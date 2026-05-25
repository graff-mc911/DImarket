import type { AdCampaign } from './types'
import { buildCampaignMediaFields, type AdCampaignMediaState } from './adCampaignMedia'
import { slotToLegacyPlacement } from './adPlacementSlots'

export const OWNER_MANAGED_PREFIX = 'owner_managed'

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
  geoScope: 'global' | 'countries' | 'regions' | 'cities'
  status: AdCampaign['status'] | 'pending_payment'
  startsAt: string
  endsAt: string
}

export function buildOwnerCampaignPayload(
  values: OwnerAdFormValues,
  ownerId: string,
  editing?: AdCampaign | null,
  media?: AdCampaignMediaState,
) {
  const now = new Date()
  const startDate = values.startsAt ? new Date(values.startsAt) : now
  const endDate = values.endsAt
    ? new Date(values.endsAt)
    : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000)

  const status = values.status === 'pending_payment' ? 'active' : values.status
  const active = status === 'active'

  return {
    advertiser_id: editing?.advertiser_id ?? ownerId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    ...(media
      ? buildCampaignMediaFields(media)
      : {
          image_url: values.mediaUrl.trim(),
          media_url: values.mediaUrl.trim(),
          media_type: values.mediaType,
        }),
    link_url: values.linkUrl.trim(),
    placement: slotToLegacyPlacement(values.selectedSlots[0] || 'home_side_r1'),
    placements: values.selectedSlots,
    geo_scope: values.geoScope,
    countries: [] as string[],
    cities: [] as string[],
    country_name: null,
    city_name: null,
    country_code: null,
    region_name: null,
    starts_at: startDate.toISOString(),
    ends_at: endDate.toISOString(),
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
  {
    label: 'Головна — горизонтальний банер (після hero)',
    slots: ['home_mob_inline_1', 'home_center', 'home_side_r1'],
  },
  { label: 'Головна — центральний блок', slots: ['home_center', 'home_mob_inline_1'] },
  { label: 'Головна — бокова колонка зліва (1-й)', slots: ['home_side_l1'] },
  { label: 'Головна — бокова колонка справа (1-й)', slots: ['home_side_r1'] },
  { label: 'Головна — широкий мобільний банер', slots: ['home_mob_inline_1'] },
  {
    label: 'Оголошення — горизонтальний банер',
    slots: ['listings_mob_inline_1', 'listings_side_r1'],
  },
  { label: 'Оголошення — бокова колонка', slots: ['listings_side_r1'] },
]
