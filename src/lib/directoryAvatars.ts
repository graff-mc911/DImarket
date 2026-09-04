/**
 * Directory avatars for Top Masters / Top Companies / catalog cards.
 *
 * DB backfill stored the same listing-theme JPEG on many rows, and seeded
 * campaign storage URLs 404. Those must never be shown — fall back to unique
 * initials (1–2 letters) with a per-profile color.
 */
import { isStockListingThemeUrl } from './listingThemeImage'

/** Seeded `.../avatar.jpeg` objects are missing (GET → NoSuchKey). Live uploads use a timestamped filename. */
export function isUnreadableCampaignAvatarUrl(url: string | null | undefined): boolean {
  const value = (url || '').trim()
  if (!value) return false
  return /\/campaigns\/profiles\/[0-9a-f-]+\/avatar\.(jpe?g|png|webp|gif)(?:\?|$)/i.test(value)
}

export function isUnusableDirectoryAvatarUrl(url: string | null | undefined): boolean {
  const value = (url || '').trim()
  if (!value) return true
  return isStockListingThemeUrl(value) || isUnreadableCampaignAvatarUrl(value)
}

export function resolveDirectoryAvatarUrl(
  _profileId: string,
  profilePhoto?: string | null,
  avatarUrl?: string | null,
): string | null {
  const uploaded = (profilePhoto || avatarUrl || '').trim()
  if (uploaded && !isUnusableDirectoryAvatarUrl(uploaded)) return uploaded
  return null
}

const COMPANY_LOGO_SKIP =
  /^(gmbh|kg|co|ltd|llc|inc|ug|ag|s\.?l\.?|s\.?a\.?|y|and|the|de|del|la|las|los|&|e\.k\.?)$/i

const COMPANY_LOGO_PALETTES = [
  { bg: '#1a2330', fg: '#f4e6d4' },
  { bg: '#9a5525', fg: '#fff8f1' },
  { bg: '#0f766e', fg: '#ecfdf8' },
  { bg: '#1e3a5f', fg: '#e8f1ff' },
  { bg: '#7c2d12', fg: '#ffedd5' },
  { bg: '#365314', fg: '#ecfccb' },
  { bg: '#4c1d95', fg: '#ede9fe' },
  { bg: '#9f1239', fg: '#ffe4e6' },
] as const

function hashSeed(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0
  }
  return h
}

function firstPortfolioImage(images: string[] | null | undefined): string | null {
  if (!Array.isArray(images)) return null
  for (const raw of images) {
    const url = (raw || '').trim()
    if (/^https?:\/\//i.test(url) && !isUnusableDirectoryAvatarUrl(url)) return url
  }
  return null
}

/** 1–2 letters for a company/master mark, skipping legal suffixes. */
export function companyLogoInitials(name: string | null | undefined): string {
  const cleaned = (name || '')
    .replace(/[—–]/g, ' ')
    .replace(/&/g, ' ')
    .replace(/,/g, ' ')
  const words = cleaned
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter((word) => word.length > 0 && !COMPANY_LOGO_SKIP.test(word))
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return 'CO'
}

export function companyLogoDataUri(name: string | null | undefined, profileId: string): string {
  const initials = companyLogoInitials(name)
  const palette = COMPANY_LOGO_PALETTES[hashSeed(profileId) % COMPANY_LOGO_PALETTES.length]
  const safe = initials
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${palette.bg}"/><text x="40" y="48" text-anchor="middle" font-size="28" font-weight="800" fill="${palette.fg}" font-family="ui-sans-serif, system-ui, sans-serif">${safe}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export type CompanyAvatarSource = {
  id: string
  full_name?: string | null
  profile_photo?: string | null
  avatar_url?: string | null
  portfolio_images?: string[] | null
  user_role?: string | null
}

export function avatarFallbackDataUri(profile: CompanyAvatarSource): string {
  return companyLogoDataUri(profile.full_name, profile.id)
}

/**
 * Real uploaded photo when readable; otherwise unique initials.
 * Never reuse listing-theme stock or seeded campaign URLs that 404.
 */
export function resolveProfileAvatarUrl(profile: CompanyAvatarSource): string {
  return (
    resolveDirectoryAvatarUrl(profile.id, profile.profile_photo, profile.avatar_url) ||
    firstPortfolioImage(profile.portfolio_images) ||
    avatarFallbackDataUri(profile)
  )
}

export function resolveCompanyAvatarUrl(company: CompanyAvatarSource): string {
  return resolveProfileAvatarUrl({ ...company, user_role: company.user_role || 'company' })
}
