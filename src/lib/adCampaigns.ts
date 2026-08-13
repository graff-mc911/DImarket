import { supabase } from './supabase'
import {
  centerSlotId,
  pageKeyFromSideAdsPage,
  sideSlotId,
  type AdPageKey,
  type SideIndex,
} from './adPlacementSlots'
import { isDemoAdCampaign } from './demoAdCampaigns'
import { isOwnerCancelledReviewNote } from './adCampaignVisibility'
import { isYoutubeMediaUrl, parseYoutubeVideoId, youtubePosterUrl } from './youtubeMedia'
import type { AdCampaign } from './types'
import { isGranularSlotId } from './adPlacementCatalog'
import { getSlotLegacyTags } from './adPlacementSlots'
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

/** Public display gate: paid/approved, in schedule, and not owner-cancelled. */
export function isCampaignPubliclyDisplayable(
  campaign: AdCampaign,
  now = Date.now(),
): boolean {
  if (campaign.status !== 'active') return false
  if (isOwnerCancelledReviewNote(campaign.review_note)) return false
  if (!isPaidCampaign(campaign)) return false
  if (!isCampaignInSchedule(campaign, now)) return false
  return true
}

function normalizePlacementId(id: string): string {
  const sticky = id.match(/^(home|listings|professionals|default)_mob_sticky$/)
  if (sticky) return `${sticky[1]}_mob_inline_1`
  return id
}

export function getCampaignPlacements(campaign: AdCampaign): string[] {
  const fromArray = (campaign.placements || []).filter(Boolean).map(normalizePlacementId) as string[]
  if (fromArray.length > 0) return fromArray
  return [normalizePlacementId(campaign.placement)]
}

export function campaignUsesGranularPlacements(campaign: AdCampaign): boolean {
  return getCampaignPlacements(campaign).some(isGranularSlotId)
}

const SLOT_FALLBACKS: Partial<Record<AdPlacement, AdPlacement[]>> = {
  sidebar: ['sidebar', 'footer', 'home', 'listings'],
  mobile_sticky: ['mobile_sticky', 'home', 'listings', 'sidebar', 'footer'],
  home: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  listings: ['listings', 'home', 'sidebar', 'mobile_sticky', 'footer'],
  footer: ['footer', 'sidebar', 'home', 'listings'],
}

/** Кампанія призначена саме для цього слота (exact ID або легасі-тег, без «чужих» зон). */
export function campaignOwnsSlot(campaign: AdCampaign, slotId: string): boolean {
  const placements = getCampaignPlacements(campaign)
  if (placements.includes(slotId)) return true
  if (campaignUsesGranularPlacements(campaign)) return false
  return campaignMatchesSlot(campaign, slotId)
}

function slotMediaEntryUrl(entry: unknown): string {
  if (!entry || typeof entry !== 'object') return ''
  const o = entry as Record<string, unknown>
  const mediaUrl = String(o.mediaUrl ?? '').trim()
  const slides = Array.isArray(o.slideUrls)
    ? o.slideUrls.map(String).filter(Boolean)
    : []
  return slides[0] || mediaUrl
}

/** Чи є у кампанії креатив саме для цього слота (без підміни з інших банерів). */
export function campaignRendersInSlot(campaign: AdCampaign, slotId: string): boolean {
  if (!campaignOwnsSlot(campaign, slotId)) return false

  const raw = campaign.slot_media
  if (!raw || typeof raw !== 'object') {
    return Boolean(campaign.image_url?.trim() || campaign.media_url?.trim())
  }

  const map = raw as Record<string, unknown>
  const granularKeys = Object.keys(map).filter((key) => slotMediaEntryUrl(map[key]))
  if (granularKeys.length === 0) {
    return Boolean(campaign.image_url?.trim() || campaign.media_url?.trim())
  }

  return Boolean(slotMediaEntryUrl(map[slotId]))
}

export function campaignMatchesSlot(campaign: AdCampaign, slot: AdPlacement | string): boolean {
  const placements = getCampaignPlacements(campaign)
  if (placements.includes(slot)) return true

  const slotIsGranular = typeof slot === 'string' && isGranularSlotId(slot)
  const campaignGranular = campaignUsesGranularPlacements(campaign)

  /** Кампанія з точними слотами — лише exact match */
  if (campaignGranular) {
    return false
  }

  const granularLegacy = getSlotLegacyTags(slot)
  if (slot.includes('_') && placements.some((p) => granularLegacy.includes(p as AdPlacement))) {
    return true
  }

  if (!slot.includes('_')) {
    if (placements.some((p) => getSlotLegacyTags(p).includes(slot as AdPlacement))) {
      return true
    }
  }

  const fallbacks = SLOT_FALLBACKS[slot as AdPlacement]
  if (fallbacks) {
    return placements.some((p) => fallbacks.includes(p as AdPlacement))
  }

  if (slotIsGranular) return false

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
  const scope = (campaign.geo_scope || 'global').toLowerCase()
  if (!scope || scope === 'global') return true

  const city = viewerCity?.trim().toLowerCase() || ''
  const country = viewerCountry?.trim().toLowerCase() || ''

  const campaignCountries = normalizeGeoTokens(
    campaign.countries?.length
      ? campaign.countries
      : campaign.country_name
        ? [campaign.country_name]
        : [],
  )
  const campaignRegions = normalizeGeoTokens(splitCommaGeoValues(campaign.region_name))
  const campaignCities = normalizeGeoTokens(
    campaign.cities?.length ? campaign.cities : splitCommaGeoValues(campaign.city_name),
  )

  if (scope === 'country' || scope === 'countries') {
    if (!country) return false
    return campaignCountries.size === 0 || campaignCountries.has(country)
  }

  if (scope === 'region' || scope === 'regions') {
    if (!country && !city) return false
    if (country && campaignCountries.has(country)) return true
    if (city && campaignCities.has(city)) return true
    return false
  }

  if (scope === 'city' || scope === 'cities') {
    if (!city) return false
    return campaignCities.size === 0 || campaignCities.has(city)
  }

  return true
}

function normalizeGeoTokens(items: string[]): Set<string> {
  return new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean))
}

function splitCommaGeoValues(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
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

export function getCampaignPosterUrl(
  campaign: AdCampaign & { slot_media?: unknown },
  slotId?: string,
): string {
  const slotMap = campaign.slot_media
  if (slotMap && typeof slotMap === 'object') {
    const map = slotMap as Record<string, unknown>
    const granularKeys = Object.keys(map).filter((key) => slotMediaEntryUrl(map[key]))

    if (slotId) {
      const pick = slotMediaEntryUrl(map[slotId])
      if (pick) return pick
      if (granularKeys.length > 0) {
        if (!campaignOwnsSlot(campaign, slotId)) return AD_MEDIA_FALLBACK
        return campaign.image_url?.trim() || AD_MEDIA_FALLBACK
      }
    } else {
      for (const val of Object.values(map)) {
        const pick = slotMediaEntryUrl(val)
        if (pick) return pick
      }
    }
  }

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
export function getPublicBannerImageUrl(
  campaign: AdCampaign,
  slotId?: string,
): string {
  return getCampaignPosterUrl(campaign, slotId)
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

function fillSideStack(
  all: AdCampaignWithAdvertiser[],
  side: 'left' | 'right',
  count: number,
  pageKey: AdPageKey,
): (AdCampaignWithAdvertiser | null)[] {
  const out: (AdCampaignWithAdvertiser | null)[] = Array.from({ length: count }, () => null)
  const legacyPool = all.filter((c) => !campaignUsesGranularPlacements(c))

  for (let i = 0; i < count; i++) {
    const slotId = sideSlotId(pageKey, side, (i + 1) as SideIndex)

    /** Куплений слот — exact match + креатив саме для цього ряду */
    const exactOwner = all.find(
      (c) => getCampaignPlacements(c).includes(slotId) && campaignRendersInSlot(c, slotId),
    )
    if (exactOwner) {
      out[i] = exactOwner
      continue
    }

    /** Легасі placement (sidebar, home…) — старі кампанії без гранульованих ID */
    const legacyPick = pickCampaignForSlot(legacyPool, slotId)
    out[i] = legacyPick && campaignRendersInSlot(legacyPick, slotId) ? legacyPick : null
  }

  return out
}

/** Ліва + права колонки з одним пулом (без дублювання кампаній між сторонами). */
export function pickSideStacksForPage(
  all: AdCampaignWithAdvertiser[],
  count: number,
  page?: 'home' | 'listings' | 'professionals' | 'default',
): {
  left: (AdCampaignWithAdvertiser | null)[]
  right: (AdCampaignWithAdvertiser | null)[]
} {
  if (all.length === 0 || count <= 0) {
    return { left: [], right: [] }
  }

  const pageKey = pageKeyFromSideAdsPage(page)
  const right = fillSideStack(all, 'right', count, pageKey)
  const left = fillSideStack(all, 'left', count, pageKey)

  return { left, right }
}

function mergeSideStackRows(
  primary: (AdCampaignWithAdvertiser | null)[],
  fallback: (AdCampaignWithAdvertiser | null)[],
): (AdCampaignWithAdvertiser | null)[] {
  return primary.map((row, index) => row ?? fallback[index] ?? null)
}

/** Слоти поточної сторінки + fallback на home, щоб банери не зникали при переході */
export function pickSideStacksForPageWithFallback(
  all: AdCampaignWithAdvertiser[],
  count: number,
  page?: 'home' | 'listings' | 'professionals' | 'default',
): {
  left: (AdCampaignWithAdvertiser | null)[]
  right: (AdCampaignWithAdvertiser | null)[]
} {
  const current = pickSideStacksForPage(all, count, page)
  const pageKey = pageKeyFromSideAdsPage(page)
  if (pageKey === 'home') return current

  const home = pickSideStacksForPage(all, count, 'home')
  return {
    left: mergeSideStackRows(current.left, home.left),
    right: mergeSideStackRows(current.right, home.right),
  }
}

/** Бокова колонка: слот 1–4 зверху вниз; null — порожній ряд (фіксована сітка) */
export function pickCampaignsForSideStack(
  all: AdCampaignWithAdvertiser[],
  position: 'left' | 'right',
  count: number,
  page?: 'home' | 'listings' | 'professionals' | 'default',
): (AdCampaignWithAdvertiser | null)[] {
  const stacks = pickSideStacksForPage(all, count, page)
  return position === 'left' ? stacks.left : stacks.right
}

/** Один центральний блок — анімована реклама Baumit (або інший GIF/відео бренд) */
export function pickCenterHeroCampaign(
  all: AdCampaignWithAdvertiser[],
  page: AdPageKey = 'home',
): AdCampaignWithAdvertiser | null {
  if (all.length === 0) return null

  const centerId = centerSlotId(page)
  const slotPick = pickCampaignForSlot(all, centerId)
  if (slotPick && campaignRendersInSlot(slotPick, centerId)) return slotPick

  const legacyCenter = all.find(
    (c) =>
      !campaignUsesGranularPlacements(c) &&
      (getCampaignPlacements(c).includes('footer') || campaignMatchesSlot(c, centerId)),
  )
  return legacyCenter && campaignRendersInSlot(legacyCenter, centerId) ? legacyCenter : null
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

  const legacyOnly = list.filter((c) => !campaignUsesGranularPlacements(c))
  if (legacyOnly.length === 0) return null

  if (variant === 'horizontal') {
    return pickCampaignByPlacement(legacyOnly, 'footer', 0) || pickCampaignByPlacement(legacyOnly, 'home', 1)
  }
  return (
    pickCampaignByPlacement(legacyOnly, 'sidebar', inlineIndex - 1) ||
    pickCampaignByPlacement(legacyOnly, 'listings', inlineIndex)
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

const GENERIC_PLACEHOLDER_TITLE_PATTERNS = [
  /^this will be your advertisement\.?$/i,
  /^banner will appear here$/i,
  /^your ad(vertisement)? here$/i,
]

/** Локалізує заглушки реклами з англомовної БД під мову інтерфейсу. */
export function localizeAdDisplayCopy(
  campaign: AdCampaignWithAdvertiser,
  t: (key: TranslationKey) => string,
): { brand: string; title: string } {
  const copy = resolveAdDisplayCopy(campaign)
  const normalized = copy.title.trim()
  if (GENERIC_PLACEHOLDER_TITLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { brand: '', title: t('advertising.preview.placeholder') }
  }
  return copy
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

  // Defense in depth: never show owner-cancelled campaigns even if status was
  // incorrectly left as `active` (production bug: review_note rejected, status active).
  const visible = rows.filter((c) => isCampaignPubliclyDisplayable(c))

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
