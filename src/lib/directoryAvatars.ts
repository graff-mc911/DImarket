/**
 * Directory avatars for Top Masters / Top Companies / catalog cards.
 *
 * DB backfill stored the same listing-theme JPEG on many rows, and seeded
 * campaign storage URLs 404. Those must never be shown — people get a unique
 * illustrated portrait, companies get a unique monogram.
 */
import { isStockListingThemeUrl } from './listingThemeImage'
import { isBusinessNamedProfessional } from './professionalDisplay'

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

const PORTRAIT_SKIN = ['#f3d0b0', '#e8b892', '#d29a6a', '#c68642', '#8d5524', '#f6d7c3', '#e0ac7a']
const PORTRAIT_HAIR = ['#1f140e', '#3b2416', '#5a3820', '#2c1b12', '#6b4a28', '#111111', '#8a5a32']
const PORTRAIT_SHIRT = ['#1a2330', '#9a5525', '#0f766e', '#1e3a5f', '#7c2d12', '#365314', '#4c1d95', '#9f1239']
const PORTRAIT_BG = ['#efe8df', '#e4eaf3', '#f3efe9', '#e7f1ee', '#f6efe4', '#ece7f3']

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

function hairMarkup(style: number, color: string): string {
  if (style === 0) {
    return `<path d="M18 36c1-16 12-24 22-24s21 8 22 24c-5-11-13-17-22-17S23 25 18 36Z" fill="${color}"/>`
  }
  if (style === 1) {
    return `<ellipse cx="40" cy="26" rx="23" ry="20" fill="${color}"/>`
  }
  if (style === 2) {
    return `<path d="M17 38c2-16 11-24 23-24 13 0 23 9 24 23-7-12-15-15-27-11-6 2-13 6-20 12Z" fill="${color}"/>`
  }
  if (style === 3) {
    return `<circle cx="40" cy="12" r="8" fill="${color}"/><path d="M18 35c2-13 12-21 22-21s20 8 22 21c-6-8-14-12-22-12s-16 4-22 12Z" fill="${color}"/>`
  }
  return `<path d="M13 62c3-30 11-40 27-40s24 10 27 40c-5-20-11-30-27-30S18 42 13 62Z" fill="${color}"/>`
}

/** Unique illustrated headshot so every master has a distinct photo-like avatar. */
export function masterPortraitDataUri(name: string | null | undefined, profileId: string): string {
  const h = hashSeed(`${profileId}:${name || ''}`)
  const skin = PORTRAIT_SKIN[h % PORTRAIT_SKIN.length]
  const hair = PORTRAIT_HAIR[(h >>> 4) % PORTRAIT_HAIR.length]
  const shirt = PORTRAIT_SHIRT[(h >>> 8) % PORTRAIT_SHIRT.length]
  const bg = PORTRAIT_BG[(h >>> 12) % PORTRAIT_BG.length]
  const style = (h >>> 16) % 5
  const glasses = ((h >>> 20) & 1) === 1
  const beard = ((h >>> 21) & 1) === 1
  const shirtDark = ((h >>> 22) & 1) === 1 ? '#111827' : shirt
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">`,
    `<rect width="80" height="80" fill="${bg}"/>`,
    `<ellipse cx="40" cy="86" rx="32" ry="22" fill="${shirtDark}"/>`,
    `<rect x="34" y="52" width="12" height="10" rx="3" fill="${skin}"/>`,
    `<circle cx="40" cy="36" r="16" fill="${skin}"/>`,
    hairMarkup(style, hair),
    beard ? `<path d="M26 42c2 12 8 18 14 18s12-6 14-18c-4 8-9 11-14 11s-10-3-14-11Z" fill="${hair}" opacity=".85"/>` : '',
    `<ellipse cx="34.5" cy="35.5" rx="1.7" ry="2.1" fill="#2a2118"/>`,
    `<ellipse cx="45.5" cy="35.5" rx="1.7" ry="2.1" fill="#2a2118"/>`,
    `<path d="M36 44c2.2 2.4 5.8 2.4 8 0" fill="none" stroke="#8a5a44" stroke-width="1.4" stroke-linecap="round"/>`,
    glasses
      ? `<g fill="none" stroke="#2a2118" stroke-width="1.5"><circle cx="34.5" cy="36" r="5.2"/><circle cx="45.5" cy="36" r="5.2"/><path d="M39.6 36h.8"/></g>`
      : '',
    `</svg>`,
  ].join('')
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

function usesCompanyMark(profile: CompanyAvatarSource): boolean {
  if (profile.user_role === 'company') return true
  return isBusinessNamedProfessional({
    full_name: profile.full_name,
    user_role: profile.user_role ?? 'professional',
  })
}

export function avatarFallbackDataUri(profile: CompanyAvatarSource): string {
  if (usesCompanyMark(profile)) {
    return companyLogoDataUri(profile.full_name, profile.id)
  }
  return masterPortraitDataUri(profile.full_name, profile.id)
}

/**
 * Always resolve to a displayable image: a real uploaded photo, a unique
 * portfolio still, or a generated portrait / company mark. Never reuse
 * listing-theme stock or seeded campaign storage URLs that 404.
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
