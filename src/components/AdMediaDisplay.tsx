import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { AdBannerLayoutKey } from '../lib/adBannerLayouts'
import {
  COLLAGE_MAX_BY_LAYOUT,
  collageGridClass,
  layoutDefaultImageStyle,
  layoutFrameImageStyle,
  resolveDisplayMode,
  resolveLayoutFrame,
  resolveLayoutTransition,
  resolveSlideUrls,
  slideshowLayerClass,
  type AdMediaStyle,
} from '../lib/adMediaStyle'
import { AD_MEDIA_FALLBACK } from '../lib/adCampaigns'

type AdMediaDisplayProps = {
  src: string
  alt?: string
  mediaType: 'image' | 'gif' | 'video'
  style?: AdMediaStyle
  layoutKey?: AdBannerLayoutKey
  className?: string
  animateSlides?: boolean
}

function resolveImageStyle(
  layoutKey: AdBannerLayoutKey | undefined,
  frameStyle: CSSProperties | null,
): CSSProperties {
  if (frameStyle) return frameStyle
  if (layoutKey) return layoutDefaultImageStyle(layoutKey)
  return {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'contain',
    objectPosition: 'center',
  }
}

/** Зображення на 100% зони слота — без blur-фону; ручне кадрування лише якщо задано в media_style. */
function AdMediaImageFill({
  src,
  alt,
  className = '',
  layoutKey,
  frameStyle,
}: {
  src: string
  alt: string
  className?: string
  layoutKey?: AdBannerLayoutKey
  frameStyle?: CSSProperties | null
}) {
  const imgStyle = resolveImageStyle(layoutKey, frameStyle ?? null)

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#1a1816] ${className}`}>
      <img
        src={src}
        alt={alt}
        style={imgStyle}
        className="h-full w-full max-h-full max-w-full"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = AD_MEDIA_FALLBACK
        }}
      />
    </div>
  )
}

export function AdMediaDisplay({
  src,
  alt = '',
  mediaType,
  style,
  layoutKey,
  className = '',
  animateSlides = true,
}: AdMediaDisplayProps) {
  const resolvedStyle = style ?? { slideshow: null }
  const slides = useMemo(() => resolveSlideUrls(src, resolvedStyle), [src, resolvedStyle])
  const [slideIndex, setSlideIndex] = useState(0)

  const displayMode = useMemo(
    () => resolveDisplayMode(resolvedStyle, layoutKey, slides.length),
    [resolvedStyle, layoutKey, slides.length],
  )
  const transition = useMemo(
    () => resolveLayoutTransition(resolvedStyle, layoutKey),
    [resolvedStyle, layoutKey],
  )
  const customFrame = useMemo(
    () => (layoutKey ? resolveLayoutFrame(resolvedStyle, layoutKey) : null),
    [resolvedStyle, layoutKey],
  )
  const frameStyle = useMemo(
    () => (customFrame ? layoutFrameImageStyle(customFrame) : null),
    [customFrame],
  )

  useEffect(() => {
    setSlideIndex(0)
  }, [slides.join('|'), displayMode])

  useEffect(() => {
    if (!animateSlides || displayMode !== 'rotate' || slides.length < 2 || mediaType === 'video') {
      return
    }
    const ms = resolvedStyle.slideshow?.intervalMs ?? 3500
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length)
    }, ms)
    return () => window.clearInterval(id)
  }, [animateSlides, displayMode, slides, mediaType, resolvedStyle.slideshow?.intervalMs])

  if (mediaType === 'video' && src) {
    return (
      <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
        <video
          src={src}
          className="block h-full w-full object-contain"
          muted
          playsInline
          loop
          autoPlay
        />
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
        <img
          src={AD_MEDIA_FALLBACK}
          alt={alt}
          className="block h-full w-full object-contain"
        />
      </div>
    )
  }

  if (displayMode === 'collage' && slides.length >= 2 && layoutKey) {
    const max = COLLAGE_MAX_BY_LAYOUT[layoutKey]
    const collageSlides = slides.slice(0, max)
    return (
      <div className={`relative h-full w-full overflow-hidden bg-[#1a1816] ${className}`}>
        <div className={`grid h-full w-full gap-px ${collageGridClass(layoutKey, collageSlides.length)}`}>
          {collageSlides.map((url, i) => (
            <AdMediaImageFill
              key={`${url}-${i}`}
              src={url}
              alt={alt}
              className="min-h-0 min-w-0"
              layoutKey={layoutKey}
              frameStyle={frameStyle}
            />
          ))}
        </div>
      </div>
    )
  }

  const multi = displayMode === 'rotate' && slides.length > 1 && animateSlides

  if (!multi) {
    return (
      <AdMediaImageFill
        src={slides[0]}
        alt={alt}
        className={className}
        layoutKey={layoutKey}
        frameStyle={frameStyle}
      />
    )
  }

  return (
    <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
      {slides.map((url, i) => {
        const active = i === slideIndex
        return (
          <div
            key={`${url}-${i}`}
            className={slideshowLayerClass(active, transition)}
          >
            <AdMediaImageFill
              src={url}
              alt={alt}
              layoutKey={layoutKey}
              frameStyle={frameStyle}
            />
          </div>
        )
      })}
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-[2] flex gap-1">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
