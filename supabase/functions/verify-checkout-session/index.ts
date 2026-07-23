import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type VerifyBody = {
  session_id: string
  user_id: string
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

    const body = (await req.json()) as VerifyBody

    if (!body.session_id) {
      return jsonResponse({ error: 'session_id is required' }, 400)
    }

    if (body.user_id !== user.id) {
      return jsonResponse({ error: 'user_id does not match authenticated user' }, 403)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })
    const session = await stripe.checkout.sessions.retrieve(body.session_id)

    const meta = session.metadata ?? {}
    const sessionUserId = meta.user_id ?? ''

    if (sessionUserId && sessionUserId !== user.id) {
      return jsonResponse({ error: 'Session belongs to another user' }, 403)
    }

    const paymentStatus =
      session.payment_status === 'paid' ? 'paid' : session.payment_status

    const amountTotal = session.amount_total ?? 0
    const currency = session.currency ?? 'eur'

    return jsonResponse({
      payment_status: paymentStatus,
      payment_type: meta.payment_type ?? '',
      reference_id: meta.reference_id ?? session.client_reference_id ?? '',
      description: meta.description ?? '',
      metadata: {
        session_id: session.id,
        payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? '',
        duration_days: meta.duration_days ?? '30',
        credits: meta.credits ?? '0',
        plan_id: meta.plan_id ?? '',
        amount_total: String(amountTotal),
        currency,
      },
    })
  } catch (err) {
    console.error('verify-checkout-session:', err)
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  }
})
