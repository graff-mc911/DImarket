import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRole) {
  console.error('stripe-webhook: missing required env vars')
}

const stripe = new Stripe(stripeKey || '', { apiVersion: '2024-11-20.acacia' })
const admin = createClient(supabaseUrl || '', serviceRole || '')

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) return new Response('Missing stripe-signature', { status: 400 })
    if (!webhookSecret) return new Response('Webhook secret not configured', { status: 500 })

    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session
      await handlePaidSession(session)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('stripe-webhook error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handlePaidSession(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {}
  const paymentType = String(meta.payment_type || '')
  const referenceId = String(meta.reference_id || '')
  const userId = String(meta.user_id || '')
  const durationDays = parseInt(String(meta.duration_days || '30'), 10)

  if (!paymentType || !userId) {
    console.warn('stripe-webhook: missing metadata', { paymentType, userId, sessionId: session.id })
    return
  }

  const amount = (session.amount_total ?? 0) / 100
  const currency = session.currency ?? 'eur'
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // Idempotency: if session already recorded, skip duplicate activation
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('stripe_session_id', session.id)
    .limit(1)
    .maybeSingle()

  if (!existing) {
    const { error: payErr } = await admin.from('payments').insert({
      user_id: userId,
      payment_type: paymentType,
      reference_id: referenceId || null,
      amount,
      currency,
      stripe_payment_intent_id: paymentIntentId,
      stripe_session_id: session.id,
      status: 'completed',
    })
    if (payErr) console.error('stripe-webhook: payments insert error', payErr)
  }

  await activateService(paymentType, referenceId, userId, {
    sessionId: session.id,
    amount,
    currency,
    durationDays: Number.isFinite(durationDays) ? durationDays : 30,
  })
}

async function activateService(
  paymentType: string,
  referenceId: string,
  userId: string,
  meta: { sessionId: string; amount: number; currency: string; durationDays: number },
) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + meta.durationDays * 24 * 60 * 60 * 1000).toISOString()

  switch (paymentType) {
    case 'premium_profile': {
      const { error } = await admin
        .from('profiles')
        .update({ is_premium: true, premium_expires_at: expiresAt })
        .eq('id', userId)
      if (error) console.error('stripe-webhook: premium_profile update error', error)
      break
    }
    case 'verified_badge': {
      const { error } = await admin
        .from('profiles')
        .update({ is_verified: true, verified_at: now.toISOString() })
        .eq('id', userId)
      if (error) console.error('stripe-webhook: verified_badge update error', error)
      break
    }
    case 'featured_listing': {
      if (!referenceId) break
      const { error } = await admin
        .from('listings')
        .update({ is_promoted: true, promoted_expires_at: expiresAt })
        .eq('id', referenceId)
        .eq('author_id', userId)
      if (error) console.error('stripe-webhook: featured_listing update error', error)
      break
    }
    case 'ad_campaign': {
      if (!referenceId) break
      const { error } = await admin
        .from('ad_campaigns')
        .update({
          status: 'active',
          stripe_payment_id: meta.sessionId,
          price_paid: meta.amount > 0 ? meta.amount : null,
          currency_paid: meta.currency || 'eur',
        })
        .eq('id', referenceId)
        .eq('advertiser_id', userId)
      if (error) console.error('stripe-webhook: ad_campaign update error', error)
      break
    }
    default:
      console.warn('stripe-webhook: unknown payment_type', paymentType)
  }
}
