/** Типи банера для окремого кадрування в редакторі */
export type AdBannerLayoutKey = 'center' | 'leaderboard' | 'mobile'

/** Legacy keys kept only for reading old media_style JSON / overlay variants. */
export type AdBannerLayoutKeyLegacy = AdBannerLayoutKey | 'side'

export type AdOverlayVariantKey =
  | 'stack'
  | 'legacy'
  | 'legacy-compact'
  | 'center'
  | 'leaderboard'
  | 'mobile-sticky'
  | 'mobile-inline'

export const AD_BANNER_LAYOUT_KEYS: AdBannerLayoutKey[] = [
  'center',
  'leaderboard',
  'mobile',
]

export const AD_BANNER_LAYOUT_META: Record<
  AdBannerLayoutKeyLegacy,
  { aspectClass: string; overlayVariant: AdOverlayVariantKey }
> = {
  side: {
    // Retired — map preview to center proportions if old prefs are opened.
    aspectClass: 'aspect-[2.4/1] min-h-[7.5rem] max-h-[10rem]',
    overlayVariant: 'center',
  },
  center: {
    aspectClass: 'aspect-[2.4/1] min-h-[7.5rem] max-h-[10rem]',
    overlayVariant: 'center',
  },
  leaderboard: {
    aspectClass: 'aspect-[4/1] min-h-[5rem] max-h-[8rem]',
    overlayVariant: 'leaderboard',
  },
  mobile: {
    aspectClass: 'aspect-[2.8/1] min-h-[5.5rem] max-h-[8rem]',
    overlayVariant: 'mobile-inline',
  },
}

export function layoutKeyFromOverlayVariant(variant: AdOverlayVariantKey): AdBannerLayoutKey {
  switch (variant) {
    case 'stack':
    case 'legacy':
    case 'legacy-compact':
      return 'center'
    case 'leaderboard':
      return 'leaderboard'
    case 'mobile-sticky':
    case 'mobile-inline':
      return 'mobile'
    case 'center':
    default:
      return 'center'
  }
}
