import { supabase } from './supabase'
import type { AdCampaign } from './types'
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

export function getCampaignPlacements(campaign: AdCampaign): AdPlacement[] {
  const fromArray = (campaign.placements || []).filter(Boolean) as AdPlacement[]
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

export function campaignMatchesSlot(campaign: AdCampaign, slot: AdPlacement): boolean {
  const placements = getCampaignPlacements(campaign)
  if (placements.includes(slot)) return true
  const fallbacks = SLOT_FALLBACKS[slot]
  if (fallbacks) {
    return placements.some((p) => fallbacks.includes(p))
  }
  return false
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

export function getCampaignMediaUrl(campaign: AdCampaign): string {
  return campaign.media_url || campaign.image_url
}

export const AD_MEDIA_FALLBACK =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'

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
  variant: 'inline' | 'sticky' | 'horizontal',
): AdCampaign | null {
  if (campaigns.length === 0) return null
  if (variant === 'sticky') {
    return pickCampaignByPlacement(campaigns, 'mobile_sticky', 0)
  }
  if (variant === 'horizontal') {
    return pickCampaignByPlacement(campaigns, 'home', 1)
  }
  return (
    pickCampaignByPlacement(campaigns, 'sidebar', 2) ||
    pickCampaignByPlacement(campaigns, 'listings', 3)
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

  const rows = (data as AdCampaignWithAdvertiser[] | null) || []

  // Розклад уже відфільтровано RLS (starts_at / ends_at). Не дублюємо через Date.now()
  // у браузері — інакше при розсинхроні годинника всі кампанії зникають з UI.
  return rows
    .filter(isPaidCampaign)
    .filter((c) => slots.some((slot) => campaignMatchesSlot(c, slot)))
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
