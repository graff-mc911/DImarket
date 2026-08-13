/**
 * Фіксовані розміри рекламних слотів — однакові на всіх сторінках.
 * Не змінюйте довільно: e2e і макет /advertising орієнтуються на ці значення.
 */

/** Центральний блок на головній («Партнерські компанії») */
export const AD_CENTER_MIN_PX = 220
export const AD_CENTER_MIN_MD_PX = 248

/** Мобільний inline між секціями (компактний; лінійний leaderboard — окремо) */
export const AD_MOBILE_INLINE_MIN_PX = 80
export const AD_MOBILE_INLINE_IMAGE_PX = 68

/** Широкий лінійний банер — та сама висота, що й «Партнерські компанії» */
export const AD_LEADERBOARD_DISPLAY_H_PX = AD_CENTER_MIN_MD_PX
export const AD_LEADERBOARD_MAX_PX = 600
export const AD_LEADERBOARD_ASPECT = '3 / 1' as const

/** Прозора панель тексту під зображенням — висота лише за вмістом */
export const AD_TEXT_PANEL_CLASS =
  'shrink-0 border-t border-[rgba(219,148,94,0.12)] bg-transparent'

export const adSlotTailwind = {
  center: 'h-auto w-full max-w-full',
  leaderboard: 'flex w-full min-w-0 max-w-full flex-col overflow-hidden',
  mobileInline: 'flex w-full min-w-0 max-w-full flex-col overflow-hidden',
} as const
