import { getPlan, normalizePlanId } from './plans'

export type MembershipBadgeId =
  | 'free'
  | 'premium'
  | 'verified'
  | 'gold_partner'
  | 'enterprise'

export type MembershipBadge = {
  id: MembershipBadgeId
  label: string
  className: string
}

export function resolveMembershipBadges(input: {
  planId?: string | null
  isPremium?: boolean | null
  isVerified?: boolean | null
  verificationLevel?: string | null
}): MembershipBadge[] {
  const plan = getPlan(input.planId)
  const storage = normalizePlanId(input.planId)
  const out: MembershipBadge[] = []

  if (storage === 'enterprise' || plan.permissions.includes('gold_partner_badge')) {
    out.push({
      id: 'enterprise',
      label: 'Enterprise',
      className: 'bg-[#1d1d1f] text-white',
    })
    out.push({
      id: 'gold_partner',
      label: 'Gold Partner',
      className: 'bg-amber-100 text-amber-900 border border-amber-300',
    })
  } else if (
    storage === 'pro' ||
    storage === 'company_premium' ||
    storage === 'customer_premium' ||
    input.isPremium
  ) {
    out.push({
      id: 'premium',
      label: 'Premium',
      className: 'bg-[#1d1d1f] text-white',
    })
  } else {
    out.push({
      id: 'free',
      label: 'Free',
      className: 'bg-[#f5f5f7] text-[#6e6e73]',
    })
  }

  if (
    input.isVerified ||
    (input.verificationLevel && input.verificationLevel !== 'none') ||
    plan.permissions.includes('verified_premium_badge') ||
    plan.permissions.includes('company_verification')
  ) {
    out.push({
      id: 'verified',
      label: 'Verified',
      className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    })
  }

  // Deduplicate by id
  const seen = new Set<string>()
  return out.filter((b) => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })
}
