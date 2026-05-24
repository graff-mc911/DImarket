/**
 * Фіксовані розміри рекламних слотів — однакові на всіх сторінках.
 * Не змінюйте довільно: e2e і макет /advertising орієнтуються на ці значення.
 */
export const AD_SIDE_STACK_ROWS = 4

/** Боковий слот 1–4 (stack) */
export const AD_SIDE_STACK_SLOT_PX = 148

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

export const adSlotTailwind = {
  sideStackSlot: 'h-[9.25rem] w-full shrink-0',
  sideLegacy: 'min-h-[12.375rem] w-[90%] max-w-full mx-auto',
  sideLegacyCompact: 'min-h-[6.75rem] w-[90%] max-w-full mx-auto',
  center: 'min-h-[13.75rem] w-full max-w-full md:min-h-[15.5rem]',
  mobileInline: 'min-h-[6.75rem] w-full',
  leaderboard: 'aspect-[4/1] w-full max-h-[300px] min-h-[4.5rem]',
} as const
