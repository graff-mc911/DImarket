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
  | 'create_draft_version'
  | 'update_draft_version'
  | 'approve_version'
  | 'weekly_digest'

type Body = {
  action?: Action
  payload?: {
    changeId?: string
    decision?: 'approved' | 'rejected' | 'published'
    notes?: string
    versionId?: string
    documentId?: string
    versionNumber?: string
    bodyMarkdown?: string
    effectiveFrom?: string | null
    changeSummary?: string
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

async function sendEmailAlert(subject: string, text: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY')
  const to =
    Deno.env.get('OSM_ALERT_EMAIL') ??
    Deno.env.get('ADMIN_EMAIL')
  if (!key || !to) return false
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
  const html = `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  return res.ok
}

function isTelegramConfigured(): boolean {
  return Boolean(
    Deno.env.get('TELEGRAM_BOT_TOKEN') &&
      (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') ?? Deno.env.get('TELEGRAM_CHANNEL_ID')),
  )
}

function isEmailConfigured(): boolean {
  return Boolean(
    Deno.env.get('RESEND_API_KEY') &&
      (Deno.env.get('OSM_ALERT_EMAIL') ?? Deno.env.get('ADMIN_EMAIL')),
  )
}

function isWebhookConfigured(): boolean {
  return Boolean(Deno.env.get('OSM_WEBHOOK_URL') || Deno.env.get('OSM_SLACK_WEBHOOK_URL'))
}

function alertsComplete(
  existing: {
    alert_sent_at?: string | null
    email_alert_sent_at?: string | null
    webhook_alert_sent_at?: string | null
  } | null | undefined,
): boolean {
  const telegramDone = !isTelegramConfigured() || Boolean(existing?.alert_sent_at)
  const emailDone = !isEmailConfigured() || Boolean(existing?.email_alert_sent_at)
  const webhookDone = !isWebhookConfigured() || Boolean(existing?.webhook_alert_sent_at)
  return telegramDone && emailDone && webhookDone
}

function isSlackWebhookUrl(url: string): boolean {
  return /hooks\.slack\.com/i.test(url)
}

async function postJson(url: string, body: unknown, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders ?? {}),
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return res.ok
}

async function sendWebhookAlert(payload: Record<string, unknown>): Promise<boolean> {
  const genericUrl = Deno.env.get('OSM_WEBHOOK_URL')
  const slackUrl = Deno.env.get('OSM_SLACK_WEBHOOK_URL')
  const secret = Deno.env.get('OSM_WEBHOOK_SECRET')
  const secretHeaders = secret ? { 'X-OSM-Webhook-Secret': secret } : undefined

  let ok = false

  const targets: string[] = []
  if (genericUrl) targets.push(genericUrl)
  if (slackUrl && slackUrl !== genericUrl) targets.push(slackUrl)

  for (const url of targets) {
    try {
      if (isSlackWebhookUrl(url) || url === slackUrl) {
        const text = [
          `*DImarket OSM* — ${String(payload.severity ?? '').toUpperCase()}`,
          `Source: ${payload.source_name} (${payload.country_code})`,
          `URL: ${payload.source_url}`,
          String(payload.summary ?? ''),
          `Review: ${payload.admin_url}`,
        ].join('\n')
        const sent = await postJson(url, { text })
        ok = ok || sent
      } else {
        const sent = await postJson(url, payload, secretHeaders)
        ok = ok || sent
      }
    } catch {
      // continue other targets
    }
  }
  return ok
}

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function autoDraftVersionNumber(at = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `auto-${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}-${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}`
}

function buildAutoDraftMarkdown(input: {
  documentTitle: string
  sourceName: string
  sourceUrl: string
  changeId: string
  oldHash: string | null
  newHash: string | null
  oldExcerpt: string | null
  newExcerpt: string | null
}): string {
  const oldSnap = input.oldExcerpt?.trim() || '_(no previous snapshot)_'
  const newSnap = input.newExcerpt?.trim() || '_(empty snapshot)_'
  return `# Auto-draft — ${input.documentTitle}

> **NOT published.** Official source changed. Edit manually; publish only after legal review.

## Official source
- **${input.sourceName}**
- ${input.sourceUrl}

## Change
- ID: \`${input.changeId}\`
- Old hash: \`${input.oldHash ?? '—'}\`
- New hash: \`${input.newHash ?? '—'}\`

## Previous excerpt
\`\`\`
${oldSnap.slice(0, 800)}
\`\`\`

## New excerpt
\`\`\`
${newSnap.slice(0, 800)}
\`\`\`

## Next steps
1. Verify changes at the official source.
2. Edit this draft.
3. Publish from admin after review.`
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
    .select('alert_sent_at, email_alert_sent_at, webhook_alert_sent_at')
    .eq('id', changeId)
    .maybeSingle()
  if (alertsComplete(existing)) return

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

  const now = new Date().toISOString()
  const telegramSent = existing?.alert_sent_at
    ? true
    : isTelegramConfigured()
      ? await sendTelegramAlert(text)
      : false
  const emailSent = existing?.email_alert_sent_at
    ? true
    : isEmailConfigured()
      ? await sendEmailAlert(
          `[DImarket OSM] ${severity.toUpperCase()} — ${source.source_name}`,
          text,
        )
      : false
  const webhookSent = existing?.webhook_alert_sent_at
    ? true
    : isWebhookConfigured()
      ? await sendWebhookAlert({
          event: 'official_source_change',
          severity,
          change_id: changeId,
          source_name: source.source_name,
          country_code: source.country_code,
          source_url: source.source_url,
          summary,
          affected_documents: affectedCount,
          admin_url: adminUrl,
          detected_at: now,
        })
      : false

  const patch: Record<string, string> = {}
  if (telegramSent && !existing?.alert_sent_at) patch.alert_sent_at = now
  if (emailSent && !existing?.email_alert_sent_at) patch.email_alert_sent_at = now
  if (webhookSent && !existing?.webhook_alert_sent_at) patch.webhook_alert_sent_at = now
  if (Object.keys(patch).length) {
    await admin.from('source_changes').update(patch).eq('id', changeId)
  }
}

async function autoDraftForAffectedDocuments(
  admin: ReturnType<typeof createClient>,
  source: Record<string, unknown>,
  changeId: string,
  affectedDocIds: string[],
  oldHash: string | null,
  newHash: string | null,
  oldExcerpt: string | null,
  newExcerpt: string | null,
): Promise<number> {
  if (!affectedDocIds.length) return 0
  const versionNumber = autoDraftVersionNumber()
  let created = 0

  for (const docId of affectedDocIds) {
    const { data: dup } = await admin
      .from('document_versions')
      .select('id')
      .eq('document_id', docId)
      .ilike('change_summary', `%${changeId}%`)
      .maybeSingle()
    if (dup) continue

    const { data: doc } = await admin
      .from('legal_documents')
      .select('id, title')
      .eq('id', docId)
      .maybeSingle()
    if (!doc) continue

    const body = buildAutoDraftMarkdown({
      documentTitle: doc.title as string,
      sourceName: String(source.source_name),
      sourceUrl: String(source.source_url),
      changeId,
      oldHash,
      newHash,
      oldExcerpt,
      newExcerpt,
    })

    const { error } = await admin.from('document_versions').insert({
      document_id: docId,
      version_number: `${versionNumber}-${created + 1}`,
      title: doc.title,
      body_markdown: body,
      source_id: source.id,
      source_url: source.source_url,
      status: 'review_required',
      change_summary: `Auto-draft from source change ${changeId} — NOT published`,
    })
    if (!error) {
      created += 1
      await admin.from('document_audit_log').insert({
        document_id: docId,
        source_id: source.id as string,
        action: 'auto_draft_from_source_change',
        new_value: { changeId, version_number: `${versionNumber}-${created}` },
        reason: 'Hash changed at official source — draft only, no auto-publish',
      })
    }
  }
  return created
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
    const { data: prevCheckRows } = await admin
      .from('source_checks')
      .select('normalized_excerpt, content_hash')
      .eq('source_id', source.id)
      .order('checked_at', { ascending: false })
      .limit(1)
    const previousExcerpt = (prevCheckRows?.[0]?.normalized_excerpt as string | null) ?? null

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
          old_excerpt: previousExcerpt,
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
        const autoDrafts = await autoDraftForAffectedDocuments(
          admin,
          source,
          changeCreated,
          affected,
          oldHash,
          hash,
          previousExcerpt,
          excerpt,
        )
        if (autoDrafts > 0) {
          results.push({ source_key: source.source_key, auto_drafts: autoDrafts })
        }
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

async function createDraftVersion(
  admin: ReturnType<typeof createClient>,
  userId: string,
  input: {
    documentId: string
    versionNumber: string
    bodyMarkdown: string
    effectiveFrom?: string | null
    changeSummary?: string
  },
) {
  const { data: doc, error: docErr } = await admin
    .from('legal_documents')
    .select('id, title, primary_source_id, official_sources:primary_source_id(source_url)')
    .eq('id', input.documentId)
    .maybeSingle()
  if (docErr || !doc) throw new Error('document_not_found')

  const sourceUrl =
    (doc.official_sources as { source_url?: string } | null)?.source_url ?? null

  const { data: version, error } = await admin
    .from('document_versions')
    .insert({
      document_id: input.documentId,
      version_number: input.versionNumber,
      title: doc.title as string,
      body_markdown: input.bodyMarkdown,
      source_id: doc.primary_source_id,
      source_url: sourceUrl,
      effective_from: input.effectiveFrom ?? null,
      status: 'review_required',
      change_summary:
        input.changeSummary ??
        'Admin-created draft — requires review before publish. No silent AI rewrite.',
    })
    .select('id, version_number')
    .maybeSingle()
  if (error) throw error

  await admin
    .from('legal_documents')
    .update({
      verification_status: 'needs_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.documentId)

  await admin.from('document_audit_log').insert({
    document_id: input.documentId,
    version_id: version?.id ?? null,
    actor_id: userId,
    action: 'draft_version_created',
    new_value: { version_number: input.versionNumber },
    reason: 'Curated draft awaiting admin review',
  })

  return { versionId: version?.id, versionNumber: version?.version_number }
}

async function updateDraftVersion(
  admin: ReturnType<typeof createClient>,
  userId: string,
  input: {
    versionId: string
    bodyMarkdown: string
    effectiveFrom?: string | null
    changeSummary?: string
  },
) {
  const { data: version, error: verErr } = await admin
    .from('document_versions')
    .select('id, document_id, version_number, status')
    .eq('id', input.versionId)
    .maybeSingle()
  if (verErr || !version) throw new Error('version_not_found')

  const editable = ['draft', 'review_required', 'approved']
  if (!editable.includes(version.status as string)) {
    throw new Error('draft_edit_not_allowed')
  }

  const patch: Record<string, unknown> = { body_markdown: input.bodyMarkdown }
  if (input.changeSummary !== undefined) patch.change_summary = input.changeSummary
  if (input.effectiveFrom !== undefined) patch.effective_from = input.effectiveFrom

  const { error } = await admin.from('document_versions').update(patch).eq('id', input.versionId)
  if (error) throw error

  await admin
    .from('legal_documents')
    .update({
      verification_status: 'needs_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', version.document_id as string)

  await admin.from('document_audit_log').insert({
    document_id: version.document_id as string,
    version_id: version.id as string,
    actor_id: userId,
    action: 'draft_version_updated',
    new_value: { version_number: version.version_number },
    reason: 'Admin edited draft — review still required before publish',
  })

  return { versionId: version.id, versionNumber: version.version_number }
}

async function approveDraftVersion(
  admin: ReturnType<typeof createClient>,
  userId: string,
  versionId: string,
) {
  const { data: version, error } = await admin
    .from('document_versions')
    .select('id, document_id, version_number, status')
    .eq('id', versionId)
    .maybeSingle()
  if (error || !version) throw new Error('version_not_found')

  if (!['draft', 'review_required'].includes(version.status as string)) {
    throw new Error('approve_not_allowed')
  }

  await admin
    .from('document_versions')
    .update({ status: 'approved' })
    .eq('id', versionId)

  await admin
    .from('legal_documents')
    .update({
      verification_status: 'needs_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', version.document_id as string)

  await admin.from('document_audit_log').insert({
    document_id: version.document_id as string,
    version_id: version.id as string,
    actor_id: userId,
    action: 'draft_version_approved',
    new_value: { version_number: version.version_number, status: 'approved' },
    reason: 'Admin approved draft — publish is a separate explicit step',
  })

  return { versionId: version.id, versionNumber: version.version_number, status: 'approved' }
}

async function runWeeklyDigest(admin: ReturnType<typeof createClient>) {
  const weekKey = isoWeekKey()
  const { data: prior } = await admin
    .from('osm_weekly_digest_runs')
    .select('id')
    .eq('week_key', weekKey)
    .maybeSingle()
  if (prior) {
    return { skipped: true, reason: 'already_sent', week_key: weekKey }
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: pending } = await admin
    .from('source_changes')
    .select('id, severity, change_type, change_summary, detected_at, official_sources(source_name, country_code)')
    .in('status', ['review_required', 'detected'])
    .order('detected_at', { ascending: false })
    .limit(50)

  const { data: recent } = await admin
    .from('source_changes')
    .select('id')
    .gte('detected_at', since)

  const pendingCount = pending?.length ?? 0
  const recentCount = recent?.length ?? 0

  if (pendingCount === 0 && recentCount === 0) {
    return { skipped: true, reason: 'nothing_to_report', week_key: weekKey }
  }

  const adminUrl = 'https://dimarket.app/admin/official-sources'
  const lines = (pending ?? []).slice(0, 15).map((c: Record<string, unknown>) => {
    const src = c.official_sources as { source_name?: string; country_code?: string } | null
    return `- [${c.severity}] ${src?.source_name ?? 'source'} (${src?.country_code ?? '—'}) — ${c.change_type}`
  })
  const text = [
    'DImarket OSM — Weekly digest',
    '',
    `Pending review: ${pendingCount}`,
    `Changes last 7 days: ${recentCount}`,
    '',
    ...(lines.length ? ['Top pending:', ...lines, ''] : []),
    `Review: ${adminUrl}`,
  ].join('\n')

  let channel = 'none'
  let sent = false
  if (isEmailConfigured()) {
    sent = await sendEmailAlert(`[DImarket OSM] Weekly digest — ${pendingCount} pending`, text)
    if (sent) channel = 'email'
  } else if (isTelegramConfigured()) {
    sent = await sendTelegramAlert(text)
    if (sent) channel = 'telegram'
  }

  if (!sent) {
    return { skipped: true, reason: 'no_alert_channel', week_key: weekKey, pending_count: pendingCount }
  }

  await admin.from('osm_weekly_digest_runs').insert({
    week_key: weekKey,
    pending_count: pendingCount,
    recent_count: recentCount,
    channel,
  })

  await admin.from('document_audit_log').insert({
    action: 'weekly_digest_sent',
    new_value: { week_key: weekKey, pending_count: pendingCount, recent_count: recentCount, channel },
    reason: 'Weekly OSM admin digest',
  })

  return {
    ok: true,
    week_key: weekKey,
    pending_count: pendingCount,
    recent_count: recentCount,
    channel,
  }
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
        telegram_configured: isTelegramConfigured(),
        email_configured: isEmailConfigured(),
        webhook_configured: isWebhookConfigured(),
      })
    }

    if (action === 'weekly_digest') {
      const gate = await requireCronOrAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const report = await runWeeklyDigest(gate.admin)
      return jsonResponse(report)
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

    if (action === 'create_draft_version') {
      const gate = await requireAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const documentId = body.payload?.documentId
      const versionNumber = body.payload?.versionNumber
      const bodyMarkdown = body.payload?.bodyMarkdown
      if (!documentId || !versionNumber || !bodyMarkdown) {
        return jsonResponse({ error: 'documentId, versionNumber, bodyMarkdown required' }, 400)
      }
      const result = await createDraftVersion(gate.admin, gate.userId, {
        documentId,
        versionNumber,
        bodyMarkdown,
        effectiveFrom: body.payload?.effectiveFrom ?? null,
        changeSummary: body.payload?.changeSummary,
      })
      return jsonResponse({ ok: true, ...result })
    }

    if (action === 'update_draft_version') {
      const gate = await requireAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const versionId = body.payload?.versionId
      const bodyMarkdown = body.payload?.bodyMarkdown
      if (!versionId || !bodyMarkdown) {
        return jsonResponse({ error: 'versionId and bodyMarkdown required' }, 400)
      }
      const result = await updateDraftVersion(gate.admin, gate.userId, {
        versionId,
        bodyMarkdown,
        effectiveFrom: body.payload?.effectiveFrom ?? null,
        changeSummary: body.payload?.changeSummary,
      })
      return jsonResponse({ ok: true, ...result })
    }

    if (action === 'approve_version') {
      const gate = await requireAdmin(req)
      if (!gate.ok) return jsonResponse({ error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
      const versionId = body.payload?.versionId
      if (!versionId) return jsonResponse({ error: 'versionId required' }, 400)
      const result = await approveDraftVersion(gate.admin, gate.userId, versionId)
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
