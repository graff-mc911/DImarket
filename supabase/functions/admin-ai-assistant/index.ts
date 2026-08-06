import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  executeAction,
  parseNaturalLanguage,
  parseShortcut,
  type AdminAction,
} from './actions.ts'

type Action =
  | 'chat'
  | 'health'
  | 'web_search'
  | 'save_correction'
  | 'list_knowledge'

type Body = {
  action?: Action
  message?: string
  confirmed?: boolean
  history?: { role: 'user' | 'assistant'; content: string }[]
  payload?: Record<string, unknown>
}

const SYSTEM_PROMPT = `You are the admin assistant for DImarket marketplace.
Respond in the same language as the admin.
Keep answers concise (max 3 sentences unless showing data).
For destructive actions ask for confirmation word ПІДТВЕРДЖУЮ.
You can manage ratings, ads, listings, emails, and platform stats.`

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { ok: false as const, error: 'unauthorized' }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_site_owner, user_role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_site_owner !== true && profile?.user_role !== 'owner') {
    return { ok: false as const, error: 'forbidden' }
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  return { ok: true as const, admin, userId: user.id, email: user.email ?? '' }
}

async function checkRateLimit(admin: ReturnType<typeof createClient>, userId: string) {
  const since = new Date(Date.now() - 3600000).toISOString()
  const { count } = await admin
    .from('admin_ai_logs')
    .select('id', { count: 'exact', head: true })
    .eq('admin_id', userId)
    .gte('created_at', since)
  return (count ?? 0) < 100
}

async function logAction(
  admin: ReturnType<typeof createClient>,
  adminId: string,
  actionType: string,
  payload: Record<string, unknown>,
  result: unknown,
  success: boolean,
  errorMessage?: string,
) {
  const { error } = await admin.from('admin_ai_logs').insert({
    admin_id: adminId,
    action_type: actionType,
    payload,
    result: result as Record<string, unknown>,
    success,
    error_message: errorMessage ?? null,
  })
  if (error) console.error('admin_ai_logs insert failed', error.message)
}

async function callClaude(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<string | null> {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return null

  const messages = [
    ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const block = data.content?.[0]
  return block?.type === 'text' ? block.text.trim() : null
}

async function searchKnowledge(admin: ReturnType<typeof createClient>, query: string) {
  const { data } = await admin
    .from('ai_knowledge_base')
    .select('question, answer, source')
    .or(`question.ilike.%${query.slice(0, 80)}%,answer.ilike.%${query.slice(0, 80)}%`)
    .order('used_count', { ascending: false })
    .limit(3)
  return data ?? []
}

async function webSearch(query: string): Promise<string> {
  const tavily = Deno.env.get('TAVILY_API_KEY')
  if (tavily) {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: tavily, query, max_results: 3 }),
    })
    if (res.ok) {
      const data = await res.json()
      const lines = (data.results ?? []).map(
        (r: { title: string; content: string; url: string }) =>
          `- **${r.title}**: ${r.content?.slice(0, 200)} (${r.url})`,
      )
      return lines.join('\n') || 'Нічого не знайдено.'
    }
  }
  return '🔍 Web search недоступний (потрібен TAVILY_API_KEY на сервері).'
}

async function runHealthCheck(admin: ReturnType<typeof createClient>) {
  const alerts: string[] = []
  const start = Date.now()
  const { error: pingErr } = await admin.from('profiles').select('id').limit(1)
  const ms = Date.now() - start
  if (pingErr) alerts.push(`🚨 Supabase profiles: ${pingErr.message}`)
  else if (ms > 2000) alerts.push(`⚠️ Supabase повільний: ${ms}ms`)

  const in24h = new Date(Date.now() + 86400000).toISOString()
  const { count: expiring } = await admin
    .from('ad_campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .lte('ends_at', in24h)

  if ((expiring ?? 0) > 0) {
    alerts.push(`⏰ ${expiring} рекламних кампаній закінчуються за 24 год.`)
  }

  const hourAgo = new Date(Date.now() - 3600000).toISOString()
  const { count: newUsers } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', hourAgo)

  if ((newUsers ?? 0) > 100) {
    alerts.push(`📈 Сплеск реєстрацій: ${newUsers}/год.`)
  }

  return {
    ok: alerts.length === 0,
    latencyMs: ms,
    alerts,
    message: alerts.length
      ? alerts.join('\n')
      : `✅ Система в нормі. Latency ${ms}ms.`,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  const gate = await requireAdmin(req)
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.error === 'forbidden' ? 403 : 401)
  }

  const body = (await req.json()) as Body
  const action = body.action ?? 'chat'

  if (!(await checkRateLimit(gate.admin, gate.userId))) {
    return jsonResponse({ ok: false, error: 'rate_limit', message: 'Ліміт 100 запитів/год.' }, 429)
  }

  try {
    if (action === 'health') {
      const health = await runHealthCheck(gate.admin)
      await logAction(gate.admin, gate.userId, 'health', {}, health, health.ok)
      return jsonResponse({ ok: true, data: health })
    }

    if (action === 'web_search') {
      const query = String(body.payload?.query ?? body.message ?? '')
      const results = await webSearch(query)
      await logAction(gate.admin, gate.userId, 'web_search', { query }, { results }, true)
      return jsonResponse({ ok: true, data: { reply: results } })
    }

    if (action === 'save_correction') {
      const question = String(body.payload?.question ?? '')
      const answer = String(body.payload?.answer ?? body.message ?? '')
      if (!question || !answer) {
        return jsonResponse({ ok: false, error: 'missing_fields' }, 400)
      }
      const { error: kbErr } = await gate.admin.from('ai_knowledge_base').insert({
        question,
        answer,
        source: 'admin',
        created_by: gate.userId,
      })
      if (kbErr) {
        await logAction(gate.admin, gate.userId, 'save_correction', { question }, null, false, kbErr.message)
        return jsonResponse({ ok: false, error: 'knowledge_save_failed', detail: kbErr.message }, 500)
      }
      return jsonResponse({
        ok: true,
        data: { reply: '✅ Зрозумів. Запам\'ятав на майбутнє.' },
      })
    }

    if (action === 'list_knowledge') {
      const { data } = await gate.admin
        .from('ai_knowledge_base')
        .select('question, answer, source, used_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      return jsonResponse({ ok: true, data: { items: data ?? [] } })
    }

    // chat
    const message = String(body.message ?? '').trim()
    if (!message) return jsonResponse({ ok: false, error: 'empty_message' }, 400)

    const confirmed = body.confirmed === true || message.trim().toUpperCase() === 'ПІДТВЕРДЖУЮ'

    // Correction pattern: "ні, правильна відповідь: ..."
    const correction = message.match(/^(?:ні|no)[,:\s]+(?:це неправильно[,:\s]+)?(?:правильна відповідь|correct)[:\s]+(.+)$/is)
    if (correction) {
      const lastQ = body.history?.filter((h) => h.role === 'user').pop()?.content ?? 'admin correction'
      const { error: kbErr } = await gate.admin.from('ai_knowledge_base').insert({
        question: lastQ,
        answer: correction[1].trim(),
        source: 'admin',
        created_by: gate.userId,
      })
      if (kbErr) {
        return jsonResponse({ ok: false, error: 'knowledge_save_failed', detail: kbErr.message }, 500)
      }
      return jsonResponse({
        ok: true,
        data: { reply: '✅ Зрозумів. Запам\'ятав на майбутнє.' },
      })
    }

    if (message.match(/^\/search\s+/i)) {
      const query = message.replace(/^\/search\s+/i, '')
      const results = await webSearch(query)
      return jsonResponse({ ok: true, data: { reply: results } })
    }

    if (message === '/learn') {
      const { data } = await gate.admin
        .from('ai_knowledge_base')
        .select('question, answer')
        .order('created_at', { ascending: false })
        .limit(10)
      const reply = data?.length
        ? data.map((r) => `**Q:** ${r.question}\n**A:** ${r.answer}`).join('\n\n')
        : 'База знань порожня.'
      return jsonResponse({ ok: true, data: { reply } })
    }

    if (message === '/alert test') {
      const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? gate.email
      const sent = Deno.env.get('RESEND_API_KEY')
        ? await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>',
            to: [adminEmail],
            subject: 'DImarket Admin AI — test alert',
            html: '<p>🚨 Тестове сповіщення Admin AI</p>',
          }),
        })
        : null
      return jsonResponse({
        ok: true,
        data: {
          reply: sent?.ok
            ? `✅ Тестовий alert надіслано на ${adminEmail}.`
            : '⚠️ Email не налаштовано (RESEND_API_KEY).',
        },
      })
    }

    let parsed: AdminAction | null = parseShortcut(message) ?? parseNaturalLanguage(message)

    if (parsed) {
      const result = await executeAction(gate.admin, gate.userId, parsed, confirmed)
      await logAction(
        gate.admin,
        gate.userId,
        parsed.type,
        parsed as unknown as Record<string, unknown>,
        result,
        result.ok,
        result.ok ? undefined : result.message,
      )
      return jsonResponse({
        ok: true,
        data: {
          reply: result.message,
          table: result.table,
          pendingConfirmation: result.pendingConfirmation,
        },
      })
    }

    const kb = await searchKnowledge(gate.admin, message)
    const kbContext = kb.length
      ? `\n\nKnowledge base:\n${kb.map((k) => `Q: ${k.question}\nA: ${k.answer}`).join('\n')}`
      : ''

    const aiReply = await callClaude(message + kbContext, body.history ?? [])
    const reply = aiReply
      ?? '🤖 AI тимчасово недоступний. Спробуйте команди: /stats, /boost email 10, /verify email, /health'

    await logAction(gate.admin, gate.userId, 'chat', { message }, { reply }, true)

    return jsonResponse({ ok: true, data: { reply } })
  } catch (e) {
    await logAction(
      gate.admin,
      gate.userId,
      action,
      body as unknown as Record<string, unknown>,
      null,
      false,
      String(e),
    )
    return jsonResponse({ ok: false, error: String(e) }, 500)
  }
})
