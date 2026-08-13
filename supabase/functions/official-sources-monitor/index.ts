import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Action = 'cron_run' | 'status' | 'check_now' | 'review_change'

type Body = {
  action?: Action
  payload?: {
    changeId?: string
    decision?: 'approved' | 'rejected' | 'published'
    notes?: string
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
  const normalized = normalizeSourceContent(raw)
  return `sha256_${await sha256Hex(normalized)}`
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
  const cronSecret = Deno.env.get('OFFICIAL_SOURCES_CRON_SECRET') ?? Deno.env.get('MARKETING_CRON_SECRET')
  const header = req.headers.get('x-cron-secret')
  if (cronSecret && header && header === cronSecret) {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    return Promise.resolve({ ok: true as const, admin, userId: null as string | null, via: 'cron' as const })
  }
  return requireAdmin(req).then((r) =>
    r.ok ? { ...r, via: 'admin' as const } : r,
  )
}

async function fetchSource(url: string): Promise<{
  ok: boolean
  status: number | null
  body: string
  error?: string
  durationMs: number
}> {
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

async function runChecks(
  admin: ReturnType<typeof createClient>,
  opts: { forceAll?: boolean } = {},
) {
  const now = new Date()
  let query = admin
    .from('official_sources')
    .select('*')
    .eq('is_active', true)

  if (!opts.forceAll) {
    query = query.lte('next_verification_at', now.toISOString())
  }

  const { data: sources, error } = await query
  if (error) throw error

  const results: Array<Record<string, unknown>> = []

  for (const source of sources ?? []) {
    const fetched = await fetchSource(source.source_url)
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
      error_message: fetched.error ?? null,
      duration_ms: fetched.durationMs,
    })

    const intervalHours = Number(source.check_interval_hours) || 24
    const nextAt = new Date(now.getTime() + intervalHours * 60 * 60 * 1000).toISOString()

    let verification_status = source.verification_status as string
    let content_status = source.content_status as string
    let last_changed_at = source.last_changed_at as string | null
    let changeCreated: string | null = null

    if (!fetched.ok || (fetched.status !== null && fetched.status >= 400)) {
      verification_status = fetched.status === 404 ? 'outdated' : 'unavailable'
      content_status = fetched.status === 404 ? 'not_found' : 'error'

      const { data: change } = await admin
        .from('source_changes')
        .insert({
          source_id: source.id,
          old_hash: oldHash,
          new_hash: hash,
          change_type: 'unavailable',
          change_summary: `Source unreachable (HTTP ${fetched.status ?? 'n/a'}): ${fetched.error ?? 'fetch failed'}`,
          old_excerpt: null,
          new_excerpt: excerpt,
          severity: severityForChange('unavailable', source.source_type),
          status: 'review_required',
        })
        .select('id')
        .maybeSingle()
      changeCreated = change?.id ?? null

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

      const { data: change } = await admin
        .from('source_changes')
        .insert({
          source_id: source.id,
          old_hash: oldHash,
          new_hash: hash,
          change_type: 'content',
          change_summary: 'Normalized content hash changed — review required before publishing legal updates.',
          old_excerpt: null,
          new_excerpt: excerpt,
          affected_document_ids: affected,
          severity: severityForChange('content', source.source_type),
          status: 'review_required',
        })
        .select('id')
        .maybeSingle()
      changeCreated = change?.id ?? null

      if (affected.length) {
        await admin
          .from('legal_documents')
          .update({
            verification_status: 'needs_review',
            updated_at: now.toISOString(),
          })
          .in('id', affected)
      }
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

  return {
    checked: results.length,
    at: now.toISOString(),
    results,
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
        .select('*, official_sources(id)')
        .maybeSingle()
      if (error) return jsonResponse({ error: error.message }, 500)

      // Approving a change does NOT auto-rewrite legal text — only clears review flags after human confirm.
      if (decision === 'approved' || decision === 'published') {
        const sourceId = change?.source_id
        if (sourceId) {
          await gate.admin
            .from('official_sources')
            .update({
              verification_status: 'verified',
              updated_at: new Date().toISOString(),
            })
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

    return jsonResponse({ error: 'unknown_action' }, 400)
  } catch (err) {
    console.error('[official-sources-monitor]', err)
    return jsonResponse(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    )
  }
})
