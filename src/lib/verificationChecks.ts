import type { Profile } from './types'
import type { UserRoleKind } from './verification/verification'
import { TRUST_LEVELS, type TrustLevel } from './verification/trustLevels'

export type VerificationCheckId =
  | 'email'
  | 'phone'
  | 'identity'
  | 'address'
  | 'license'
  | 'company'
  | 'insurance'
  | 'vat'
  | 'experience'
  | 'premium'
  | 'trusted'

export type VerificationCheck = {
  id: VerificationCheckId
  label: string
  description: string
  done: boolean
  docType?: string
}

const IDENTITY_DOCS = ['identity', 'id_card', 'passport', 'driving_license']
const LICENSE_DOCS = ['trade_license', 'professional_license', 'professional_certificate']

function hasAny(docs: Set<string>, keys: string[]) {
  return keys.some((k) => docs.has(k))
}

export function buildVerificationChecks(input: {
  profile: Profile | null
  emailConfirmed?: boolean
  docTypes: string[]
  role: UserRoleKind
}): VerificationCheck[] {
  const p = input.profile
  const docs = new Set(input.docTypes)
  const emailDone = Boolean(p?.email_verified_at) || Boolean(input.emailConfirmed)
  const phoneDone = Boolean(p?.phone_verified_at)

  const all: VerificationCheck[] = [
    {
      id: 'email',
      label: 'Email Verified',
      description: 'Confirmed account email',
      done: emailDone,
    },
    {
      id: 'phone',
      label: 'Phone Verified',
      description: 'Verified phone on profile',
      done: phoneDone,
    },
    {
      id: 'identity',
      label: 'Identity Verified',
      description: 'ID card, passport, or driving license',
      done: Boolean(p?.identity_verified) || hasAny(docs, IDENTITY_DOCS),
      docType: 'id_card',
    },
    {
      id: 'address',
      label: 'Address Verified',
      description: 'Utility bill or bank statement',
      done: Boolean(p?.address_verified) || docs.has('proof_of_address'),
      docType: 'proof_of_address',
    },
    {
      id: 'license',
      label: 'Professional License Verified',
      description: 'Trade or professional license / certificate',
      done: Boolean(p?.license_verified) || hasAny(docs, LICENSE_DOCS),
      docType: 'professional_license',
    },
    {
      id: 'company',
      label: 'Business Verified',
      description: 'Business registration document',
      done: Boolean(p?.business_verified) || docs.has('business_registration'),
      docType: 'business_registration',
    },
    {
      id: 'vat',
      label: 'VAT / Tax Verified',
      description: 'VAT or tax certificate',
      done: Boolean(p?.vat_verified) || docs.has('vat'),
      docType: 'vat',
    },
    {
      id: 'insurance',
      label: 'Insurance Verified',
      description: 'Liability insurance certificate',
      done: Boolean(p?.insurance_verified) || docs.has('insurance'),
      docType: 'insurance',
    },
    {
      id: 'experience',
      label: 'Experience',
      description: 'Experience proof or completed jobs',
      done: docs.has('experience_proof') || (p?.completed_jobs ?? 0) >= 3,
      docType: 'experience_proof',
    },
    {
      id: 'premium',
      label: 'Premium Verified',
      description: 'Active Premium membership',
      done: Boolean(p?.is_premium),
    },
    {
      id: 'trusted',
      label: 'DImarket Trusted Professional',
      description: 'Highest trust level unlocked',
      done: Boolean(p?.trusted_professional) || (p?.trust_level ?? 0) >= 6,
    },
  ]

  if (input.role === 'customer') {
    return all.filter((c) => ['email', 'phone', 'identity', 'address'].includes(c.id))
  }
  if (input.role === 'company') {
    return all.filter((c) =>
      ['email', 'phone', 'company', 'vat', 'address', 'insurance', 'license', 'premium', 'trusted'].includes(
        c.id,
      ),
    )
  }
  // professional
  return all.filter((c) =>
    [
      'email',
      'phone',
      'identity',
      'license',
      'insurance',
      'experience',
      'address',
      'company',
      'premium',
      'trusted',
    ].includes(c.id),
  )
}

export function progressFromChecks(checks: VerificationCheck[]): {
  done: number
  total: number
  pct: number
  completed: VerificationCheck[]
  missing: VerificationCheck[]
} {
  const completed = checks.filter((c) => c.done)
  const missing = checks.filter((c) => !c.done)
  const total = checks.length || 1
  return {
    done: completed.length,
    total: checks.length,
    pct: Math.round((completed.length / total) * 100),
    completed,
    missing,
  }
}

export function nextLevelHint(level: TrustLevel, checks: VerificationCheck[]): string {
  const done = new Set(checks.filter((c) => c.done).map((c) => c.id))
  const next = TRUST_LEVELS.find((t) => t.level === ((level + 1) as TrustLevel))
  if (!next) return 'Highest trust level unlocked'

  const need: VerificationCheckId[] =
    next.level === 1
      ? ['email']
      : next.level === 2
        ? ['email', 'phone']
        : next.level === 3
          ? ['identity']
          : next.level === 4
            ? ['identity', 'license']
            : next.level === 5
              ? ['company']
              : ['identity', 'license', 'address', 'insurance']

  const missing = need.filter((id) => !done.has(id))
  if (!missing.length) return `Ready for ${next.label}`
  return `Next: ${next.label} — complete ${missing.join(', ')}`
}

/** @deprecated metal tiers — kept for legacy VerificationBadge */
export const VERIFICATION_LEVELS = TRUST_LEVELS.map((t) => ({
  id: t.level === 6 ? 'platinum' : t.level >= 4 ? 'gold' : t.level === 3 ? 'silver' : t.level >= 1 ? 'bronze' : 'none',
  label: t.label,
  blurb: t.blurb,
  requires: [] as VerificationCheckId[],
}))
