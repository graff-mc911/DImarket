import type { SlotZone } from './adPlacementCatalog'
import {
  AD_CENTER_MIN_MD_PX,
  AD_CENTER_MIN_PX,
  AD_LEADERBOARD_ASPECT,
  AD_LEADERBOARD_DISPLAY_H_PX,
  AD_MOBILE_INLINE_IMAGE_PX,
  AD_MOBILE_INLINE_MIN_PX,
  AD_SIDE_RAIL_WIDTH_PX,
  AD_SIDE_STACK_GAP_PX,
  AD_SIDE_STACK_ROWS,
} from './adSlotLayout'

/** Орієнтир для розрахунку висоти бокового ряду (xl, viewport ~900px). */
const SIDE_REF_VIEWPORT_H = 900
const SIDE_REF_HEADER_PX = 168

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

/** Висота одного бокового ряду (4 слоти в sticky-колонці). */
export function adSideStackRowHeightPx(railWidthPx = AD_SIDE_RAIL_WIDTH_PX.xl): number {
  const stickyH = SIDE_REF_VIEWPORT_H - SIDE_REF_HEADER_PX
  const inner =
    stickyH - 16 - AD_SIDE_STACK_GAP_PX * (AD_SIDE_STACK_ROWS - 1)
  return Math.round(inner / AD_SIDE_STACK_ROWS)
}

const sideRowH = adSideStackRowHeightPx()
const sideRailW = AD_SIDE_RAIL_WIDTH_PX.xl
/** ~28px під заголовок + один рядок опису */
const sideImageH = Math.max(88, sideRowH - 28)

const SIDE_SPEC: AdSlotContainerSpec = {
  zone: 'side_left',
  containerW: sideRailW,
  containerH: sideRowH,
  imageW: sideRailW,
  imageH: sideImageH,
  uploadW: 500,
  uploadH: 700,
  aspect: '5∶7',
}

export const AD_SLOT_CONTAINER_SPECS: Record<SlotZone, AdSlotContainerSpec> = {
  side_left: { ...SIDE_SPEC, zone: 'side_left' },
  side_right: { ...SIDE_SPEC, zone: 'side_right' },
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
    uploadH: 300,
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
  if (slotId.includes('_side_l')) return AD_SLOT_CONTAINER_SPECS.side_left
  if (slotId.includes('_side_r')) return AD_SLOT_CONTAINER_SPECS.side_right
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
 * Ширина 100% — слот займає всю колонку контенту; бокові — орієнтир при viewport ~900px.
 */
export function wireframeSlotSizeShort(spec: AdSlotContainerSpec): string {
  switch (spec.zone) {
    case 'side_left':
    case 'side_right':
      return `${spec.containerW}×~${spec.containerH}`
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

/** Розмір файлу для макета — зона зображення (те, що реально показується). */
export function wireframeSlotFileSizeShort(spec: AdSlotContainerSpec): string {
  return `${spec.imageW}×${spec.imageH}`
}

/** Додатковий рядок: зона фото (px), якщо менша за контейнер. */
export function wireframeSlotImageHeightPx(spec: AdSlotContainerSpec): number | null {
  if (spec.zone === 'side_left' || spec.zone === 'side_right') {
    return spec.imageH < spec.containerH ? spec.imageH : null
  }
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
