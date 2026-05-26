import { useMemo } from 'react'
import { AdBanner } from './AdBanner'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { pickSideStacksForPage } from '../lib/adCampaigns'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'
import { pageKeyFromSideAdsPage } from '../lib/adPlacementSlots'
import type { SideAdsPage } from './PageWithSideAds'

const SIDE_STACK_COUNT = 4

type SideAdRailsProps = {
  page: SideAdsPage
}

/** Бокові рейки — fixed у viewport; контент слотів оновлюється при зміні сторінки */
export function SideAdRails({ page }: SideAdRailsProps) {
  const { loading, getForSlots } = usePaidAds()
  const pageKey = pageKeyFromSideAdsPage(page)
  const sideSlots = useMemo(() => sideSlotIdsForPage(pageKey), [pageKey])
  const sideCampaigns = useMemo(() => getForSlots(sideSlots, 24), [getForSlots, sideSlots])

  const sideStacks = useMemo(
    () => pickSideStacksForPage(sideCampaigns, SIDE_STACK_COUNT, page),
    [sideCampaigns, page],
  )

  const hasLeftRail = !loading && sideStacks.left.some(Boolean)
  const hasRightRail = !loading && sideStacks.right.some(Boolean)

  const emptyRailClass =
    'ad-side-rail ad-side-rail--viewport-fixed h-full min-h-0 pointer-events-none'

  return (
    <>
      {hasLeftRail ? (
        <AdBanner
          position="left"
          sticky
          fixedViewport
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.left}
        />
      ) : (
        <aside className={`${emptyRailClass} ad-side-rail--left`} aria-hidden />
      )}
      {hasRightRail ? (
        <AdBanner
          position="right"
          sticky
          fixedViewport
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.right}
        />
      ) : (
        <aside className={`${emptyRailClass} ad-side-rail--right`} aria-hidden />
      )}
    </>
  )
}
