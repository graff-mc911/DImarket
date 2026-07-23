import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type CheckoutBody = {
  payment_type: string
  reference_id?: string
  user_id: string
  amount: number
  currency: string
  description: string
  success_url?: string
  cancel_url?: string
  duration_days?: number
  credits?: number
  mode?: 'payment' | 'subscription'
  billing_interval?: 'month' | 'year'
  plan_id?: string
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

    const body = (await req.json()) as CheckoutBody

    if (!body.payment_type || !body.user_id || !body.amount || !body.description) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    if (body.user_id !== user.id) {
      return jsonResponse({ error: 'user_id does not match authenticated user' }, 403)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const origin = req.headers.get('origin') ?? 'http://localhost:5173'
    const successUrl = body.success_url ?? `${origin}/checkout`
    const cancelUrl = body.cancel_url ?? `${origin}/pricing`

    const mode = body.mode === 'subscription' || body.payment_type === 'subscription'
      ? 'subscription'
      : 'payment'

    const durationDays = String(body.duration_days ?? defaultDurationDays(body.payment_type))
    const planId = body.plan_id || body.reference_id || ''
    const interval = body.billing_interval === 'year' ? 'year' : 'month'

    // Reuse Stripe customer when possible
    let customerId: string | undefined
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile?.full_name || undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', user.id)
    }

    const metadata: Record<string, string> = {
      payment_type: body.payment_type,
      reference_id: body.reference_id || '',
      user_id: body.user_id,
      duration_days: durationDays,
      description: body.description.slice(0, 500),
      plan_id: planId,
      billing_interval: interval,
      credits: String(body.credits ?? 0),
    }

    const lineItem =
      mode === 'subscription'
        ? {
            price_data: {
              currency: (body.currency || 'eur').toLowerCase(),
              unit_amount: Math.round(body.amount),
              recurring: { interval: interval as 'month' | 'year' },
              product_data: {
                name: body.description.slice(0, 200),
              },
            },
            quantity: 1,
          }
        : {
            price_data: {
              currency: (body.currency || 'eur').toLowerCase(),
              unit_amount: Math.round(body.amount),
              product_data: {
                name: body.description.slice(0, 200),
              },
            },
            quantity: 1,
          }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: body.reference_id || undefined,
      metadata,
      subscription_data: mode === 'subscription' ? { metadata } : undefined,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return jsonResponse({ error: 'Stripe did not return checkout URL' }, 500)
    }

    return jsonResponse({
      url: session.url,
      session_id: session.id,
    })
  } catch (err) {
    console.error('create-checkout-session:', err)
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  }
})

function defaultDurationDays(paymentType: string): number {
  switch (paymentType) {
    case 'premium_profile':
    case 'featured_profile':
      return 28
    case 'featured_listing':
      return 7
    case 'sponsored_project':
      return 14
    case 'verified_badge':
      return 365
    case 'ad_campaign':
      return 7
    default:
      return 30
  }
}
