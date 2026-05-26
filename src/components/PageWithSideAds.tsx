import { useMemo, type ReactNode } from 'react'
import { AdBanner } from './AdBanner'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { pickSideStacksForPage } from '../lib/adCampaigns'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'
import { pageKeyFromSideAdsPage } from '../lib/adPlacementSlots'

export type SideAdsPage = 'home' | 'listings' | 'professionals' | 'default'

const SIDE_STACK_COUNT = 4

export function adPageForPath(path: string): SideAdsPage {
  if (path === '/') return 'home'
  if (path === '/listings' || path === '/vacancies' || path === '/sell-rent') return 'listings'
  if (path === '/professionals') return 'professionals'
  if (path === '/advertising' || path === '/advertise' || path === '/create-ad' || path === '/assistant/job') {
    return 'default'
  }
  return 'default'
}

/** Бокові рейки лише там, де вони є в макеті сторінки */
export function pathUsesSideAdRails(path: string): boolean {
  if (
    path === '/' ||
    path === '/listings' ||
    path === '/vacancies' ||
    path === '/sell-rent' ||
    path === '/professionals' ||
    path === '/contact' ||
    path === '/create-ad' ||
    path === '/assistant/job' ||
    path === '/advertising' ||
    path === '/advertise'
  ) {
    return true
  }
  if (path.startsWith('/listing/') || path.startsWith('/professional/')) return true
  return false
}

interface PageWithSideAdsProps {
  children: ReactNode
  page?: SideAdsPage
  className?: string
  /** false — повна ширина без бокових рейок (реклама, логін, кабінет…) */
  showSideAds?: boolean
}

export function PageWithSideAds({
  children,
  page = 'default',
  className = '',
  showSideAds = true,
}: PageWithSideAdsProps) {
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
  const reserveRails = true

  if (!showSideAds) {
    return (
      <div className={`page-bg min-h-screen pb-8 ${className}`}>
        <div className="layout-page-gutter min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className={`page-bg min-h-screen pb-8 ${className}`}>
      <div className="layout-with-side-ads">
        {hasLeftRail ? (
          <AdBanner
            position="left"
            sticky
            page={page}
            stackCount={SIDE_STACK_COUNT}
            stackCampaigns={sideStacks.left}
          />
        ) : reserveRails ? (
          <aside className="ad-side-rail ad-side-rail--left h-full min-h-full" aria-hidden />
        ) : null}
        <div className="layout-with-side-ads__main">{children}</div>
        {hasRightRail ? (
          <AdBanner
            position="right"
            sticky
            page={page}
            stackCount={SIDE_STACK_COUNT}
            stackCampaigns={sideStacks.right}
          />
        ) : reserveRails ? (
          <aside className="ad-side-rail ad-side-rail--right h-full min-h-full" aria-hidden />
        ) : null}
      </div>
    </div>
  )
}
