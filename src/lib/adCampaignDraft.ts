/**
 * Persist /advertising campaign form draft across navigation.
 * Media is stored by URL (already uploaded to storage) — not as File blobs.
 */

import { centerSlotId } from './adPlacementSlots'
import { sanitizeSlotsForPurchase } from './adPlacementCatalog'
import { DEFAULT_AD_MEDIA_STYLE, type AdMediaStyle } from './adMediaStyle'
import type { SlotMediaMap } from './adSlotMedia'
import type { GeoMode } from './adGeoCatalog'

export const AD_CAMPAIGN_DRAFT_KEY = 'dimarket_ad_campaign_draft_v1'

export type AdCampaignFormDraft = {
  v: 1
  savedAt: string
  userId: string | null
  editingCampaignId: string | null
  /** User explicitly opened / focused the create-edit composer */
  composerActive: boolean
  title: string
  description: string
  linkUrl: string
  startsAt: string
  endsAt: string
  selectedSlots: string[]
  geoMode: GeoMode
  selectedCountries: string[]
  selectedRegions: string[]
  selectedCities: string[]
  durationWeeks: number
  mediaType: 'image' | 'gif' | 'video'
  mediaUrl: string
  slideUrls: string[]
  mediaStyle: AdMediaStyle
  slotMedia: SlotMediaMap
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export function readAdCampaignDraft(userId: string | null | undefined): AdCampaignFormDraft | null {
  try {
    const raw = localStorage.getItem(AD_CAMPAIGN_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed) || parsed.v !== 1) return null

    const draftUser = typeof parsed.userId === 'string' ? parsed.userId : null
    // Prefer same-user drafts; allow anonymous → logged-in handoff when draft has no user yet
    if (userId && draftUser && draftUser !== userId) return null

    const slotsRaw = asStringArray(parsed.selectedSlots)
    const selectedSlots =
      slotsRaw.length > 0 ? sanitizeSlotsForPurchase(slotsRaw) : [centerSlotId('home')]

    const geoMode = (parsed.geoMode as GeoMode) || 'global'
    if (!['global', 'countries', 'regions', 'cities'].includes(geoMode)) return null

    const mediaType = parsed.mediaType
    if (mediaType !== 'image' && mediaType !== 'gif' && mediaType !== 'video') return null

    const mediaStyle = isRecord(parsed.mediaStyle)
      ? ({ ...DEFAULT_AD_MEDIA_STYLE, ...parsed.mediaStyle } as AdMediaStyle)
      : DEFAULT_AD_MEDIA_STYLE

    const slotMedia = isRecord(parsed.slotMedia) ? (parsed.slotMedia as SlotMediaMap) : {}

    const hasContent =
      Boolean(String(parsed.title || '').trim()) ||
      Boolean(String(parsed.description || '').trim()) ||
      Boolean(String(parsed.linkUrl || '').trim()) ||
      Boolean(String(parsed.mediaUrl || '').trim()) ||
      asStringArray(parsed.slideUrls).length > 0 ||
      Object.keys(slotMedia).length > 0 ||
      asStringArray(parsed.selectedCountries).length > 0 ||
      asStringArray(parsed.selectedRegions).length > 0 ||
      asStringArray(parsed.selectedCities).length > 0 ||
      selectedSlots.length > 1 ||
      selectedSlots[0] !== centerSlotId('home')

    if (!hasContent && !parsed.editingCampaignId && !parsed.composerActive) return null

    return {
      v: 1,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      userId: draftUser,
      editingCampaignId:
        typeof parsed.editingCampaignId === 'string' ? parsed.editingCampaignId : null,
      composerActive: parsed.composerActive === true,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      linkUrl: typeof parsed.linkUrl === 'string' ? parsed.linkUrl : '',
      startsAt: typeof parsed.startsAt === 'string' ? parsed.startsAt : '',
      endsAt: typeof parsed.endsAt === 'string' ? parsed.endsAt : '',
      selectedSlots,
      geoMode,
      selectedCountries: asStringArray(parsed.selectedCountries),
      selectedRegions: asStringArray(parsed.selectedRegions),
      selectedCities: asStringArray(parsed.selectedCities),
      durationWeeks:
        typeof parsed.durationWeeks === 'number' && parsed.durationWeeks >= 1
          ? Math.min(52, Math.floor(parsed.durationWeeks))
          : 1,
      mediaType,
      mediaUrl: typeof parsed.mediaUrl === 'string' ? parsed.mediaUrl : '',
      slideUrls: asStringArray(parsed.slideUrls),
      mediaStyle,
      slotMedia,
    }
  } catch {
    return null
  }
}

export function writeAdCampaignDraft(draft: Omit<AdCampaignFormDraft, 'v' | 'savedAt'>): void {
  try {
    const payload: AdCampaignFormDraft = {
      v: 1,
      savedAt: new Date().toISOString(),
      ...draft,
      selectedSlots: sanitizeSlotsForPurchase(draft.selectedSlots),
    }
    localStorage.setItem(AD_CAMPAIGN_DRAFT_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function clearAdCampaignDraft(): void {
  try {
    localStorage.removeItem(AD_CAMPAIGN_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function draftHasMeaningfulContent(draft: AdCampaignFormDraft): boolean {
  return Boolean(
    draft.composerActive ||
      draft.title.trim() ||
      draft.description.trim() ||
      draft.linkUrl.trim() ||
      draft.mediaUrl.trim() ||
      draft.slideUrls.length ||
      Object.keys(draft.slotMedia).length ||
      draft.editingCampaignId,
  )
}

/** Keep /advertising?compose=1 in sync with composer focus (no full navigation). */
export function syncAdvertisingComposeUrl(active: boolean): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.pathname.startsWith('/advertising')) return
  if (active) url.searchParams.set('compose', '1')
  else url.searchParams.delete('compose')
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(window.history.state, '', next)
}

export function readAdvertisingComposeUrl(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('compose') === '1'
}
