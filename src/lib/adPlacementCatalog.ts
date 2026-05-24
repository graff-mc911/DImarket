import type { TranslationKey } from './i18n'
import {
  AD_PAGE_KEYS,
  centerSlotId,
  mobileInlineSlotId,
  sideSlotId,
  type AdPageKey,
  type InlineIndex,
  type SideIndex,
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
  row?: SideIndex | InlineIndex
  viewport: 'desktop' | 'mobile' | 'all'
  /** Маршрути, де слот реально рендериться */
  routes: string[]
  implemented: boolean
  labelKey: TranslationKey
  hintKey: TranslationKey
}

const SIDE_ROWS: SideIndex[] = [1, 2, 3, 4]
const INLINE_ROWS: InlineIndex[] = [1, 2, 3, 4]

function sideSlots(page: AdPageKey, routes: string[]): AdPlacementSlotDef[] {
  const out: AdPlacementSlotDef[] = []
  for (const row of SIDE_ROWS) {
    for (const side of ['left', 'right'] as const) {
      const id = sideSlotId(page, side, row)
      out.push({
        id,
        page,
        zone: side === 'left' ? 'side_left' : 'side_right',
        row,
        viewport: 'desktop',
        routes,
        implemented: true,
        labelKey: 'advertising.slots.sideRow',
        hintKey: side === 'left' ? 'advertising.catalog.sideLeftHint' : 'advertising.catalog.sideRightHint',
      })
    }
  }
  return out
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

/** Єдиний каталог — лише слоти, які реально є в UI */
export const AD_PLACEMENT_CATALOG: AdPlacementSlotDef[] = [
  ...sideSlots('home', ['/']),
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
  ...mobileInlineSlots('home', ['/'], [1, 2, 3, 4]),

  ...sideSlots('listings', ['/listings', '/vacancies', '/sell-rent']),
  ...mobileInlineSlots('listings', ['/listings', '/vacancies', '/sell-rent'], [1, 2, 3, 4]),

  ...sideSlots('professionals', ['/professionals']),
  ...mobileInlineSlots('professionals', ['/professionals'], [1, 2]),

  ...sideSlots('default', [
    '/contact',
    '/advertising',
    '/advertise',
    '/login',
    '/register',
    '/settings',
    '/profile',
    '/create-ad',
    '/dashboard',
    '/messages',
    '/favorites',
    '/my-listings',
    '/boost',
    '/checkout',
  ]),
  ...mobileInlineSlots('default', ['/create-ad'], [1, 2]),
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
        left: pageSlots.filter((s) => s.zone === 'side_left').map((s) => s.id),
        right: pageSlots.filter((s) => s.zone === 'side_right').map((s) => s.id),
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
  return valid.length > 0 ? valid : [sideSlotId('home', 'right', 1)]
}
