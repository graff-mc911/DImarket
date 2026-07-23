/** DImarket monetization plans & add-on catalog */

export type PlanId = 'free' | 'pro' | 'business' | 'enterprise'
export type BillingInterval = 'month' | 'year'
export type SupportTier = 'community' | 'email' | 'priority' | 'dedicated'

export type PlanDefinition = {
  id: PlanId
  name: string
  tagline: string
  priceEurMonth: number
  priceEurYear: number
  leadCreditsMonthly: number
  featuredProfile: boolean
  premiumProfile: boolean
  sponsoredProjectsMonthly: number
  bannerAdDiscountPct: number
  googleAdsIncluded: boolean
  supportTier: SupportTier
  highlights: string[]
  cta: string
  popular?: boolean
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start winning jobs on DImarket',
    priceEurMonth: 0,
    priceEurYear: 0,
    leadCreditsMonthly: 0,
    featuredProfile: false,
    premiumProfile: false,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 0,
    googleAdsIncluded: false,
    supportTier: 'community',
    highlights: [
      'Public professional profile',
      'Apply to open projects',
      'Community support',
      'Banner ads available à la carte',
    ],
    cta: 'Current plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'More visibility and steady leads',
    priceEurMonth: 29,
    priceEurYear: 290,
    leadCreditsMonthly: 20,
    featuredProfile: true,
    premiumProfile: true,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 10,
    googleAdsIncluded: false,
    supportTier: 'email',
    popular: true,
    highlights: [
      'Featured + premium profile',
      '20 lead credits / month',
      '10% off banner ads',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Grow with sponsored reach',
    priceEurMonth: 79,
    priceEurYear: 790,
    leadCreditsMonthly: 75,
    featuredProfile: true,
    premiumProfile: true,
    sponsoredProjectsMonthly: 2,
    bannerAdDiscountPct: 25,
    googleAdsIncluded: false,
    supportTier: 'priority',
    highlights: [
      'Everything in Pro',
      '75 lead credits / month',
      '2 sponsored projects / month',
      '25% off banner ads',
      'Priority support',
    ],
    cta: 'Upgrade to Business',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full market power + Google Ads',
    priceEurMonth: 199,
    priceEurYear: 1990,
    leadCreditsMonthly: 500,
    featuredProfile: true,
    premiumProfile: true,
    sponsoredProjectsMonthly: 10,
    bannerAdDiscountPct: 40,
    googleAdsIncluded: true,
    supportTier: 'dedicated',
    highlights: [
      'Everything in Business',
      '500 lead credits / month',
      '10 sponsored projects / month',
      'Google Ads management included',
      'Dedicated support',
    ],
    cta: 'Contact sales',
  },
]

export type AddonProduct = {
  id: string
  paymentType:
    | 'featured_profile'
    | 'sponsored_project'
    | 'lead_credits'
    | 'google_ads'
    | 'ad_campaign'
    | 'verified_badge'
  name: string
  description: string
  priceEur: number
  durationDays?: number
  credits?: number
  href?: string
}

export const ADDONS: AddonProduct[] = [
  {
    id: 'featured_profile_4w',
    paymentType: 'featured_profile',
    name: 'Featured profile — 4 weeks',
    description: 'Stand out in the professionals catalog with a Featured badge',
    priceEur: 39,
    durationDays: 28,
  },
  {
    id: 'sponsored_project_2w',
    paymentType: 'sponsored_project',
    name: 'Sponsored project — 2 weeks',
    description: 'Boost your project to the top of the pro lead feed',
    priceEur: 49,
    durationDays: 14,
  },
  {
    id: 'lead_credits_25',
    paymentType: 'lead_credits',
    name: 'Lead credits — 25 pack',
    description: 'Unlock high-intent leads when you need extra capacity',
    priceEur: 25,
    credits: 25,
  },
  {
    id: 'lead_credits_100',
    paymentType: 'lead_credits',
    name: 'Lead credits — 100 pack',
    description: 'Best value for busy teams',
    priceEur: 79,
    credits: 100,
  },
  {
    id: 'google_ads_setup',
    paymentType: 'google_ads',
    name: 'Google Ads setup',
    description: 'Managed Google Ads campaign setup and first-month optimization',
    priceEur: 149,
  },
  {
    id: 'banner_ads',
    paymentType: 'ad_campaign',
    name: 'Banner ads',
    description: 'Self-serve geo-targeted banners across DImarket',
    priceEur: 25,
    href: '/advertise',
  },
]

export const SUPPORT_COPY: Record<SupportTier, { label: string; sla: string }> = {
  community: {
    label: 'Community',
    sla: 'Help center + contact form · reply within 3 business days',
  },
  email: {
    label: 'Email',
    sla: 'Email support · reply within 1 business day',
  },
  priority: {
    label: 'Priority',
    sla: 'Priority inbox · reply within 4 business hours',
  },
  dedicated: {
    label: 'Dedicated',
    sla: 'Named success manager · same-day response',
  },
}

export function getPlan(id: string | null | undefined): PlanDefinition {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

export function planPrice(plan: PlanDefinition, interval: BillingInterval): number {
  return interval === 'year' ? plan.priceEurYear : plan.priceEurMonth
}

export function yearlySavingsPct(plan: PlanDefinition): number {
  if (plan.priceEurMonth <= 0) return 0
  const full = plan.priceEurMonth * 12
  if (full <= 0) return 0
  return Math.round(((full - plan.priceEurYear) / full) * 100)
}
