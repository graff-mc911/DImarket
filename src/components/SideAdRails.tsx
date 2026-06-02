import { useMemo, useRef, type ReactNode } from 'react'
import { AdBanner } from './AdBanner'
import { usePaidAds } from '../contexts/PaidAdsContext'
import {
  pickSideStacksForPageWithFallback,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'
import { sideSlotIdsForPage } from '../lib/adPlacementCatalog'

const SIDE_STACK_COUNT = 4
/** Один набір слотів/креативів для всіх маршрутів — без «стрибків» між сторінками */
const PERSISTENT_SIDE_PAGE = 'home' as const

type SideAdRailsLayoutProps = {
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

function emptySideStacks(): {
  left: (AdCampaignWithAdvertiser | null)[]
  right: (AdCampaignWithAdvertiser | null)[]
} {
  return {
    left: Array.from({ length: SIDE_STACK_COUNT }, () => null),
    right: Array.from({ length: SIDE_STACK_COUNT }, () => null),
  }
}

function sideStacksHaveMedia(stacks: {
  left: (AdCampaignWithAdvertiser | null)[]
  right: (AdCampaignWithAdvertiser | null)[]
}): boolean {
  return [...stacks.left, ...stacks.right].some(Boolean)
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
 * Стек R1–L4 фіксується після першого завантаження (home-слоти) і не змінюється при SPA-навігації.
 */
export function SideAdRailsLayout({ children }: SideAdRailsLayoutProps) {
  const { loading, getForSlots } = usePaidAds()
  const sideSlots = useMemo(() => allCatalogSideSlotIds(), [])
  const sideCampaigns = useMemo(() => getForSlots(sideSlots, 48), [getForSlots, sideSlots])
  const lockedStacksRef = useRef<ReturnType<typeof pickSideStacksForPageWithFallback> | null>(null)

  const sideStacks = useMemo(() => {
    if (loading) return lockedStacksRef.current ?? emptySideStacks()

    if (lockedStacksRef.current && sideStacksHaveMedia(lockedStacksRef.current)) {
      return lockedStacksRef.current
    }

    const next = pickSideStacksForPageWithFallback(
      sideCampaigns,
      SIDE_STACK_COUNT,
      PERSISTENT_SIDE_PAGE,
    )
    lockedStacksRef.current = next
    return next
  }, [sideCampaigns, loading])

  const hasLeftRail = !loading && sideStacks.left.some(Boolean)
  const hasRightRail = !loading && sideStacks.right.some(Boolean)

  return (
    <div className="layout-with-side-ads flex-1">
      {hasLeftRail ? (
        <AdBanner
          key="side-rail-left"
          position="left"
          sticky
          page={PERSISTENT_SIDE_PAGE}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.left}
        />
      ) : (
        <EmptySideRail position="left" />
      )}
      <div className="layout-with-side-ads__main flex min-w-0 flex-col">{children}</div>
      {hasRightRail ? (
        <AdBanner
          key="side-rail-right"
          position="right"
          sticky
          page={PERSISTENT_SIDE_PAGE}
          stackCount={SIDE_STACK_COUNT}
          stackCampaigns={sideStacks.right}
        />
      ) : (
        <EmptySideRail position="right" />
      )}
    </div>
  )
}
