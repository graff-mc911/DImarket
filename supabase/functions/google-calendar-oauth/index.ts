import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.owned',
].join(' ')

function clientId() {
  return Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID') || ''
}
function clientSecret() {
  return Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
}
function redirectUri() {
  const explicit = Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI')
  if (explicit) return explicit
  const base = Deno.env.get('SUPABASE_URL') || ''
  return `${base.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'start'
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const site = Deno.env.get('SITE_URL') || Deno.env.get('VITE_SITE_URL') || 'https://dimarket.app'

  // OAuth callback from Google
  if (code) {
    try {
      const userId = state || ''
      if (!userId) {
        return Response.redirect(`${site}/pro/calendar?gcal=missing_state`, 302)
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId(),
          client_secret: clientSecret(),
          redirect_uri: redirectUri(),
          grant_type: 'authorization_code',
        }),
      })
      const tokens = await tokenRes.json()
      if (!tokenRes.ok) {
        console.error('token exchange', tokens)
        return Response.redirect(`${site}/pro/calendar?gcal=token_error`, 302)
      }

      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const expiry = tokens.expires_in
        ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
        : null

      await admin.from('google_calendar_connections').upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: expiry,
        calendar_id: 'primary',
        scope: tokens.scope || SCOPES,
        updated_at: new Date().toISOString(),
      })

      return Response.redirect(`${site}/pro/calendar?gcal=connected`, 302)
    } catch (e) {
      console.error(e)
      return Response.redirect(`${site}/pro/calendar?gcal=error`, 302)
    }
  }

  if (action === 'start') {
    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return jsonResponse({ ok: false, error: 'unauthorized' }, 401)

    if (!clientId()) {
      return jsonResponse({ ok: false, error: 'google_client_not_configured' }, 503)
    }

    const params = new URLSearchParams({
      client_id: clientId(),
      redirect_uri: redirectUri(),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state: user.id,
    })
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    return jsonResponse({ ok: true, url: authUrl })
  }

  return jsonResponse({ ok: false, error: 'unknown_action' }, 400)
})
