import type { CSSProperties } from 'react'
import {
  AD_SLOT_CONTAINER_SPECS,
  containerSpecForSlotId,
  type AdSlotContainerSpec,
} from './adSlotContainerSpecs'

export type AdOverlayVariantKey =
  | 'stack'
  | 'legacy'
  | 'legacy-compact'
  | 'center'
  | 'leaderboard'
  | 'mobile-sticky'
  | 'mobile-inline'

export function containerSpecForOverlayVariant(
  variant: AdOverlayVariantKey,
): AdSlotContainerSpec | null {
  switch (variant) {
    case 'stack':
    case 'legacy':
    case 'legacy-compact':
      return AD_SLOT_CONTAINER_SPECS.side_left
    case 'center':
      return AD_SLOT_CONTAINER_SPECS.center
    case 'leaderboard':
      return AD_SLOT_CONTAINER_SPECS.mob_leaderboard
    case 'mobile-sticky':
    case 'mobile-inline':
      return AD_SLOT_CONTAINER_SPECS.mob_inline
    default:
      return null
  }
}

export function resolveAdSlotSpec(
  slotId?: string,
  variant?: AdOverlayVariantKey,
): AdSlotContainerSpec | null {
  if (slotId) return containerSpecForSlotId(slotId)
  if (variant) return containerSpecForOverlayVariant(variant)
  return null
}

export function adSlotShellStyle(
  spec: AdSlotContainerSpec,
  variant: AdOverlayVariantKey,
): CSSProperties {
  if (variant === 'stack') {
    return {
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      minHeight: 0,
    }
  }

  const isCenter = variant === 'center'
  const isFullBleed = variant === 'leaderboard' || variant === 'mobile-inline' || variant === 'mobile-sticky'

  return {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: isCenter ? spec.containerW : isFullBleed ? '100%' : spec.containerW,
    height: spec.containerH,
    maxHeight: spec.containerH,
    minHeight: spec.containerH,
  }
}

export function adSlotImageStyle(
  spec: AdSlotContainerSpec,
  variant?: AdOverlayVariantKey,
): CSSProperties | undefined {
  if (variant === 'stack') return undefined

  return {
    width: '100%',
    height: spec.imageH,
    maxHeight: spec.imageH,
    minHeight: spec.imageH,
    flexShrink: 0,
  }
}

/** Масштаб слота на wireframe (колонка вужча за реальні 248px) */
export function wireframeSlotHeightPx(containerH: number, columnWidthPx = 72): number {
  const scale = columnWidthPx / AD_SLOT_CONTAINER_SPECS.side_left.containerW
  return Math.max(32, Math.round(containerH * scale))
}
