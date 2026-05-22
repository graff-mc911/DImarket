import { useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard, AdOverlayPlaceholder, adOverlayGlow } from './AdOverlayCard'
import {
  trackAdImpression,
  type AdCampaignWithAdvertiser,
  type AdPlacement,
} from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

interface AdBannerProps {
  position: 'left' | 'right'
  sticky?: boolean
  page?: 'home' | 'listings'
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

const FIXED_TOP = 'top-[8rem] xl:top-[9rem]'
const STACK_FIXED_HEIGHT = 'h-[calc(100vh-8rem)] xl:h-[calc(100vh-9rem)]'

function fixedSideClasses(position: 'left' | 'right', rail: 'home' | 'default') {
  const width =
    rail === 'home' ? 'w-[240px] 2xl:w-[280px]' : 'w-[260px] 2xl:w-[300px]'
  const offset =
    position === 'left'
      ? 'left-4 md:left-6 xl:left-8 2xl:left-10'
      : 'right-4 md:right-6 xl:right-8 2xl:right-10'
  return `${width} ${offset}`
}

export function AdBanner({ position, sticky = true, page, stackCount }: AdBannerProps) {
  const rail = stackCount ? 'home' : 'default'
  const fixedClasses = sticky
    ? `fixed z-30 ${FIXED_TOP} ${fixedSideClasses(position, rail)}`
    : ''
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
        className={`hidden flex-col xl:flex ${
          sticky
            ? `${fixedClasses} ${STACK_FIXED_HEIGHT}`
            : 'h-full min-h-full w-full flex-1'
        }`}
      >
        <div
          className="grid min-h-0 w-full flex-1 gap-2 py-0.5 2xl:gap-3"
          style={{ gridTemplateRows: `repeat(${stackCount}, minmax(0, 1fr))` }}
        >
          {loading
            ? Array.from({ length: stackCount }, (_, i) => (
                <div
                  key={i}
                  className={`min-h-0 overflow-hidden animate-pulse rounded-[14px] bg-white/20 ${adOverlayGlow}`}
                />
              ))
            : stackCampaigns.length > 0
              ? stackCampaigns.map((campaign, index) => (
                  <div key={`${campaign.id}-${index}`} className="min-h-0 overflow-hidden">
                    <AdOverlayCard campaign={campaign} variant="stack" className="h-full min-h-0" />
                  </div>
                ))
              : Array.from({ length: stackCount }, (_, i) => (
                  <div key={i} className="min-h-0 overflow-hidden">
                    <AdOverlayPlaceholder
                      variant="stack"
                      className="h-full min-h-0"
                      title={t('ads.adSpace')}
                      subtitle={t('ads.advertiseHere')}
                      onClick={() => navigateTo('/advertising')}
                    />
                  </div>
                ))}
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`hidden h-fit xl:block ${sticky ? `${fixedClasses}` : 'w-full'}`}
      style={{ maxHeight: sticky ? 'calc(100vh - 9rem)' : undefined }}
    >
      <div className="overflow-hidden">
        {loading ? (
          <div className={`min-h-[220px] animate-pulse bg-white/20 ${adOverlayGlow}`} />
        ) : primaryCampaign ? (
          <AdOverlayCard campaign={primaryCampaign} variant="legacy" />
        ) : (
          <AdOverlayPlaceholder
            variant="legacy"
            title={t('ads.adSpace')}
            subtitle={t('ads.advertiseHere')}
            onClick={() => navigateTo('/advertising')}
          />
        )}
      </div>

      {sticky && (
        <div className="mt-3 overflow-hidden">
          {loading ? (
            <div className={`min-h-[120px] animate-pulse bg-white/20 ${adOverlayGlow}`} />
          ) : secondaryCampaign ? (
            <AdOverlayCard campaign={secondaryCampaign} variant="legacy-compact" />
          ) : (
            <AdOverlayPlaceholder
              variant="legacy-compact"
              title={t('ads.stickyAdBlock')}
              subtitle={t('ads.premiumPlacement')}
              onClick={() => navigateTo('/advertising')}
            />
          )}
        </div>
      )}
    </aside>
  )
}
