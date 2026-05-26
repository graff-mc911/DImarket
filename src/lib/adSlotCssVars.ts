import { AD_SLOT_CONTAINER_SPECS } from './adSlotContainerSpecs'

/** Синхронізація розмірів слотів (схема /advertising) з CSS на сайті */
export function applyAdSlotCssVars(): void {
  const side = AD_SLOT_CONTAINER_SPECS.side_left
  const center = AD_SLOT_CONTAINER_SPECS.center
  const leaderboard = AD_SLOT_CONTAINER_SPECS.mob_leaderboard
  const mobile = AD_SLOT_CONTAINER_SPECS.mob_inline
  const root = document.documentElement

  root.style.setProperty('--ad-side-slot-w', `${side.containerW}px`)
  root.style.setProperty('--ad-side-slot-h', `${side.containerH}px`)
  root.style.setProperty('--ad-side-image-h', `${side.imageH}px`)
  root.style.setProperty('--ad-center-slot-w', `${center.containerW}px`)
  root.style.setProperty('--ad-center-slot-h', `${center.containerH}px`)
  root.style.setProperty('--ad-center-image-h', `${center.imageH}px`)
  root.style.setProperty('--ad-leaderboard-slot-h', `${leaderboard.containerH}px`)
  root.style.setProperty('--ad-mobile-inline-slot-h', `${mobile.containerH}px`)
  root.style.setProperty('--ad-mobile-inline-image-h', `${mobile.imageH}px`)
}
