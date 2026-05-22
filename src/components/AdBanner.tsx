import { useEffect, useMemo } from 'react'
import { ExternalLink, Megaphone } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import {
  AD_MEDIA_FALLBACK,
  getAdvertiserLabel,
  getCampaignMediaUrl,
  trackAdClick,
  trackAdImpression,
  type AdCampaignWithAdvertiser,
  type AdPlacement,
} from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

interface AdBannerProps {
  position: 'left' | 'right'
  sticky?: boolean
  page?: 'home' | 'listings'
  /** Кількість блоків у колонці (наприклад 6 на головній) */
  stackCount?: number
}

function slotsForPage(page?: 'home' | 'listings'): AdPlacement[] {
  if (page === 'home') return ['home', 'sidebar', 'footer']
  if (page === 'listings') return ['listings', 'sidebar', 'home']
  return ['sidebar', 'home', 'listings', 'footer']
}

function campaignsForSide(
  all: AdCampaignWithAdvertiser[],
  position: 'left' | 'right',
  count: number,
): AdCampaignWithAdvertiser[] {
  if (all.length === 0 || count <= 0) return []
  const offset = position === 'right' ? count : 0
  const picked: AdCampaignWithAdvertiser[] = []
  for (let i = 0; i < count; i++) {
    picked.push(all[(offset + i) % all.length])
  }
  return picked
}

const stackGlow =
  'rounded-[18px] bg-white/22 shadow-[0_0_0_1px_rgba(255,255,255,0.42),0_6px_28px_rgba(15,23,42,0.05)] backdrop-blur-[2px] transition duration-300 hover:bg-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.58),0_10px_32px_rgba(199,138,96,0.1)]'

export function AdBanner({ position, sticky = true, page, stackCount }: AdBannerProps) {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()

  const pool = useMemo(
    () => getForSlots(slotsForPage(page), stackCount ? stackCount * 2 : 6),
    [getForSlots, page, stackCount],
  )

  const stackCampaigns = useMemo(() => {
    if (!stackCount || stackCount < 2) return []
    return campaignsForSide(pool, position, stackCount)
  }, [pool, position, stackCount])

  const [primaryCampaign, secondaryCampaign] = useMemo(() => {
    if (stackCount && stackCount >= 2) return [null, null] as const
    if (pool.length === 0) return [null, null] as const
    if (position === 'left') {
      return [pool[0] || null, pool[1] || null] as const
    }
    return [pool[1] || pool[0] || null, pool[2] || pool[0] || null] as const
  }, [pool, position, stackCount])

  useEffect(() => {
    if (loading) return
    const toTrack =
      stackCount && stackCount >= 2
        ? stackCampaigns
        : [primaryCampaign, secondaryCampaign].filter(Boolean)
    for (const c of toTrack) {
      if (c) void trackAdImpression(c.id)
    }
  }, [loading, stackCount, stackCampaigns, primaryCampaign, secondaryCampaign])

  if (stackCount && stackCount >= 2) {
    return (
      <aside
        className={`hidden w-full xl:block ${sticky ? 'sticky top-20' : ''}`}
      >
        <div
          className="flex min-h-0 flex-col justify-between gap-2 py-1"
          style={{ height: sticky ? 'calc(100vh - 5rem)' : undefined }}
        >
          {loading
            ? Array.from({ length: stackCount }, (_, i) => (
                <div
                  key={i}
                  className={`min-h-0 flex-1 animate-pulse ${stackGlow}`}
                />
              ))
            : stackCampaigns.length > 0
              ? stackCampaigns.map((campaign, index) => (
                  <div key={`${campaign.id}-${index}`} className="min-h-0 flex-1">
                    <SidebarStackCard campaign={campaign} />
                  </div>
                ))
              : Array.from({ length: stackCount }, (_, i) => (
                  <div key={i} className="min-h-0 flex-1">
                    <SidebarStackPlaceholder
                      onAdvertise={() => navigateTo('/advertising')}
                    />
                  </div>
                ))}
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`hidden h-fit w-full xl:block ${sticky ? 'sticky top-20' : ''}`}
      style={{ maxHeight: sticky ? 'calc(100vh - 6rem)' : undefined }}
    >
      <div className={`relative overflow-hidden p-4 ${stackGlow}`}>
        {loading ? (
          <LegacyLoadingState />
        ) : primaryCampaign ? (
          <LegacyCampaignCard campaign={primaryCampaign} compact={false} />
        ) : (
          <LegacyPlaceholder
            title={t('ads.adSpace')}
            text={t('ads.advertiseHere')}
            tall
            onAdvertise={() => navigateTo('/advertising')}
          />
        )}
      </div>

      {sticky && (
        <div className={`relative mt-3 overflow-hidden p-3 ${stackGlow}`}>
          {loading ? (
            <div className="h-24 animate-pulse rounded-[16px] bg-white/15" />
          ) : secondaryCampaign ? (
            <LegacyCampaignCard campaign={secondaryCampaign} compact={true} />
          ) : (
            <LegacyPlaceholder
              title={t('ads.stickyAdBlock')}
              text={t('ads.premiumPlacement')}
              tall={false}
              onAdvertise={() => navigateTo('/advertising')}
            />
          )}
        </div>
      )}
    </aside>
  )
}

function SidebarStackCard({ campaign }: { campaign: AdCampaignWithAdvertiser }) {
  const { t } = useApp()
  const brand = getAdvertiserLabel(campaign)
  const mediaUrl = getCampaignMediaUrl(campaign)

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className={`flex h-full min-h-0 flex-col overflow-hidden p-2.5 ${stackGlow}`}
      onClick={() => void trackAdClick(campaign.id)}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-white/10">
        <img
          src={mediaUrl}
          alt={campaign.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = AD_MEDIA_FALLBACK
          }}
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
          {t('ads.badge')}
        </span>
      </div>

      <div className="mt-2 shrink-0 space-y-0.5">
        {brand && (
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-500)]">
            {brand}
          </p>
        )}
        <h3 className="line-clamp-2 text-[11px] font-extrabold leading-snug text-[var(--ink-900)]">
          {campaign.title}
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-700)]">
          {t('ads.visit')}
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  )
}

function SidebarStackPlaceholder({ onAdvertise }: { onAdvertise: () => void }) {
  const { t } = useApp()

  return (
    <button
      type="button"
      onClick={onAdvertise}
      className={`flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 p-3 text-center ${stackGlow}`}
    >
      <Megaphone className="h-4 w-4 text-[var(--ink-500)]" />
      <span className="text-[11px] font-bold text-[var(--ink-800)]">{t('ads.adSpace')}</span>
      <span className="text-[10px] text-[var(--ink-500)]">{t('ads.advertiseHere')}</span>
    </button>
  )
}

function LegacyCampaignCard({
  campaign,
  compact,
}: {
  campaign: AdCampaignWithAdvertiser
  compact: boolean
}) {
  const { t } = useApp()
  const mediaUrl = getCampaignMediaUrl(campaign)
  const imageHeightClass = compact ? 'h-24' : 'h-48'

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className="block"
      onClick={() => void trackAdClick(campaign.id)}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748b]">
        <Megaphone className="h-3.5 w-3.5" />
        <span>{t('ads.badge')}</span>
      </div>

      <div
        className={`mt-3 overflow-hidden rounded-[20px] bg-white/15 ${imageHeightClass}`}
      >
        <img
          src={mediaUrl}
          alt={campaign.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = AD_MEDIA_FALLBACK
          }}
        />
      </div>

      <h3
        className={`mt-3 font-extrabold text-[#2f2a24] ${compact ? 'text-base' : 'text-lg'}`}
      >
        {campaign.title}
      </h3>

      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#475569]">
        {t('ads.visit')}
        <ExternalLink className="h-4 w-4" />
      </span>
    </a>
  )
}

function LegacyPlaceholder({
  title,
  text,
  tall,
  onAdvertise,
}: {
  title: string
  text: string
  tall: boolean
  onAdvertise: () => void
}) {
  return (
    <button
      type="button"
      onClick={onAdvertise}
      className="block w-full text-center"
    >
      <div
        className={`mb-3 flex w-full items-center justify-center rounded-[20px] bg-white/20 text-sm font-bold text-[#475569] ${tall ? 'h-48' : 'h-24'}`}
      >
        {title}
      </div>
      <p className="text-sm font-semibold text-[#2f2a24]">{text}</p>
    </button>
  )
}

function LegacyLoadingState() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
      <div className="h-48 animate-pulse rounded-[20px] bg-white/15" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-white/20" />
    </div>
  )
}
