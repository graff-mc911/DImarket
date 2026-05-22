import { useEffect, useMemo, type ReactNode } from 'react'
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
  page?: 'home' | 'listings' | 'default'
  stackCount?: number
}

function slotsForPage(page?: 'home' | 'listings' | 'default'): AdPlacement[] {
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

const STICKY_TOP = 'top-[8rem] xl:top-[9rem]'
const STICKY_VIEWPORT_H =
  'h-[calc(100vh-8rem)] max-h-full min-h-0 xl:h-[calc(100vh-9rem)]'

function SideRailFrame({
  sticky,
  children,
  className = '',
}: {
  sticky: boolean
  children: ReactNode
  className?: string
}) {
  if (!sticky) {
    return (
      <aside className={`hidden h-full min-h-full w-full flex-1 flex-col xl:flex ${className}`}>
        {children}
      </aside>
    )
  }

  return (
    <aside className={`hidden h-full min-h-0 w-full xl:flex xl:flex-col ${className}`}>
      <div className={`sticky z-20 w-full ${STICKY_TOP} ${STICKY_VIEWPORT_H}`}>{children}</div>
    </aside>
  )
}

export function AdBanner({ position, sticky = true, page, stackCount }: AdBannerProps) {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()

  const pool = useMemo(
    () => getForSlots(slotsForPage(page), stackCount ? stackCount * 2 : 8),
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
      <SideRailFrame sticky={sticky}>
        <div
          className="grid h-full min-h-0 w-full gap-2 py-0.5 2xl:gap-3"
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
      </SideRailFrame>
    )
  }

  return (
    <SideRailFrame sticky={sticky} className={sticky ? '' : 'h-fit'}>
      <div className={`flex min-h-0 flex-col overflow-hidden ${sticky ? 'max-h-full' : ''}`}>
        <div className="overflow-hidden">
          {loading ? (
            <div className={`mx-auto min-h-[198px] w-[90%] animate-pulse bg-white/20 ${adOverlayGlow}`} />
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
              <div className={`mx-auto min-h-[108px] w-[90%] animate-pulse bg-white/20 ${adOverlayGlow}`} />
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
      </div>
    </SideRailFrame>
  )
}
