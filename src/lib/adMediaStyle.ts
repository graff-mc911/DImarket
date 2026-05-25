/** Налаштування відображення банера (зберігається в ad_campaigns.media_style). */

import type { AdBannerLayoutKey } from './adBannerLayouts'

export type AdDisplayMode = 'single' | 'rotate' | 'collage'

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

/** Режим показу для типу банера (без ручного кадрування). */
export type AdLayoutPrefs = {
  displayMode?: AdDisplayMode
  transition?: AdSlideshowTransition
}

/** @deprecated Лише для зворотної сумісності в БД — на рендері не використовується. */
export type AdFrameStyle = {
  fit?: 'cover' | 'contain'
  positionX?: number
  positionY?: number
  scale?: number
  brightness?: number
  contrast?: number
  saturate?: number
}

export type AdMediaStyle = {
  byLayout?: Partial<Record<AdBannerLayoutKey, AdLayoutPrefs>>
  slideshow?: AdMediaSlideshow | null
}

export const DEFAULT_AD_MEDIA_STYLE: AdMediaStyle = {
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

export const LAYOUT_DEFAULT_TRANSITION: Record<AdBannerLayoutKey, AdSlideshowTransition> = {
  side: 'slide-left',
  center: 'fade',
  leaderboard: 'crossfade',
  mobile: 'fade',
}

export const COLLAGE_MAX_BY_LAYOUT: Record<AdBannerLayoutKey, number> = {
  side: 2,
  center: 3,
  leaderboard: 4,
  mobile: 2,
}

export const TRANSITIONS_FOR_LAYOUT: Record<AdBannerLayoutKey, AdSlideshowTransition[]> = {
  side: ['slide-left', 'slide-right', 'slide-up', 'fade', 'crossfade', 'zoom-fade', 'instant'],
  center: ['fade', 'crossfade', 'slide-left', 'slide-right', 'zoom-fade', 'instant'],
  leaderboard: ['fade', 'crossfade', 'slide-left', 'slide-right', 'instant'],
  mobile: ['fade', 'crossfade', 'slide-left', 'slide-right', 'instant'],
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

function normalizeDisplayMode(raw: unknown): AdDisplayMode | undefined {
  if (raw === 'rotate' || raw === 'slideshow') return 'rotate'
  if (raw === 'collage' || raw === 'grid' || raw === 'multi') return 'collage'
  if (raw === 'single' || raw === 'one') return 'single'
  return undefined
}

function parseLayoutPrefs(entry: Record<string, unknown>): AdLayoutPrefs | undefined {
  const displayMode = normalizeDisplayMode(entry.displayMode)
  const transition = entry.transition
    ? normalizeTransition(entry.transition)
    : undefined
  if (displayMode || transition) {
    return { ...(displayMode ? { displayMode } : {}), ...(transition ? { transition } : {}) }
  }
  return undefined
}

function parseByLayout(raw: unknown): AdMediaStyle['byLayout'] {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const keys: AdBannerLayoutKey[] = ['side', 'center', 'leaderboard', 'mobile']
  const out: Partial<Record<AdBannerLayoutKey, AdLayoutPrefs>> = {}
  for (const key of keys) {
    const entry = o[key]
    if (entry && typeof entry === 'object') {
      const prefs = parseLayoutPrefs(entry as Record<string, unknown>)
      if (prefs) out[key] = prefs
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
    byLayout: parseByLayout(o.byLayout),
    slideshow,
  }
}

export function resolveLayoutPrefs(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey,
): AdLayoutPrefs {
  return style.byLayout?.[layout] ?? {}
}

export function resolveDisplayMode(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey | undefined,
  slideCount: number,
): AdDisplayMode {
  if (layout) {
    const mode = style.byLayout?.[layout]?.displayMode
    if (mode) return mode
  }
  if (slideCount >= 2) return 'rotate'
  return 'single'
}

export function resolveLayoutTransition(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey | undefined,
): AdSlideshowTransition {
  if (layout) {
    const tr = style.byLayout?.[layout]?.transition
    if (tr) return tr
  }
  if (style.slideshow?.transition) return style.slideshow.transition
  if (layout) return LAYOUT_DEFAULT_TRANSITION[layout]
  return 'fade'
}

export function layoutHasPrefs(style: AdMediaStyle, layout: AdBannerLayoutKey): boolean {
  return Boolean(style.byLayout?.[layout])
}

export function setLayoutPrefs(
  style: AdMediaStyle,
  layout: AdBannerLayoutKey,
  prefs: AdLayoutPrefs,
): AdMediaStyle {
  return {
    ...style,
    byLayout: { ...style.byLayout, [layout]: prefs },
  }
}

export function clearLayoutPrefs(style: AdMediaStyle, layout: AdBannerLayoutKey): AdMediaStyle {
  if (!style.byLayout?.[layout]) return style
  const next = { ...style.byLayout }
  delete next[layout]
  return {
    ...style,
    byLayout: Object.keys(next).length > 0 ? next : undefined,
  }
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
  const base: AdMediaStyle = { byLayout: style.byLayout }
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

export function collageGridClass(layout: AdBannerLayoutKey, count: number): string {
  const wide = layout === 'center' || layout === 'leaderboard' || layout === 'mobile'
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return wide ? 'grid-cols-2 grid-rows-1' : 'grid-cols-1 grid-rows-2'
  if (count === 3) return wide ? 'grid-cols-3 grid-rows-1' : 'grid-cols-1 grid-rows-3'
  return 'grid-cols-2 grid-rows-2'
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
