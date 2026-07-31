/** DImarket Premium Membership catalog */

export type PlanId =
  | 'guest'
  | 'customer'
  | 'customer_premium'
  | 'free'
  | 'pro'
  | 'business'
  | 'company_premium'
  | 'enterprise'

export type BillingInterval = 'month' | 'year'
export type SupportTier = 'community' | 'email' | 'priority' | 'dedicated'
export type PlanAudience = 'guest' | 'customer' | 'professional' | 'company' | 'enterprise'

export type PlanPermission =
  | 'verified_premium_badge'
  | 'higher_search_ranking'
  | 'unlimited_portfolio'
  | 'unlimited_applications'
  | 'priority_ai_matching'
  | 'advanced_statistics'
  | 'lead_notifications'
  | 'profile_boost'
  | 'premium_support'
  | 'custom_profile_url'
  | 'company_verification'
  | 'unlimited_employees'
  | 'unlimited_branches'
  | 'featured_company'
  | 'advanced_analytics'
  | 'company_badge'
  | 'marketing_tools'
  | 'project_templates'
  | 'unlimited_saved_pros'
  | 'ai_project_assistant'
  | 'exclusive_discounts'
  | 'priority_support'
  | 'google_ads'
  | 'gold_partner_badge'

export type PlanDefinition = {
  id: PlanId
  /** Canonical id stored in DB / Stripe (aliases resolve here) */
  storageId: string
  name: string
  tagline: string
  audience: PlanAudience
  priceEurMonth: number
  priceEurYear: number
  leadCreditsMonthly: number
  featuredProfile: boolean
  premiumProfile: boolean
  sponsoredProjectsMonthly: number
  bannerAdDiscountPct: number
  googleAdsIncluded: boolean
  supportTier: SupportTier
  trialDays: number
  permissions: PlanPermission[]
  highlights: string[]
  cta: string
  popular?: boolean
  recommended?: boolean
  checkoutEnabled: boolean
}

/** Alias map: legacy / alternate ids → storage id */
export const PLAN_ALIASES: Record<string, string> = {
  guest: 'guest',
  customer: 'customer',
  customer_premium: 'customer_premium',
  free: 'free',
  professional_free: 'free',
  pro: 'pro',
  professional_premium: 'pro',
  business: 'company_premium',
  company_premium: 'company_premium',
  enterprise: 'enterprise',
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'guest',
    storageId: 'guest',
    name: 'Guest',
    tagline: 'Browse DImarket without an account',
    audience: 'guest',
    priceEurMonth: 0,
    priceEurYear: 0,
    leadCreditsMonthly: 0,
    featuredProfile: false,
    premiumProfile: false,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 0,
    googleAdsIncluded: false,
    supportTier: 'community',
    trialDays: 0,
    permissions: [],
    highlights: ['Browse professionals & companies', 'Read reviews', 'View public projects'],
    cta: 'Continue browsing',
    checkoutEnabled: false,
  },
  {
    id: 'customer',
    storageId: 'customer',
    name: 'Customer',
    tagline: 'Post projects and hire with confidence',
    audience: 'customer',
    priceEurMonth: 0,
    priceEurYear: 0,
    leadCreditsMonthly: 0,
    featuredProfile: false,
    premiumProfile: false,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 0,
    googleAdsIncluded: false,
    supportTier: 'community',
    trialDays: 0,
    permissions: [],
    highlights: [
      'Create projects',
      'Save professionals',
      'Messages & quotes',
      'Community support',
    ],
    cta: 'Get started free',
    checkoutEnabled: false,
  },
  {
    id: 'customer_premium',
    storageId: 'customer_premium',
    name: 'Customer Premium',
    tagline: 'Faster hiring with AI and exclusive perks',
    audience: 'customer',
    priceEurMonth: 9,
    priceEurYear: 90,
    leadCreditsMonthly: 0,
    featuredProfile: false,
    premiumProfile: true,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 5,
    googleAdsIncluded: false,
    supportTier: 'priority',
    trialDays: 30,
    permissions: [
      'priority_support',
      'project_templates',
      'unlimited_saved_pros',
      'ai_project_assistant',
      'exclusive_discounts',
      'premium_support',
    ],
    highlights: [
      'Priority support',
      'Project templates',
      'Unlimited saved professionals',
      'AI project assistant',
      'Exclusive discounts',
    ],
    cta: 'Start 30-day trial',
    checkoutEnabled: true,
  },
  {
    id: 'free',
    storageId: 'free',
    name: 'Professional Free',
    tagline: 'Start winning jobs on DImarket',
    audience: 'professional',
    priceEurMonth: 0,
    priceEurYear: 0,
    leadCreditsMonthly: 0,
    featuredProfile: false,
    premiumProfile: false,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 0,
    googleAdsIncluded: false,
    supportTier: 'community',
    trialDays: 0,
    permissions: [],
    highlights: [
      'Public professional profile',
      'Apply to open projects',
      'Basic portfolio',
      'Community support',
    ],
    cta: 'Current plan',
    checkoutEnabled: false,
  },
  {
    id: 'pro',
    storageId: 'pro',
    name: 'Professional Premium',
    tagline: 'Verified badge, ranking boost & unlimited leads',
    audience: 'professional',
    priceEurMonth: 29,
    priceEurYear: 290,
    leadCreditsMonthly: 20,
    featuredProfile: true,
    premiumProfile: true,
    sponsoredProjectsMonthly: 0,
    bannerAdDiscountPct: 10,
    googleAdsIncluded: false,
    supportTier: 'email',
    trialDays: 30,
    popular: true,
    recommended: true,
    permissions: [
      'verified_premium_badge',
      'higher_search_ranking',
      'unlimited_portfolio',
      'unlimited_applications',
      'priority_ai_matching',
      'advanced_statistics',
      'lead_notifications',
      'profile_boost',
      'premium_support',
      'custom_profile_url',
    ],
    highlights: [
      'Verified Premium Badge',
      'Higher search ranking',
      'Unlimited portfolio photos',
      'Unlimited project applications',
      'Priority AI matching',
      'Advanced statistics',
      'Lead notifications',
      'Profile boost',
      'Premium support',
      'Custom profile URL',
    ],
    cta: 'Start 30-day trial',
    checkoutEnabled: true,
  },
  {
    id: 'company_premium',
    storageId: 'company_premium',
    name: 'Company Premium',
    tagline: 'Teams, branches & featured company placement',
    audience: 'company',
    priceEurMonth: 79,
    priceEurYear: 790,
    leadCreditsMonthly: 75,
    featuredProfile: true,
    premiumProfile: true,
    sponsoredProjectsMonthly: 2,
    bannerAdDiscountPct: 25,
    googleAdsIncluded: false,
    supportTier: 'priority',
    trialDays: 30,
    permissions: [
      'company_verification',
      'unlimited_employees',
      'unlimited_branches',
      'featured_company',
      'advanced_analytics',
      'priority_support',
      'company_badge',
      'marketing_tools',
      'verified_premium_badge',
      'higher_search_ranking',
      'unlimited_portfolio',
      'unlimited_applications',
      'priority_ai_matching',
      'lead_notifications',
      'profile_boost',
    ],
    highlights: [
      'Company verification',
      'Unlimited employees',
      'Unlimited branches',
      'Featured company placement',
      'Advanced analytics',
      'Priority support',
      'Company badge',
      'Marketing tools',
    ],
    cta: 'Start 30-day trial',
    checkoutEnabled: true,
  },
  {
    id: 'enterprise',
    storageId: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full market power + dedicated success',
    audience: 'enterprise',
    priceEurMonth: 199,
    priceEurYear: 1990,
    leadCreditsMonthly: 500,
    featuredProfile: true,
    premiumProfile: true,
    sponsoredProjectsMonthly: 10,
    bannerAdDiscountPct: 40,
    googleAdsIncluded: true,
    supportTier: 'dedicated',
    trialDays: 30,
    permissions: [
      'gold_partner_badge',
      'company_verification',
      'unlimited_employees',
      'unlimited_branches',
      'featured_company',
      'advanced_analytics',
      'marketing_tools',
      'google_ads',
      'priority_ai_matching',
      'advanced_statistics',
      'premium_support',
      'priority_support',
      'custom_profile_url',
      'profile_boost',
      'unlimited_portfolio',
      'unlimited_applications',
    ],
    highlights: [
      'Everything in Company Premium',
      'Gold Partner badge',
      '500 lead credits / month',
      'Google Ads management included',
      'Dedicated success manager',
      'Custom commercial terms',
    ],
    cta: 'Contact sales',
    checkoutEnabled: false,
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

/** Plans shown as primary cards (unique storage ids, no duplicate business alias) */
export const PRICING_PLANS: PlanDefinition[] = PLANS.filter(
  (p, i, arr) => arr.findIndex((x) => x.storageId === p.storageId) === i,
)

export function normalizePlanId(id: string | null | undefined): string {
  if (!id) return 'free'
  return PLAN_ALIASES[id] || id
}

export function getPlan(id: string | null | undefined): PlanDefinition {
  const normalized = normalizePlanId(id)
  return (
    PLANS.find((p) => p.storageId === normalized || p.id === normalized) ||
    PLANS.find((p) => p.id === 'free')!
  )
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

export function plansForAudience(
  audience: PlanAudience | 'all',
): PlanDefinition[] {
  if (audience === 'all') return PRICING_PLANS
  return PRICING_PLANS.filter((p) => p.audience === audience)
}

export type ComparisonRow = {
  feature: string
  guest: boolean | string
  customer: boolean | string
  customer_premium: boolean | string
  free: boolean | string
  pro: boolean | string
  company_premium: boolean | string
  enterprise: boolean | string
}

export const FEATURE_COMPARISON: ComparisonRow[] = [
  {
    feature: 'Browse marketplace',
    guest: true,
    customer: true,
    customer_premium: true,
    free: true,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Create projects',
    guest: false,
    customer: true,
    customer_premium: true,
    free: false,
    pro: false,
    company_premium: false,
    enterprise: true,
  },
  {
    feature: 'AI project assistant',
    guest: false,
    customer: false,
    customer_premium: true,
    free: false,
    pro: false,
    company_premium: false,
    enterprise: true,
  },
  {
    feature: 'Unlimited saved professionals',
    guest: false,
    customer: '5',
    customer_premium: true,
    free: false,
    pro: false,
    company_premium: false,
    enterprise: true,
  },
  {
    feature: 'Verified Premium Badge',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Higher search ranking',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Unlimited portfolio photos',
    guest: false,
    customer: false,
    customer_premium: false,
    free: '6',
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Unlimited project applications',
    guest: false,
    customer: false,
    customer_premium: false,
    free: '10/mo',
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Priority AI matching',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Advanced statistics',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Lead notifications',
    guest: false,
    customer: false,
    customer_premium: false,
    free: 'Basic',
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Profile boost',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Custom profile URL',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Company verification & badge',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: false,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Unlimited employees & branches',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: false,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Featured company placement',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: false,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Marketing tools',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: false,
    company_premium: true,
    enterprise: true,
  },
  {
    feature: 'Google Ads management',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: false,
    company_premium: false,
    enterprise: true,
  },
  {
    feature: 'Gold Partner badge',
    guest: false,
    customer: false,
    customer_premium: false,
    free: false,
    pro: false,
    company_premium: false,
    enterprise: true,
  },
  {
    feature: '30-day free trial',
    guest: false,
    customer: false,
    customer_premium: true,
    free: false,
    pro: true,
    company_premium: true,
    enterprise: 'On request',
  },
  {
    feature: 'Support',
    guest: '—',
    customer: 'Community',
    customer_premium: 'Priority',
    free: 'Community',
    pro: 'Email',
    company_premium: 'Priority',
    enterprise: 'Dedicated',
  },
]
