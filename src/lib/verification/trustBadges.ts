export type TrustBadgeId =
  | 'verified'
  | 'identity'
  | 'business'
  | 'premium'
  | 'address'

export type TrustBadge = {
  id: TrustBadgeId
  label: string
  active: boolean
  tone: string
}

export type TrustBadgeSource = {
  is_verified?: boolean | null
  identity_verified?: boolean | null
  business_verified?: boolean | null
  address_verified?: boolean | null
  is_premium?: boolean | null
  verification_level?: string | null
}

/** Named production badges shown on profiles and cards. */
export function buildTrustBadges(source: TrustBadgeSource | null | undefined): TrustBadge[] {
  const s = source ?? {}
  const level = s.verification_level
  const verified =
    Boolean(s.is_verified) ||
    (level != null && level !== 'none' && ['silver', 'gold', 'platinum'].includes(level))

  return [
    {
      id: 'verified',
      label: 'Verified',
      active: verified,
      tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'identity',
      label: 'Identity Verified',
      active: Boolean(s.identity_verified),
      tone: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 'business',
      label: 'Business Verified',
      active: Boolean(s.business_verified),
      tone: 'bg-violet-50 text-violet-800 border-violet-200',
    },
    {
      id: 'premium',
      label: 'Premium',
      active: Boolean(s.is_premium),
      tone: 'bg-amber-50 text-amber-900 border-amber-200',
    },
  ]
}

export function activeTrustBadges(source: TrustBadgeSource | null | undefined): TrustBadge[] {
  return buildTrustBadges(source).filter((b) => b.active)
}
