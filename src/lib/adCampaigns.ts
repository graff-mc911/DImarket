import { supabase } from './supabase'
import {
  centerSlotId,
  pageKeyFromSideAdsPage,
  sideSlotId,
  type AdPageKey,
  type SideIndex,
} from './adPlacementSlots'
import { isDemoAdCampaign } from './demoAdCampaigns'
import { isYoutubeMediaUrl, parseYoutubeVideoId, youtubePosterUrl } from './youtubeMedia'
import type { AdCampaign } from './types'
import { getSlotLegacyTags } from './adPlacementSlots'
import { isOwnerManagedCampaign } from './ownerAdCampaign'
import type { TranslationKey } from './i18n'

export type AdPlacement =
  | 'home'
  | 'listings'
  | 'sidebar'
  | 'footer'
  | 'mobile_sticky'

export type AdCampaignWithAdvertiser = AdCampaign & {
  advertiser?: {
    full_name: string | null
    website: string | null
    avatar_url: string | null
    profile_photo: string | null
    user_role: string | null
  } | null
}

export type FetchPaidAdsOptions = {
  slots: AdPlacement[]
  limit?: number
  viewerCity?: string | null
  viewerCountry?: string | null
}

export function isPaidCampaign(campaign: AdCampaign): boolean {
  if (campaign.stripe_payment_id) return true
  if (campaign.price_paid != null && Number(campaign.price_paid) > 0) return true
  if (campaign.approved_by) return true
  return false
}

export function getCampaignPlacements(campaign: AdCampaign): string[] {
  const fromArray = (campaign.placements || []).filter(Boolean) as string[]
  if (fromArray.length > 0) return fromArray
  return [campaign.placement]
}

const SLOT_FALLBACKS: Partial<Record<AdPlacement, AdPlacement[]>> = {
  sidebar: ['sidebar', 'footer', 'home', 'listings'],
  mobile_sticky: ['mobile_sticky', 'home', 'listings', 'sidebar', 'footer'],
  home: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  listings: ['listings', 'home', 'sidebar', 'mobile_sticky', 'footer'],
  footer: ['footer', 'sidebar', 'home', 'listings'],
}

/** Мобільний inline-слот на тій самій сторінці (для показу в бокових колонках на desktop) */
function ownerMobileSlotForPage(pageKey: AdPageKey): string {
  return `${pageKey}_mob_inline_1`
}

function campaignMatchesOwnerMobileOnDesktop(
  campaign: AdCampaign,
  slot: string,
  pageKey: AdPageKey,
): boolean {
  if (!isOwnerManagedCampaign(campaign)) return false
  const placements = getCampaignPlacements(campaign)
  const mobileLeader = ownerMobileSlotForPage(pageKey)
  if (!placements.includes(mobileLeader)) return false
  if (slot === mobileLeader || slot === centerSlotId(pageKey)) return true
  if (slot.includes('_side_') && slot.startsWith(`${pageKey}_`)) return true
  if (placements.includes('home_leaderboard') && slot.includes('_mob_inline_')) return true
  return false
}

export function campaignMatchesSlot(campaign: AdCampaign, slot: AdPlacement | string): boolean {
  const placements = getCampaignPlacements(campaign)
  if (placements.includes(slot)) return true

  const granularLegacy = getSlotLegacyTags(slot)
  if (slot.includes('_') && placements.some((p) => granularLegacy.includes(p as AdPlacement))) {
    return true
  }

  const fallbacks = SLOT_FALLBACKS[slot as AdPlacement]
  if (fallbacks) {
    return placements.some((p) => fallbacks.includes(p as AdPlacement))
  }

  if (typeof slot === 'string' && slot.includes('_')) {
    const pageKey = (['home', 'listings', 'professionals', 'default'] as AdPageKey[]).find((p) =>
      slot.startsWith(`${p}_`),
    )
    if (pageKey && campaignMatchesOwnerMobileOnDesktop(campaign, slot, pageKey)) {
      return true
    }
  }

  return false
}

function hashSlotId(slotId: string): number {
  let h = 0
  for (let i = 0; i < slotId.length; i++) h = (h * 31 + slotId.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Кампанія для конкретного слота (точний ID або легасі-тег) */
export function pickCampaignForSlot(
  campaigns: AdCampaignWithAdvertiser[],
  slotId: string,
): AdCampaignWithAdvertiser | null {
  if (campaigns.length === 0) return null

  const exact = campaigns.find((c) => getCampaignPlacements(c).includes(slotId))
  if (exact) return exact

  const matching = campaigns.filter((c) => campaignMatchesSlot(c, slotId))
  if (matching.length === 0) return null
  return matching[hashSlotId(slotId) % matching.length] ?? null
}

export function isCampaignInSchedule(campaign: AdCampaign, now = Date.now()): boolean {
  const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : null
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null
  const started = startsAt === null || startsAt <= now
  const notEnded = endsAt === null || endsAt >= now
  return started && notEnded
}

export function matchesViewerGeo(
  campaign: AdCampaign,
  viewerCity?: string | null,
  viewerCountry?: string | null,
): boolean {
  const scope = campaign.geo_scope
  if (!scope || scope === 'global' || scope === 'countries') return true

  const city = viewerCity?.trim().toLowerCase()
  const country = viewerCountry?.trim().toLowerCase()

  if (scope === 'country' || scope === 'countries') {
    const target = (campaign.country_name || '').toLowerCase()
    return !target || !country || target === country
  }

  if (scope === 'region' || scope === 'regions') {
    return true
  }

  if (scope === 'city' || scope === 'cities') {
    const cities = (campaign.cities || []).map((c) => c.toLowerCase())
    if (cities.length === 0) {
      const one = (campaign.city_name || '').toLowerCase()
      return !one || !city || one === city
    }
    return !city || cities.includes(city)
  }

  return true
}

export function sortPaidCampaigns(a: AdCampaign, b: AdCampaign): number {
  const priceA = Number(a.price_paid ?? 0)
  const priceB = Number(b.price_paid ?? 0)
  if (priceB !== priceA) return priceB - priceA
  const impA = Number(a.impressions ?? 0)
  const impB = Number(b.impressions ?? 0)
  if (impA !== impB) return impA - impB
  const tA = a.created_at ? new Date(a.created_at).getTime() : 0
  const tB = b.created_at ? new Date(b.created_at).getTime() : 0
  return tB - tA
}

export const AD_MEDIA_FALLBACK =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'

export function getCampaignMediaType(campaign: AdCampaign): 'image' | 'gif' | 'video' {
  const mediaUrl = campaign.media_url || ''
  if (isYoutubeMediaUrl(mediaUrl)) return 'video'
  const t = campaign.media_type
  if (t === 'video' || t === 'gif' || t === 'image') return t
  return 'image'
}

export function getCampaignPosterUrl(campaign: AdCampaign): string {
  if (campaign.image_url?.trim()) return campaign.image_url.trim()
  const mediaUrl = campaign.media_url || ''
  const ytId = parseYoutubeVideoId(mediaUrl)
  if (ytId) return youtubePosterUrl(ytId)
  if (mediaUrl && !mediaUrl.includes('youtube') && !/\.(mp4|webm)(\?|$)/i.test(mediaUrl)) {
    return mediaUrl
  }
  return AD_MEDIA_FALLBACK
}

/** У банерах на сайті — лише статичне зображення (без автовідео) */
export function getPublicBannerImageUrl(campaign: AdCampaign): string {
  return getCampaignPosterUrl(campaign)
}

export function getCampaignMediaUrl(campaign: AdCampaign): string {
  const type = getCampaignMediaType(campaign)
  if (type === 'video') {
    return campaign.media_url || campaign.image_url || AD_MEDIA_FALLBACK
  }
  if (type === 'gif') {
    return campaign.media_url || campaign.image_url || AD_MEDIA_FALLBACK
  }
  return campaign.image_url || campaign.media_url || AD_MEDIA_FALLBACK
}

export function isVideoCampaign(campaign: AdCampaign): boolean {
  return getCampaignMediaType(campaign) === 'video'
}

export function isAnimatedCampaign(campaign: AdCampaign): boolean {
  return getCampaignMediaType(campaign) === 'gif'
}

/** Бокова колонка: слот 1–4 зверху вниз (ліворуч / праворуч) */
export function pickCampaignsForSideStack(
  all: AdCampaignWithAdvertiser[],
  position: 'left' | 'right',
  count: number,
  page?: 'home' | 'listings' | 'default',
): AdCampaignWithAdvertiser[] {
  if (all.length === 0 || count <= 0) return []

  const pageKey = pageKeyFromSideAdsPage(page)
  const side = position === 'left' ? 'left' : 'right'
  const used = new Set<string>()
  const out: AdCampaignWithAdvertiser[] = []

  const pool = () => all.filter((c) => !used.has(c.id))

  for (let i = 0; i < count; i++) {
    const slotId = sideSlotId(pageKey, side, (i + 1) as SideIndex)
    let picked = pickCampaignForSlot(pool(), slotId)

    if (!picked && i === 0) {
      picked =
        pool().find(
          (c) =>
            isOwnerManagedCampaign(c) &&
            getCampaignPlacements(c).includes(ownerMobileSlotForPage(pageKey)),
        ) ?? null
    }

    if (!picked) {
      picked =
        pool().find((c) => campaignMatchesSlot(c, 'sidebar')) ??
        pool()[i % Math.max(pool().length, 1)] ??
        null
    }

    if (picked) {
      out.push(picked)
      used.add(picked.id)
    }
  }

  return out
}

/** Один центральний блок — анімована реклама Baumit (або інший GIF/відео бренд) */
export function pickCenterHeroCampaign(
  all: AdCampaignWithAdvertiser[],
  page: AdPageKey = 'home',
): AdCampaignWithAdvertiser | null {
  if (all.length === 0) return null

  const centerId = centerSlotId(page)
  const ownerCenter = all.find(
    (c) => isOwnerManagedCampaign(c) && getCampaignPlacements(c).includes(centerId),
  )
  if (ownerCenter) return ownerCenter

  const ownerMobileLeader = all.find(
    (c) =>
      isOwnerManagedCampaign(c) &&
      getCampaignPlacements(c).includes(ownerMobileSlotForPage(page)),
  )
  if (ownerMobileLeader) return ownerMobileLeader

  const slotPick = pickCampaignForSlot(all, centerId)
  if (slotPick) return slotPick

  return all[0] ?? null
}

/** @deprecated використовуйте pickCenterHeroCampaign */
export function pickCenterAnimatedCampaigns(
  all: AdCampaignWithAdvertiser[],
  limit: number,
): AdCampaignWithAdvertiser[] {
  const hero = pickCenterHeroCampaign(all)
  return hero ? [hero].slice(0, limit) : []
}

export function pickCampaignByPlacement(
  campaigns: AdCampaign[],
  preferred: AdPlacement,
  fallbackIndex = 0,
): AdCampaign | null {
  const match = campaigns.find(
    (c) =>
      getCampaignPlacements(c).includes(preferred) || c.placement === preferred,
  )
  return match || campaigns[fallbackIndex] || campaigns[0] || null
}

export function pickMobileCampaign(
  campaigns: AdCampaign[],
  variant: 'inline' | 'horizontal',
  page: AdPageKey = 'home',
  inlineIndex: 1 | 2 | 3 | 4 = 1,
): AdCampaign | null {
  if (campaigns.length === 0) return null

  const slotId =
    variant === 'horizontal'
      ? `${page}_mob_inline_1`
      : `${page}_mob_inline_${inlineIndex}`

  const list = campaigns as AdCampaignWithAdvertiser[]

  const exact = list.find((c) => getCampaignPlacements(c).includes(slotId))
  if (exact) return exact

  if (variant === 'horizontal') {
    const leaderboard = list.find((c) => getCampaignPlacements(c).includes('home_leaderboard'))
    if (leaderboard) return leaderboard
  }

  const picked = pickCampaignForSlot(list, slotId)
  if (picked) return picked

  if (variant === 'horizontal') {
    return pickCampaignByPlacement(campaigns, 'footer', 0) || pickCampaignByPlacement(campaigns, 'home', 1)
  }
  return (
    pickCampaignByPlacement(campaigns, 'sidebar', inlineIndex - 1) ||
    pickCampaignByPlacement(campaigns, 'listings', inlineIndex)
  )
}

export function getAdvertiserLabel(campaign: AdCampaignWithAdvertiser): string | null {
  const name = campaign.advertiser?.full_name?.trim()
  const looksLikeAccountLogin =
    !name ||
    name.includes('@') ||
    /^ivan\.sovban$/i.test(name) ||
    /^[a-z0-9._-]+$/i.test(name)

  if (name && !looksLikeAccountLogin) return name

  const brandFromTitle = campaign.title.split(/[—–-]/)[0]?.trim()
  if (brandFromTitle) return brandFromTitle

  return name || null
}

/** Текст у картці реклами без дублювання бренду в заголовку (GREE + GREE — …). */
export function resolveAdDisplayCopy(campaign: AdCampaignWithAdvertiser): {
  brand: string
  title: string
} {
  const brand = (getAdvertiserLabel(campaign) ?? '').trim()
  const title = campaign.title.trim()

  if (!brand || !title) {
    return { brand, title }
  }

  const brandLower = brand.toLowerCase()
  const titleLower = title.toLowerCase()

  if (titleLower === brandLower) {
    return { brand: '', title }
  }

  if (titleLower.startsWith(brandLower)) {
    return { brand: '', title }
  }

  return { brand, title }
}

export function getGeoTargetLabel(
  campaign: AdCampaign,
  t: (key: TranslationKey) => string,
): string {
  const scope = campaign.geo_scope
  if (scope === 'global' || scope === 'countries') {
    return t('ads.geo.global')
  }
  if (scope === 'country' || scope === 'countries') {
    return campaign.country_name || t('ads.geo.countryFallback')
  }
  if (scope === 'region' || scope === 'regions') {
    return `${campaign.region_name || t('ads.geo.regionFallback')} / ${campaign.country_name || t('ads.geo.countryFallback')}`
  }
  if (scope === 'city' || scope === 'cities') {
    return `${campaign.city_name || t('ads.geo.cityFallback')} / ${campaign.country_name || t('ads.geo.countryFallback')}`
  }
  return t('ads.geo.localFallback')
}

export async function fetchPaidAdCampaigns(
  options: FetchPaidAdsOptions,
): Promise<AdCampaignWithAdvertiser[]> {
  const { slots, limit = 12, viewerCity, viewerCountry } = options

  // Без join на profiles: RLS дозволяє читати лише is_professional=true,
  // через що вбудований advertiser часто ламає публічний fetch у браузері.
  let { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('status', 'active')
    .order('price_paid', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    console.error('[ads] fetchPaidAdCampaigns:', error.message, error)
    return []
  }

  const rows = ((data as AdCampaignWithAdvertiser[] | null) || []).filter(
    (c) => !isDemoAdCampaign(c),
  )

  const visible = rows.filter(isPaidCampaign)

  const filtered =
    slots.length === 0
      ? visible
      : visible.filter((c) => slots.some((slot) => campaignMatchesSlot(c, slot)))

  return filtered
    .filter((c) => matchesViewerGeo(c, viewerCity, viewerCountry))
    .sort(sortPaidCampaigns)
    .slice(0, limit)
}

export async function trackAdImpression(campaignId: string): Promise<void> {
  try {
    await supabase.rpc('track_ad_impression', { campaign_id: campaignId })
  } catch {
    // RPC може бути ще не застосований у Supabase
  }
}

export async function trackAdClick(campaignId: string): Promise<void> {
  try {
    await supabase.rpc('track_ad_click', { campaign_id: campaignId })
  } catch {
    // див. trackAdImpression
  }
}
