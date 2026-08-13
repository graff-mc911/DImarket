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
      // Side rails retired — fall back to center sizing if any leftover UI asks.
      return AD_SLOT_CONTAINER_SPECS.center
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

  if (variant === 'leaderboard') {
    return {
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100%',
      height: spec.containerH,
      maxHeight: spec.containerH,
      minHeight: spec.containerH,
    }
  }

  if (variant === 'mobile-inline' || variant === 'mobile-sticky') {
    return {
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100%',
      minHeight: 0,
      height: 'auto',
    }
  }

  if (variant === 'center') {
    return {
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: spec.containerW,
      minHeight: 0,
      height: 'auto',
      marginInline: 'auto',
    }
  }

  return {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: isCenter ? spec.containerW : spec.containerW,
    height: spec.containerH,
    maxHeight: spec.containerH,
    minHeight: spec.containerH,
  }
}

export function adSlotImageStyle(
  spec: AdSlotContainerSpec,
  variant?: AdOverlayVariantKey,
): CSSProperties | undefined {
  if (variant === 'stack') {
    return {
      width: '100%',
      height: spec.imageH,
      maxHeight: spec.imageH,
      minHeight: spec.imageH,
      flexShrink: 0,
    }
  }

  if (variant === 'leaderboard') {
    return {
      width: '100%',
      height: spec.imageH,
      maxHeight: spec.imageH,
      minHeight: spec.imageH,
      flexShrink: 0,
      overflow: 'hidden',
    }
  }

  if (variant === 'mobile-inline' || variant === 'mobile-sticky') {
    return undefined
  }

  if (variant === 'center') {
    return {
      width: '100%',
      height: spec.imageH,
      maxHeight: spec.imageH,
      minHeight: spec.imageH,
      flexShrink: 0,
      overflow: 'hidden',
    }
  }

  return {
    width: '100%',
    height: spec.imageH,
    maxHeight: spec.imageH,
    minHeight: spec.imageH,
    flexShrink: 0,
  }
}

/** Масштаб слота на wireframe */
export function wireframeSlotHeightPx(containerH: number, columnWidthPx = 200): number {
  const scale = columnWidthPx / AD_SLOT_CONTAINER_SPECS.center.containerW
  return Math.max(32, Math.round(containerH * scale))
}

/** Масштаб inline-слота на mobile wireframe (колонка ~200px); лінійний — aspect */
export function wireframeMobileInlineHeightPx(containerH: number, columnWidthPx = 200): number {
  return Math.max(24, Math.round(wireframeSlotHeightPx(containerH, columnWidthPx) / 2))
}

/** Широкі банери — пропорції як на сайті (не фіксована висота в px) */
export function wireframeWideAspectClass(
  zone: 'center' | 'mob_leaderboard' | 'mob_inline',
): string {
  if (zone === 'center') return 'aspect-[720/248] min-h-[72px] w-full'
  if (zone === 'mob_leaderboard') return 'aspect-[4/1] min-h-[48px] w-full'
  return ''
}
