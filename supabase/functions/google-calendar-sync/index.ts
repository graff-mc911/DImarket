import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = { booking_id?: string }

function clientId() {
  return Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID') || ''
}
function clientSecret() {
  return Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return jsonResponse({ ok: false, error: 'unauthorized' }, 401)

  const body = (await req.json()) as Body
  const bookingId = String(body.booking_id || '').trim()
  if (!bookingId) return jsonResponse({ ok: false, error: 'booking_id_required' }, 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle()

  if (bErr || !booking) return jsonResponse({ ok: false, error: 'booking_not_found' }, 404)
  if (booking.professional_id !== user.id) {
    return jsonResponse({ ok: false, error: 'forbidden' }, 403)
  }
  if (booking.status !== 'accepted') {
    return jsonResponse({ ok: false, error: 'not_accepted' }, 400)
  }

  const { data: conn } = await admin
    .from('google_calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn) return jsonResponse({ ok: true, data: { skipped: 'not_connected' } })

  let accessToken = conn.access_token as string
  const expiry = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0
  if (expiry && expiry < Date.now() + 60_000 && conn.refresh_token) {
    const refreshed = await refreshAccessToken(conn.refresh_token)
    if (refreshed.access_token) {
      accessToken = refreshed.access_token
      await admin
        .from('google_calendar_connections')
        .update({
          access_token: accessToken,
          token_expiry: refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }
  }

  const calendarId = encodeURIComponent(conn.calendar_id || 'primary')
  const eventBody = {
    summary: `DImarket: ${booking.customer_name}`,
    description: [
      booking.notes || '',
      booking.customer_email ? `Email: ${booking.customer_email}` : '',
      booking.customer_phone ? `Phone: ${booking.customer_phone}` : '',
      'Synced from DImarket',
    ]
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: booking.starts_at },
    end: { dateTime: booking.ends_at },
  }

  let eventId = booking.google_event_id as string | null
  let res: Response

  if (eventId) {
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      },
    )
  } else {
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      },
    )
  }

  const json = await res.json()
  if (!res.ok) {
    console.error('gcal event', json)
    return jsonResponse({ ok: false, error: 'google_api_error', detail: json }, 502)
  }

  eventId = json.id
  await admin
    .from('bookings')
    .update({ google_event_id: eventId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  return jsonResponse({ ok: true, data: { event_id: eventId } })
})
