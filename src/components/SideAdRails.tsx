import { useMemo } from 'react'
import { createPortal } from 'react-dom'
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

/** Fixed бокові рейки в viewport; портал у body — не зникають при зміні маршруту */
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
  // Для «default» (у т.ч. сторінка реклами) не фіксуємо рейки на весь viewport,
  // щоб футер не заїжджав під бокові баннери.
  const fixedViewport = page === 'home' || page === 'listings' || page === 'professionals'

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {hasLeftRail ? (
        <AdBanner
          position="left"
          sticky
          fixedViewport={fixedViewport}
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.left}
        />
      ) : null}
      {hasRightRail ? (
        <AdBanner
          position="right"
          sticky
          fixedViewport={fixedViewport}
          page={page}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.right}
        />
      ) : null}
    </>,
    document.body,
  )
}
