import { ExternalLink, Megaphone } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  AD_MEDIA_FALLBACK,
  getAdvertiserLabel,
  getCampaignMediaUrl,
  getGeoTargetLabel,
  trackAdClick,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'

export const adOverlayGlow =
  'rounded-[18px] shadow-[0_0_0_1px_rgba(255,255,255,0.42),0_6px_28px_rgba(15,23,42,0.05)] transition duration-300 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.58),0_10px_32px_rgba(199,138,96,0.1)]'

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
  { block: string; brand: string; title: string; meta: string; badge: string }
> = {
  stack: {
    block: 'h-full min-h-[72px]',
    brand: 'text-[10px]',
    title: 'text-[11px] line-clamp-2',
    meta: 'text-[10px]',
    badge: 'text-[9px] px-2 py-0.5',
  },
  legacy: {
    block: 'min-h-[220px]',
    brand: 'text-[11px]',
    title: 'text-lg line-clamp-3',
    meta: 'text-sm',
    badge: 'text-[10px] px-2.5 py-1',
  },
  'legacy-compact': {
    block: 'min-h-[120px]',
    brand: 'text-[10px]',
    title: 'text-base line-clamp-2',
    meta: 'text-xs',
    badge: 'text-[9px] px-2 py-0.5',
  },
  center: {
    block: 'min-h-[220px] md:min-h-[240px]',
    brand: 'text-[11px]',
    title: 'text-base line-clamp-2',
    meta: 'text-xs',
    badge: 'text-[10px] px-2.5 py-1',
  },
  'mobile-sticky': {
    block: 'min-h-[80px]',
    brand: 'text-[10px]',
    title: 'text-sm line-clamp-1',
    meta: 'text-[10px]',
    badge: 'text-[9px] px-2 py-0.5',
  },
  'mobile-inline': {
    block: 'min-h-[120px]',
    brand: 'text-[10px]',
    title: 'text-sm line-clamp-2',
    meta: 'text-xs',
    badge: 'text-[9px] px-2 py-0.5',
  },
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
  const mediaUrl = getCampaignMediaUrl(campaign)
  const styles = variantStyles[variant]
  const pad = variant === 'stack' ? 'p-2.5' : variant === 'mobile-sticky' ? 'p-3 pr-10' : 'p-4'

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className={`group relative block overflow-hidden ${adOverlayGlow} ${styles.block} ${className}`}
      onClick={() => void trackAdClick(campaign.id)}
    >
      <img
        src={mediaUrl}
        alt={campaign.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        onError={(e) => {
          e.currentTarget.src = AD_MEDIA_FALLBACK
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/45 to-black/20"
        aria-hidden
      />

      <div className={`relative z-[1] flex h-full min-h-[inherit] flex-col justify-between ${pad}`}>
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full bg-black/35 font-bold uppercase tracking-[0.12em] text-white/95 backdrop-blur-sm ${styles.badge}`}
        >
          <Megaphone className="h-3 w-3 shrink-0" />
          {t('ads.badge')}
        </span>

        <div className="mt-auto space-y-0.5 pt-2">
          {brand && (
            <p className={`font-bold uppercase tracking-[0.1em] text-white/75 ${styles.brand}`}>
              {brand}
            </p>
          )}
          <h3 className={`font-extrabold leading-snug text-white ${styles.title}`}>
            {campaign.title}
          </h3>
          {showDescription && campaign.description && (
            <p className={`line-clamp-2 leading-5 text-white/85 ${styles.meta}`}>
              {campaign.description}
            </p>
          )}
          {showGeo && (
            <p className={`line-clamp-1 text-white/75 ${styles.meta}`}>
              {getGeoTargetLabel(campaign, t)}
            </p>
          )}
          <span
            className={`inline-flex items-center gap-1 font-semibold text-white/95 ${styles.meta}`}
          >
            {t('ads.visit')}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
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
  const pad = variant === 'stack' ? 'p-2.5' : 'p-4'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative block w-full overflow-hidden bg-[linear-gradient(135deg,rgba(71,85,105,0.55),rgba(51,65,85,0.72))] text-left ${adOverlayGlow} ${styles.block} ${className}`}
    >
      <div
        className={`relative z-[1] flex h-full min-h-[inherit] flex-col justify-between ${pad}`}
      >
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full bg-black/30 font-bold uppercase tracking-[0.12em] text-white/90 ${styles.badge}`}
        >
          <Megaphone className="h-3 w-3" />
          {t('ads.badge')}
        </span>
        <div className="mt-auto space-y-1 pt-2">
          <p className={`font-extrabold text-white ${styles.title}`}>{title}</p>
          <p className={`text-white/80 ${styles.meta}`}>{subtitle}</p>
        </div>
      </div>
    </button>
  )
}
