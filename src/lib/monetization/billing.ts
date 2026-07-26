import { supabase } from '../supabase'
import { createCheckoutSession, eurosToCents, type PaymentType } from '../stripe'
import {
  ADDONS,
  PLANS,
  getPlan,
  normalizePlanId,
  planPrice,
  type BillingInterval,
  type PlanId,
} from './plans'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type BillingProfile = {
  plan_id: string | null
  lead_credits: number | null
  support_tier: string | null
  subscription_status: string | null
  subscription_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  is_premium: boolean | null
  is_featured: boolean | null
  premium_expires_at: string | null
  featured_expires_at: string | null
  trial_ends_at?: string | null
  membership_badge?: string | null
}

export type BillingInvoice = {
  id: string
  number: string | null
  status: string
  amount_due: number
  amount_paid: number
  currency: string
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  paid_at: string | null
  created_at: string
  period_start: string | null
  period_end: string | null
}

export type PaymentHistoryRow = {
  id: string
  payment_type: string
  amount: number
  currency: string
  status: string
  created_at: string
  description?: string | null
}

export async function fetchBillingProfile(userId: string): Promise<BillingProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'plan_id, lead_credits, support_tier, subscription_status, subscription_period_end, stripe_customer_id, stripe_subscription_id, is_premium, is_featured, premium_expires_at, featured_expires_at, trial_ends_at, membership_badge',
    )
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    // Fallback without new columns
    const retry = await supabase
      .from('profiles')
      .select(
        'plan_id, lead_credits, support_tier, subscription_status, subscription_period_end, stripe_customer_id, stripe_subscription_id, is_premium, is_featured, premium_expires_at, featured_expires_at',
      )
      .eq('id', userId)
      .maybeSingle()
    if (retry.error) {
      console.error('fetchBillingProfile:', error)
      return null
    }
    return retry.data as BillingProfile | null
  }
  return data as BillingProfile | null
}

export async function fetchCreditLedger(userId: string, limit = 40) {
  const { data, error } = await db
    .from('lead_credit_ledger')
    .select('id, delta, balance_after, reason, reference_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchCreditLedger:', error)
    return []
  }
  return data ?? []
}

export async function fetchBillingInvoices(userId: string, limit = 30): Promise<BillingInvoice[]> {
  const { data, error } = await db
    .from('billing_invoices')
    .select(
      'id, number, status, amount_due, amount_paid, currency, hosted_invoice_url, invoice_pdf, paid_at, created_at, period_start, period_end',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    if (/relation|schema cache|does not exist/i.test(error.message)) return []
    console.error('fetchBillingInvoices:', error)
    return []
  }
  return (data ?? []) as BillingInvoice[]
}

export async function fetchPaymentHistory(userId: string, limit = 40): Promise<PaymentHistoryRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, payment_type, amount, currency, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchPaymentHistory:', error)
    return []
  }
  return (data ?? []) as PaymentHistoryRow[]
}

export async function fetchUserSubscription(userId: string) {
  const { data, error } = await db
    .from('user_subscriptions')
    .select(
      'id, plan_id, billing_interval, status, current_period_end, cancel_at_period_end, trial_end, coupon_code',
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

export async function startPlanCheckout(opts: {
  userId: string
  planId: PlanId | string
  interval: BillingInterval
  withTrial?: boolean
}): Promise<{ url: string; session_id: string }> {
  const plan = getPlan(opts.planId)
  const storageId = normalizePlanId(plan.storageId || plan.id)
  if (!plan.checkoutEnabled || plan.priceEurMonth <= 0) {
    throw new Error('This plan does not require checkout')
  }

  const amount = eurosToCents(planPrice(plan, opts.interval))
  const trialDays = opts.withTrial === false ? 0 : plan.trialDays || 0

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      payment_type: 'subscription',
      reference_id: storageId,
      user_id: opts.userId,
      amount,
      currency: 'eur',
      description: `DImarket ${plan.name} (${opts.interval}ly)`,
      mode: 'subscription',
      billing_interval: opts.interval,
      plan_id: storageId,
      trial_period_days: trialDays > 0 ? trialDays : undefined,
      success_url: window.location.origin + '/billing?upgraded=1',
      cancel_url: window.location.origin + '/pricing',
    },
  })

  if (error) throw new Error(error.message || 'Stripe error')
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('No checkout URL')
  return { url: data.url, session_id: data.session_id }
}

export async function startAddonCheckout(opts: {
  userId: string
  addonId: string
  referenceId?: string
}): Promise<{ url: string; session_id: string }> {
  const addon = ADDONS.find((a) => a.id === opts.addonId)
  if (!addon) throw new Error('Unknown add-on')
  if (addon.href) {
    window.location.href = addon.href
    return { url: addon.href, session_id: '' }
  }

  return createCheckoutSession({
    payment_type: addon.paymentType as PaymentType,
    reference_id: opts.referenceId || opts.userId,
    user_id: opts.userId,
    amount: eurosToCents(addon.priceEur),
    currency: 'eur',
    description: addon.name,
    duration_days: addon.durationDays,
    credits: addon.credits,
    success_url: window.location.origin + '/billing?addon=1',
    cancel_url: window.location.origin + '/pricing',
  })
}

export async function openBillingPortal(userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-billing-portal', {
    body: {
      user_id: userId,
      return_url: window.location.origin + '/billing',
    },
  })
  if (error) throw new Error(error.message || 'Portal error')
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('No portal URL')
  return data.url as string
}

export async function submitGoogleAdsRequest(input: {
  userId: string
  businessName: string
  websiteUrl?: string
  monthlyBudgetEur?: number
  goals?: string
}) {
  const { data, error } = await db
    .from('google_ads_requests')
    .insert({
      user_id: input.userId,
      business_name: input.businessName,
      website_url: input.websiteUrl || null,
      monthly_budget_eur: input.monthlyBudgetEur ?? null,
      goals: input.goals || null,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function createSponsoredProject(opts: {
  listingId: string
  userId: string
  durationDays: number
  stripeSessionId?: string
}) {
  const expires = new Date()
  expires.setDate(expires.getDate() + opts.durationDays)
  const { error } = await db.from('sponsored_projects').insert({
    listing_id: opts.listingId,
    sponsor_user_id: opts.userId,
    status: 'active',
    expires_at: expires.toISOString(),
    stripe_session_id: opts.stripeSessionId || null,
  })
  if (error) throw error
}

export async function consumeLeadCredit(userId: string, referenceId?: string) {
  const { data, error } = await db.rpc('consume_lead_credit', {
    p_user_id: userId,
    p_amount: 1,
    p_reason: 'lead_unlock',
    p_reference_id: referenceId ?? null,
  })
  if (error) throw error
  return data as number
}

export async function fetchMembershipCoupons() {
  const { data, error } = await db
    .from('membership_coupons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return []
  return data ?? []
}

export async function upsertMembershipCoupon(input: {
  code: string
  percentOff?: number | null
  amountOffEur?: number | null
  trialDays?: number | null
  planIds?: string[] | null
  maxRedemptions?: number | null
  expiresAt?: string | null
  active?: boolean
  description?: string | null
}) {
  const { data, error } = await db.rpc('admin_upsert_membership_coupon', {
    p_code: input.code,
    p_percent_off: input.percentOff ?? null,
    p_amount_off_eur: input.amountOffEur ?? null,
    p_trial_days: input.trialDays ?? null,
    p_plan_ids: input.planIds ?? null,
    p_max_redemptions: input.maxRedemptions ?? null,
    p_expires_at: input.expiresAt ?? null,
    p_active: input.active ?? true,
    p_description: input.description ?? null,
  })
  if (error) throw error
  return data as string
}

export async function updateSubscriptionPlanAdmin(input: {
  id: string
  priceEurMonth?: number
  priceEurYear?: number
  trialDays?: number
  isActive?: boolean
  name?: string
}) {
  const patch: Record<string, unknown> = {}
  if (input.priceEurMonth != null) patch.price_eur_month = input.priceEurMonth
  if (input.priceEurYear != null) patch.price_eur_year = input.priceEurYear
  if (input.trialDays != null) patch.trial_days = input.trialDays
  if (input.isActive != null) patch.is_active = input.isActive
  if (input.name) patch.name = input.name
  const { error } = await db.from('subscription_plans').update(patch).eq('id', input.id)
  if (error) throw error
}

export async function fetchSubscriptionPlansAdmin() {
  const { data, error } = await db
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return PLANS.map((p) => ({ id: p.storageId, name: p.name }))
  return data ?? []
}

export function planLabel(planId: string | null | undefined) {
  return getPlan(planId).name
}

export function isPastDue(status: string | null | undefined) {
  return status === 'past_due' || status === 'unpaid'
}

export function isTrialing(status: string | null | undefined, trialEndsAt?: string | null) {
  if (status === 'trialing') return true
  if (trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()) return true
  return false
}

export { PLANS, ADDONS, getPlan }
