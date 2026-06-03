import { useEffect, useMemo, type ReactNode } from 'react'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'
import {
  pickCampaignsForSideStack,
  trackAdImpression,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'
import {
  AD_SIDE_STACK_CELL_CLASS,
  AD_SIDE_STACK_GRID_CLASS,
  AD_SIDE_RAIL_STICKY_FIT_CLASS,
  AD_SIDE_RAIL_STICKY_STACK_CLASS,
  adSlotTailwind,
} from '../lib/adSlotLayout'
import { pageKeyFromSideAdsPage, sideSlotId, type SideIndex } from '../lib/adPlacementSlots'

interface AdBannerProps {
  position: 'left' | 'right'
  sticky?: boolean
  /** Fixed у viewport (shell layout) */
  fixedViewport?: boolean
  page?: 'home' | 'listings' | 'professionals' | 'default'
  stackCount?: number
  /** Якщо задано — не рахувати слоти повторно (спільний пул L/R) */
  stackCampaigns?: (AdCampaignWithAdvertiser | null)[]
}

const SIDE_RAIL_CLASS = 'ad-side-rail shrink-0'

function SideRailFrame({
  position,
  sticky,
  fixedViewport = false,
  children,
  className = '',
  fillViewport = false,
}: {
  position: 'left' | 'right'
  sticky: boolean
  fixedViewport?: boolean
  children: ReactNode
  className?: string
  fillViewport?: boolean
}) {
  const positionClass = position === 'left' ? 'ad-side-rail--left' : 'ad-side-rail--right'
  const fixedClass = fixedViewport ? ' ad-side-rail--viewport-fixed' : ''

  if (!sticky) {
    return (
      <aside className={`${SIDE_RAIL_CLASS} ${positionClass}${fixedClass} h-full min-h-full ${className}`}>
        {children}
      </aside>
    )
  }

  return (
    <aside className={`${SIDE_RAIL_CLASS} ${positionClass}${fixedClass} h-full min-h-0 ${className}`}>
      <div
        className={
          fillViewport ? AD_SIDE_RAIL_STICKY_STACK_CLASS : AD_SIDE_RAIL_STICKY_FIT_CLASS
        }
      >
        {children}
      </div>
    </aside>
  )
}

export function AdBanner({
  position,
  sticky = true,
  fixedViewport = false,
  page,
  stackCount,
  stackCampaigns: stackCampaignsProp,
}: AdBannerProps) {
  const { loading, getForSlots } = usePaidAds()

  const pageKey = pageKeyFromSideAdsPage(page)
  const sideSlots = useMemo(() => sideSlotIdsForPage(pageKey), [pageKey])

  const pool = useMemo(
    () => getForSlots(sideSlots, stackCount ? 24 : 8),
    [getForSlots, sideSlots, stackCount],
  )

  const stackCampaigns = useMemo(() => {
    if (stackCampaignsProp) return stackCampaignsProp
    if (!stackCount || stackCount < 2) return []
    return pickCampaignsForSideStack(pool, position, stackCount, page)
  }, [stackCampaignsProp, pool, position, stackCount, page])

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

  const hasStackMedia = stackCount && stackCount >= 2 && stackCampaigns.some(Boolean)

  if (loading && !hasStackMedia && !primaryCampaign && !secondaryCampaign) return null

  if (stackCount && stackCount >= 2) {
    if (!stackCampaigns.some(Boolean)) return null

    return (
      <SideRailFrame position={position} sticky={sticky} fixedViewport={fixedViewport} fillViewport>
        <div className={AD_SIDE_STACK_GRID_CLASS}>
          {stackCampaigns.map((campaign, index) => {
            const slotId = sideSlotId(pageKey, position, (index + 1) as SideIndex)
            return (
            <div
              key={campaign ? `${campaign.id}-${index}` : `empty-${index}`}
              className={AD_SIDE_STACK_CELL_CLASS}
            >
              {campaign ? (
                <AdOverlayCard
                  campaign={campaign}
                  slotId={slotId}
                  variant="stack"
                  showDescription
                  className={adSlotTailwind.sideStackSlot}
                />
              ) : null}
            </div>
            )
          })}
        </div>
      </SideRailFrame>
    )
  }

  if (!primaryCampaign && !secondaryCampaign) return null

  return (
    <SideRailFrame position={position} sticky={sticky} fixedViewport={fixedViewport} className={sticky ? '' : 'h-fit'}>
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
