export type TrustBadgeId =
  | 'email'
  | 'phone'
  | 'identity'
  | 'business'
  | 'insurance'
  | 'premium'
  | 'trusted'

export type TrustBadge = {
  id: TrustBadgeId
  label: string
  active: boolean
  tone: string
}

export type TrustBadgeSource = {
  email_verified_at?: string | null
  phone_verified_at?: string | null
  is_verified?: boolean | null
  identity_verified?: boolean | null
  business_verified?: boolean | null
  insurance_verified?: boolean | null
  address_verified?: boolean | null
  license_verified?: boolean | null
  vat_verified?: boolean | null
  is_premium?: boolean | null
  trusted_professional?: boolean | null
  trust_level?: number | null
  verification_level?: string | null
}

export function buildTrustBadges(source: TrustBadgeSource | null | undefined): TrustBadge[] {
  const s = source ?? {}
  const trusted =
    Boolean(s.trusted_professional) || Number(s.trust_level ?? 0) >= 6

  return [
    {
      id: 'email',
      label: 'Email Verified',
      active: Boolean(s.email_verified_at),
      tone: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 'phone',
      label: 'Phone Verified',
      active: Boolean(s.phone_verified_at),
      tone: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    },
    {
      id: 'identity',
      label: 'Identity Verified',
      active: Boolean(s.identity_verified),
      tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'business',
      label: 'Business Verified',
      active: Boolean(s.business_verified),
      tone: 'bg-violet-50 text-violet-800 border-violet-200',
    },
    {
      id: 'insurance',
      label: 'Insurance Verified',
      active: Boolean(s.insurance_verified),
      tone: 'bg-teal-50 text-teal-900 border-teal-200',
    },
    {
      id: 'premium',
      label: 'Premium',
      active: Boolean(s.is_premium),
      tone: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      id: 'trusted',
      label: 'Trusted Professional',
      active: trusted,
      tone: 'bg-[#1d1d1f] text-white border-[#1d1d1f]',
    },
  ]
}

export function activeTrustBadges(
  source: TrustBadgeSource | null | undefined,
  max = 8,
): TrustBadge[] {
  return buildTrustBadges(source)
    .filter((b) => b.active)
    .slice(0, max)
}
