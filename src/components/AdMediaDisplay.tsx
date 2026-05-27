import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { AdBannerLayoutKey } from '../lib/adBannerLayouts'
import {
  COLLAGE_MAX_BY_LAYOUT,
  collageGridClass,
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
  imageClassName?: string
  animateSlides?: boolean
}

/** Повне зображення в контейнері; фон — розмита копія; frame — ручне кадрування. */
function AdMediaImageFill({
  src,
  alt,
  className = '',
  imageClassName = '',
  frameStyle,
}: {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  frameStyle?: CSSProperties
}) {
  const mergedImageStyle = frameStyle
  const useBlurBg = (frameStyle?.objectFit ?? 'contain') === 'contain'

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#1a1816] ${className}`}>
      {useBlurBg && (
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-md"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = AD_MEDIA_FALLBACK
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        style={mergedImageStyle}
        className={`relative z-[1] mx-auto h-full w-full ${imageClassName || (frameStyle ? '' : 'object-contain')}`}
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
  imageClassName = '',
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
  const frame = useMemo(
    () => (layoutKey ? resolveLayoutFrame(resolvedStyle, layoutKey) : undefined),
    [resolvedStyle, layoutKey],
  )
  const frameStyle = useMemo(
    () => (frame ? layoutFrameImageStyle(frame) : undefined),
    [frame],
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
          className={`h-full w-full object-contain ${imageClassName}`}
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
          className={`h-full w-full object-contain ${imageClassName}`}
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
              imageClassName={imageClassName}
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
        imageClassName={imageClassName}
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
            <AdMediaImageFill src={url} alt={alt} imageClassName={imageClassName} frameStyle={frameStyle} />
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
