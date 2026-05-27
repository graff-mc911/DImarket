import { useMemo, type ReactNode } from 'react'
import { AdBanner } from './AdBanner'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { pickSideStacksForPageWithFallback } from '../lib/adCampaigns'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'
import type { SideAdsPage } from './PageWithSideAds'

const SIDE_STACK_COUNT = 4

type SideAdRailsLayoutProps = {
  page: SideAdsPage
  children: ReactNode
}

function allCatalogSideSlotIds(): string[] {
  return [
    ...sideSlotIdsForPage('home'),
    ...sideSlotIdsForPage('listings'),
    ...sideSlotIdsForPage('professionals'),
    ...sideSlotIdsForPage('default'),
  ]
}

function EmptySideRail({ position }: { position: 'left' | 'right' }) {
  return (
    <div
      className={`ad-side-rail ad-side-rail--${position} ad-side-rail--empty`}
      aria-hidden
    />
  )
}

/**
 * Сітка: бокові рейки (sticky під шапкою) + центр (контент + футер).
 * При скролі до футера банери піднімаються разом із ним; при SPA-переходах рейки лишаються на місці.
 */
export function SideAdRailsLayout({ page, children }: SideAdRailsLayoutProps) {
  const { loading, getForSlots } = usePaidAds()
  const sideSlots = useMemo(() => allCatalogSideSlotIds(), [])
  const sideCampaigns = useMemo(() => getForSlots(sideSlots, 48), [getForSlots, sideSlots])

  const sideStacks = useMemo(
    () => pickSideStacksForPageWithFallback(sideCampaigns, SIDE_STACK_COUNT, page),
    [sideCampaigns, page],
  )

  const hasLeftRail = !loading && sideStacks.left.some(Boolean)
  const hasRightRail = !loading && sideStacks.right.some(Boolean)

  return (
    <div className="layout-with-side-ads flex-1">
      {hasLeftRail ? (
        <AdBanner
          position="left"
          sticky
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.left}
        />
      ) : (
        <EmptySideRail position="left" />
      )}
      <div className="layout-with-side-ads__main flex min-w-0 flex-col">{children}</div>
      {hasRightRail ? (
        <AdBanner
          position="right"
          sticky
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.right}
        />
      ) : (
        <EmptySideRail position="right" />
      )}
    </div>
  )
}
