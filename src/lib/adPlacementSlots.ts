import type { AdPlacement } from './adCampaigns'
import type { TranslationKey } from './i18n'

/** Сторінки, для яких можна купити окремі слоти */
export type AdPageKey = 'home' | 'listings' | 'professionals' | 'default'

export const AD_PAGE_KEYS: AdPageKey[] = ['home', 'listings', 'professionals', 'default']

export const PAGE_LABEL_KEYS: Record<AdPageKey, TranslationKey> = {
  home: 'advertising.slots.page.home',
  listings: 'advertising.slots.page.listings',
  professionals: 'advertising.slots.page.professionals',
  default: 'advertising.slots.page.default',
}

const INLINE_INDEXES = [1, 2, 3, 4] as const

export type InlineIndex = (typeof INLINE_INDEXES)[number]

/** Retired side / left / right banner slot IDs (never sell or render). */
export function isSideSlotId(id: string): boolean {
  const s = (id || '').toLowerCase()
  return (
    s.includes('_side_') ||
    s === 'side_left' ||
    s === 'side_right' ||
    s === 'sidebar'
  )
}

export function centerSlotId(page: AdPageKey): string {
  return `${page}_center`
}

export function mobileStickySlotId(page: AdPageKey): string {
  return `${page}_mob_sticky`
}

export function mobileInlineSlotId(page: AdPageKey, index: InlineIndex): string {
  return `${page}_mob_inline_${index}`
}

export function pageKeyFromSideAdsPage(
  page?: 'home' | 'listings' | 'professionals' | 'companies' | 'default',
): AdPageKey {
  if (page === 'home') return 'home'
  if (page === 'listings') return 'listings'
  if (page === 'professionals') return 'professionals'
  return 'default'
}

export function pageKeyFromMobilePage(page?: 'home' | 'listings' | 'professionals' | 'companies' | 'default'): AdPageKey {
  if (page === 'home') return 'home'
  if (page === 'listings') return 'listings'
  if (page === 'professionals') return 'professionals'
  return 'default'
}

/** Усі гранульовані ID слотів, що ще продаються / рендеряться (без бокових). */
export function allGranularSlotIds(): string[] {
  const ids: string[] = []
  for (const page of AD_PAGE_KEYS) {
    ids.push(centerSlotId(page))
    ids.push(mobileStickySlotId(page))
    for (const i of INLINE_INDEXES) ids.push(mobileInlineSlotId(page, i))
  }
  return ids
}

/** Легасі placement для колонки placement (CHECK у БД) */
export function slotToLegacyPlacement(slotId: string): AdPlacement {
  if (slotId.includes('_mob_sticky')) return 'mobile_sticky'
  if (slotId.includes('_center')) return 'footer'
  if (slotId.includes('_side_')) return 'home' // side retired — never map to sidebar sales
  if (slotId.startsWith('listings')) return 'listings'
  if (slotId.startsWith('professionals')) return 'listings'
  return 'home'
}

/** Легасі-теги, якими ще позначені старі кампанії */
const SLOT_LEGACY_TAGS: Partial<Record<string, AdPlacement[]>> = {}

function legacyFor(page: AdPageKey, tags: AdPlacement[]): void {
  SLOT_LEGACY_TAGS[centerSlotId(page)] = ['footer', 'home', 'listings', page === 'listings' ? 'listings' : 'home']
  SLOT_LEGACY_TAGS[mobileStickySlotId(page)] = ['mobile_sticky', 'home', 'listings']
  for (let i = 1; i <= 4; i++) {
    SLOT_LEGACY_TAGS[mobileInlineSlotId(page, i as InlineIndex)] = [
      'mobile_sticky',
      'listings',
      'home',
    ]
  }
  void tags
}

for (const page of AD_PAGE_KEYS) {
  const base: AdPlacement[] =
    page === 'home'
      ? ['home', 'footer', 'mobile_sticky']
      : page === 'listings'
        ? ['listings', 'home', 'mobile_sticky']
        : page === 'professionals'
          ? ['listings', 'home', 'mobile_sticky']
          : ['home', 'listings', 'footer', 'mobile_sticky']
  legacyFor(page, base)
}

export function getSlotLegacyTags(slotId: string): AdPlacement[] {
  if (isSideSlotId(slotId)) return []
  return SLOT_LEGACY_TAGS[slotId] ?? ['home', 'listings']
}

export const SLOT_LABEL_KEYS: Record<string, TranslationKey> = {}

for (const page of AD_PAGE_KEYS) {
  SLOT_LABEL_KEYS[centerSlotId(page)] = 'advertising.slots.center'
  SLOT_LABEL_KEYS[mobileStickySlotId(page)] = 'advertising.slots.mobSticky'
  for (const i of INLINE_INDEXES) {
    SLOT_LABEL_KEYS[mobileInlineSlotId(page, i)] = 'advertising.slots.mobInlinePrefix'
  }
}

export type SlotPickerGroup = {
  page: AdPageKey
  desktop: {
    left: string[]
    right: string[]
    center: string
  }
  mobile: {
    sticky: string
    inline: string[]
  }
}

export function slotGroupsForPicker(): SlotPickerGroup[] {
  return AD_PAGE_KEYS.map((page) => ({
    page,
    desktop: {
      left: [],
      right: [],
      center: centerSlotId(page),
    },
    mobile: {
      sticky: mobileStickySlotId(page),
      inline: INLINE_INDEXES.map((i) => mobileInlineSlotId(page, i)),
    },
  }))
}

/** Міграція старого вибору (home, sidebar, …) у гранульовані слоти — без side slots. */
export function expandLegacyPlacements(legacy: string[]): string[] {
  const out = new Set<string>()
  for (const tag of legacy) {
    if (isSideSlotId(tag)) continue
    if (tag.includes('_center') || tag.includes('_mob_')) {
      out.add(tag)
      continue
    }

    // Retired sidebar / side_* — do not expand into center/mobile (await owner migration).
    if (tag === 'sidebar') continue

    const pages: AdPageKey[] =
      tag === 'home'
        ? ['home']
        : tag === 'listings'
          ? ['listings']
          : tag === 'footer' || tag === 'mobile_sticky'
            ? [...AD_PAGE_KEYS]
            : ['default']

    for (const page of pages) {
      if (tag === 'footer' || tag === 'home') {
        out.add(centerSlotId(page))
      }
      if (tag === 'home' || tag === 'listings' || tag === 'mobile_sticky') {
        out.add(mobileInlineSlotId(page, 1))
      }
    }
  }
  if (out.size === 0) out.add(centerSlotId('home'))
  return [...out]
}

const INLINE_ROW_KEYS: Record<string, TranslationKey> = {
  '1': 'advertising.slots.inline1',
  '2': 'advertising.slots.inline2',
  '3': 'advertising.slots.inline3',
  '4': 'advertising.slots.inline4',
}

export function formatSlotLabel(slotId: string, t: (key: TranslationKey) => string): string {
  const page = AD_PAGE_KEYS.find((p) => slotId.startsWith(p + '_')) ?? 'default'
  const pageLabel = t(PAGE_LABEL_KEYS[page])

  if (isSideSlotId(slotId)) {
    return `${pageLabel} · (retired side slot)`
  }
  if (slotId.endsWith('_center')) {
    return `${pageLabel} · ${t('advertising.slots.center')}`
  }
  if (slotId.endsWith('_mob_sticky')) {
    return `${pageLabel} · ${t('advertising.slots.mobSticky')}`
  }
  const inlineMatch = slotId.match(/_mob_inline_(\d)$/)
  if (inlineMatch) {
    const row = INLINE_ROW_KEYS[inlineMatch[1]] ? t(INLINE_ROW_KEYS[inlineMatch[1]]) : inlineMatch[1]
    return `${pageLabel} · ${t('advertising.slots.mobInlinePrefix')} ${row}`
  }
  return slotId
}
