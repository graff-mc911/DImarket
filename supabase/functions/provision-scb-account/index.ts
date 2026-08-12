import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type ProvisionBody = {
  password?: string
  fullName?: string
}

function randomPassword(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) + 'Aa1!'
}

function isDuplicateUserError(message: string | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('already') || m.includes('registered') || m.includes('exists')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ ok: false, error: 'missing_auth' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const scbUrl = Deno.env.get('SCB_SUPABASE_URL')
    const scbServiceKey = Deno.env.get('SCB_SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ ok: false, error: 'misconfigured' }, 500)
    }

    if (!scbUrl || !scbServiceKey) {
      return jsonResponse({ ok: false, error: 'scb_not_configured' }, 503)
    }

    let body: ProvisionBody = {}
    try {
      body = (await req.json()) as ProvisionBody
    } catch {
      body = {}
    }

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser()

    if (userError || !user?.email) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
    }

    const email = user.email.trim().toLowerCase()
    const fullName =
      body.fullName?.trim() ||
      (typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name.trim()
        : '') ||
      email.split('@')[0]

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_role, is_professional, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.user_role ?? user.user_metadata?.user_role
    const isPro =
      profile?.is_professional === true ||
      role === 'professional' ||
      role === 'company'

    if (!isPro) {
      return jsonResponse({ ok: false, error: 'not_professional' }, 403)
    }

    const { data: existingLink } = await supabaseAdmin
      .from('scb_account_links')
      .select('scb_user_id, status')
      .eq('dimarket_user_id', user.id)
      .maybeSingle()

    if (existingLink && existingLink.status !== 'failed') {
      return jsonResponse({
        ok: true,
        alreadyLinked: true,
        status: existingLink.status,
        scbUserId: existingLink.scb_user_id,
      })
    }

    const scbAdmin = createClient(scbUrl, scbServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const password = body.password?.trim() || randomPassword()
    const passwordSynced = Boolean(body.password?.trim())

    const { data: created, error: createError } = await scbAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: profile?.full_name || fullName,
        source: 'dimarket',
        dimarket_user_id: user.id,
      },
    })

    let scbUserId = created.user?.id ?? null
    let status: 'provisioned' | 'existing_email' = 'provisioned'
    let errorMessage: string | null = null

    if (createError) {
      if (isDuplicateUserError(createError.message)) {
        status = 'existing_email'
        errorMessage = null
      } else {
        await supabaseAdmin.from('scb_account_links').upsert(
          {
            dimarket_user_id: user.id,
            scb_user_id: null,
            email,
            status: 'failed',
            error_message: createError.message,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'dimarket_user_id' },
        )
        return jsonResponse({ ok: false, error: createError.message }, 500)
      }
    }

    await supabaseAdmin.from('scb_account_links').upsert(
      {
        dimarket_user_id: user.id,
        scb_user_id: scbUserId,
        email,
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dimarket_user_id' },
    )

    return jsonResponse({
      ok: true,
      status,
      scbUserId,
      passwordSynced,
      alreadyExists: status === 'existing_email',
    })
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500)
  }
})
