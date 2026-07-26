import type { VerificationLevel } from './types'

export function verificationLevelLabel(
  level: VerificationLevel | null | undefined,
): string {
  switch (level) {
    case 'platinum':
      return 'Platinum'
    case 'gold':
      return 'Gold'
    case 'silver':
      return 'Silver'
    case 'bronze':
      return 'Bronze'
    default:
      return ''
  }
}

export function verificationLevelClass(
  level: VerificationLevel | null | undefined,
): string {
  switch (level) {
    case 'platinum':
      return 'bg-gradient-to-r from-[#1e1b4b] to-[#4c1d95] text-white border-[#7c3aed]'
    case 'gold':
      return 'bg-[#ffd814] text-[#0f1111] border-[#f0c14b]'
    case 'silver':
      return 'bg-[#e7e9ec] text-[#0f1111] border-[#d5d9d9]'
    case 'bronze':
      return 'bg-[#f3e8d8] text-[#5c4033] border-[#d4a574]'
    default:
      return 'bg-[#f0f2f2] text-[#565959] border-[#d5d9d9]'
  }
}

/** Client-side estimate of level when DB column missing */
export function estimateVerificationLevel(input: {
  phone?: string | null
  email?: string | null
  isVerified?: boolean | null
  hasIdentityDoc?: boolean
  hasCompanyDoc?: boolean
  hasInsuranceDoc?: boolean
  hasLicenseDoc?: boolean
  hasBackgroundDoc?: boolean
  hasAddressDoc?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
}): VerificationLevel {
  const hasPhone = Boolean(input.phoneVerified)
  const hasEmail = Boolean(input.emailVerified)
  if (
    hasPhone &&
    hasEmail &&
    input.isVerified &&
    input.hasIdentityDoc &&
    input.hasCompanyDoc &&
    input.hasInsuranceDoc &&
    input.hasLicenseDoc &&
    input.hasBackgroundDoc &&
    input.hasAddressDoc
  ) {
    return 'platinum'
  }
  if (
    hasPhone &&
    hasEmail &&
    input.isVerified &&
    input.hasInsuranceDoc &&
    input.hasLicenseDoc &&
    input.hasAddressDoc
  ) {
    return 'gold'
  }
  if (hasPhone && hasEmail && (input.isVerified || input.hasIdentityDoc || input.hasCompanyDoc)) {
    return 'silver'
  }
  if (hasPhone && hasEmail) return 'bronze'
  return 'none'
}
