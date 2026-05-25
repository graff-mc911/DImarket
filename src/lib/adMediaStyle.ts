/** Налаштування відображення банера (зберігається в ad_campaigns.media_style). */

export type AdMediaFit = 'cover' | 'contain'

export type AdSlideshowTransition = 'fade' | 'slide'

export type AdMediaSlideshow = {
  urls: string[]
  intervalMs: number
  transition: AdSlideshowTransition
}

export type AdMediaStyle = {
  fit: AdMediaFit
  positionX: number
  positionY: number
  scale: number
  brightness: number
  contrast: number
  saturate: number
  slideshow?: AdMediaSlideshow | null
}

export const DEFAULT_AD_MEDIA_STYLE: AdMediaStyle = {
  fit: 'cover',
  positionX: 50,
  positionY: 50,
  scale: 100,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  slideshow: null,
}

export function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
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
        transition: s.transition === 'slide' ? 'slide' : 'fade',
      }
    }
  }

  return {
    fit: o.fit === 'contain' ? 'contain' : 'cover',
    positionX: clampPercent(Number(o.positionX ?? 50)),
    positionY: clampPercent(Number(o.positionY ?? 50)),
    scale: Math.min(200, Math.max(80, Number(o.scale ?? 100) || 100)),
    brightness: Math.min(150, Math.max(50, Number(o.brightness ?? 100) || 100)),
    contrast: Math.min(150, Math.max(50, Number(o.contrast ?? 100) || 100)),
    saturate: Math.min(150, Math.max(0, Number(o.saturate ?? 100) || 100)),
    slideshow,
  }
}

export function mediaStyleToCssFilter(style: AdMediaStyle): string {
  const b = style.brightness / 100
  const c = style.contrast / 100
  const s = style.saturate / 100
  return `brightness(${b}) contrast(${c}) saturate(${s})`
}

export function mediaStyleObjectPosition(style: AdMediaStyle): string {
  return `${style.positionX}% ${style.positionY}%`
}

export function resolveSlideUrls(
  primaryUrl: string,
  style: AdMediaStyle,
): string[] {
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
