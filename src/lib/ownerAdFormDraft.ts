/**
 * Persist owner-cabinet ad composer (formOpen + fields) across remounts,
 * tab switches, and short reloads. Session-scoped — no secrets/files.
 */

import { DEFAULT_AD_MEDIA_STYLE, type AdMediaStyle } from './adMediaStyle'
import type { AdCampaignMediaState } from './adCampaignMedia'
import type { OwnerAdFormValues } from './ownerAdCampaign'
import type { SlotMediaMap } from './adSlotMedia'
import { centerSlotId } from './adPlacementSlots'
import type { PlacementEditorPageId } from './adPlacementPages'

export const OWNER_AD_FORM_DRAFT_KEY = 'dimarket_owner_ad_form_draft_v1'

export type OwnerAdFormDraft = {
  v: 1
  savedAt: string
  ownerId: string
  formOpen: boolean
  editingId: string | null
  form: OwnerAdFormValues
  mediaUrl: string
  slideUrls: string[]
  mediaStyle: AdMediaStyle
  bannerMediaType: AdCampaignMediaState['mediaType']
  slotMedia: SlotMediaMap
  placementPreviewPage: PlacementEditorPageId
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export function ownerAdDraftHasUnsavedContent(draft: OwnerAdFormDraft): boolean {
  if (!draft.formOpen) return false
  const f = draft.form
  return Boolean(
    f.title.trim() ||
      f.description.trim() ||
      f.linkUrl.trim() ||
      draft.mediaUrl.trim() ||
      draft.slideUrls.length ||
      Object.keys(draft.slotMedia).length ||
      draft.editingId ||
      (f.selectedSlots.length > 1) ||
      f.selectedSlots[0] !== centerSlotId('home') ||
      f.geoScope !== 'global' ||
      f.selectedCountries.length ||
      f.selectedRegions.length ||
      f.selectedCities.length,
  )
}

export function readOwnerAdFormDraft(ownerId: string): OwnerAdFormDraft | null {
  try {
    const raw = sessionStorage.getItem(OWNER_AD_FORM_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed) || parsed.v !== 1) return null
    if (parsed.ownerId !== ownerId) return null
    if (typeof parsed.formOpen !== 'boolean') return null
    if (!isRecord(parsed.form)) return null

    const mediaType = parsed.bannerMediaType
    if (mediaType !== 'image' && mediaType !== 'gif' && mediaType !== 'video') return null

    const mediaStyle = isRecord(parsed.mediaStyle)
      ? ({ ...DEFAULT_AD_MEDIA_STYLE, ...parsed.mediaStyle } as AdMediaStyle)
      : DEFAULT_AD_MEDIA_STYLE

    const form = parsed.form as OwnerAdFormValues
    const selectedSlots = asStringArray(form.selectedSlots)
    return {
      v: 1,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      ownerId,
      formOpen: parsed.formOpen,
      editingId: typeof parsed.editingId === 'string' ? parsed.editingId : null,
      form: {
        title: typeof form.title === 'string' ? form.title : '',
        description: typeof form.description === 'string' ? form.description : '',
        linkUrl: typeof form.linkUrl === 'string' ? form.linkUrl : '',
        mediaUrl: typeof form.mediaUrl === 'string' ? form.mediaUrl : '',
        mediaType: form.mediaType === 'gif' || form.mediaType === 'video' ? form.mediaType : 'image',
        selectedSlots: selectedSlots.length > 0 ? selectedSlots : [centerSlotId('home')],
        geoScope: (form.geoScope as OwnerAdFormValues['geoScope']) || 'global',
        selectedCountries: asStringArray(form.selectedCountries),
        selectedRegions: asStringArray(form.selectedRegions),
        selectedCities: asStringArray(form.selectedCities),
        status: form.status || 'active',
        startsAt: typeof form.startsAt === 'string' ? form.startsAt : '',
        endsAt: typeof form.endsAt === 'string' ? form.endsAt : '',
      },
      mediaUrl: typeof parsed.mediaUrl === 'string' ? parsed.mediaUrl : '',
      slideUrls: asStringArray(parsed.slideUrls),
      mediaStyle,
      bannerMediaType: mediaType,
      slotMedia: isRecord(parsed.slotMedia) ? (parsed.slotMedia as SlotMediaMap) : {},
      placementPreviewPage: (
        [
          'home',
          'listings',
          'professionals',
          'listing-detail',
          'professional-detail',
        ] as PlacementEditorPageId[]
      ).includes(parsed.placementPreviewPage as PlacementEditorPageId)
        ? (parsed.placementPreviewPage as PlacementEditorPageId)
        : 'home',
    }
  } catch {
    return null
  }
}

export function writeOwnerAdFormDraft(
  draft: Omit<OwnerAdFormDraft, 'v' | 'savedAt'>,
): void {
  try {
    if (!draft.formOpen) {
      sessionStorage.removeItem(OWNER_AD_FORM_DRAFT_KEY)
      return
    }
    const payload: OwnerAdFormDraft = {
      v: 1,
      savedAt: new Date().toISOString(),
      ...draft,
    }
    sessionStorage.setItem(OWNER_AD_FORM_DRAFT_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function clearOwnerAdFormDraft(): void {
  try {
    sessionStorage.removeItem(OWNER_AD_FORM_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

/** Sync composer open state into /dashboard URL without full navigation. */
export function syncOwnerAdsUrlState(opts: {
  formOpen: boolean
  editingId: string | null
}): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.pathname.startsWith('/dashboard')) return

  if (!opts.formOpen) {
    url.searchParams.delete('ads')
    url.searchParams.delete('adId')
  } else if (opts.editingId) {
    url.searchParams.set('ads', 'edit')
    url.searchParams.set('adId', opts.editingId)
  } else {
    url.searchParams.set('ads', 'create')
    url.searchParams.delete('adId')
  }

  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next)
  }
}

export function readOwnerAdsUrlState(): {
  formOpen: boolean
  editingId: string | null
} {
  if (typeof window === 'undefined') return { formOpen: false, editingId: null }
  const params = new URLSearchParams(window.location.search)
  const ads = params.get('ads')
  const adId = params.get('adId')
  if (ads === 'edit' && adId) return { formOpen: true, editingId: adId }
  if (ads === 'create') return { formOpen: true, editingId: null }
  return { formOpen: false, editingId: null }
}
