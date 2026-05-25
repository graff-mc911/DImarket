/** Типи банера для окремого кадрування в редакторі */
export type AdBannerLayoutKey = 'side' | 'center' | 'leaderboard' | 'mobile'

export type AdOverlayVariantKey =
  | 'stack'
  | 'legacy'
  | 'legacy-compact'
  | 'center'
  | 'leaderboard'
  | 'mobile-sticky'
  | 'mobile-inline'

export const AD_BANNER_LAYOUT_KEYS: AdBannerLayoutKey[] = [
  'side',
  'center',
  'leaderboard',
  'mobile',
]

export const AD_BANNER_LAYOUT_META: Record<
  AdBannerLayoutKey,
  { aspectClass: string; overlayVariant: AdOverlayVariantKey }
> = {
  side: {
    aspectClass: 'aspect-[5/7] min-h-[8rem] max-h-[11rem] w-full max-w-[10rem] mx-auto',
    overlayVariant: 'stack',
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
      return 'side'
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
