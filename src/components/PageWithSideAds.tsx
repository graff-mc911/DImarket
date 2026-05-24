import type { ReactNode } from 'react'
import { AdBanner } from './AdBanner'

export type SideAdsPage = 'home' | 'listings' | 'professionals' | 'default'

const SIDE_STACK_COUNT = 4

export function adPageForPath(path: string): SideAdsPage {
  if (path === '/') return 'home'
  if (path === '/listings' || path === '/vacancies' || path === '/sell-rent') return 'listings'
  if (path === '/professionals') return 'professionals'
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
    path === '/create-ad'
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
  const withRails = showSideAds

  return (
    <div className={`page-bg min-h-screen pb-8 ${className}`}>
      <div className="w-full px-4 md:px-6 lg:px-8 2xl:px-10">
        {withRails ? (
          <div className="flex items-stretch gap-4 lg:gap-6">
            <AdBanner position="left" sticky page={page} stackCount={SIDE_STACK_COUNT} />
            <div className="min-w-0 flex-1">{children}</div>
            <AdBanner position="right" sticky page={page} stackCount={SIDE_STACK_COUNT} />
          </div>
        ) : (
          <div className="min-w-0">{children}</div>
        )}
      </div>
    </div>
  )
}
