import type { SlotZone } from './adPlacementCatalog'
import {
  AD_CENTER_MIN_MD_PX,
  AD_LEADERBOARD_ASPECT,
  AD_LEADERBOARD_DISPLAY_H_PX,
  AD_MOBILE_INLINE_IMAGE_PX,
  AD_MOBILE_INLINE_MIN_PX,
} from './adSlotLayout'

export type AdSlotContainerSpec = {
  zone: SlotZone
  containerW: number
  containerH: number
  /** Безпечна зона зображення в контейнері (px) */
  imageW: number
  imageH: number
  uploadW: number
  uploadH: number
  aspect: string
}

export const AD_SLOT_CONTAINER_SPECS: Record<SlotZone, AdSlotContainerSpec> = {
  center: {
    zone: 'center',
    containerW: 720,
    containerH: AD_CENTER_MIN_MD_PX,
    imageW: 720,
    imageH: AD_CENTER_MIN_MD_PX,
    uploadW: 960,
    uploadH: 400,
    aspect: '2.4∶1',
  },
  mob_leaderboard: {
    zone: 'mob_leaderboard',
    containerW: 390,
    containerH: AD_LEADERBOARD_DISPLAY_H_PX,
    imageW: 1200,
    imageH: AD_LEADERBOARD_DISPLAY_H_PX,
    uploadW: 1200,
    uploadH: AD_LEADERBOARD_DISPLAY_H_PX,
    aspect: AD_LEADERBOARD_ASPECT.replace(' / ', '∶'),
  },
  mob_inline: {
    zone: 'mob_inline',
    containerW: 390,
    containerH: AD_MOBILE_INLINE_MIN_PX,
    imageW: 390,
    imageH: AD_MOBILE_INLINE_IMAGE_PX,
    uploadW: 840,
    uploadH: 300,
    aspect: '2.8∶1',
  },
}

export function containerSpecForZone(zone: SlotZone): AdSlotContainerSpec {
  return AD_SLOT_CONTAINER_SPECS[zone]
}

export function containerSpecForSlotId(slotId: string, zone?: SlotZone): AdSlotContainerSpec | null {
  if (zone) return containerSpecForZone(zone)
  // Side slots retired — no container for them.
  if (slotId.includes('_side_')) return null
  if (slotId.includes('_center')) return AD_SLOT_CONTAINER_SPECS.center
  if (slotId.includes('_mob_inline_1') || slotId.endsWith('_mob_inline_1'))
    return AD_SLOT_CONTAINER_SPECS.mob_leaderboard
  if (slotId.includes('_mob_inline') || slotId.includes('_mob_'))
    return AD_SLOT_CONTAINER_SPECS.mob_inline
  return null
}

/** Короткий підпис для слота на схемі: «248×170». */
export function formatSlotContainerShort(spec: AdSlotContainerSpec): string {
  return `${spec.containerW}×${spec.containerH}`
}

/**
 * Розмір на схемі «Де показувати рекламу» — синхронізовано з applyAdSlotCssVars / index.css.
 */
export function wireframeSlotSizeShort(spec: AdSlotContainerSpec): string {
  switch (spec.zone) {
    case 'center':
      return `${spec.containerW}×${spec.imageH}`
    case 'mob_leaderboard':
      return `100%×${spec.containerH}`
    case 'mob_inline':
      return `100%×${spec.containerH}`
    default:
      return formatSlotContainerShort(spec)
  }
}

export function wireframeSlotFileSizeShort(spec: AdSlotContainerSpec): string {
  return `${spec.imageW}×${spec.imageH}`
}

/** Додатковий рядок: зона фото (px), якщо менша за контейнер. */
export function wireframeSlotImageHeightPx(spec: AdSlotContainerSpec): number | null {
  if (spec.zone === 'mob_inline' && spec.imageH < spec.containerH) {
    return spec.imageH
  }
  return null
}

/** Підказка при наведенні / title. */
export function formatSlotContainerTooltip(
  spec: AdSlotContainerSpec,
  formatLine: (params: {
    cw: number
    ch: number
    iw: number
    ih: number
    uw: number
    uh: number
    aspect: string
  }) => string,
): string {
  return formatLine({
    cw: spec.containerW,
    ch: spec.containerH,
    iw: spec.imageW,
    ih: spec.imageH,
    uw: spec.uploadW,
    uh: spec.uploadH,
    aspect: spec.aspect,
  })
}

export function wireframeSlotSizeTitle(spec: AdSlotContainerSpec): string {
  return `Container ${spec.containerW}×${spec.containerH} · upload ${spec.uploadW}×${spec.uploadH} (${spec.aspect})`
}

/** Чи є в контейнері «лист» (зображення менш за контейнер по висоті). */
export function slotHasImageLetterbox(spec: AdSlotContainerSpec): boolean {
  if (spec.zone === 'mob_inline' && spec.imageH < spec.containerH) {
    return true
  }
  return false
}
