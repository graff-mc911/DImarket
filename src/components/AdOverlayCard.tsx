import { Megaphone } from 'lucide-react'
import {
  AD_MEDIA_FALLBACK,
  getGeoTargetLabel,
  getPublicBannerImageUrl,
  resolveAdDisplayCopy,
  trackAdClick,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'
import { useApp } from '../contexts/AppContext'

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
  }
> = {
  stack: {
    shell: 'h-[90%] w-[90%] max-h-full max-w-full min-h-[4rem] mx-auto my-auto',
    image: 'min-h-[2.25rem] flex-1 w-full',
    text: 'p-1.5',
    brand: 'text-[9px]',
    title: 'text-[10px] line-clamp-2 leading-snug',
    meta: 'text-[9px]',
  },
  legacy: {
    shell: 'min-h-[198px] w-[90%] max-w-full mx-auto',
    image: 'h-[112px] w-full shrink-0',
    text: 'p-2.5',
    brand: 'text-[10px]',
    title: 'text-base line-clamp-2',
    meta: 'text-xs',
  },
  'legacy-compact': {
    shell: 'min-h-[108px] w-[90%] max-w-full mx-auto',
    image: 'h-[60px] w-full shrink-0',
    text: 'p-2',
    brand: 'text-[9px]',
    title: 'text-sm line-clamp-2',
    meta: 'text-[10px]',
  },
  center: {
    shell: 'min-h-[220px] w-full max-w-full mx-auto md:min-h-[248px]',
    image: 'h-[140px] w-full shrink-0 md:h-[156px]',
    text: 'p-2.5',
    brand: 'text-[10px]',
    title: 'text-sm line-clamp-2',
    meta: 'text-xs',
  },
  'mobile-sticky': {
    shell: 'min-h-[72px] w-full',
    image: 'h-[44px] w-full shrink-0',
    text: 'p-2',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-1',
    meta: 'text-[9px]',
  },
  'mobile-inline': {
    shell: 'min-h-[108px] w-full',
    image: 'h-[68px] w-full shrink-0',
    text: 'p-2',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-2',
    meta: 'text-[10px]',
  },
}

function AdCampaignMedia({
  campaign,
  imageClass,
}: {
  campaign: AdCampaignWithAdvertiser
  imageClass: string
}) {
  const imageSrc = getPublicBannerImageUrl(campaign)
  const isBrandBanner = imageSrc.includes('/ads/brands/')

  return (
    <div className={`relative overflow-hidden bg-[rgba(255,248,241,0.5)] ${imageClass}`}>
      <img
        src={imageSrc}
        alt={campaign.title}
        className={
          isBrandBanner
            ? 'h-full w-full object-contain object-center bg-[#1c1917] transition duration-500 group-hover:scale-[1.01]'
            : 'h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]'
        }
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = AD_MEDIA_FALLBACK
        }}
      />
    </div>
  )
}

function AdTextContent({
  brand,
  title,
  description,
  geo,
  styles,
}: {
  brand: string
  title: string
  description?: string | null
  geo?: string | null
  styles: (typeof variantStyles)[AdOverlayVariant]
}) {
  return (
    <div className="space-y-0.5">
      {brand && (
        <p className={`font-bold uppercase tracking-[0.1em] text-[var(--ink-500)] ${styles.brand}`}>
          {brand}
        </p>
      )}
      {title && (
        <h3 className={`font-extrabold leading-snug text-[var(--ink-900)] ${styles.title}`}>{title}</h3>
      )}
      {description && (
        <p className={`line-clamp-2 leading-snug text-[var(--ink-700)] ${styles.meta}`}>
          {description}
        </p>
      )}
      {geo && <p className={`line-clamp-1 text-[var(--ink-500)] ${styles.meta}`}>{geo}</p>}
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
  const { brand, title } = resolveAdDisplayCopy(campaign)
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
      <AdCampaignMedia campaign={campaign} imageClass={styles.image} />

      <div
        className={`shrink-0 border-t border-[rgba(219,148,94,0.12)] bg-[rgba(255,252,248,0.98)] ${styles.text}`}
      >
        <AdTextContent
          brand={brand}
          title={title}
          description={showDesc ? campaign.description : null}
          geo={showGeo ? getGeoTargetLabel(campaign, t) : null}
          styles={styles}
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
            <p className={`font-extrabold text-[var(--ink-900)] ${styles.title}`}>{title}</p>
            <p className={`text-[var(--ink-500)] ${styles.meta}`}>{subtitle}</p>
          </div>
        )}
      </div>
    </button>
  )
}
