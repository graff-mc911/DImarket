import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Channel = 'email' | 'telegram' | 'inapp'

type Body = {
  channel?: Channel
  to?: string
  userId?: string
  subject?: string
  body?: string
  link_path?: string
}

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
  return { ok: true as const, admin, userId: user.id }
}

async function sendResendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return false
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
  const unsubscribe = Deno.env.get('VITE_SITE_URL') ?? 'https://dimarket.app'
  const html = `<p>${body.replace(/\n/g, '<br>')}</p>
<p style="font-size:12px;color:#888"><a href="${unsubscribe}/settings">Налаштування сповіщень</a></p>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  return res.ok
}

async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) return false
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  return res.ok
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
  const channel = body.channel ?? 'inapp'
  const messageBody = String(body.body ?? '').trim()
  if (!messageBody) {
    return jsonResponse({ ok: false, error: 'empty_body' }, 400)
  }

  try {
    if (channel === 'inapp') {
      const userId = body.userId
      if (!userId) {
        return jsonResponse({ ok: false, error: 'userId_required' }, 400)
      }
      const { error } = await gate.admin.from('notifications').insert({
        user_id: userId,
        type: 'system',
        title: body.subject ?? 'DImarket',
        body: messageBody,
        link_path: body.link_path ?? '/settings',
      })
      if (error) return jsonResponse({ ok: false, error: error.message }, 400)
      return jsonResponse({ ok: true, data: { channel: 'inapp' } })
    }

    if (channel === 'email') {
      const to = String(body.to ?? '').trim()
      if (!to) return jsonResponse({ ok: false, error: 'to_required' }, 400)
      const sent = await sendResendEmail(to, body.subject ?? 'DImarket', messageBody)
      if (!sent) {
        return jsonResponse({ ok: false, error: 'email_send_failed' }, 502)
      }
      return jsonResponse({ ok: true, data: { channel: 'email', to } })
    }

    if (channel === 'telegram') {
      const chatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') ?? String(body.to ?? '').trim()
      if (!chatId) return jsonResponse({ ok: false, error: 'telegram_chat_required' }, 400)
      const sent = await sendTelegram(chatId, messageBody)
      if (!sent) return jsonResponse({ ok: false, error: 'telegram_send_failed' }, 502)
      return jsonResponse({ ok: true, data: { channel: 'telegram' } })
    }

    return jsonResponse({ ok: false, error: 'unknown_channel' }, 400)
  } catch (e) {
    return jsonResponse({ ok: false, error: String(e) }, 500)
  }
})
