import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  notification_id?: string
  user_id?: string
  type?: string
  title?: string
  body?: string
  url?: string
  send_push?: boolean
  send_email?: boolean
}

async function sendResendEmail(to: string, subject: string, body: string, link?: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return false
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
  const site = Deno.env.get('SITE_URL') || Deno.env.get('VITE_SITE_URL') || 'https://dimarket.app'
  const href = link?.startsWith('http') ? link : `${site}${link || ''}`
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1d1d1f">
    <h2 style="margin:0 0 8px">${subject}</h2>
    <p>${body.replace(/\n/g, '<br>')}</p>
    ${link ? `<p><a href="${href}" style="color:#0066cc">Open in DImarket</a></p>` : ''}
    <p style="font-size:12px;color:#888"><a href="${site}/settings">Notification settings</a></p>
  </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
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

  const auth = req.headers.get('Authorization') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!serviceKey || !auth.includes(serviceKey)) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  let payload: Body
  try {
    payload = (await req.json()) as Body
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400)
  }

  const userId = String(payload.user_id || '').trim()
  if (!userId) return jsonResponse({ ok: false, error: 'user_id_required' }, 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
  )

  const title = payload.title || 'DImarket'
  const body = payload.body || ''
  const url = payload.url || '/'
  const sendPush = payload.send_push !== false
  const sendEmail = payload.send_email !== false

  let pushSent = 0
  let emailSent = false

  if (sendPush) {
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || Deno.env.get('VITE_VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@dimarket.app'

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
      const { data: tokens } = await admin
        .from('notification_tokens')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId)

      const stale: string[] = []
      const notification = JSON.stringify({ title, body, url })
      for (const row of tokens ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            notification,
          )
          pushSent += 1
        } catch (e: unknown) {
          const statusCode =
            e && typeof e === 'object' && 'statusCode' in e
              ? Number((e as { statusCode: number }).statusCode)
              : 0
          if (statusCode === 404 || statusCode === 410) stale.push(row.endpoint)
        }
      }
      if (stale.length) {
        await admin.from('notification_tokens').delete().in('endpoint', stale)
      }
    }
  }

  if (sendEmail) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle()

    let email = (profile as { email?: string | null } | null)?.email || null
    if (!email) {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      email = authUser.user?.email ?? null
    }
    if (email) {
      emailSent = await sendResendEmail(email, title, body, url)
    }
  }

  if (payload.notification_id) {
    await admin
      .from('notifications')
      .update({
        push_sent: pushSent > 0,
        email_sent: emailSent,
      })
      .eq('id', payload.notification_id)
  }

  return jsonResponse({
    ok: true,
    data: { push_sent: pushSent, email_sent: emailSent },
  })
})
