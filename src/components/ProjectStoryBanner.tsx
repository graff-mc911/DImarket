import type { MouseEvent, ReactNode } from 'react'
import { navigateTo } from '../lib/navigation'

export type ProjectStoryRow = {
  label: string
  value: string
  accent?: boolean
}

type ProjectStoryBannerProps = {
  href: string
  title: string
  imageSrc?: string
  imageAlt?: string
  media?: ReactNode
  rows?: ProjectStoryRow[]
  quote?: string | null
  asQuote?: boolean
  onClick?: () => void
  sponsored?: boolean
  className?: string
}

export function ProjectStoryBanner({
  href,
  title,
  imageSrc,
  imageAlt = '',
  media,
  rows = [],
  quote,
  asQuote = false,
  onClick,
  sponsored = false,
  className = '',
}: ProjectStoryBannerProps) {
  const trimmedQuote = quote?.trim()
  const quoted = !trimmedQuote
    ? null
    : asQuote && !/^[«"“']/.test(trimmedQuote)
      ? `«${trimmedQuote}»`
      : trimmedQuote

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.()
    if (sponsored) return
    if (!href.startsWith('/') || href.startsWith('//')) return
    event.preventDefault()
    navigateTo(href)
  }

  return (
    <a
      href={href}
      target={sponsored ? '_blank' : undefined}
      rel={sponsored ? 'noreferrer sponsored' : undefined}
      className={`ad-story ${className}`.trim()}
      onClick={handleClick}
    >
      <div className="ad-story__media">
        {media ?? (
          <img
            className="ad-story__photo"
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="ad-story__body">
        {title ? <h3 className="ad-story__title">{title}</h3> : null}
        {rows.length > 0 ? (
          <dl className="ad-story__meta">
            {rows.map((row) => (
              <div key={row.label} className="ad-story__row">
                <dt>{row.label}</dt>
                <dd className={row.accent ? 'ad-story__value--accent' : undefined}>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {quoted ? <blockquote className="ad-story__quote">{quoted}</blockquote> : null}
      </div>
    </a>
  )
}
