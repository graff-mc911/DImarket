import type { AdCampaign } from './types'
import { campaignOwnsSlot } from './adCampaigns'
import {
  buildCampaignMediaFields,
  emptyCampaignMediaState,
  mediaStateFromCampaign,
  type AdCampaignMediaState,
} from './adCampaignMedia'
import { layoutKeyFromOverlayVariant } from './adBannerLayouts'
import type { AdBannerLayoutKey } from './adBannerLayouts'
import { getSlotDefinition } from './adPlacementCatalog'
import {
  buildMediaStylePayload,
  DEFAULT_AD_MEDIA_STYLE,
  parseAdMediaStyle,
  type AdMediaStyle,
} from './adMediaStyle'
import { formatSlotLabel, type AdPageKey } from './adPlacementSlots'

export type SlotMediaEntry = {
  mediaUrl: string
  mediaType: 'image' | 'gif' | 'video'
  slideUrls: string[]
  mediaStyle: AdMediaStyle
}

export type SlotMediaMap = Record<string, SlotMediaEntry>

export function emptySlotMediaEntry(): SlotMediaEntry {
  return {
    mediaUrl: '',
    mediaType: 'image',
    slideUrls: [],
    mediaStyle: { ...DEFAULT_AD_MEDIA_STYLE },
  }
}

/** Один файл на слот — без накладання слайдів */
export function normalizeSlotMediaEntry(entry: SlotMediaEntry): SlotMediaEntry {
  const url = (entry.slideUrls.find(Boolean) || entry.mediaUrl || '').trim()
  if (!url) return emptySlotMediaEntry()
  return {
    mediaUrl: url,
    mediaType: entry.mediaType,
    slideUrls: [url],
    mediaStyle: {
      ...entry.mediaStyle,
      slideshow: null,
    },
  }
}

export function parseSlotMediaMap(raw: unknown): SlotMediaMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: SlotMediaMap = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== 'object') continue
    const o = val as Record<string, unknown>
    const mediaUrl = String(o.mediaUrl ?? '').trim()
    const mediaType =
      o.mediaType === 'gif' || o.mediaType === 'video' ? o.mediaType : 'image'
    const slideUrls = Array.isArray(o.slideUrls)
      ? o.slideUrls.map(String).filter(Boolean)
      : mediaUrl
        ? [mediaUrl]
        : []
    out[key] = normalizeSlotMediaEntry({
      mediaUrl: slideUrls[0] || mediaUrl,
      mediaType,
      slideUrls,
      mediaStyle: parseAdMediaStyle(o.mediaStyle),
    })
  }
  return out
}

export function layoutKeyFromSlotId(slotId: string): AdBannerLayoutKey {
  if (slotId.includes('_side_')) return 'side'
  if (slotId.includes('_center')) return 'center'
  if (slotId.includes('_mob_inline_1') || slotId.endsWith('_mob_inline_1')) return 'leaderboard'
  if (slotId.includes('_mob_')) return 'mobile'
  return 'center'
}

export function slotMediaEntryHasMedia(entry: SlotMediaEntry | undefined): boolean {
  if (!entry) return false
  return Boolean(entry.mediaUrl.trim() || entry.slideUrls.some(Boolean))
}

export function ensureSlotMediaForSelection(
  selectedSlots: string[],
  current: SlotMediaMap,
): SlotMediaMap {
  const next = { ...current }
  for (const id of selectedSlots) {
    if (!next[id]) next[id] = emptySlotMediaEntry()
  }
  for (const id of Object.keys(next)) {
    if (!selectedSlots.includes(id)) delete next[id]
  }
  return next
}

export function mergeSlotMediaWithDefault(
  slotMedia: SlotMediaMap,
  selectedSlots: string[],
  fallback: AdCampaignMediaState,
): SlotMediaMap {
  const merged: SlotMediaMap = {}
  for (const slotId of selectedSlots) {
    const custom = slotMedia[slotId]
    if (slotMediaEntryHasMedia(custom)) {
      merged[slotId] = normalizeSlotMediaEntry(custom!)
      continue
    }
    if (fallback.mediaUrl.trim() || fallback.slideUrls.length) {
      merged[slotId] = {
        mediaUrl: fallback.slideUrls[0] || fallback.mediaUrl,
        mediaType: fallback.mediaType,
        slideUrls: fallback.slideUrls.length ? fallback.slideUrls : [fallback.mediaUrl],
        mediaStyle: { ...fallback.mediaStyle },
      }
    }
  }
  return merged
}

export function slotMediaMapFromCampaign(
  campaign: AdCampaign & { slot_media?: unknown },
): SlotMediaMap {
  return parseSlotMediaMap(campaign.slot_media)
}

function firstSlotMediaEntry(map: SlotMediaMap): SlotMediaEntry | null {
  for (const entry of Object.values(map)) {
    if (slotMediaEntryHasMedia(entry)) return normalizeSlotMediaEntry(entry!)
  }
  return null
}

function mediaStateFromSlotEntry(entry: SlotMediaEntry): AdCampaignMediaState {
  const norm = normalizeSlotMediaEntry(entry)
  return {
    mediaUrl: norm.slideUrls[0] || norm.mediaUrl,
    slideUrls: norm.slideUrls.length ? norm.slideUrls : [norm.mediaUrl],
    mediaStyle: norm.mediaStyle,
    mediaType: norm.mediaType,
  }
}

export function mediaStateFromCampaignAndSlot(
  campaign: AdCampaign & { slot_media?: unknown; media_style?: unknown },
  slotId?: string,
): AdCampaignMediaState {
  const map = parseSlotMediaMap(campaign.slot_media)

  if (slotId) {
    const entry = map[slotId]
    if (slotMediaEntryHasMedia(entry)) {
      return mediaStateFromSlotEntry(entry!)
    }

    const granularKeys = Object.keys(map).filter((key) => slotMediaEntryHasMedia(map[key]))
    if (granularKeys.length > 0 || !campaignOwnsSlot(campaign, slotId)) {
      return emptyCampaignMediaState()
    }

    return mediaStateFromCampaign(campaign)
  }

  const anySlot = firstSlotMediaEntry(map)
  if (anySlot) {
    return mediaStateFromSlotEntry(anySlot)
  }

  return mediaStateFromCampaign(campaign)
}

export function campaignWithSlotMedia(
  campaign: AdCampaign & { slot_media?: unknown; media_style?: unknown },
  slotId?: string,
): AdCampaign & { media_style?: unknown } {
  if (!slotId) return campaign
  const state = mediaStateFromCampaignAndSlot(campaign, slotId)
  if (!state.mediaUrl.trim() && !state.slideUrls.length) return campaign
  const fields = buildCampaignMediaFields(state)
  return {
    ...campaign,
    image_url: fields.image_url,
    media_url: fields.media_url,
    media_type: fields.media_type,
    media_style: fields.media_style,
  }
}

export function buildSlotMediaPayload(
  slotMedia: SlotMediaMap,
  selectedSlots: string[],
  fallback: AdCampaignMediaState,
): Record<string, unknown> {
  const merged = mergeSlotMediaWithDefault(slotMedia, selectedSlots, fallback)
  const payload: Record<string, unknown> = {}
  for (const [slotId, entry] of Object.entries(merged)) {
    if (!slotMediaEntryHasMedia(entry)) continue
    const norm = normalizeSlotMediaEntry(entry)
    payload[slotId] = {
      mediaUrl: norm.mediaUrl,
      mediaType: norm.mediaType,
      slideUrls: norm.slideUrls,
      mediaStyle: buildMediaStylePayload(norm.mediaStyle, norm.slideUrls),
    }
  }
  return payload
}

export function buildFullCampaignMediaFields(
  slotMedia: SlotMediaMap,
  selectedSlots: string[],
  fallback: AdCampaignMediaState,
) {
  const merged = mergeSlotMediaWithDefault(slotMedia, selectedSlots, fallback)
  const firstSlot = selectedSlots[0]
  const firstEntry = firstSlot ? merged[firstSlot] : undefined
  const baseState: AdCampaignMediaState =
    slotMediaEntryHasMedia(firstEntry)
      ? {
          mediaUrl: firstEntry!.slideUrls[0] || firstEntry!.mediaUrl,
          slideUrls: firstEntry!.slideUrls,
          mediaStyle: firstEntry!.mediaStyle,
          mediaType: firstEntry!.mediaType,
        }
      : fallback

  return {
    ...buildCampaignMediaFields(baseState),
    slot_media: buildSlotMediaPayload(slotMedia, selectedSlots, fallback),
  }
}

export function selectedSlotsHaveMedia(
  slotMedia: SlotMediaMap,
  selectedSlots: string[],
  fallback: AdCampaignMediaState,
): boolean {
  if (fallback.mediaUrl.trim() || fallback.slideUrls.length) return true
  return selectedSlots.some((id) => slotMediaEntryHasMedia(slotMedia[id]))
}

export function sortSlotsForEditor(slots: string[]): string[] {
  const order = (id: string) => {
    const def = getSlotDefinition(id)
    const page = def?.page ?? 'default'
    const pageIdx: Record<AdPageKey, number> = {
      home: 0,
      listings: 1,
      professionals: 2,
      default: 3,
    }
    const zone = def?.zone ?? 'mob_inline'
    const zoneIdx: Record<string, number> = {
      side_left: 0,
      side_right: 1,
      center: 2,
      mob_leaderboard: 3,
      mob_inline: 4,
    }
    const row = def?.row ?? 0
    return (pageIdx[page] ?? 9) * 1000 + (zoneIdx[zone] ?? 9) * 10 + row
  }
  return [...slots].sort((a, b) => order(a) - order(b))
}

export function formatSlotEditorTitle(
  slotId: string,
  t: (key: import('./i18n').TranslationKey) => string,
): string {
  return formatSlotLabel(slotId, t)
}

export function overlayVariantForSlot(slotId: string) {
  const layout = layoutKeyFromSlotId(slotId)
  const variants = {
    side: 'stack',
    center: 'center',
    leaderboard: 'leaderboard',
    mobile: 'mobile-inline',
  } as const
  return variants[layout]
}
