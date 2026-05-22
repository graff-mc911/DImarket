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
  // Активні кампанії в БД (демо / до застосування SQL-міграції paid gate)
  if (campaign.status === 'active') return true
  return false
}

export function getCampaignPlacements(campaign: AdCampaign): AdPlacement[] {
  const fromArray = (campaign.placements || []).filter(Boolean) as AdPlacement[]
  if (fromArray.length > 0) return fromArray
  return [campaign.placement]
}

export function campaignMatchesSlot(campaign: AdCampaign, slot: AdPlacement): boolean {
  const placements = getCampaignPlacements(campaign)
  if (placements.includes(slot)) return true
  if (slot === 'sidebar') {
    return placements.some((p) => p === 'sidebar' || p === 'footer' || p === 'home')
  }
  if (slot === 'mobile_sticky') {
    return placements.some((p) =>
      ['mobile_sticky', 'home', 'listings', 'sidebar'].includes(p),
    )
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

export function getAdvertiserLabel(campaign: AdCampaignWithAdvertiser): string | null {
  const name = campaign.advertiser?.full_name?.trim()
  if (name) return name
  return null
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

  const selectWithAdvertiser = `
      *,
      advertiser:profiles!advertiser_id (
        full_name,
        website,
        avatar_url,
        profile_photo,
        user_role
      )
    `

  let { data, error } = await supabase
    .from('ad_campaigns')
    .select(selectWithAdvertiser)
    .eq('status', 'active')
    .order('price_paid', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    const retry = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('price_paid', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(40)
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[ads] fetchPaidAdCampaigns:', error.message)
    return []
  }

  const rows = (data as AdCampaignWithAdvertiser[] | null) || []

  return rows
    .filter(isPaidCampaign)
    .filter(isCampaignInSchedule)
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
