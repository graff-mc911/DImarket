import type { Profile, UserRole } from '../types'
import { isSiteOwner } from '../siteOwner'

export type DashboardRole = 'customer' | 'professional' | 'company' | 'admin'

export function resolveDashboardRole(
  profile: Profile | null,
  email?: string | null,
): DashboardRole | null {
  if (!profile) return null
  if (isSiteOwner(profile, email)) return 'admin'
  if (profile.user_role === 'company') return 'company'
  if (profile.user_role === 'professional' || profile.is_professional) return 'professional'
  if (profile.user_role === 'client' || !profile.user_role) return 'customer'
  return 'customer'
}

export function dashboardHomePath(role: DashboardRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'company':
      return '/company/dashboard'
    case 'professional':
      return '/pro/dashboard'
    case 'customer':
    default:
      return '/customer/dashboard'
  }
}

export function isProLikeRole(role: UserRole | string | null | undefined): boolean {
  return role === 'professional' || role === 'company'
}

export function roleLabel(role: DashboardRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'company':
      return 'Company'
    case 'professional':
      return 'Professional'
    case 'customer':
    default:
      return 'Customer'
  }
}
