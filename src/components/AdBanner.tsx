import { useEffect, useMemo, type ReactNode } from 'react'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'
import { pickCampaignsForSideStack, trackAdImpression } from '../lib/adCampaigns'
import { adSlotTailwind } from '../lib/adSlotLayout'
import { pageKeyFromSideAdsPage } from '../lib/adPlacementSlots'

interface AdBannerProps {
  position: 'left' | 'right'
  sticky?: boolean
  page?: 'home' | 'listings' | 'professionals' | 'default'
  stackCount?: number
}

const STICKY_TOP = 'top-[8rem] xl:top-[9rem]'

const SIDE_RAIL_WIDTH =
  'hidden w-[200px] shrink-0 lg:flex lg:flex-col xl:w-[216px] 2xl:w-[252px]'

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
      <aside className={`${SIDE_RAIL_WIDTH} h-full min-h-full ${className}`}>
        {children}
      </aside>
    )
  }

  return (
    <aside className={`${SIDE_RAIL_WIDTH} h-full min-h-0 ${className}`}>
      <div className={`sticky z-20 h-fit w-full ${STICKY_TOP}`}>{children}</div>
    </aside>
  )
}

export function AdBanner({ position, sticky = true, page, stackCount }: AdBannerProps) {
  const { loading, getForSlots } = usePaidAds()

  const pageKey = pageKeyFromSideAdsPage(page)
  const sideSlots = useMemo(() => sideSlotIdsForPage(pageKey), [pageKey])

  const pool = useMemo(
    () => getForSlots(sideSlots, stackCount ? 24 : 8),
    [getForSlots, sideSlots, stackCount],
  )

  const stackCampaigns = useMemo(() => {
    if (!stackCount || stackCount < 2) return []
    return pickCampaignsForSideStack(pool, position, stackCount, page)
  }, [pool, position, stackCount, page])

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
        ? stackCampaigns.filter(Boolean)
        : [primaryCampaign, secondaryCampaign].filter(Boolean)
    for (const c of toTrack) {
      if (c) void trackAdImpression(c.id)
    }
  }, [loading, stackCount, stackCampaigns, primaryCampaign, secondaryCampaign])

  if (loading) return null

  if (stackCount && stackCount >= 2) {
    if (!stackCampaigns.some(Boolean)) return null

    return (
      <SideRailFrame sticky={sticky}>
        <div className="flex w-full flex-col gap-2 py-0.5 2xl:gap-3">
          {stackCampaigns.map((campaign, index) =>
            campaign ? (
              <div
                key={`${campaign.id}-${index}`}
                className={`${adSlotTailwind.sideStackSlot} overflow-hidden`}
              >
                <AdOverlayCard
                  campaign={campaign}
                  variant="stack"
                  className="h-full w-full"
                  showDescription
                />
              </div>
            ) : null,
          )}
        </div>
      </SideRailFrame>
    )
  }

  if (!primaryCampaign && !secondaryCampaign) return null

  return (
    <SideRailFrame sticky={sticky} className={sticky ? '' : 'h-fit'}>
      <div className={`flex min-h-0 flex-col overflow-hidden ${sticky ? 'max-h-full' : ''}`}>
        {primaryCampaign && (
          <div className="overflow-hidden">
            <AdOverlayCard campaign={primaryCampaign} variant="legacy" />
          </div>
        )}

        {sticky && secondaryCampaign && (
          <div className={`overflow-hidden ${primaryCampaign ? 'mt-3' : ''}`}>
            <AdOverlayCard campaign={secondaryCampaign} variant="legacy-compact" />
          </div>
        )}
      </div>
    </SideRailFrame>
  )
}
