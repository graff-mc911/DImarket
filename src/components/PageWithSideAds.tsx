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

/** Шапка/футер: та сама сітка gutter + центр, без рекламних блоків */
export function LayoutChrome({
  children,
  path,
  className = '',
}: {
  children: ReactNode
  path: string
  className?: string
}) {
  const withRails = pathUsesSideAdRails(path)

  if (!withRails) {
    return <div className={`layout-page-gutter min-w-0 ${className}`.trim()}>{children}</div>
  }

  return (
    <div className={`layout-with-side-ads ${className}`.trim()}>
      <div aria-hidden className="layout-side-rail-spacer" />
      <div className="layout-with-side-ads__main">{children}</div>
      <div aria-hidden className="layout-side-rail-spacer" />
    </div>
  )
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
      {withRails ? (
        <div className="layout-with-side-ads">
          <AdBanner position="left" sticky page={page} stackCount={SIDE_STACK_COUNT} />
          <div className="layout-with-side-ads__main">{children}</div>
          <AdBanner position="right" sticky page={page} stackCount={SIDE_STACK_COUNT} />
        </div>
      ) : (
        <div className="layout-page-gutter min-w-0">{children}</div>
      )}
    </div>
  )
}
