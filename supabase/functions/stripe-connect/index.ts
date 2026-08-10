import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  action?: 'onboard' | 'status' | 'login'
  return_path?: string
  refresh_path?: string
  country?: string
}

function siteOrigin(req: Request): string {
  const fromEnv = Deno.env.get('SITE_URL') || Deno.env.get('VITE_SITE_URL')
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return (req.headers.get('origin') || 'https://dimarket.app').replace(/\/$/, '')
}

function syncPayload(account: Stripe.Account) {
  const ready =
    Boolean(account.charges_enabled) &&
    Boolean(account.payouts_enabled) &&
    Boolean(account.details_submitted)
  return {
    stripe_account_id: account.id,
    stripe_connect_charges_enabled: Boolean(account.charges_enabled),
    stripe_connect_payouts_enabled: Boolean(account.payouts_enabled),
    stripe_connect_details_submitted: Boolean(account.details_submitted),
    stripe_connect_onboarded_at: ready ? new Date().toISOString() : null,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY is not configured' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const action = body.action || 'status'
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: profile } = await admin
      .from('profiles')
      .select(
        'id, full_name, is_professional, user_role, stripe_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_onboarded_at',
      )
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      return jsonResponse({ error: 'Profile not found' }, 404)
    }

    const isPro =
      Boolean(profile.is_professional) ||
      profile.user_role === 'professional' ||
      profile.user_role === 'company'
    if (!isPro) {
      return jsonResponse({ error: 'Only professionals can connect payouts', code: 'not_pro' }, 403)
    }

    let accountId = profile.stripe_account_id as string | null

    if (action === 'status') {
      if (accountId) {
        const account = await stripe.accounts.retrieve(accountId)
        const payload = syncPayload(account)
        // Keep existing onboarded_at if already set
        if (profile.stripe_connect_onboarded_at && payload.stripe_connect_onboarded_at) {
          payload.stripe_connect_onboarded_at = profile.stripe_connect_onboarded_at
        } else if (!payload.stripe_connect_onboarded_at) {
          delete (payload as { stripe_connect_onboarded_at?: string | null }).stripe_connect_onboarded_at
        }
        await admin.from('profiles').update(payload).eq('id', user.id)
        return jsonResponse({
          ok: true,
          connected: true,
          ready:
            payload.stripe_connect_charges_enabled &&
            payload.stripe_connect_payouts_enabled &&
            payload.stripe_connect_details_submitted,
          ...payload,
        })
      }
      return jsonResponse({
        ok: true,
        connected: false,
        ready: false,
        stripe_account_id: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_details_submitted: false,
      })
    }

    if (action === 'login') {
      if (!accountId) {
        return jsonResponse({ error: 'No Connect account yet', code: 'no_account' }, 400)
      }
      const link = await stripe.accounts.createLoginLink(accountId)
      return jsonResponse({ ok: true, url: link.url })
    }

    // onboard
    if (!accountId) {
      const country = (body.country || 'ES').toUpperCase().slice(0, 2)
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email: user.email || undefined,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_profile: {
          product_description: 'Construction and home services via DImarket',
          mcc: '1520',
        },
        metadata: { user_id: user.id },
      })
      accountId = account.id
      await admin
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          stripe_connect_charges_enabled: false,
          stripe_connect_payouts_enabled: false,
          stripe_connect_details_submitted: false,
        })
        .eq('id', user.id)
    }

    const origin = siteOrigin(req)
    const returnPath = body.return_path || '/settings?connect=return'
    const refreshPath = body.refresh_path || '/settings?connect=refresh'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}${refreshPath.startsWith('/') ? '' : '/'}${refreshPath}`,
      return_url: `${origin}${returnPath.startsWith('/') ? '' : '/'}${returnPath}`,
      type: 'account_onboarding',
    })

    return jsonResponse({
      ok: true,
      url: accountLink.url,
      stripe_account_id: accountId,
    })
  } catch (err) {
    console.error('stripe-connect:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
