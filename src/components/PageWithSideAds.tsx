import type { ReactNode } from 'react'
import { AdBanner } from './AdBanner'

export type SideAdsPage = 'home' | 'listings' | 'default'

const SIDE_STACK_COUNT = 4

export function adPageForPath(path: string): SideAdsPage {
  if (path === '/') return 'home'
  if (path === '/listings') return 'listings'
  return 'default'
}

interface PageWithSideAdsProps {
  children: ReactNode
  page?: SideAdsPage
  className?: string
}

export function PageWithSideAds({
  children,
  page = 'default',
  className = '',
}: PageWithSideAdsProps) {
  return (
    <div className={`page-bg min-h-screen pb-8 ${className}`}>
      <div className="w-full px-4 md:px-6 xl:px-8 2xl:px-10">
        <div className="flex items-stretch gap-6">
          <aside className="hidden w-[216px] shrink-0 xl:flex xl:flex-col 2xl:w-[252px]">
            <AdBanner position="left" sticky page={page} stackCount={SIDE_STACK_COUNT} />
          </aside>

          <div className="min-w-0 flex-1">{children}</div>

          <aside className="hidden w-[216px] shrink-0 xl:flex xl:flex-col 2xl:w-[252px]">
            <AdBanner position="right" sticky page={page} stackCount={SIDE_STACK_COUNT} />
          </aside>
        </div>
      </div>
    </div>
  )
}
