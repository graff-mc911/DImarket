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

// HMAC secret for signing the OAuth state param. Prefer a dedicated secret;
// fall back to the service role key (always present, never leaves the server).
// If no secret is available at all, fail closed — never send an unsigned state.
function stateSecret(): string {
  return (
    Deno.env.get('GOOGLE_OAUTH_STATE_SECRET') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    ''
  )
}

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function makeState(userId: string): Promise<string> {
  const exp = Date.now() + STATE_TTL_MS
  const payload = `${userId}.${exp}`
  const sig = await hmacSign(payload, stateSecret())
  return `${payload}.${sig}`
}

async function verifyState(state: string): Promise<string | null> {
  const secret = stateSecret()
  if (!secret) return null // fail closed if no signing secret is available
  const parts = state.split('.')
  if (parts.length !== 3) return null
  const [userId, expStr, sig] = parts
  if (!userId || !expStr || !sig) return null
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now()) return null
  const expected = await hmacSign(`${userId}.${exp}`, secret)
  // Constant-time-ish comparison.
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0 ? userId : null
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
      // Verify the signed state to defeat CSRF. The state must be HMAC-signed
      // by this server and not expired; the userId it carries is trusted only
      // after verification.
      const userId = state ? await verifyState(state) : null
      if (!userId) {
        return Response.redirect(`${site}/pro/calendar?gcal=invalid_state`, 302)
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
    if (!stateSecret()) {
      return jsonResponse({ ok: false, error: 'state_secret_missing' }, 503)
    }

    const params = new URLSearchParams({
      client_id: clientId(),
      redirect_uri: redirectUri(),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state: await makeState(user.id),
    })
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    return jsonResponse({ ok: true, url: authUrl })
  }

  return jsonResponse({ ok: false, error: 'unknown_action' }, 400)
})
