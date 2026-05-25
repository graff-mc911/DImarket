/** Налаштування відображення банера (зберігається в ad_campaigns.media_style). */

import type { AdBannerLayoutKey } from './adBannerLayouts'

export type AdMediaFit = 'cover' | 'contain'

export type AdSlideshowTransition =
  | 'fade'
  | 'crossfade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-fade'
  | 'instant'

export type AdMediaSlideshow = {
  urls: string[]
  intervalMs: number
  transition: AdSlideshowTransition
}

/** Кадрування одного зображення (позиція, фільтри). */
export type AdFrameStyle = {
  fit: AdMediaFit
  positionX: number
  positionY: number
  scale: number
  brightness: number
  contrast: number
  saturate: number
}

export type AdMediaStyle = AdFrameStyle & {
  /** Окремі налаштування для типів банера (повний кадр на ключ). */
  byLayout?: Partial<Record<AdBannerLayoutKey, AdFrameStyle>>
  slideshow?: AdMediaSlideshow | null
}

export const DEFAULT_AD_FRAME: AdFrameStyle = {
  fit: 'cover',
  positionX: 50,
  positionY: 50,
  scale: 100,
  brightness: 100,
  contrast: 100,
  saturate: 100,
}

export const DEFAULT_AD_MEDIA_STYLE: AdMediaStyle = {
  ...DEFAULT_AD_FRAME,
  slideshow: null,
}

export const AD_SLIDESHOW_TRANSITIONS: AdSlideshowTransition[] = [
  'fade',
  'crossfade',
  'slide-left',
  'slide-right',
  'slide-up',
  'zoom-fade',
  'instant',
]

export function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function pickFrame(o: Record<string, unknown>): AdFrameStyle {
  return {
    fit: o.fit === 'contain' ? 'contain' : 'cover',
    positionX: clampPercent(Number(o.positionX ?? 50)),
    positionY: clampPercent(Number(o.positionY ?? 50)),
    scale: Math.min(200, Math.max(80, Number(o.scale ?? 100) || 100)),
    brightness: Math.min(150, Math.max(50, Number(o.brightness ?? 100) || 100)),
    contrast: Math.min(150, Math.max(50, Number(o.contrast ?? 100) || 100)),
    saturate: Math.min(150, Math.max(0, Number(o.saturate ?? 100) || 100)),
  }
}

function normalizeTransition(raw: unknown): AdSlideshowTransition {
  if (raw === 'slide' || raw === 'slide-left') return 'slide-left'
  if (raw === 'slide-right') return 'slide-right'
  if (raw === 'slide-up') return 'slide-up'
  if (raw === 'crossfade') return 'crossfade'
  if (raw === 'zoom-fade') return 'zoom-fade'
  if (raw === 'instant') return 'instant'
  return 'fade'
}

function parseByLayout(raw: unknown): AdMediaStyle['byLayout'] {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const keys: AdBannerLayoutKey[] = ['side', 'center', 'leaderboard', 'mobile']
  const out: Partial<Record<AdBannerLayoutKey, AdFrameStyle>> = {}
  for (const key of keys) {
    const entry = o[key]
    if (entry && typeof entry === 'object') {
      out[key] = pickFrame(entry as Record<string, unknown>)
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function parseAdMediaStyle(raw: unknown): AdMediaStyle {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AD_MEDIA_STYLE }
  const o = raw as Record<string, unknown>
  const slideRaw = o.slideshow
  let slideshow: AdMediaSlideshow | null = null
  if (slideRaw && typeof slideRaw === 'object') {
    const s = slideRaw as Record<string, unknown>
    const urls = Array.isArray(s.urls)
      ? s.urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      : []
    if (urls.length > 0) {
      slideshow = {
        urls,
        intervalMs:
          typeof s.intervalMs === 'number' && s.intervalMs >= 800
            ? Math.min(15000, s.intervalMs)
            : 3500,
        transition: normalizeTransition(s.transition),
      }
    }
  }

  return {
    ...pickFrame(o),
    byLayout: parseByLayout(o.byLayout),
    slideshow,
  }
}

export function resolveFrameStyle(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey,
): AdFrameStyle {
  return style.byLayout?.[layout] ?? pickFrame(style as unknown as Record<string, unknown>)
}

/** Стиль для рендеру конкретного банера (кадр + спільне слайдшоу). */
export function resolveDisplayStyle(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey,
): AdMediaStyle {
  return {
    ...resolveFrameStyle(style, layout),
    slideshow: style.slideshow ?? null,
  }
}

export function layoutHasCustomFrame(style: AdMediaStyle, layout: AdBannerLayoutKey): boolean {
  return Boolean(style.byLayout?.[layout])
}

export function setLayoutFrame(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey,
  frame: AdFrameStyle,
): AdMediaStyle {
  return {
    ...style,
    byLayout: { ...style.byLayout, [layout]: frame },
  }
}

export function clearLayoutFrame(style: AdMediaStyle, layout: AdBannerLayoutKey): AdMediaStyle {
  if (!style.byLayout?.[layout]) return style
  const next = { ...style.byLayout }
  delete next[layout]
  return {
    ...style,
    byLayout: Object.keys(next).length > 0 ? next : undefined,
  }
}

export function mediaStyleToCssFilter(style: AdFrameStyle): string {
  const b = style.brightness / 100
  const c = style.contrast / 100
  const s = style.saturate / 100
  return `brightness(${b}) contrast(${c}) saturate(${s})`
}

export function mediaStyleObjectPosition(style: AdFrameStyle): string {
  return `${style.positionX}% ${style.positionY}%`
}

export function resolveSlideUrls(primaryUrl: string, style: AdMediaStyle): string[] {
  const fromSlide = style.slideshow?.urls?.filter(Boolean) ?? []
  if (fromSlide.length > 0) return fromSlide
  return primaryUrl.trim() ? [primaryUrl.trim()] : []
}

export function buildMediaStylePayload(
  style: AdMediaStyle,
  slideUrls: string[],
): AdMediaStyle {
  const urls = slideUrls.filter(Boolean)
  const base = { ...style }
  if (urls.length > 1) {
    base.slideshow = {
      urls,
      intervalMs: style.slideshow?.intervalMs ?? 3500,
      transition: style.slideshow?.transition ?? 'fade',
    }
  } else {
    base.slideshow = null
  }
  return base
}

export function slideshowLayerClass(
  active: boolean,
  transition: AdSlideshowTransition,
): string {
  const base = 'absolute inset-0 h-full w-full ease-in-out'
  switch (transition) {
    case 'instant':
      return `${base} transition-none ${active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`
    case 'crossfade':
      return `${base} transition-opacity duration-[1200ms] ${active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`
    case 'fade':
      return `${base} transition-opacity duration-[900ms] ${active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`
    case 'slide-left':
      return `${base} transition-all duration-[900ms] ${
        active ? 'opacity-100 translate-x-0 z-[1]' : 'opacity-0 translate-x-[18%] z-0'
      }`
    case 'slide-right':
      return `${base} transition-all duration-[900ms] ${
        active ? 'opacity-100 translate-x-0 z-[1]' : 'opacity-0 -translate-x-[18%] z-0'
      }`
    case 'slide-up':
      return `${base} transition-all duration-[900ms] ${
        active ? 'opacity-100 translate-y-0 z-[1]' : 'opacity-0 translate-y-[14%] z-0'
      }`
    case 'zoom-fade':
      return `${base} transition-all duration-[1000ms] ${
        active ? 'opacity-100 scale-100 z-[1]' : 'opacity-0 scale-[1.06] z-0'
      }`
    default:
      return `${base} transition-opacity duration-[900ms] ${active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`
  }
}
