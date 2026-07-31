import type { Profile, VerificationLevel } from './types'

export type VerificationCheckId =
  | 'email'
  | 'phone'
  | 'identity'
  | 'company'
  | 'license'
  | 'address'
  | 'insurance'
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
    blurb: 'Identity or business documents',
    requires: ['email', 'phone', 'identity'],
  },
  {
    id: 'gold',
    label: 'Gold',
    blurb: 'License + address + insurance',
    requires: ['email', 'phone', 'identity', 'license', 'address', 'insurance'],
  },
  {
    id: 'platinum',
    label: 'Platinum',
    blurb: 'Full stack + background check',
    requires: [
      'email',
      'phone',
      'identity',
      'company',
      'license',
      'address',
      'insurance',
      'background',
    ],
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
  const hasEmail = Boolean(p?.email_verified_at) || Boolean(input.emailConfirmed)
  const hasPhone = Boolean(p?.phone_verified_at)

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
      description: 'Verified phone on profile',
      done: hasPhone,
    },
    {
      id: 'identity',
      label: 'Identity document',
      description: 'Government ID / passport',
      done: docs.has('identity'),
      docType: 'identity',
    },
    {
      id: 'company',
      label: 'Business registration',
      description: 'Company registry or VAT',
      done: docs.has('business_registration') || docs.has('vat'),
      docType: 'business_registration',
    },
    {
      id: 'license',
      label: 'Professional license',
      description: 'Trade / professional license',
      done: docs.has('trade_license') || docs.has('professional_license'),
      docType: 'trade_license',
    },
    {
      id: 'address',
      label: 'Address verification',
      description: 'Utility bill or bank statement',
      done: docs.has('proof_of_address'),
      docType: 'proof_of_address',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      description: 'Liability insurance certificate',
      done: docs.has('insurance'),
      docType: 'insurance',
    },
    {
      id: 'background',
      label: 'Background check',
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
  const currentIdx = order.indexOf(
    (level && level !== 'none' ? level : 'none') as VerificationLevel,
  )
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
