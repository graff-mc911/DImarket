import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_AD_MEDIA_STYLE,
  mediaStyleObjectPosition,
  mediaStyleToCssFilter,
  resolveSlideUrls,
  type AdMediaStyle,
} from '../lib/adMediaStyle'
import { AD_MEDIA_FALLBACK } from '../lib/adCampaigns'

type AdMediaDisplayProps = {
  src: string
  alt?: string
  mediaType: 'image' | 'gif' | 'video'
  style?: AdMediaStyle
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
  className = '',
  imageClassName = '',
  animateSlides = true,
}: AdMediaDisplayProps) {
  const slides = useMemo(() => resolveSlideUrls(src, style), [src, style])
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    setSlideIndex(0)
  }, [slides.join('|')])

  useEffect(() => {
    if (!animateSlides || slides.length < 2 || mediaType === 'video') return
    const ms = style.slideshow?.intervalMs ?? 3500
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length)
    }, ms)
    return () => window.clearInterval(id)
  }, [animateSlides, slides, mediaType, style.slideshow?.intervalMs])

  const filter = mediaStyleToCssFilter(style)
  const objectPosition = mediaStyleObjectPosition(style)
  const objectFit = style.fit
  const scale = style.scale / 100

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

  const transition = style.slideshow?.transition ?? 'fade'

  return (
    <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
      {slides.map((url, i) => {
        const active = i === slideIndex
        return (
          <img
            key={`${url}-${i}`}
            src={url}
            alt={alt}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${imageClassName} ${
              transition === 'fade'
                ? active
                  ? 'opacity-100'
                  : 'opacity-0'
                : active
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-full'
            }`}
            style={imgStyle}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = AD_MEDIA_FALLBACK
            }}
          />
        )
      })}
      {slides.length > 1 && (
        <div className="pointer-events-none absolute bottom-1.5 right-1.5 flex gap-1">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
