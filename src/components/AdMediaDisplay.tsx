import { useEffect, useMemo, useState } from 'react'
import type { AdBannerLayoutKey } from '../lib/adBannerLayouts'
import {
  DEFAULT_AD_MEDIA_STYLE,
  mediaStyleObjectPosition,
  mediaStyleToCssFilter,
  resolveDisplayStyle,
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
  /** Кадрування для конкретного типу банера */
  layoutKey?: AdBannerLayoutKey
  className?: string
  imageClassName?: string
  /** Автослайд для 2+ зображень */
  animateSlides?: boolean
}

export function AdMediaDisplay({
  src,
  alt = '',
  mediaType,
  style = DEFAULT_AD_MEDIA_STYLE,
  layoutKey,
  className = '',
  imageClassName = '',
  animateSlides = true,
}: AdMediaDisplayProps) {
  const displayStyle = useMemo(
    () => (layoutKey ? resolveDisplayStyle(style, layoutKey) : style),
    [style, layoutKey],
  )
  const slides = useMemo(() => resolveSlideUrls(src, displayStyle), [src, displayStyle])
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    setSlideIndex(0)
  }, [slides.join('|')])

  useEffect(() => {
    if (!animateSlides || slides.length < 2 || mediaType === 'video') return
    const ms = displayStyle.slideshow?.intervalMs ?? 3500
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length)
    }, ms)
    return () => window.clearInterval(id)
  }, [animateSlides, slides, mediaType, displayStyle.slideshow?.intervalMs])

  const filter = mediaStyleToCssFilter(displayStyle)
  const objectPosition = mediaStyleObjectPosition(displayStyle)
  const objectFit = displayStyle.fit
  const scale = displayStyle.scale / 100

  const imgStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    filter,
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: objectPosition,
  }

  if (mediaType === 'video' && src) {
    return (
      <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
        <video
          src={src}
          className={`h-full w-full ${imageClassName}`}
          style={{ objectFit, objectPosition, filter }}
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
        <img src={AD_MEDIA_FALLBACK} alt={alt} className={`h-full w-full object-cover ${imageClassName}`} />
      </div>
    )
  }

  const transition = displayStyle.slideshow?.transition ?? 'fade'
  const multi = slides.length > 1 && animateSlides

  if (!multi) {
    return (
      <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
        <img
          src={slides[0]}
          alt={alt}
          className={`h-full w-full ${imageClassName}`}
          style={imgStyle}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = AD_MEDIA_FALLBACK
          }}
        />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
      {slides.map((url, i) => {
        const active = i === slideIndex
        return (
          <img
            key={`${url}-${i}`}
            src={url}
            alt={alt}
            className={`${slideshowLayerClass(active, transition)} ${imageClassName}`}
            style={imgStyle}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = AD_MEDIA_FALLBACK
            }}
          />
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
