/**
 * Public directory avatars hosted on DImarket Supabase Storage (media).
 * Used when profile_photo / avatar_url are still empty (RLS blocks anon profile updates).
 * Prefer DB fields once service-role backfill has run.
 */
import { isStockListingThemeUrl } from './listingThemeImage'

export const DIRECTORY_AVATAR_BY_PROFILE_ID: Record<string, string> = {
  '89ccac50-eded-47be-9426-ae6087bd16da':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/89ccac50-eded-47be-9426-ae6087bd16da/avatar.jpeg',
  '0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f/avatar.jpeg',
  '74d22af9-67ea-4dbf-baae-7640d638ea7d':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/74d22af9-67ea-4dbf-baae-7640d638ea7d/avatar.jpeg',
  '37c6f253-06cb-42ca-9d72-ab8e49d51e13':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/37c6f253-06cb-42ca-9d72-ab8e49d51e13/avatar.jpeg',
  '27bccd1d-3309-402e-977b-86be4048fa66':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/27bccd1d-3309-402e-977b-86be4048fa66/avatar.jpeg',
  '6d6517d5-565a-40a7-9f80-6f8d9b9c03cf':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/6d6517d5-565a-40a7-9f80-6f8d9b9c03cf/avatar.jpeg',
  'b2a7e44d-128a-4cf3-9906-097efa8a7c8b':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/b2a7e44d-128a-4cf3-9906-097efa8a7c8b/avatar.png',
  '358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0/avatar.jpeg',
  'c8fe9419-9049-4a14-a440-38c44ae7be51':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/c8fe9419-9049-4a14-a440-38c44ae7be51/avatar.jpeg',
  'aedc48d6-dc72-4f83-b443-4987fb8ddcaf':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/aedc48d6-dc72-4f83-b443-4987fb8ddcaf/avatar.jpeg',
}

export function resolveDirectoryAvatarUrl(
  profileId: string,
  profilePhoto?: string | null,
  avatarUrl?: string | null,
): string | null {
  const uploaded = (profilePhoto || avatarUrl || '').trim()
  if (uploaded && !isStockListingThemeUrl(uploaded)) return uploaded
  const mapped = DIRECTORY_AVATAR_BY_PROFILE_ID[profileId]
  if (mapped && !isStockListingThemeUrl(mapped)) return mapped
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
    if (/^https?:\/\//i.test(url) && !isStockListingThemeUrl(url)) return url
  }
  return null
}

/** 1–2 letters for a company mark, skipping legal suffixes. */
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" role="img" aria-hidden="true"><rect width="80" height="80" rx="18" fill="${palette.bg}"/><text x="40" y="48" text-anchor="middle" font-size="28" font-weight="800" fill="${palette.fg}" font-family="ui-sans-serif, system-ui, sans-serif">${safe}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export type CompanyAvatarSource = {
  id: string
  full_name?: string | null
  profile_photo?: string | null
  avatar_url?: string | null
  portfolio_images?: string[] | null
}

/**
 * Company avatars always resolve to an image: uploaded logo/photo, portfolio still,
 * or a generated monogram logo. Never leave a Top Company tile empty.
 */
export function resolveCompanyAvatarUrl(company: CompanyAvatarSource): string {
  return (
    resolveDirectoryAvatarUrl(company.id, company.profile_photo, company.avatar_url) ||
    firstPortfolioImage(company.portfolio_images) ||
    companyLogoDataUri(company.full_name, company.id)
  )
}
