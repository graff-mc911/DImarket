import type { AdPlacement } from './adCampaigns'
import type { TranslationKey } from './i18n'

/** Сторінки, для яких можна купити окремі слоти */
export type AdPageKey =
  | 'home'
  | 'listings'
  | 'professionals'
  | 'companies'
  | 'categories'
  | 'map'
  | 'estimator'
  | 'default'

export const AD_PAGE_KEYS: AdPageKey[] = [
  'home',
  'listings',
  'professionals',
  'companies',
  'categories',
  'map',
  'estimator',
  'default',
]

export const PAGE_LABEL_KEYS: Record<AdPageKey, TranslationKey> = {
  home: 'advertising.slots.page.home',
  listings: 'advertising.slots.page.listings',
  professionals: 'advertising.slots.page.professionals',
  companies: 'advertising.slots.page.companies',
  categories: 'advertising.slots.page.categories',
  map: 'advertising.slots.page.map',
  estimator: 'advertising.slots.page.estimator',
  default: 'advertising.slots.page.default',
}

const SIDE_INDEXES = [1, 2, 3, 4] as const
const INLINE_INDEXES = [1, 2, 3, 4] as const

export type SideIndex = (typeof SIDE_INDEXES)[number]
export type InlineIndex = (typeof INLINE_INDEXES)[number]

export function sideSlotId(page: AdPageKey, side: 'left' | 'right', index: SideIndex): string {
  return `${page}_side_${side === 'left' ? 'l' : 'r'}${index}`
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

/** Слоти сторінки + домашні, щоб уже куплені банери показувались не лише на `/`. */
export function displaySlotIdsForPage(
  page: AdPageKey,
  inlineIndex: InlineIndex = 1,
): string[] {
  const pageSlots = [centerSlotId(page), mobileInlineSlotId(page, inlineIndex)]
  if (page === 'home') {
    return [...pageSlots, mobileInlineSlotId('home', 1)]
  }
  return [
    ...pageSlots,
    centerSlotId('home'),
    mobileInlineSlotId('home', inlineIndex),
    mobileInlineSlotId('home', 1),
  ]
}

export function pageKeyFromSideAdsPage(page?: AdPageKey): AdPageKey {
  return page && AD_PAGE_KEYS.includes(page) ? page : 'default'
}

export function pageKeyFromMobilePage(page?: AdPageKey): AdPageKey {
  return pageKeyFromSideAdsPage(page)
}

/** Усі гранульовані ID слотів */
export function allGranularSlotIds(): string[] {
  const ids: string[] = []
  for (const page of AD_PAGE_KEYS) {
    for (const side of ['left', 'right'] as const) {
      for (const i of SIDE_INDEXES) ids.push(sideSlotId(page, side, i))
    }
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
  if (slotId.includes('_side_')) return 'sidebar'
  if (slotId.startsWith('listings')) return 'listings'
  if (slotId.startsWith('professionals')) return 'listings'
  if (slotId.startsWith('companies')) return 'listings'
  return 'home'
}

/** Легасі-теги, якими ще позначені старі кампанії */
const SLOT_LEGACY_TAGS: Partial<Record<string, AdPlacement[]>> = {}

function legacyFor(page: AdPageKey, tags: AdPlacement[]): void {
  for (let i = 1; i <= 4; i++) {
    SLOT_LEGACY_TAGS[sideSlotId(page, 'left', i as SideIndex)] = tags
    SLOT_LEGACY_TAGS[sideSlotId(page, 'right', i as SideIndex)] = tags
  }
  SLOT_LEGACY_TAGS[centerSlotId(page)] = ['footer', 'home', 'listings', page === 'listings' ? 'listings' : 'home']
  SLOT_LEGACY_TAGS[mobileStickySlotId(page)] = ['mobile_sticky', 'home', 'listings', 'sidebar']
  for (let i = 1; i <= 4; i++) {
    SLOT_LEGACY_TAGS[mobileInlineSlotId(page, i as InlineIndex)] = [
      'mobile_sticky',
      'sidebar',
      'listings',
      'home',
    ]
  }
}

for (const page of AD_PAGE_KEYS) {
  const base: AdPlacement[] =
    page === 'home'
      ? ['home', 'sidebar', 'footer', 'mobile_sticky']
      : page === 'listings'
        ? ['listings', 'sidebar', 'home', 'mobile_sticky']
        : page === 'professionals' || page === 'companies'
          ? ['listings', 'sidebar', 'home', 'mobile_sticky']
          : ['sidebar', 'home', 'listings', 'footer', 'mobile_sticky']
  legacyFor(page, base)
}

export function getSlotLegacyTags(slotId: string): AdPlacement[] {
  return SLOT_LEGACY_TAGS[slotId] ?? ['home', 'sidebar', 'listings']
}

export const SLOT_LABEL_KEYS: Record<string, TranslationKey> = {}

for (const page of AD_PAGE_KEYS) {
  for (const i of SIDE_INDEXES) {
    SLOT_LABEL_KEYS[sideSlotId(page, 'left', i)] = 'advertising.slots.sideLeft'
    SLOT_LABEL_KEYS[sideSlotId(page, 'right', i)] = 'advertising.slots.sideRight'
  }
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
      left: SIDE_INDEXES.map((i) => sideSlotId(page, 'left', i)),
      right: SIDE_INDEXES.map((i) => sideSlotId(page, 'right', i)),
      center: centerSlotId(page),
    },
    mobile: {
      sticky: mobileStickySlotId(page),
      inline: INLINE_INDEXES.map((i) => mobileInlineSlotId(page, i)),
    },
  }))
}

/** Міграція старого вибору (home, sidebar, …) у гранульовані слоти */
export function expandLegacyPlacements(legacy: string[]): string[] {
  const out = new Set<string>()
  for (const tag of legacy) {
    if (tag.includes('_side_') || tag.includes('_center') || tag.includes('_mob_')) {
      out.add(tag)
      continue
    }

    const pages: AdPageKey[] =
      tag === 'home'
        ? ['home']
        : tag === 'listings'
          ? ['listings']
          : tag === 'sidebar' || tag === 'footer' || tag === 'mobile_sticky'
            ? [...AD_PAGE_KEYS]
            : ['default']

    for (const page of pages) {
      if (tag === 'footer' || tag === 'home') {
        out.add(centerSlotId(page))
      }
      if (tag === 'sidebar' || tag === 'home' || tag === 'listings' || tag === 'mobile_sticky') {
        out.add(mobileInlineSlotId(page, 1))
      }
    }
  }
  if (out.size === 0) out.add(centerSlotId('home'))
  return [...out]
}

const SIDE_ROW_KEYS: Record<string, TranslationKey> = {
  '1': 'advertising.slots.row1',
  '2': 'advertising.slots.row2',
  '3': 'advertising.slots.row3',
  '4': 'advertising.slots.row4',
}

const INLINE_ROW_KEYS: Record<string, TranslationKey> = {
  '1': 'advertising.slots.inline1',
  '2': 'advertising.slots.inline2',
  '3': 'advertising.slots.inline3',
  '4': 'advertising.slots.inline4',
}

export function formatSlotLabel(slotId: string, t: (key: TranslationKey) => string): string {
  const page =
    [...AD_PAGE_KEYS]
      .sort((a, b) => b.length - a.length)
      .find((p) => slotId.startsWith(`${p}_`)) ?? 'default'
  const pageLabel = t(PAGE_LABEL_KEYS[page])

  const sideMatch = slotId.match(/_side_(l|r)(\d)$/)
  if (sideMatch) {
    const side = sideMatch[1] === 'l' ? t('advertising.slots.sideLeft') : t('advertising.slots.sideRight')
    const row = SIDE_ROW_KEYS[sideMatch[2]] ? t(SIDE_ROW_KEYS[sideMatch[2]]) : sideMatch[2]
    return `${pageLabel} · ${side} · ${row}`
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
