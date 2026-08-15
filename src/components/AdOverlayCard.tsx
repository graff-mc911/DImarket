import { type CSSProperties } from 'react'
import { Megaphone } from 'lucide-react'
import {
  getGeoTargetLabel,
  getPublicBannerImageUrl,
  localizeAdDisplayCopy,
  trackAdClick,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'
import { campaignWithSlotMedia, mediaStateFromCampaignAndSlot } from '../lib/adSlotMedia'
import { layoutKeyFromOverlayVariant } from '../lib/adBannerLayouts'
import { AdMediaDisplay } from './AdMediaDisplay'
import { useApp } from '../contexts/AppContext'
import { AD_TEXT_PANEL_CLASS, adSlotTailwind } from '../lib/adSlotLayout'
import {
  adSlotImageStyle,
  adSlotShellStyle,
  resolveAdSlotSpec,
  type AdOverlayVariantKey,
} from '../lib/adSlotDisplay'

export const adOverlayGlow =
  'rounded-[14px] border border-[rgba(219,148,94,0.2)] bg-[rgba(255,252,248,0.98)] shadow-[0_2px_8px_rgba(67,44,26,0.07)] transition duration-300 hover:border-[rgba(219,148,94,0.32)] hover:shadow-[0_3px_12px_rgba(67,44,26,0.1)]'

type AdOverlayVariant = AdOverlayVariantKey

interface AdOverlayCardProps {
  campaign: AdCampaignWithAdvertiser
  variant: AdOverlayVariant
  className?: string
  showDescription?: boolean
  showGeo?: boolean
  /** Лише зображення на весь банер (leaderboard 4:1) */
  imageOnly?: boolean
  /** Гранульований слот — окреме медіа з slot_media */
  slotId?: string
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
    textInner?: string
  }
> = {
  stack: {
    shell: 'grid h-full w-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden',
    image: 'ad-slot-side__media ad-slot-side__media--stack-flex w-full min-h-0 overflow-hidden',
    text: 'ad-side-stack-card__text shrink-0 px-1.5 py-0.5',
    textInner: 'space-y-0 leading-[1.15]',
    brand: 'text-[8px] leading-none',
    title: 'text-[9px] line-clamp-1 leading-[1.1]',
    meta: 'ad-side-stack-desc text-[9px] line-clamp-1 leading-[1.15]',
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
    shell: `${adSlotTailwind.center} ad-slot-center`,
    image: 'ad-slot-center__media w-full min-h-0 shrink-0 overflow-hidden',
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
    image: 'w-full min-h-0 shrink-0 overflow-hidden',
    text: 'px-2 py-1',
    brand: 'text-[9px]',
    title: 'text-xs line-clamp-2 leading-tight',
    meta: 'text-[10px] line-clamp-1 leading-tight',
  },
  leaderboard: {
    shell: adSlotTailwind.leaderboard,
    image: 'ad-slot-leaderboard__media w-full min-h-0 shrink-0 overflow-hidden',
    text: 'hidden',
    brand: 'hidden',
    title: 'hidden',
    meta: 'hidden',
  },
}

function AdCampaignMedia({
  campaign,
  imageClass,
  imageStyle,
  variant,
  slotId,
}: {
  campaign: AdCampaignWithAdvertiser
  imageClass: string
  imageStyle?: CSSProperties
  variant: AdOverlayVariant
  slotId?: string
}) {
  const resolved = campaignWithSlotMedia(
    campaign as AdCampaignWithAdvertiser & { slot_media?: unknown },
    slotId,
  )
  const slotState = mediaStateFromCampaignAndSlot(
    campaign as AdCampaignWithAdvertiser & { slot_media?: unknown; media_style?: unknown },
    slotId,
  )
  const shouldAdaptRatio =
    (variant === 'mobile-inline' ||
      variant === 'center' ||
      variant === 'leaderboard') &&
    (slotState.mediaType === 'image' || slotState.mediaType === 'gif')
  // Width fluid; height comes from the real asset (no fixed 248px slot crop/stretch).
  const adaptiveImageStyle: CSSProperties | undefined = shouldAdaptRatio
    ? {
        ...(imageStyle ?? {}),
        width: '100%',
        height: 'auto',
        minHeight: 0,
        maxHeight: 'none',
      }
    : imageStyle
  const imageSrc =
    slotState.slideUrls[0] ||
    slotState.mediaUrl ||
    (slotId ? '' : getPublicBannerImageUrl(resolved))
  const mediaStyle = slotState.mediaStyle
  const layoutKey = layoutKeyFromOverlayVariant(variant)
  const mediaType =
    slotState.mediaType === 'video' || slotState.mediaType === 'gif'
      ? slotState.mediaType
      : resolved.media_type === 'video' || resolved.media_type === 'gif'
        ? resolved.media_type
        : 'image'

  if (!imageSrc.trim()) {
    return (
      <div
        className={imageClass}
        style={adaptiveImageStyle}
      >
        <div className="flex h-full min-h-[4.5rem] w-full items-center justify-center bg-[linear-gradient(135deg,rgba(71,85,105,0.35),rgba(51,65,85,0.5))]">
          <Megaphone className="h-5 w-5 text-white/70" />
        </div>
      </div>
    )
  }

  return (
    <div className={imageClass} style={adaptiveImageStyle}>
      <AdMediaDisplay
        src={imageSrc}
        alt={campaign.title}
        mediaType={mediaType}
        style={mediaStyle}
        layoutKey={layoutKey}
        className={shouldAdaptRatio ? 'h-auto w-full' : 'h-full w-full'}
        animateSlides
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
  const desc = description?.trim()

  return (
    <div className={styles.textInner ?? 'space-y-0.5 leading-tight'}>
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
  showDescription = variant === 'stack',
  showGeo = false,
  imageOnly = false,
  slotId,
}: AdOverlayCardProps) {
  const { t } = useApp()
  const { brand, title } = localizeAdDisplayCopy(campaign, t)
  const styles = variantStyles[variant]
  const isLeaderboard = variant === 'leaderboard' || imageOnly
  const showDesc = showDescription && Boolean(campaign.description?.trim())
  const geoLabel = showGeo ? getGeoTargetLabel(campaign, t) : null
  const showText = hasAdTextBlock(brand, title, showDesc ? campaign.description : null, geoLabel)
  const slotState = mediaStateFromCampaignAndSlot(
    campaign as AdCampaignWithAdvertiser & { slot_media?: unknown; media_style?: unknown },
    slotId,
  )
  const textOnImage = Boolean(slotState.mediaStyle.textOverlay) && !isLeaderboard
  const slotSpec = resolveAdSlotSpec(slotId, variant)
  const shellStyle: CSSProperties | undefined =
    slotSpec && variant !== 'stack' ? adSlotShellStyle(slotSpec, variant) : undefined
  const imageStyle: CSSProperties | undefined =
    variant === 'stack'
      ? { width: '100%', height: '100%', minHeight: 0, maxHeight: '100%' }
      : slotSpec
        ? adSlotImageStyle(slotSpec, variant)
        : undefined

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className={`group overflow-hidden ${adOverlayGlow} ${styles.shell} ${variant !== 'stack' ? 'flex flex-col' : ''} ${className}`}
      style={shellStyle}
      onClick={() => void trackAdClick(campaign.id)}
    >
      <div className={`relative ${variant === 'stack' ? 'min-h-0 h-full' : 'min-h-0 shrink-0'}`}>
        <AdCampaignMedia
          campaign={campaign}
          slotId={slotId}
          variant={variant}
          imageClass={styles.image}
          imageStyle={imageStyle}
        />
        {textOnImage && showText && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-2">
            {brand ? (
              <p className={`font-bold uppercase tracking-[0.08em] text-white/75 ${styles.brand}`}>
                {brand}
              </p>
            ) : null}
            {title ? (
              <p className={`font-extrabold text-white ${styles.title}`}>{title}</p>
            ) : null}
            {showDesc && campaign.description?.trim() ? (
              <p className={`mt-0.5 text-white/90 ${styles.meta}`}>{campaign.description.trim()}</p>
            ) : null}
          </div>
        )}
      </div>

      {!isLeaderboard && showText && !textOnImage && (
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
