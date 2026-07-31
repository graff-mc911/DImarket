/** Numeric trust levels 0–6 (product model). Maps to legacy metal tiers. */

export type TrustLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const TRUST_LEVELS: Array<{
  level: TrustLevel
  label: string
  blurb: string
}> = [
  { level: 0, label: 'Guest', blurb: 'Account created' },
  { level: 1, label: 'Email Verified', blurb: 'Confirmed email' },
  { level: 2, label: 'Phone Verified', blurb: 'Email + phone' },
  { level: 3, label: 'Identity Verified', blurb: 'Government ID reviewed' },
  { level: 4, label: 'Professional Verified', blurb: 'License + identity' },
  { level: 5, label: 'Business Verified', blurb: 'Company registration' },
  { level: 6, label: 'Trusted Professional', blurb: 'Full DImarket trust stack' },
]

export function trustLevelLabel(level: number | null | undefined): string {
  const found = TRUST_LEVELS.find((t) => t.level === level)
  return found?.label ?? 'Guest'
}

export function clampTrustLevel(n: unknown): TrustLevel {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return 0
  if (v >= 6) return 6
  return Math.floor(v) as TrustLevel
}

/** Map legacy bronze/silver/gold/platinum → approx trust level */
export function metalToTrustLevel(metal: string | null | undefined): TrustLevel {
  switch (metal) {
    case 'platinum':
      return 6
    case 'gold':
      return 4
    case 'silver':
      return 3
    case 'bronze':
      return 2
    default:
      return 0
  }
}
