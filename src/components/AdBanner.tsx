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
      <div className="hidden h-full min-h-full w-full flex-1 flex-col xl:flex">
        <div className="grid h-1/2 min-h-0 w-full grid-rows-6 gap-1 py-0.5">
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
      </div>
    )
  }

  return (
    <aside
      className={`hidden h-fit w-full xl:block ${sticky ? 'sticky top-20' : ''}`}
      style={{ maxHeight: sticky ? 'calc(100vh - 6rem)' : undefined }}
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
