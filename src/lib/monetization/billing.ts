import { supabase } from '../supabase'
import { createCheckoutSession, eurosToCents, type PaymentType } from '../stripe'
import {
  ADDONS,
  PLANS,
  getPlan,
  planPrice,
  type BillingInterval,
  type PlanId,
} from './plans'

// Local helper — Database table inserts are loosely typed until full schema regen
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
}

export async function fetchBillingProfile(userId: string): Promise<BillingProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'plan_id, lead_credits, support_tier, subscription_status, subscription_period_end, stripe_customer_id, stripe_subscription_id, is_premium, is_featured, premium_expires_at, featured_expires_at',
    )
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('fetchBillingProfile:', error)
    return null
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

export async function startPlanCheckout(opts: {
  userId: string
  planId: PlanId
  interval: BillingInterval
}): Promise<{ url: string; session_id: string }> {
  const plan = getPlan(opts.planId)
  if (plan.id === 'free') throw new Error('Free plan does not require checkout')

  const amount = eurosToCents(planPrice(plan, opts.interval))
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      payment_type: 'subscription',
      reference_id: plan.id,
      user_id: opts.userId,
      amount,
      currency: 'eur',
      description: `DImarket ${plan.name} (${opts.interval}ly)`,
      mode: 'subscription',
      billing_interval: opts.interval,
      plan_id: plan.id,
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

export function planLabel(planId: string | null | undefined) {
  return getPlan(planId).name
}

export { PLANS, ADDONS, getPlan }
