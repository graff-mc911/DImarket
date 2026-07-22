import type { Profile, VerificationLevel } from './types'

export type VerificationCheckId =
  | 'email'
  | 'phone'
  | 'identity'
  | 'company'
  | 'insurance'
  | 'license'
  | 'background'

export type VerificationCheck = {
  id: VerificationCheckId
  label: string
  description: string
  done: boolean
  docType?: string
}

export const VERIFICATION_LEVELS: Array<{
  id: VerificationLevel
  label: string
  blurb: string
  requires: VerificationCheckId[]
}> = [
  {
    id: 'bronze',
    label: 'Bronze',
    blurb: 'Email + Phone verified',
    requires: ['email', 'phone'],
  },
  {
    id: 'silver',
    label: 'Silver',
    blurb: 'Identity or company documents',
    requires: ['email', 'phone', 'identity'],
  },
  {
    id: 'gold',
    label: 'Gold',
    blurb: 'Insurance + trade license',
    requires: ['email', 'phone', 'identity', 'insurance', 'license'],
  },
  {
    id: 'platinum',
    label: 'Platinum',
    blurb: 'Full stack + background check',
    requires: ['email', 'phone', 'identity', 'company', 'insurance', 'license', 'background'],
  },
]

export function buildVerificationChecks(input: {
  profile: Profile | null
  email?: string | null
  emailConfirmed?: boolean
  docTypes: string[]
}): VerificationCheck[] {
  const p = input.profile
  const docs = new Set(input.docTypes)
  const hasEmail =
    Boolean(p?.email_verified_at) ||
    Boolean(input.emailConfirmed) ||
    Boolean(input.email)
  const hasPhone =
    Boolean(p?.phone_verified_at) ||
    Boolean(p?.phone && p.phone.trim().length > 5)

  return [
    {
      id: 'email',
      label: 'Email',
      description: 'Confirmed account email',
      done: hasEmail,
    },
    {
      id: 'phone',
      label: 'Phone',
      description: 'Phone number on profile',
      done: hasPhone,
    },
    {
      id: 'identity',
      label: 'Identity',
      description: 'Government ID / passport',
      done: docs.has('identity'),
      docType: 'identity',
    },
    {
      id: 'company',
      label: 'Company',
      description: 'Business registration or VAT',
      done: docs.has('business_registration') || docs.has('vat'),
      docType: 'business_registration',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      description: 'Liability insurance certificate',
      done: docs.has('insurance'),
      docType: 'insurance',
    },
    {
      id: 'license',
      label: 'License',
      description: 'Trade / professional license',
      done: docs.has('trade_license'),
      docType: 'trade_license',
    },
    {
      id: 'background',
      label: 'Background Check',
      description: 'Police / background clearance',
      done: docs.has('background_check'),
      docType: 'background_check',
    },
  ]
}

export function nextLevelHint(
  level: VerificationLevel | null | undefined,
  checks: VerificationCheck[],
): string {
  const done = new Set(checks.filter((c) => c.done).map((c) => c.id))
  const order: VerificationLevel[] = ['bronze', 'silver', 'gold', 'platinum']
  const currentIdx = order.indexOf((level && level !== 'none' ? level : 'none') as VerificationLevel)
  const start = currentIdx < 0 ? 0 : currentIdx + 1
  for (let i = start; i < order.length; i++) {
    const tier = VERIFICATION_LEVELS.find((t) => t.id === order[i])
    if (!tier) continue
    const missing = tier.requires.filter((r) => !done.has(r))
    if (missing.length) {
      return `Next: ${tier.label} — complete ${missing.join(', ')}`
    }
  }
  if (level === 'platinum') return 'Highest trust level unlocked'
  return 'Complete checks to unlock the next badge'
}
