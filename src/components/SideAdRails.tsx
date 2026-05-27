import { useMemo } from 'react'
import { AdBanner } from './AdBanner'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { pickSideStacksForPageWithFallback } from '../lib/adCampaigns'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'
import type { SideAdsPage } from './PageWithSideAds'

const SIDE_STACK_COUNT = 4

type SideAdRailsProps = {
  page: SideAdsPage
}

function allCatalogSideSlotIds(): string[] {
  return [
    ...sideSlotIdsForPage('home'),
    ...sideSlotIdsForPage('listings'),
    ...sideSlotIdsForPage('professionals'),
    ...sideSlotIdsForPage('default'),
  ]
}

/** Fixed бокові рейки в viewport; рендер у app-shell (не portal), щоб футер міг бути поверх */
export function SideAdRails({ page }: SideAdRailsProps) {
  const { loading, getForSlots } = usePaidAds()
  const sideSlots = useMemo(() => allCatalogSideSlotIds(), [])
  const sideCampaigns = useMemo(() => getForSlots(sideSlots, 48), [getForSlots, sideSlots])

  const sideStacks = useMemo(
    () => pickSideStacksForPageWithFallback(sideCampaigns, SIDE_STACK_COUNT, page),
    [sideCampaigns, page],
  )

  const hasLeftRail = !loading && sideStacks.left.some(Boolean)
  const hasRightRail = !loading && sideStacks.right.some(Boolean)

  if (!hasLeftRail && !hasRightRail) return null

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
      ) : null}
      {hasRightRail ? (
        <AdBanner
          position="right"
          sticky
          fixedViewport
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.right}
        />
      ) : null}
    </>
  )
}
