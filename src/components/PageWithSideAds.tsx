import { type ReactNode } from 'react'
import { isSeoLocale } from '../lib/seoRoutes'

export type SideAdsPage = 'home' | 'listings' | 'professionals' | 'companies' | 'default'

export function adPageForPath(path: string): SideAdsPage {
  const parts = path.split('/').filter(Boolean)
  if (path === '/') return 'home'
  if (path === '/listings' || path === '/vacancies' || path === '/sell-rent') return 'listings'
  if (path === '/professionals') return 'professionals'
  if (path === '/companies') return 'companies'
  if (parts.length === 3 && isSeoLocale(parts[0])) return 'professionals'
  if (path === '/advertising' || path === '/advertise' || path === '/create-ad' || path === '/assistant/job') {
    return 'default'
  }
  return 'default'
}

/** Бокові рейки лише там, де вони є в макеті сторінки */
export function pathUsesSideAdRails(path: string): boolean {
  if (
    path === '/listings' ||
    path === '/vacancies' ||
    path === '/sell-rent' ||
    path === '/professionals' ||
    path === '/companies' ||
    path === '/contact' ||
    path === '/create-ad' ||
    path === '/assistant/job' ||
    path === '/for-professionals' ||
    path === '/for-companies' ||
    path === '/for-advertisers' ||
    path === '/advertising' ||
    path === '/advertise'
  ) {
    return true
  }
  if (path.startsWith('/listing/') || path.startsWith('/professional/')) return true
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 3 && isSeoLocale(parts[0])) return true
  return false
}

interface PageWithSideAdsProps {
  children: ReactNode
  className?: string
  /** @deprecated Використовуйте inSideAdsGrid */
  showSideAds?: boolean
  /** Центральна колонка в сітці layout-with-side-ads (бокові рейки зовні) */
  inSideAdsGrid?: boolean
}

/** Обгортка контенту; бокові рейки — у SideAdRailsLayout (App.tsx) */
export function PageWithSideAds({
  children,
  className = '',
  inSideAdsGrid = false,
}: PageWithSideAdsProps) {
  if (inSideAdsGrid) {
    return (
      <div className={`page-bg min-h-full pb-8 ${className}`}>
        <div className="layout-page-content min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className={`page-bg min-h-screen pb-8 ${className}`}>
      <div className="layout-page-gutter min-w-0">{children}</div>
    </div>
  )
}
