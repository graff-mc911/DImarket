import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Action =
  | 'cron_run'
  | 'status'
  | 'check_now'
  | 'review_change'
  | 'publish_version'
  | 'rollback_version'

type Body = {
  action?: Action
  payload?: {
    changeId?: string
    decision?: 'approved' | 'rejected' | 'published'
    notes?: string
    versionId?: string
    documentId?: string
  }
}

function normalizeSourceContent(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashNormalizedContent(raw: string): Promise<string> {
  return `sha256_${await sha256Hex(normalizeSourceContent(raw))}`
}

function excerptNormalized(raw: string, max = 400): string {
  const n = normalizeSourceContent(raw)
  return n.length <= max ? n : `${n.slice(0, max)}…`
}

function severityForChange(
  changeType: string,
  sourceType: string,
): 'low' | 'medium' | 'high' | 'critical' {
  if (changeType === 'unavailable') {
    return sourceType === 'official_gazette' || sourceType === 'eu_official' ? 'critical' : 'high'
  }
  if (changeType === 'content') {
    if (
      sourceType === 'official_gazette' ||
      sourceType === 'eu_official' ||
      sourceType === 'national_government' ||
      sourceType === 'ministry'
    ) {
      return 'high'
    }
    return 'medium'
  }
  return 'low'
}

async function sendTelegramAlert(text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId =
    Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') ??
    Deno.env.get('TELEGRAM_CHANNEL_ID')
  if (!token || !chatId) return false
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      disable_web_page_preview: true,
    }),
  })
  const data = await res.json()
  return Boolean(data.ok)
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { ok: false as const, error: 'unauthorized' }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_site_owner, user_role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = profile?.is_site_owner === true || profile?.user_role === 'owner'
  if (!isAdmin) return { ok: false as const, error: 'forbidden' }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  return { ok: true as const, admin, userId: user.id }
}

function requireCronOrAdmin(req: Request) {
  const cronSecret =
    Deno.env.get('OFFICIAL_SOURCES_CRON_SECRET') ?? Deno.env.get('MARKETING_CRON_SECRET')
  const header = req.headers.get('x-cron-secret')
  if (cronSecret && header && header === cronSecret) {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    return Promise.resolve({
      ok: true as const,
      admin,
      userId: null as string | null,
      via: 'cron' as const,
    })
  }
  return requireAdmin(req).then((r) => (r.ok ? { ...r, via: 'admin' as const } : r))
}

async function fetchSource(url: string) {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'DImarket-OfficialSourceMonitor/1.0 (+https://dimarket.app)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    const body = await res.text()
    return {
      ok: res.ok,
      status: res.status,
      body,
      durationMs: Date.now() - started,
    }
  } catch (err) {
    return {
      ok: false,
      status: null,
      body: '',
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    }
  }
}

async function notifyChangeIfNeeded(
  admin: ReturnType<typeof createClient>,
  changeId: string,
  source: Record<string, unknown>,
  severity: string,
  summary: string,
  affectedCount: number,
) {
  if (severity !== 'critical' && severity !== 'high') return

  const { data: existing } = await admin
    .from('source_changes')
    .select('alert_sent_at')
    .eq('id', changeId)
    .maybeSingle()
  if (existing?.alert_sent_at) return

  const adminUrl = 'https://dimarket.app/admin/official-sources'
  const text = [
    '⚠️ DImarket — Official source changed',
    '',
    `Priority: ${severity.toUpperCase()}`,
    `Source: ${source.source_name}`,
    `Country: ${source.country_code}`,
    `URL: ${source.source_url}`,
    '',
    summary,
    '',
    affectedCount > 0 ? `Affected documents: ${affectedCount}` : 'Affected documents: —',
    '',
    `Review: ${adminUrl}`,
  ].join('\n')

  const sent = await sendTelegramAlert(text)
  if (sent) {
    await admin
      .from('source_changes')
      .update({ alert_sent_at: new Date().toISOString() })
      .eq('id', changeId)
  }
}

async function activateEffectiveVersions(admin: ReturnType<typeof createClient>) {
  const now = new Date().toISOString()
  const { data: docs } = await admin
    .from('legal_documents')
    .select('id, current_version_id, doc_key')
    .eq('is_published', true)

  let switched = 0
  for (const doc of docs ?? []) {
    const { data: versions } = await admin
      .from('document_versions')
      .select('id, status, effective_from, effective_until, published_at, version_number')
      .eq('document_id', doc.id)
      .eq('status', 'published')

    if (!versions?.length) continue

    const t = Date.now()
    const current = versions
      .filter((v) => {
        const from = v.effective_from ? new Date(v.effective_from).getTime() : 0
        const until = v.effective_until ? new Date(v.effective_until).getTime() : null
        if (v.effective_from && !Number.isNaN(from) && t < from) return false
        if (until !== null && !Number.isNaN(until) && t > until) return false
        return true
      })
      .sort((a, b) => {
        const af = a.effective_from ? new Date(a.effective_from).getTime() : 0
        const bf = b.effective_from ? new Date(b.effective_from).getTime() : 0
        return bf - af
      })[0]

    if (!current || current.id === doc.current_version_id) continue

    const others = versions.filter((v) => v.id !== current.id && v.status === 'published')
    if (others.length) {
      await admin
        .from('document_versions')
        .update({ status: 'superseded' })
        .in(
          'id',
          others.map((v) => v.id),
        )
    }

    await admin
      .from('legal_documents')
      .update({ current_version_id: current.id, updated_at: now })
      .eq('id', doc.id)

    await admin.from('document_audit_log').insert({
      document_id: doc.id,
      version_id: current.id,
      action: 'effective_version_activated',
      new_value: { version_number: current.version_number },
      reason: 'Automatic switch after effective_from',
    })
    switched += 1
  }
  return switched
}

async function runChecks(
  admin: ReturnType<typeof createClient>,
  opts: { forceAll?: boolean } = {},
) {
  const now = new Date()
  let query = admin.from('official_sources').select('*').eq('is_active', true)
  if (!opts.forceAll) {
    query = query.lte('next_verification_at', now.toISOString())
  }

  const { data: sources, error } = await query
  if (error) throw error

  const results: Array<Record<string, unknown>> = []

  for (const source of sources ?? []) {
    const fetched = await fetchSource(source.source_url as string)
    const hash = fetched.body ? await hashNormalizedContent(fetched.body) : null
    const excerpt = fetched.body ? excerptNormalized(fetched.body) : null
    const oldHash = source.source_hash as string | null

    await admin.from('source_checks').insert({
      source_id: source.id,
      http_status: fetched.status,
      content_hash: hash,
      content_length: fetched.body?.length ?? 0,
      normalized_excerpt: excerpt,
      fetch_ok: fetched.ok,
      error_message: (fetched as { error?: string }).error ?? null,
      duration_ms: fetched.durationMs,
    })

    const intervalHours = Number(source.check_interval_hours) || 24
    const nextAt = new Date(now.getTime() + intervalHours * 60 * 60 * 1000).toISOString()

    let verification_status = source.verification_status as string
    let content_status = source.content_status as string
    let last_changed_at = source.last_changed_at as string | null
    let changeCreated: string | null = null
    let affectedCount = 0

    if (!fetched.ok || (fetched.status !== null && fetched.status >= 400)) {
      verification_status = fetched.status === 404 ? 'outdated' : 'unavailable'
      content_status = fetched.status === 404 ? 'not_found' : 'error'

      const severity = severityForChange('unavailable', source.source_type as string)
      const { data: change } = await admin
        .from('source_changes')
        .insert({
          source_id: source.id,
          old_hash: oldHash,
          new_hash: hash,
          change_type: 'unavailable',
          change_summary: `Source unreachable (HTTP ${fetched.status ?? 'n/a'})`,
          new_excerpt: excerpt,
          severity,
          status: 'review_required',
        })
        .select('id')
        .maybeSingle()
      changeCreated = change?.id ?? null

      if (changeCreated) {
        await notifyChangeIfNeeded(
          admin,
          changeCreated,
          source,
          severity,
          `Source unreachable (HTTP ${fetched.status ?? 'n/a'})`,
          0,
        )
      }

      await admin
        .from('legal_documents')
        .update({
          verification_status: verification_status === 'outdated' ? 'outdated' : 'needs_review',
          updated_at: now.toISOString(),
        })
        .eq('primary_source_id', source.id)
    } else if (oldHash && hash && oldHash !== hash) {
      verification_status = 'changed'
      content_status = 'ok'
      last_changed_at = now.toISOString()

      const { data: docs } = await admin
        .from('legal_documents')
        .select('id')
        .eq('primary_source_id', source.id)
      const affected = (docs ?? []).map((d: { id: string }) => d.id)
      affectedCount = affected.length

      const severity = severityForChange('content', source.source_type as string)
      const { data: change } = await admin
        .from('source_changes')
        .insert({
          source_id: source.id,
          old_hash: oldHash,
          new_hash: hash,
          change_type: 'content',
          change_summary:
            'Normalized content hash changed — review required before publishing legal updates.',
          new_excerpt: excerpt,
          affected_document_ids: affected,
          severity,
          status: 'review_required',
        })
        .select('id')
        .maybeSingle()
      changeCreated = change?.id ?? null

      if (changeCreated) {
        await notifyChangeIfNeeded(
          admin,
          changeCreated,
          source,
          severity,
          'Content hash changed at official source.',
          affectedCount,
        )
      }

      if (affected.length) {
        await admin
          .from('legal_documents')
          .update({ verification_status: 'needs_review', updated_at: now.toISOString() })
          .in('id', affected)
      }
    } else if (!oldHash && hash) {
      verification_status = 'verified'
      content_status = 'ok'
    } else {
      verification_status = 'verified'
      content_status = 'ok'
    }

    await admin
      .from('official_sources')
      .update({
        last_checked_at: now.toISOString(),
        last_success_at: fetched.ok ? now.toISOString() : source.last_success_at,
        last_changed_at,
        next_verification_at: nextAt,
        source_hash: hash ?? source.source_hash,
        http_status: fetched.status,
        content_status,
        verification_status,
        updated_at: now.toISOString(),
      })
      .eq('id', source.id)

    results.push({
      source_key: source.source_key,
      http_status: fetched.status,
      verification_status,
      changed: Boolean(changeCreated),
      change_id: changeCreated,
      fetch_ok: fetched.ok,
    })
  }

  const effectiveSwitched = await activateEffectiveVersions(admin)

  return {
    checked: results.length,
    at: now.toISOString(),
    effective_switched: effectiveSwitched,
    results,
  }
}

async function publishVersion(
  admin: ReturnType<typeof createClient>,
  userId: string,
  versionId: string,
) {
  const now = new Date().toISOString()
  const { data: version, error } = await admin
    .from('document_versions')
    .select('*, legal_documents(id, doc_key, current_version_id)')
    .eq('id', versionId)
    .maybeSingle()
  if (error || !version) throw new Error('version_not_found')

  const docId = version.document_id as string
  const effectiveFrom = version.effective_from ?? now

  const { data: siblings } = await admin
    .from('document_versions')
    .select('id, status')
    .eq('document_id', docId)
    .eq('status', 'published')

  const toSupersede = (siblings ?? [])
    .filter((v: { id: string }) => v.id !== versionId)
    .map((v: { id: string }) => v.id)

  if (toSupersede.length) {
    await admin.from('document_versions').update({ status: 'superseded' }).in('id', toSupersede)
  }

  await admin
    .from('document_versions')
    .update({
      status: 'published',
      published_at: version.published_at ?? now,
      effective_from: effectiveFrom,
      verified_at: now,
      verified_by: userId,
    })
    .eq('id', versionId)

  await admin
    .from('legal_documents')
    .update({
      current_version_id: versionId,
      is_published: true,
      verification_status: 'verified',
      last_verified_at: now,
      updated_at: now,
    })
    .eq('id', docId)

  await admin.from('document_audit_log').insert({
    document_id: docId,
    version_id: versionId,
    actor_id: userId,
    action: 'version_published',
    old_value: { superseded: toSupersede },
    new_value: { version_number: version.version_number },
    reason: 'Admin approved publish — no silent AI rewrite',
  })

  return { versionId, documentId: docId, superseded: toSupersede }
}

async function rollbackVersion(
  admin: ReturnType<typeof createClient>,
  userId: string,
  versionId: string,
) {
  const now = new Date().toISOString()
  const { data: target, error } = await admin
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle()
  if (error || !target) throw new Error('version_not_found')

  const allowed = ['published', 'superseded', 'approved']
  if (!allowed.includes(target.status as string)) {
    throw new Error('rollback_not_allowed')
  }

  const docId = target.document_id as string
  const { data: currentDoc } = await admin
    .from('legal_documents')
    .select('current_version_id')
    .eq('id', docId)
    .maybeSingle()

  const { data: published } = await admin
    .from('document_versions')
    .select('id')
    .eq('document_id', docId)
    .eq('status', 'published')

  const toSupersede = (published ?? [])
    .filter((v: { id: string }) => v.id !== versionId)
    .map((v: { id: string }) => v.id)

  if (toSupersede.length) {
    await admin.from('document_versions').update({ status: 'superseded' }).in('id', toSupersede)
  }

  await admin
    .from('document_versions')
    .update({ status: 'published', verified_at: now, verified_by: userId })
    .eq('id', versionId)

  await admin
    .from('legal_documents')
    .update({
      current_version_id: versionId,
      verification_status: 'verified',
      last_verified_at: now,
      updated_at: now,
    })
    .eq('id', docId)

  await admin.from('document_audit_log').insert({
    document_id: docId,
    version_id: versionId,
    actor_id: userId,
    action: 'version_rollback',
    old_value: { previous_current: currentDoc?.current_version_id },
    new_value: { version_number: target.version_number },
    reason: 'Admin rolled back to prior verified version',
  })

  return { versionId, documentId: docId, previousCurrent: currentDoc?.current_version_id }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const action = body.action ?? 'status'

    if (action === 'status') {
      const gate = await requireCronOrAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const { data: sources } = await gate.admin
        .from('official_sources')
        .select('source_key, verification_status, last_checked_at, http_status, content_status')
        .eq('is_active', true)
      const { count } = await gate.admin
        .from('source_changes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'review_required')
      return jsonResponse({
        sources: sources ?? [],
        review_required: count ?? 0,
        telegram_configured: Boolean(
          Deno.env.get('TELEGRAM_BOT_TOKEN') &&
            (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') ?? Deno.env.get('TELEGRAM_CHANNEL_ID')),
        ),
      })
    }

    if (action === 'cron_run' || action === 'check_now') {
      const gate = await requireCronOrAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const report = await runChecks(gate.admin, { forceAll: action === 'check_now' })
      return jsonResponse({ ok: true, ...report })
    }

    if (action === 'review_change') {
      const gate = await requireAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const changeId = body.payload?.changeId
      const decision = body.payload?.decision
      if (!changeId || !decision) {
        return jsonResponse({ error: 'changeId and decision required' }, 400)
      }

      const { data: change, error } = await gate.admin
        .from('source_changes')
        .update({
          status: decision,
          reviewed_at: new Date().toISOString(),
          reviewed_by: gate.userId,
          review_notes: body.payload?.notes ?? null,
        })
        .eq('id', changeId)
        .select('*')
        .maybeSingle()
      if (error) return jsonResponse({ error: error.message }, 500)

      if (decision === 'approved' || decision === 'published') {
        const sourceId = change?.source_id
        if (sourceId) {
          await gate.admin
            .from('official_sources')
            .update({ verification_status: 'verified', updated_at: new Date().toISOString() })
            .eq('id', sourceId)
        }
        await gate.admin.from('document_audit_log').insert({
          source_id: change?.source_id ?? null,
          actor_id: gate.userId,
          action: `source_change_${decision}`,
          old_value: { changeId },
          new_value: { decision, notes: body.payload?.notes ?? null },
          reason: 'Admin reviewed official source change (no silent legal rewrite)',
        })
      }

      return jsonResponse({ ok: true, change })
    }

    if (action === 'publish_version') {
      const gate = await requireAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const versionId = body.payload?.versionId
      if (!versionId) return jsonResponse({ error: 'versionId required' }, 400)
      const result = await publishVersion(gate.admin, gate.userId, versionId)
      return jsonResponse({ ok: true, ...result })
    }

    if (action === 'rollback_version') {
      const gate = await requireAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const versionId = body.payload?.versionId
      if (!versionId) return jsonResponse({ error: 'versionId required' }, 400)
      const result = await rollbackVersion(gate.admin, gate.userId, versionId)
      return jsonResponse({ ok: true, ...result })
    }

    return jsonResponse({ error: 'unknown_action' }, 400)
  } catch (err) {
    console.error('[official-sources-monitor]', err)
    return jsonResponse(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    )
  }
})
