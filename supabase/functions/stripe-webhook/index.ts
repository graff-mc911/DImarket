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
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created'
    ) {
      await handleSubscriptionChange(event.data.object as Stripe.Subscription)
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
    } else if (event.type === 'invoice.paid') {
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
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

async function markProjectEscrowAuthorized(
  session: Stripe.Checkout.Session,
  paymentIntentId: string | null,
) {
  const meta = session.metadata ?? {}
  const escrowId = String(meta.reference_id || '')
  const userId = String(meta.user_id || '')
  const now = new Date().toISOString()

  const payload = {
    status: 'authorized',
    stripe_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    authorized_at: now,
    updated_at: now,
  }

  if (isUuid(escrowId)) {
    const { error } = await admin.from('project_escrows').update(payload).eq('id', escrowId)
    if (error) console.error('stripe-webhook: project_escrow by id', error)
  } else {
    const { error } = await admin
      .from('project_escrows')
      .update(payload)
      .eq('stripe_session_id', session.id)
    if (error) console.error('stripe-webhook: project_escrow by session', error)
  }

  // Audit row in payments (status completed = authorization recorded; capture is separate)
  const amount = (session.amount_total ?? 0) / 100
  const currency = session.currency ?? 'eur'
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('stripe_session_id', session.id)
    .limit(1)
    .maybeSingle()

  if (!existing) {
    const { error: payErr } = await admin.from('payments').insert({
      user_id: userId || null,
      payment_type: 'project_escrow',
      reference_id: isUuid(escrowId) ? escrowId : null,
      amount,
      currency,
      stripe_payment_intent_id: paymentIntentId,
      stripe_session_id: session.id,
      status: 'completed',
    })
    if (payErr) console.error('stripe-webhook: escrow payments insert', payErr)
  }

  if (session.customer && typeof session.customer === 'string' && userId) {
    await admin.from('profiles').update({ stripe_customer_id: session.customer }).eq('id', userId)
  }

  if (userId) {
    try {
      let linkPath = '/projects'
      if (isUuid(escrowId)) {
        const { data: row } = await admin
          .from('project_escrows')
          .select('listing_id')
          .eq('id', escrowId)
          .maybeSingle()
        if (row?.listing_id) linkPath = `/project/${row.listing_id}/manage`
      }
      await admin.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'payment',
        p_title: 'Project funds held',
        p_body: 'Your card was authorized. Funds release when you complete the project.',
        p_link_path: linkPath,
        p_reference_type: 'payment',
        p_reference_id: null,
      })
    } catch (e) {
      console.error('stripe-webhook: escrow notification', e)
    }
  }
}

async function handlePaidSession(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {}
  const paymentType = String(meta.payment_type || '')
  const referenceId = String(meta.reference_id || '')
  const userId = String(meta.user_id || '')
  const durationDays = parseInt(String(meta.duration_days || '30'), 10)
  const credits = parseInt(String(meta.credits || '0'), 10)
  const planId = String(meta.plan_id || referenceId || '')
  const billingInterval = String(meta.billing_interval || 'month')

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

  // Project escrow: authorize-only (manual capture). Do not run ads activation.
  if (paymentType === 'project_escrow') {
    await markProjectEscrowAuthorized(session, paymentIntentId)
    return
  }

  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('stripe_session_id', session.id)
    .limit(1)
    .maybeSingle()

  let paymentId: string | null = existing?.id ?? null

  if (!existing) {
    const { data: inserted, error: payErr } = await admin
      .from('payments')
      .insert({
        user_id: userId,
        payment_type: paymentType,
        reference_id: isUuid(referenceId) ? referenceId : null,
        amount,
        currency,
        stripe_payment_intent_id: paymentIntentId,
        stripe_session_id: session.id,
        status: 'completed',
      })
      .select('id')
      .maybeSingle()
    if (payErr) console.error('stripe-webhook: payments insert error', payErr)
    paymentId = inserted?.id ?? null
  }

  if (session.customer && typeof session.customer === 'string') {
    await admin.from('profiles').update({ stripe_customer_id: session.customer }).eq('id', userId)
  }

  if (paymentType === 'subscription' || session.mode === 'subscription') {
    const subId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null
    await upsertSubscription({
      userId,
      planId: planId || 'pro',
      billingInterval,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
      stripeSubscriptionId: subId,
      status: 'active',
      grantCredits: true,
    })
  } else {
    await activateService(paymentType, referenceId, userId, {
      sessionId: session.id,
      amount,
      currency,
      durationDays: Number.isFinite(durationDays) ? durationDays : 30,
      credits: Number.isFinite(credits) ? credits : 0,
      paymentId,
    })
  }

  try {
    await admin.rpc('create_notification', {
      p_user_id: userId,
      p_type: 'payment',
      p_title: 'Payment confirmed',
      p_body: `Your ${paymentType.replace(/_/g, ' ')} payment was successful.`,
      p_link_path: '/billing',
      p_reference_type: 'payment',
      p_reference_id: null,
    })
  } catch (e) {
    console.error('stripe-webhook: notification error', e)
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const meta = sub.metadata ?? {}
  const userId = String(meta.user_id || '')
  const planId = String(meta.plan_id || meta.reference_id || 'pro')
  const billingInterval = String(meta.billing_interval || 'month')
  if (!userId) {
    console.warn('stripe-webhook: subscription without user_id', sub.id)
    return
  }

  await upsertSubscription({
    userId,
    planId,
    billingInterval,
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : null,
    stripeSubscriptionId: sub.id,
    status: mapSubStatus(sub.status),
    periodStart: new Date(sub.current_period_start * 1000).toISOString(),
    periodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    grantCredits: false,
  })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const meta = sub.metadata ?? {}
  let userId = String(meta.user_id || '')
  if (!userId) {
    const { data } = await admin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle()
    userId = data?.user_id || ''
  }
  if (!userId) return

  await admin
    .from('user_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.id)

  await admin.rpc('clear_plan_to_free', { p_user_id: userId })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Monthly renewal: re-grant plan credits
  if (invoice.billing_reason !== 'subscription_cycle') return
  const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
  if (!subId) return

  const { data: row } = await admin
    .from('user_subscriptions')
    .select('user_id, plan_id, current_period_end')
    .eq('stripe_subscription_id', subId)
    .maybeSingle()

  if (!row?.user_id || !row.plan_id) return

  await admin.rpc('apply_plan_entitlements', {
    p_user_id: row.user_id,
    p_plan_id: row.plan_id,
    p_period_end: row.current_period_end,
    p_grant_monthly_credits: true,
  })
}

async function upsertSubscription(opts: {
  userId: string
  planId: string
  billingInterval: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: string
  periodStart?: string
  periodEnd?: string
  cancelAtPeriodEnd?: boolean
  grantCredits: boolean
}) {
  const periodEnd =
    opts.periodEnd ||
    new Date(Date.now() + (opts.billingInterval === 'year' ? 365 : 32) * 86400000).toISOString()
  const periodStart = opts.periodStart || new Date().toISOString()

  await admin.from('profiles').update({
    stripe_customer_id: opts.stripeCustomerId,
    stripe_subscription_id: opts.stripeSubscriptionId,
    subscription_status: opts.status,
    subscription_period_end: periodEnd,
    plan_id: opts.planId,
  }).eq('id', opts.userId)

  if (opts.stripeSubscriptionId) {
    const { data: existing } = await admin
      .from('user_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', opts.stripeSubscriptionId)
      .maybeSingle()

    const payload = {
      user_id: opts.userId,
      plan_id: opts.planId,
      billing_interval: opts.billingInterval === 'year' ? 'year' : 'month',
      status: opts.status,
      stripe_customer_id: opts.stripeCustomerId,
      stripe_subscription_id: opts.stripeSubscriptionId,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: opts.cancelAtPeriodEnd ?? false,
      updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
      await admin.from('user_subscriptions').update(payload).eq('id', existing.id)
    } else {
      await admin.from('user_subscriptions').insert(payload)
    }
  }

  await admin.rpc('apply_plan_entitlements', {
    p_user_id: opts.userId,
    p_plan_id: opts.planId,
    p_period_end: periodEnd,
    p_grant_monthly_credits: opts.grantCredits,
  })
}

async function activateService(
  paymentType: string,
  referenceId: string,
  userId: string,
  meta: {
    sessionId: string
    amount: number
    currency: string
    durationDays: number
    credits: number
    paymentId: string | null
  },
) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + meta.durationDays * 24 * 60 * 60 * 1000).toISOString()

  switch (paymentType) {
    case 'premium_profile': {
      const { error } = await admin
        .from('profiles')
        .update({ is_premium: true, premium_expires_at: expiresAt })
        .eq('id', userId)
      if (error) console.error('stripe-webhook: premium_profile', error)
      break
    }
    case 'featured_profile': {
      const { error } = await admin
        .from('profiles')
        .update({ is_featured: true, featured_expires_at: expiresAt })
        .eq('id', userId)
      if (error) console.error('stripe-webhook: featured_profile', error)
      break
    }
    case 'verified_badge': {
      const { error } = await admin
        .from('profiles')
        .update({ is_verified: true, verified_at: now.toISOString() })
        .eq('id', userId)
      if (error) console.error('stripe-webhook: verified_badge', error)
      break
    }
    case 'featured_listing': {
      if (!referenceId) break
      const { error } = await admin
        .from('listings')
        .update({ is_promoted: true, promoted_expires_at: expiresAt })
        .eq('id', referenceId)
        .eq('author_id', userId)
      if (error) console.error('stripe-webhook: featured_listing', error)
      break
    }
    case 'sponsored_project': {
      if (!referenceId) break
      const { error } = await admin.from('sponsored_projects').insert({
        listing_id: referenceId,
        sponsor_user_id: userId,
        status: 'active',
        expires_at: expiresAt,
        stripe_session_id: meta.sessionId,
      })
      if (error) console.error('stripe-webhook: sponsored_project', error)
      break
    }
    case 'lead_credits': {
      const amount = meta.credits > 0 ? meta.credits : Math.max(1, Math.round(meta.amount))
      const { error } = await admin.rpc('grant_lead_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: 'purchase_pack',
        p_reference_id: meta.sessionId,
        p_payment_id: meta.paymentId,
      })
      if (error) console.error('stripe-webhook: lead_credits', error)
      break
    }
    case 'google_ads': {
      const { error } = await admin
        .from('google_ads_requests')
        .update({ status: 'in_review', stripe_session_id: meta.sessionId, updated_at: now.toISOString() })
        .eq('user_id', userId)
        .eq('status', 'pending')
      if (error) console.error('stripe-webhook: google_ads', error)
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
      if (error) console.error('stripe-webhook: ad_campaign', error)
      break
    }
    default:
      console.warn('stripe-webhook: unknown payment_type', paymentType)
  }
}

function mapSubStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'canceled':
    case 'unpaid':
    case 'incomplete':
      return status
    default:
      return 'active'
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
