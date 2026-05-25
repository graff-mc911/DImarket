import { Megaphone } from 'lucide-react'
import {
  getGeoTargetLabel,
  getPublicBannerImageUrl,
  resolveAdDisplayCopy,
  trackAdClick,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'
import { layoutKeyFromOverlayVariant } from '../lib/adBannerLayouts'
import { parseAdMediaStyle } from '../lib/adMediaStyle'
import { AdMediaDisplay } from './AdMediaDisplay'
import { useApp } from '../contexts/AppContext'
import { AD_TEXT_PANEL_CLASS, adSlotTailwind } from '../lib/adSlotLayout'

export const adOverlayGlow =
  'rounded-[14px] border border-[rgba(219,148,94,0.2)] bg-[rgba(255,252,248,0.98)] shadow-[0_2px_8px_rgba(67,44,26,0.07)] transition duration-300 hover:border-[rgba(219,148,94,0.32)] hover:shadow-[0_3px_12px_rgba(67,44,26,0.1)]'

type AdOverlayVariant =
  | 'stack'
  | 'legacy'
  | 'legacy-compact'
  | 'center'
  | 'mobile-sticky'
  | 'mobile-inline'
  | 'leaderboard'

interface AdOverlayCardProps {
  campaign: AdCampaignWithAdvertiser
  variant: AdOverlayVariant
  className?: string
  showDescription?: boolean
  showGeo?: boolean
  /** Лише зображення на весь банер (leaderboard 4:1) */
  imageOnly?: boolean
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
    shell: 'flex h-full w-full min-h-0 flex-col overflow-hidden',
    image: 'min-h-0 w-full flex-1 basis-0',
    text: 'shrink-0 px-1.5 py-0.5',
    brand: 'text-[9px]',
    title: 'text-[10px] line-clamp-1 leading-tight',
    meta: 'text-[9px] line-clamp-1 leading-tight',
  },
  legacy: {
    shell: adSlotTailwind.sideLegacy,
    image: 'h-[7rem] w-full shrink-0',
    text: 'px-2 py-1',
    brand: 'text-[10px]',
    title: 'text-sm line-clamp-2 leading-tight',
    meta: 'text-[10px] line-clamp-1 leading-tight',
  },
  'legacy-compact': {
    shell: adSlotTailwind.sideLegacyCompact,
    image: 'h-[3.75rem] w-full shrink-0',
    text: 'px-2 py-1',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-2 leading-tight',
    meta: 'text-[9px] line-clamp-1 leading-tight',
  },
  center: {
    shell: adSlotTailwind.center,
    image: 'h-[8.75rem] w-full shrink-0 md:h-[9.75rem]',
    text: 'px-2.5 py-1',
    brand: 'text-[10px]',
    title: 'text-sm line-clamp-2 leading-tight',
    meta: 'text-xs line-clamp-2 leading-tight',
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
    shell: adSlotTailwind.mobileInline,
    image: 'h-[4.25rem] w-full shrink-0',
    text: 'px-2 py-1',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-2 leading-tight',
    meta: 'text-[10px] line-clamp-1 leading-tight',
  },
  leaderboard: {
    shell: adSlotTailwind.leaderboard,
    image: 'aspect-[4/1] h-auto w-full max-h-[300px] min-h-[4.5rem]',
    text: 'hidden',
    brand: 'hidden',
    title: 'hidden',
    meta: 'hidden',
  },
}

function AdCampaignMedia({
  campaign,
  imageClass,
  fillBanner = false,
  variant,
}: {
  campaign: AdCampaignWithAdvertiser
  imageClass: string
  fillBanner?: boolean
  variant: AdOverlayVariant
}) {
  const imageSrc = getPublicBannerImageUrl(campaign)
  const mediaStyle = parseAdMediaStyle(
    (campaign as AdCampaignWithAdvertiser & { media_style?: unknown }).media_style,
  )
  const layoutKey = layoutKeyFromOverlayVariant(variant)
  const mediaType =
    campaign.media_type === 'video' || campaign.media_type === 'gif'
      ? campaign.media_type
      : 'image'

  return (
    <AdMediaDisplay
      src={imageSrc}
      alt={campaign.title}
      mediaType={mediaType}
      style={mediaStyle}
      layoutKey={layoutKey}
      className={imageClass}
      imageClassName={
        fillBanner || imageSrc.includes('/ads/banners/')
          ? 'h-full w-full'
          : 'h-full w-full transition duration-500 group-hover:scale-[1.02]'
      }
      animateSlides
    />
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
  const desc = description?.trim()

  return (
    <div className="space-y-0.5 leading-tight">
      {brand && (
        <p className={`font-bold uppercase tracking-[0.08em] text-[var(--ink-500)] ${styles.brand}`}>
          {brand}
        </p>
      )}
      {title && (
        <h3 className={`font-extrabold text-[var(--ink-900)] ${styles.title}`}>{title}</h3>
      )}
      {desc && <p className={`text-[var(--ink-700)] ${styles.meta}`}>{desc}</p>}
      {geo && <p className={`text-[var(--ink-500)] ${styles.meta}`}>{geo}</p>}
    </div>
  )
}

function hasAdTextBlock(
  brand: string,
  title: string,
  description: string | null | undefined,
  geo: string | null | undefined,
): boolean {
  return Boolean(brand || title || description?.trim() || geo)
}

export function AdOverlayCard({
  campaign,
  variant,
  className = '',
  showDescription = false,
  showGeo = false,
  imageOnly = false,
}: AdOverlayCardProps) {
  const { t } = useApp()
  const { brand, title } = resolveAdDisplayCopy(campaign)
  const styles = variantStyles[variant]
  const isLeaderboard = variant === 'leaderboard' || imageOnly
  const showDesc = showDescription && Boolean(campaign.description?.trim())
  const geoLabel = showGeo ? getGeoTargetLabel(campaign, t) : null
  const showText = hasAdTextBlock(brand, title, showDesc ? campaign.description : null, geoLabel)

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className={`group flex flex-col overflow-hidden ${adOverlayGlow} ${styles.shell} ${className}`}
      onClick={() => void trackAdClick(campaign.id)}
    >
      <AdCampaignMedia
        campaign={campaign}
        variant={variant}
        imageClass={styles.image}
        fillBanner={isLeaderboard}
      />

      {!isLeaderboard && showText && (
        <div className={`${AD_TEXT_PANEL_CLASS} ${styles.text}`}>
          <AdTextContent
            brand={brand}
            title={title}
            description={showDesc ? campaign.description : null}
            geo={geoLabel}
            styles={styles}
          />
        </div>
      )}
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
  const isLeaderboard = variant === 'leaderboard'

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

      {!isLeaderboard && (
        <div className={`${AD_TEXT_PANEL_CLASS} ${styles.text}`}>
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
      )}
    </button>
  )
}
