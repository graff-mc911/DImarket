import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AD_BANNER_LAYOUT_META, type AdBannerLayoutKey } from '../lib/adBannerLayouts'
import {
  COLLAGE_MAX_BY_LAYOUT,
  collageGridClass,
  frameIsCustomized,
  isFluidBannerLayout,
  layoutDefaultImageStyle,
  layoutFrameImageStyle,
  resolveDisplayMode,
  resolveLayoutFrame,
  resolveLayoutTransition,
  resolveSlideUrls,
  slideshowLayerClass,
  type AdMediaStyle,
} from '../lib/adMediaStyle'
import { resolvePublicAdMediaUrl } from '../lib/adMediaStorage'

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
    height: 'auto',
    display: 'block',
    objectFit: 'contain',
    objectPosition: 'center',
  }
}

const NATURAL_IMG_STYLE: CSSProperties = {
  width: '100%',
  height: 'auto',
  maxHeight: 'min(42vh, 20rem)',
  display: 'block',
  objectFit: 'contain',
  objectPosition: 'center',
}

/** Зображення в слоті — без stretch; висота від реального aspect-ratio контейнера / asset. */
function AdMediaImageFill({
  src,
  alt,
  className = '',
  layoutKey,
  frameStyle,
  customizedFrame,
  fillBox = false,
}: {
  src: string
  alt: string
  className?: string
  layoutKey?: AdBannerLayoutKey
  frameStyle?: CSSProperties | null
  customizedFrame?: boolean
  /** Absolute slideshow layer: fill the already-sized parent box. */
  fillBox?: boolean
}) {
  const imgStyle = resolveImageStyle(layoutKey, frameStyle ?? null)
  const fluid = isFluidBannerLayout(layoutKey)
  // Client creatives (e.g. full designed banners) keep native ratio on phone/leaderboard.
  // Only a real crop (cover / pan / zoom) switches to a fixed aspect shell.
  const naturalHeight = !fillBox && (fluid ? !customizedFrame : !frameStyle && !layoutKey)
  const aspectShell =
    !fillBox && fluid && customizedFrame && layoutKey
      ? AD_BANNER_LAYOUT_META[layoutKey].aspectClass
      : null
  const resolvedSrc = resolvePublicAdMediaUrl(src)
  const fillContainStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: (frameStyle?.objectFit as 'cover' | 'contain' | undefined) ?? 'contain',
    objectPosition: (frameStyle?.objectPosition as string | undefined) ?? 'center',
    ...(frameStyle?.transform ? { transform: frameStyle.transform, transformOrigin: frameStyle.transformOrigin } : {}),
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-transparent ${
        fillBox
          ? 'h-full'
          : naturalHeight
            ? 'ad-slot-fluid-media h-auto'
            : aspectShell
              ? aspectShell
              : 'h-full'
      } ${className}`}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        style={naturalHeight ? NATURAL_IMG_STYLE : fillBox ? fillContainStyle : imgStyle}
        className={
          naturalHeight
            ? 'block h-auto w-full max-w-full'
            : 'h-full w-full max-h-full max-w-full'
        }
        loading="lazy"
        data-ad-media-retry="0"
        onError={(e) => {
          const img = e.currentTarget
          // One retry: legacy ad-media URLs → media bucket / orphan remap.
          if (img.dataset.adMediaRetry === '0') {
            img.dataset.adMediaRetry = '1'
            const next = resolvePublicAdMediaUrl(img.src)
            if (next && next !== img.src) {
              img.style.visibility = 'visible'
              img.src = next
              return
            }
          }
          // Never swap in a hardcoded stock photo as a fake ad.
          img.style.visibility = 'hidden'
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
  const customizedFrame = useMemo(
    () => (layoutKey ? frameIsCustomized(customFrame, layoutKey) : Boolean(customFrame)),
    [customFrame, layoutKey],
  )
  const frameStyle = useMemo(
    () => (customizedFrame && customFrame ? layoutFrameImageStyle(customFrame) : null),
    [customizedFrame, customFrame],
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
      <div
        className={`relative overflow-hidden bg-[#1a1816] ${
          isFluidBannerLayout(layoutKey) ? 'ad-slot-fluid-media h-auto' : ''
        } ${className}`}
      >
        <video
          src={src}
          className={
            isFluidBannerLayout(layoutKey)
              ? 'block h-auto w-full object-contain'
              : 'block h-full w-full object-contain'
          }
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
      <div className={`relative overflow-hidden bg-transparent ${className}`}>
        <div className="flex min-h-[4.5rem] w-full items-center justify-center" aria-hidden />
      </div>
    )
  }

  if (displayMode === 'collage' && slides.length >= 2 && layoutKey) {
    const max = COLLAGE_MAX_BY_LAYOUT[layoutKey]
    const collageSlides = slides.slice(0, max)
    const fluid = isFluidBannerLayout(layoutKey)
    return (
      <div
        className={`relative w-full overflow-hidden bg-[#1a1816] ${
          fluid ? `ad-slot-fluid-media ${AD_BANNER_LAYOUT_META[layoutKey].aspectClass}` : 'h-full'
        } ${className}`}
      >
        <div className={`grid h-full w-full gap-px ${collageGridClass(layoutKey, collageSlides.length)}`}>
          {collageSlides.map((url, i) => (
            <AdMediaImageFill
              key={`${url}-${i}`}
              src={url}
              alt={alt}
              className="min-h-0 min-w-0"
              layoutKey={layoutKey}
              frameStyle={frameStyle}
              customizedFrame={customizedFrame}
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
        customizedFrame={customizedFrame}
      />
    )
  }

  const fluidRotate = isFluidBannerLayout(layoutKey)

  // Fluid banners: first slide sizes the box; layers sit absolutely on top
  // (absolute-only stacks collapse when the parent is height:auto).
  if (fluidRotate) {
    return (
      <div className={`relative w-full overflow-hidden bg-[#1a1816] ${className}`}>
        <div className="invisible pointer-events-none select-none" aria-hidden>
          <AdMediaImageFill
            src={slides[0]}
            alt=""
            layoutKey={layoutKey}
            frameStyle={frameStyle}
            customizedFrame={customizedFrame}
          />
        </div>
        {slides.map((url, i) => {
          const active = i === slideIndex
          return (
            <div key={`${url}-${i}`} className={slideshowLayerClass(active, transition)}>
              <AdMediaImageFill
                src={url}
                alt={alt}
                layoutKey={layoutKey}
                frameStyle={frameStyle}
                customizedFrame={customizedFrame}
                fillBox
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

  return (
    <div className={`relative overflow-hidden bg-[#1a1816] ${className}`}>
      {slides.map((url, i) => {
        const active = i === slideIndex
        return (
          <div key={`${url}-${i}`} className={slideshowLayerClass(active, transition)}>
            <AdMediaImageFill
              src={url}
              alt={alt}
              layoutKey={layoutKey}
              frameStyle={frameStyle}
              customizedFrame={customizedFrame}
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
