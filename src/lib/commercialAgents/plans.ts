/** Feature flags & plan checks for Commercial Agents monetization (no Stripe yet). */

export type CommercialPlan = 'free' | 'pro_agent' | 'pro_manufacturer' | 'premium_opportunity'

export const COMMERCIAL_AGENTS_ENABLED = true

/** Soft limits for FREE tier — enforced in UI; backend Stripe later. */
export const COMMERCIAL_PLAN_LIMITS = {
  free: {
    maxApplicationsPerMonth: 5,
    maxOpportunities: 2,
    advancedFilters: false,
    aiMatching: false,
    profileBoost: false,
    featuredOpportunity: false,
  },
  pro_agent: {
    maxApplicationsPerMonth: 10_000,
    maxOpportunities: 0,
    advancedFilters: true,
    aiMatching: true,
    profileBoost: true,
    featuredOpportunity: false,
  },
  pro_manufacturer: {
    maxApplicationsPerMonth: 0,
    maxOpportunities: 10_000,
    advancedFilters: true,
    aiMatching: true,
    profileBoost: false,
    featuredOpportunity: true,
  },
  premium_opportunity: {
    maxApplicationsPerMonth: 0,
    maxOpportunities: 10_000,
    advancedFilters: true,
    aiMatching: true,
    profileBoost: false,
    featuredOpportunity: true,
  },
} as const

/** Until billing is wired, everyone is treated as free with soft UI hints only. */
export function resolveCommercialPlan(_profileId?: string | null): CommercialPlan {
  return 'free'
}

export function canApplyAsAgent(plan: CommercialPlan, applicationsThisMonth: number): boolean {
  const limits = COMMERCIAL_PLAN_LIMITS[plan]
  return applicationsThisMonth < limits.maxApplicationsPerMonth
}

export function canCreateOpportunity(plan: CommercialPlan, openCount: number): boolean {
  const limits = COMMERCIAL_PLAN_LIMITS[plan]
  return openCount < limits.maxOpportunities
}
