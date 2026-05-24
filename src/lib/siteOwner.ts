export const SITE_OWNER_EMAIL = 'ivan.sovban@gmail.com'

export function isSiteOwner(
  profile?: { is_site_owner?: boolean | null } | null,
  email?: string | null,
): boolean {
  if (profile?.is_site_owner === true) return true
  return (email || '').trim().toLowerCase() === SITE_OWNER_EMAIL.trim().toLowerCase()
}
