import type { AdCampaign } from './types'
import { buildCampaignMediaFields, type AdCampaignMediaState } from './adCampaignMedia'
import {
  buildFullCampaignMediaFields,
  type SlotMediaMap,
} from './adSlotMedia'
import { slotToLegacyPlacement } from './adPlacementSlots'
import type { GeoMode } from './adGeoCatalog'

export const OWNER_MANAGED_PREFIX = 'owner_managed'

function splitCommaValues(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

export function isOwnerManagedCampaign(campaign: AdCampaign): boolean {
  return (campaign.review_note || '').startsWith(OWNER_MANAGED_PREFIX)
}

export function ownerManagedReviewNote(extra?: string | null): string {
  const tail = extra?.trim()
  return tail ? `${OWNER_MANAGED_PREFIX}: ${tail}` : OWNER_MANAGED_PREFIX
}

export type OwnerAdFormValues = {
  title: string
  description: string
  linkUrl: string
  mediaUrl: string
  mediaType: 'image' | 'gif' | 'video'
  selectedSlots: string[]
  slotMedia?: SlotMediaMap
  geoScope: GeoMode
  selectedCountries: string[]
  selectedRegions: string[]
  selectedCities: string[]
  status: AdCampaign['status'] | 'pending_payment'
  startsAt: string
  endsAt: string
}

export function isOwnerCampaignExpiredInSchedule(campaign: AdCampaign, now = Date.now()): boolean {
  if (campaign.status !== 'active') return false
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null
  return endsAt !== null && endsAt < now
}

export function getOwnerCampaignScheduleLabel(campaign: AdCampaign): string {
  if (!campaign.ends_at) {
    if (isOwnerManagedCampaign(campaign)) return 'До скасування власником'
    return 'Безстроково'
  }
  const ends = new Date(campaign.ends_at)
  if (ends.getTime() < Date.now()) {
    return `Термін закінчився ${ends.toLocaleDateString('uk-UA')}`
  }
  return `До ${ends.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

export function getOwnerCampaignGeoLabel(campaign: AdCampaign): string {
  const scope = (campaign.geo_scope || 'global') as GeoMode
  if (scope === 'global') return 'Увесь світ'
  const countries = campaign.countries?.length
    ? campaign.countries
    : campaign.country_name
      ? [campaign.country_name]
      : []
  const cities = campaign.cities?.length
    ? campaign.cities
    : splitCommaValues(campaign.city_name)
  const regions = splitCommaValues(campaign.region_name)
  if (scope === 'countries') return countries.join(', ') || 'Країни не вказані'
  if (scope === 'regions') return regions.join(', ') || countries.join(', ') || 'Регіони не вказані'
  return cities.join(', ') || 'Міста не вказані'
}

export function campaignToOwnerForm(c: AdCampaign): OwnerAdFormValues {
  const slots =
    (c.placements || []).filter(Boolean).length > 0
      ? (c.placements as string[])
      : ['home_center']

  return {
    title: c.title,
    description: c.description || '',
    linkUrl: c.link_url,
    mediaUrl: c.media_url || c.image_url,
    mediaType: (c.media_type as OwnerAdFormValues['mediaType']) || 'image',
    selectedSlots: slots,
    geoScope: ((c.geo_scope as GeoMode) || 'global'),
    selectedCountries: c.countries?.length
      ? c.countries
      : c.country_name
        ? [c.country_name]
        : [],
    selectedRegions: splitCommaValues(c.region_name),
    selectedCities: c.cities?.length ? c.cities : splitCommaValues(c.city_name),
    status: c.status,
    startsAt: c.starts_at ? toOwnerLocalInput(c.starts_at) : '',
    endsAt: c.ends_at ? toOwnerLocalInput(c.ends_at) : '',
  }
}

export function toOwnerLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function buildOwnerCampaignPayload(
  values: OwnerAdFormValues,
  ownerId: string,
  editing?: AdCampaign | null,
  media?: AdCampaignMediaState,
  targetCities: string[] = [],
) {
  const now = new Date()
  const startDate = values.startsAt ? new Date(values.startsAt) : now
  const endsAtIso = values.endsAt.trim()
    ? new Date(values.endsAt).toISOString()
    : null

  const status = values.status === 'pending_payment' ? 'active' : values.status
  const active = status === 'active'

  return {
    advertiser_id: editing?.advertiser_id ?? ownerId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    ...(media
      ? values.slotMedia
        ? buildFullCampaignMediaFields(values.slotMedia, values.selectedSlots, media)
        : buildCampaignMediaFields(media)
      : {
          image_url: values.mediaUrl.trim(),
          media_url: values.mediaUrl.trim(),
          media_type: values.mediaType,
        }),
    link_url: values.linkUrl.trim(),
    placement: slotToLegacyPlacement(values.selectedSlots[0] || 'home_center'),
    placements: values.selectedSlots,
    geo_scope: values.geoScope,
    countries: values.selectedCountries,
    cities: targetCities,
    country_name: values.selectedCountries[0] ?? null,
    city_name: targetCities[0] ?? null,
    country_code: null,
    region_name:
      values.selectedRegions.length > 0 ? values.selectedRegions.join(', ') : null,
    starts_at: startDate.toISOString(),
    ends_at: endsAtIso,
    status,
    review_note: ownerManagedReviewNote(
      editing?.review_note?.replace(/^owner_managed:?\s*/i, '') || null,
    ),
    updated_at: now.toISOString(),
    ...(active
      ? {
          approved_by: ownerId,
          approved_at: now.toISOString(),
          price_paid: editing?.price_paid ?? 0,
          currency_paid: editing?.currency_paid ?? 'eur',
        }
      : {}),
  }
}

export const OWNER_SLOT_PRESETS: { label: string; slots: string[] }[] = [
  { label: 'Головна — центр + топ-банер', slots: ['home_center', 'home_mob_inline_1'] },
  { label: 'Головна — центральний блок', slots: ['home_center'] },
  { label: 'Головна — широкий топ-банер', slots: ['home_mob_inline_1'] },
  { label: 'Оголошення — топ + у стрічці', slots: ['listings_mob_inline_1', 'listings_mob_inline_2'] },
  { label: 'Фахівці — топ + у стрічці', slots: ['professionals_mob_inline_1', 'professionals_mob_inline_2'] },
  { label: 'Картка оголошення / фахівця', slots: ['default_mob_inline_1'] },
]
