import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  listing_id?: string
  profile_ids?: string[]
}

async function sendResendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return false
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('VITE_SITE_URL') ?? 'https://dimarket.app'
  const html = `<p>${body.replace(/\n/g, '<br>')}</p>
<p style="font-size:12px;color:#888"><a href="${siteUrl}/settings">Notification settings</a></p>`

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

function verifyInvokeAuth(req: Request): boolean {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const auth = req.headers.get('Authorization') ?? ''
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true
  if (auth.startsWith('Bearer ')) return true
  return false
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }
  if (!verifyInvokeAuth(req)) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400)
  }

  const listingId = String(body.listing_id ?? '').trim()
  const profileIds = Array.isArray(body.profile_ids)
    ? body.profile_ids.map((id) => String(id).trim()).filter(Boolean)
    : []

  if (!listingId || !profileIds.length) {
    return jsonResponse({ ok: false, error: 'missing_params' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: listing } = await admin
    .from('listings')
    .select('id, title, location, listing_type')
    .eq('id', listingId)
    .maybeSingle()

  if (!listing || listing.listing_type !== 'service_request') {
    return jsonResponse({ ok: false, error: 'listing_not_found' }, 404)
  }

  const { data: scored } = await admin
    .from('match_scores')
    .select('contractor_id')
    .eq('listing_id', listingId)
    .in('contractor_id', profileIds)

  const allowed = new Set((scored ?? []).map((r) => r.contractor_id as string))
  const targetIds = profileIds.filter((id) => allowed.has(id))
  if (!targetIds.length) {
    return jsonResponse({ ok: true, data: { emailed: 0, telegram: 0, skipped: profileIds.length } })
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, telegram_chat_id, notifications_enabled, is_professional')
    .in('id', targetIds)
    .eq('is_professional', true)

  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('VITE_SITE_URL') ?? 'https://dimarket.app'
  const link = `${siteUrl}/listing/${listingId}`
  const title = String(listing.title ?? 'Job request').slice(0, 120)
  const location = String(listing.location ?? '').slice(0, 80)

  let emailed = 0
  let telegram = 0

  for (const profile of profiles ?? []) {
    if (profile.notifications_enabled === false) continue

    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email?.trim()

    if (email) {
      const subject = `New AI Match: ${title}`
      const text =
        `Hi ${profile.full_name ?? 'professional'},\n\n` +
        `New AI Match — a project was matched to your profile.\n\n` +
        `${title}\n📍 ${location}\n\n` +
        `View details: ${link}`
      if (await sendResendEmail(email, subject, text)) emailed++
    }

    if (profile.telegram_chat_id) {
      const tgText =
        `✨ New AI Match\n\n${title}\n📍 ${location}\n\n${link}`
      if (await sendTelegram(String(profile.telegram_chat_id), tgText)) telegram++
    }
  }

  return jsonResponse({ ok: true, data: { emailed, telegram, targets: targetIds.length } })
})
