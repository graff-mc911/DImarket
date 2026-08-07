// ============================================================
// stripe.ts — Stripe Checkout via Supabase Edge Functions
// ============================================================

import { supabase } from './supabase'

export type PaymentType =
  | 'ad_campaign'
  | 'premium_profile'
  | 'featured_listing'
  | 'verified_badge'
  | 'subscription'
  | 'featured_profile'
  | 'sponsored_project'
  | 'lead_credits'
  | 'google_ads'
  | 'project_escrow'

export interface CheckoutParams {
  payment_type: PaymentType
  reference_id?: string
  user_id: string
  amount: number
  currency: string
  description: string
  duration_days?: number
  credits?: number
  mode?: 'payment' | 'subscription'
  billing_interval?: 'month' | 'year'
  plan_id?: string
  success_url?: string
  cancel_url?: string
}

export interface CheckoutResult {
  url: string
  session_id: string
}

export const eurosToCents = (euros: number): number => Math.round(euros * 100)

export async function createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      payment_type: params.payment_type,
      reference_id: params.reference_id || '',
      user_id: params.user_id,
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      description: params.description,
      duration_days: params.duration_days,
      credits: params.credits,
      mode: params.mode || 'payment',
      billing_interval: params.billing_interval,
      plan_id: params.plan_id,
      success_url: params.success_url || window.location.origin + '/checkout',
      cancel_url: params.cancel_url || window.location.origin + window.location.pathname,
    },
  })

  if (error) throw new Error(error.message || 'Stripe error')
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('No checkout URL from Stripe')

  return { url: data.url, session_id: data.session_id }
}

export const BOOST_PACKAGES = [
  {
    id: 'premium_profile_4w',
    type: 'premium_profile' as PaymentType,
    name: 'Premium profile — 4 weeks',
    description: 'Your profile ranks at the top of the catalog',
    price_eur: 29,
    duration_days: 28,
  },
  {
    id: 'premium_profile_12w',
    type: 'premium_profile' as PaymentType,
    name: 'Premium profile — 12 weeks',
    description: 'Your profile ranks at the top of the catalog',
    price_eur: 69,
    duration_days: 84,
  },
  {
    id: 'featured_listing_1w',
    type: 'featured_listing' as PaymentType,
    name: 'Featured listing — 1 week',
    description: 'Highlight a single listing',
    price_eur: 9,
    duration_days: 7,
  },
  {
    id: 'verified_badge',
    type: 'verified_badge' as PaymentType,
    name: 'Verified badge',
    description: 'Verified checkmark on your profile',
    price_eur: 49,
    duration_days: 365,
  },
]
