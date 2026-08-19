import { type ReactNode } from 'react'
import { isSeoLocale } from '../lib/seoRoutes'
import type { AdPageKey } from '../lib/adPlacementSlots'

export type SideAdsPage = AdPageKey

export function adPageForPath(path: string): SideAdsPage {
  const parts = path.split('/').filter(Boolean)
  if (path === '/') return 'home'
  if (path === '/listings' || path === '/vacancies' || path === '/sell-rent') return 'listings'
  if (path === '/professionals') return 'professionals'
  if (path === '/companies') return 'companies'
  if (path === '/categories' || path.startsWith('/category/')) return 'categories'
  if (path === '/map') return 'map'
  if (path === '/cost-estimator' || path === '/estimate') return 'estimator'
  if (parts.length === 3 && isSeoLocale(parts[0])) return 'professionals'
  if (path === '/advertising' || path === '/advertise' || path === '/create-ad' || path === '/assistant/job') {
    return 'default'
  }
  return 'default'
}

/** Amazon layout: без бокових рекламних рейок */
export function pathUsesSideAdRails(_path: string): boolean {
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
