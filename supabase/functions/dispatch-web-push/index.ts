import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  user_id?: string
  title?: string
  body?: string
  url?: string
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const isService = Boolean(serviceKey && auth.includes(serviceKey))

  if (!isService) {
    // Allow authenticated user to push-test only their own tokens via user JWT is not needed;
    // production path is service-role from DB trigger / webhook.
    if (!auth) return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || Deno.env.get('VITE_VAPID_PUBLIC_KEY')
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@dimarket.app'

  if (!vapidPublic || !vapidPrivate) {
    return jsonResponse({ ok: false, error: 'vapid_not_configured' }, 503)
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

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
    serviceKey || anonKey,
  )

  const { data: tokens, error } = await admin
    .from('notification_tokens')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) return jsonResponse({ ok: false, error: error.message }, 400)
  if (!tokens?.length) return jsonResponse({ ok: true, data: { sent: 0 } })

  const notification = JSON.stringify({
    title: payload.title || 'DImarket',
    body: payload.body || '',
    url: payload.url || '/messages',
  })

  let sent = 0
  const stale: string[] = []

  for (const row of tokens) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        notification,
      )
      sent += 1
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

  return jsonResponse({ ok: true, data: { sent, stale: stale.length } })
})
