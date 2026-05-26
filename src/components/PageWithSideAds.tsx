import { type ReactNode } from 'react'
import { SideAdRails } from './SideAdRails'

export type SideAdsPage = 'home' | 'listings' | 'professionals' | 'default'

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
  if (!showSideAds) {
    return (
      <div className={`page-bg min-h-screen pb-8 ${className}`}>
        <div className="layout-page-gutter min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className={`page-bg min-h-screen pb-8 app-page-with-fixed-rails ${className}`}>
      <SideAdRails page={page} />
      <div className="app-page-main min-w-0">{children}</div>
    </div>
  )
}
