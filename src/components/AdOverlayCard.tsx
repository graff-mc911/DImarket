import { ExternalLink, Megaphone, Play } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  AD_MEDIA_FALLBACK,
  getAdvertiserLabel,
  getCampaignMediaType,
  getCampaignMediaUrl,
  getCampaignPosterUrl,
  getGeoTargetLabel,
  trackAdClick,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'

export const adOverlayGlow =
  'rounded-[14px] border border-[rgba(219,148,94,0.2)] bg-[rgba(255,252,248,0.98)] shadow-[0_2px_8px_rgba(67,44,26,0.07)] transition duration-300 hover:border-[rgba(219,148,94,0.32)] hover:shadow-[0_3px_12px_rgba(67,44,26,0.1)]'

type AdOverlayVariant = 'stack' | 'legacy' | 'legacy-compact' | 'center' | 'mobile-sticky' | 'mobile-inline'

interface AdOverlayCardProps {
  campaign: AdCampaignWithAdvertiser
  variant: AdOverlayVariant
  className?: string
  showDescription?: boolean
  showGeo?: boolean
}

const variantStyles: Record<
  AdOverlayVariant,
  {
    shell: string
    image: string
    text: string
    brand: string
    title: string
    meta: string
    badge: string
  }
> = {
  stack: {
    shell: 'h-[90%] w-[90%] max-h-full max-w-full min-h-[4rem] mx-auto my-auto',
    image: 'min-h-[2.25rem] flex-1 w-full',
    text: 'p-1.5',
    brand: 'text-[9px]',
    title: 'text-[10px] line-clamp-2 leading-snug',
    meta: 'text-[9px]',
    badge: 'text-[7px] px-1 py-0',
  },
  legacy: {
    shell: 'min-h-[198px] w-[90%] max-w-full mx-auto',
    image: 'h-[112px] w-full shrink-0',
    text: 'p-2.5',
    brand: 'text-[10px]',
    title: 'text-base line-clamp-2',
    meta: 'text-xs',
    badge: 'text-[9px] px-2 py-0.5',
  },
  'legacy-compact': {
    shell: 'min-h-[108px] w-[90%] max-w-full mx-auto',
    image: 'h-[60px] w-full shrink-0',
    text: 'p-2',
    brand: 'text-[9px]',
    title: 'text-sm line-clamp-2',
    meta: 'text-[10px]',
    badge: 'text-[8px] px-1.5 py-0.5',
  },
  center: {
    shell: 'min-h-[198px] w-[90%] max-w-full mx-auto md:min-h-[216px]',
    image: 'h-[112px] w-full shrink-0 md:h-[122px]',
    text: 'p-2.5',
    brand: 'text-[10px]',
    title: 'text-sm line-clamp-2',
    meta: 'text-xs',
    badge: 'text-[9px] px-2 py-0.5',
  },
  'mobile-sticky': {
    shell: 'min-h-[72px] w-full',
    image: 'h-[44px] w-full shrink-0',
    text: 'p-2 pr-8',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-1',
    meta: 'text-[9px]',
    badge: 'text-[8px] px-1.5 py-0.5',
  },
  'mobile-inline': {
    shell: 'min-h-[108px] w-full',
    image: 'h-[68px] w-full shrink-0',
    text: 'p-2 pr-8',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-2',
    meta: 'text-[10px]',
    badge: 'text-[8px] px-1.5 py-0.5',
  },
}

function AdCampaignMedia({
  campaign,
  imageClass,
  badgeClass,
}: {
  campaign: AdCampaignWithAdvertiser
  imageClass: string
  badgeClass: string
}) {
  const { t } = useApp()
  const mediaType = getCampaignMediaType(campaign)
  const poster = getCampaignPosterUrl(campaign)
  const mediaSrc = getCampaignMediaUrl(campaign)

  if (mediaType === 'video') {
    return (
      <div className={`relative overflow-hidden bg-black/5 ${imageClass}`}>
        <video
          src={mediaSrc}
          poster={poster}
          className="h-full w-full object-cover"
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
        />
        <span
          className={`absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full border border-white/50 bg-black/40 font-bold uppercase tracking-[0.08em] text-white/95 ${badgeClass}`}
        >
          <Play className="h-2.5 w-2.5 shrink-0 fill-current" />
          {t('ads.videoBadge')}
        </span>
      </div>
    )
  }

  if (mediaType === 'gif') {
    return (
      <div className={`relative overflow-hidden bg-black/5 ${imageClass}`}>
        <img
          src={mediaSrc}
          alt={campaign.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span
          className={`absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full border border-white/50 bg-black/35 font-bold uppercase tracking-[0.1em] text-white/95 ${badgeClass}`}
        >
          {t('ads.animBadge')}
        </span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-[rgba(255,248,241,0.5)] ${imageClass}`}>
      <img
        src={poster}
        alt={campaign.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = AD_MEDIA_FALLBACK
        }}
      />
      <span
        className={`absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full border border-white/50 bg-black/25 font-bold uppercase tracking-[0.1em] text-white/95 backdrop-blur-[2px] ${badgeClass}`}
      >
        <Megaphone className="h-2.5 w-2.5 shrink-0" />
        {t('ads.badge')}
      </span>
    </div>
  )
}

function AdTextContent({
  brand,
  title,
  description,
  geo,
  showVisit,
  visitLabel,
  styles,
  compactRow,
}: {
  brand: string
  title: string
  description?: string | null
  geo?: string | null
  showVisit: boolean
  visitLabel: string
  styles: (typeof variantStyles)[AdOverlayVariant]
  compactRow?: boolean
}) {
  if (compactRow) {
    return (
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          {brand && (
            <p
              className={`truncate font-bold uppercase tracking-[0.08em] text-[var(--ink-500)] ${styles.brand}`}
            >
              {brand}
            </p>
          )}
          <h3 className={`font-extrabold text-[var(--ink-900)] ${styles.title}`}>{title}</h3>
          {description && (
            <p className={`line-clamp-2 text-[var(--ink-700)] ${styles.meta}`}>{description}</p>
          )}
        </div>
        {showVisit && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 font-semibold text-[var(--accent-700)] ${styles.meta}`}
          >
            <span className="sr-only">{visitLabel}</span>
            <ExternalLink className="h-3 w-3" />
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {brand && (
        <p className={`font-bold uppercase tracking-[0.1em] text-[var(--ink-500)] ${styles.brand}`}>
          {brand}
        </p>
      )}
      <h3 className={`font-extrabold leading-snug text-[var(--ink-900)] ${styles.title}`}>{title}</h3>
      {description && (
        <p className={`line-clamp-2 leading-snug text-[var(--ink-700)] ${styles.meta}`}>
          {description}
        </p>
      )}
      {geo && <p className={`line-clamp-1 text-[var(--ink-500)] ${styles.meta}`}>{geo}</p>}
      {showVisit && (
        <span
          className={`inline-flex items-center gap-1 font-semibold text-[var(--accent-700)] ${styles.meta}`}
        >
          {visitLabel}
          <ExternalLink className="h-3 w-3" />
        </span>
      )}
    </div>
  )
}

export function AdOverlayCard({
  campaign,
  variant,
  className = '',
  showDescription = false,
  showGeo = false,
}: AdOverlayCardProps) {
  const { t } = useApp()
  const brand = getAdvertiserLabel(campaign)
  const styles = variantStyles[variant]
  const isStack = variant === 'stack'
  const showDesc = showDescription || isStack

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className={`group flex flex-col overflow-hidden ${adOverlayGlow} ${styles.shell} ${className}`}
      onClick={() => void trackAdClick(campaign.id)}
    >
      <AdCampaignMedia campaign={campaign} imageClass={styles.image} badgeClass={styles.badge} />

      <div
        className={`shrink-0 border-t border-[rgba(219,148,94,0.12)] bg-[rgba(255,252,248,0.98)] ${styles.text}`}
      >
        <AdTextContent
          brand={brand ?? ''}
          title={campaign.title}
          description={showDesc ? campaign.description : null}
          geo={showGeo ? getGeoTargetLabel(campaign, t) : null}
          showVisit={!isStack}
          visitLabel={t('ads.visit')}
          styles={styles}
          compactRow={isStack}
        />
      </div>
    </a>
  )
}

interface AdOverlayPlaceholderProps {
  title: string
  subtitle: string
  variant: AdOverlayVariant
  className?: string
  onClick: () => void
}

export function AdOverlayPlaceholder({
  title,
  subtitle,
  variant,
  className = '',
  onClick,
}: AdOverlayPlaceholderProps) {
  const { t } = useApp()
  const styles = variantStyles[variant]
  const isStack = variant === 'stack'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col overflow-hidden text-left ${adOverlayGlow} ${styles.shell} ${className}`}
    >
      <div
        className={`flex items-center justify-center bg-[linear-gradient(135deg,rgba(71,85,105,0.35),rgba(51,65,85,0.5))] ${styles.image}`}
      >
        <Megaphone className="h-5 w-5 text-white/70" />
      </div>

      <div className={`shrink-0 border-t border-[rgba(219,148,94,0.12)] ${styles.text}`}>
        {isStack ? (
          <div className="min-w-0">
            <p className={`font-extrabold text-[var(--ink-900)] ${styles.title}`}>{title}</p>
            <p className={`truncate text-[var(--ink-500)] ${styles.meta}`}>{subtitle}</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[rgba(255,252,248,0.9)] font-bold uppercase tracking-[0.1em] text-[var(--accent-700)] ${styles.badge}`}
            >
              <Megaphone className="h-2.5 w-2.5" />
              {t('ads.badge')}
            </span>
            <p className={`mt-1 font-extrabold text-[var(--ink-900)] ${styles.title}`}>{title}</p>
            <p className={`text-[var(--ink-500)] ${styles.meta}`}>{subtitle}</p>
          </div>
        )}
      </div>
    </button>
  )
}
