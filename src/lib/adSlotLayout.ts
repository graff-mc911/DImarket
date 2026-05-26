/**
 * Фіксовані розміри рекламних слотів — однакові на всіх сторінках.
 * Не змінюйте довільно: e2e і макет /advertising орієнтуються на ці значення.
 */
export const AD_SIDE_STACK_ROWS = 4

/** Ширина бокової колонки (px), +15% від 200 / 216 / 252 */
export const AD_SIDE_RAIL_WIDTH_PX = {
  lg: 230,
  xl: 248,
  '2xl': 290,
} as const

/** Відступ між 4 боковими блоками = відступ від країв колонки (px) */
export const AD_SIDE_STACK_GAP_PX = 8

/** Sticky-обгортка бокової колонки (висота/відступ — у index.css через --header-offset) */
export const AD_SIDE_RAIL_STICKY_CLASS = 'ad-side-rail__sticky'

export const AD_SIDE_RAIL_STICKY_VIEWPORT_CLASS =
  'ad-side-rail__sticky ad-side-rail__sticky--viewport'

export const AD_SIDE_RAIL_STICKY_FIT_CLASS =
  'ad-side-rail__sticky ad-side-rail__sticky--fit'

/** 4 рівні ряди + однаковий gap і padding */
export const AD_SIDE_STACK_GRID_CLASS =
  'box-border grid h-full w-full grid-rows-4 gap-2 p-2'

/** Комірка сітки — мін. висота щоб ряди 3–4 не зникали при viewport-стеку */
export const AD_SIDE_STACK_CELL_CLASS = 'min-h-[4.5rem] min-w-0 w-full flex-1 overflow-hidden'

/** Класичний боковий банер (legacy) */
export const AD_SIDE_LEGACY_MIN_PX = 198

/** Другий блок у sticky-колонці (legacy-compact) */
export const AD_SIDE_LEGACY_COMPACT_MIN_PX = 108

/** Центральний блок на головній */
export const AD_CENTER_MIN_PX = 220
export const AD_CENTER_MIN_MD_PX = 248

/** Мобільний inline між секціями */
export const AD_MOBILE_INLINE_MIN_PX = 108
export const AD_MOBILE_INLINE_IMAGE_PX = 68

/** Широкий банер (hero / над списком) */
export const AD_LEADERBOARD_MAX_PX = 300
export const AD_LEADERBOARD_ASPECT = '4 / 1' as const

/** Прозора панель тексту під зображенням — висота лише за вмістом */
export const AD_TEXT_PANEL_CLASS =
  'shrink-0 border-t border-[rgba(219,148,94,0.12)] bg-transparent'

export const adSlotTailwind = {
  sideStackSlot: 'h-full w-full',
  sideLegacy: 'h-auto w-[90%] max-w-full mx-auto',
  sideLegacyCompact: 'h-auto w-[90%] max-w-full mx-auto',
  center: 'h-auto w-full max-w-full',
  mobileInline: 'h-auto w-full',
  leaderboard: 'aspect-[4/1] w-full max-h-[300px] min-h-[4.5rem]',
} as const
