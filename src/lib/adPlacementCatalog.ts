import type { TranslationKey } from './i18n'
import {
  AD_PAGE_KEYS,
  centerSlotId,
  mobileInlineSlotId,
  type AdPageKey,
  type InlineIndex,
} from './adPlacementSlots'

export type SlotZone =
  | 'side_left'
  | 'side_right'
  | 'center'
  | 'mob_leaderboard'
  | 'mob_inline'

export type AdPlacementSlotDef = {
  id: string
  page: AdPageKey
  zone: SlotZone
  row?: InlineIndex
  viewport: 'desktop' | 'mobile' | 'all'
  /** Маршрути, де слот реально рендериться */
  routes: string[]
  implemented: boolean
  labelKey: TranslationKey
  hintKey: TranslationKey
}

function mobileInlineSlots(page: AdPageKey, routes: string[], rows: InlineIndex[]): AdPlacementSlotDef[] {
  return rows.map((row) => {
    const id = mobileInlineSlotId(page, row)
    const zone: SlotZone = row === 1 ? 'mob_leaderboard' : 'mob_inline'
    return {
      id,
      page,
      zone,
      row,
      viewport: row === 1 ? 'all' : 'mobile',
      routes,
      implemented: true,
      labelKey: row === 1 ? 'advertising.catalog.leaderboard' : 'advertising.slots.mobInlinePrefix',
      hintKey:
        row === 1
          ? 'advertising.catalog.leaderboardHint'
          : 'advertising.catalog.inlineHint',
    }
  })
}

/**
 * Каталог без бокових рейок (як OLX/Avito: центр / топ + inline у стрічці + detail).
 * Продаємо лише слоти, які реально змонтовані в UI.
 */
export const AD_PLACEMENT_CATALOG: AdPlacementSlotDef[] = [
  {
    id: centerSlotId('home'),
    page: 'home',
    zone: 'center',
    viewport: 'all',
    routes: ['/'],
    implemented: true,
    labelKey: 'advertising.slots.center',
    hintKey: 'advertising.catalog.centerHint',
  },
  ...mobileInlineSlots('home', ['/'], [1]),

  ...mobileInlineSlots('listings', ['/listings', '/vacancies', '/sell-rent'], [1, 2]),

  ...mobileInlineSlots('professionals', ['/professionals'], [1, 2]),

  /** Картка оголошення / фахівця — один широкий слот */
  ...mobileInlineSlots('default', ['/listing/', '/professional/'], [1]),
]

const CATALOG_BY_ID = new Map(AD_PLACEMENT_CATALOG.map((s) => [s.id, s]))

export function getSlotDefinition(slotId: string): AdPlacementSlotDef | undefined {
  return CATALOG_BY_ID.get(slotId)
}

export function getImplementedSlotIds(): string[] {
  return AD_PLACEMENT_CATALOG.filter((s) => s.implemented).map((s) => s.id)
}

export function slotGroupsForPurchasePicker(): {
  page: AdPageKey
  desktop: { left: string[]; right: string[]; center: string | null }
  mobile: { inline: string[] }
}[] {
  return AD_PAGE_KEYS.map((page) => {
    const pageSlots = AD_PLACEMENT_CATALOG.filter((s) => s.page === page && s.implemented)
    return {
      page,
      desktop: {
        left: [],
        right: [],
        center: pageSlots.find((s) => s.zone === 'center')?.id ?? null,
      },
      mobile: {
        inline: pageSlots
          .filter((s) => s.zone === 'mob_leaderboard' || s.zone === 'mob_inline')
          .map((s) => s.id),
      },
    }
  })
}

/** Слоти, які не в каталозі (старі покупки) — лишаємо в кампанії, але не продаємо */
export function sanitizeSlotsForPurchase(selected: string[]): string[] {
  const allowed = new Set(getImplementedSlotIds())
  const valid = selected.filter((id) => allowed.has(id))
  return valid.length > 0 ? valid : [centerSlotId('home')]
}

export function isGranularSlotId(id: string): boolean {
  return id.includes('_side_') || id.includes('_center') || id.includes('_mob_')
}

export function sideSlotIdsForPage(page: AdPageKey): string[] {
  return AD_PLACEMENT_CATALOG.filter((s) => s.page === page && (s.zone === 'side_left' || s.zone === 'side_right')).map(
    (s) => s.id,
  )
}

export function mobileSlotIdsForPage(page: AdPageKey): string[] {
  return AD_PLACEMENT_CATALOG.filter(
    (s) => s.page === page && (s.zone === 'mob_leaderboard' || s.zone === 'mob_inline'),
  ).map((s) => s.id)
}

export function centerSlotIdsForPage(page: AdPageKey): string[] {
  return AD_PLACEMENT_CATALOG.filter((s) => s.page === page && s.zone === 'center').map((s) => s.id)
}
