// ============================================================
// Home.tsx — Premium European construction marketplace homepage
// ============================================================

import { useEffect, useState } from 'react'
import {
  HomeCategoriesPreview,
  HomeCustomerReviews,
  HomeDownloadApp,
  HomeFaq,
  HomeFeaturedCompanies,
  HomeHero,
  HomeInteractiveMap,
  HomePopularProjects,
  HomeTopProfessionals,
  HomeTrustBar,
  HomeWhyDimarket,
} from '../components/home'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { SponsoredCompanies } from '../components/SponsoredCompanies'
import { useApp } from '../contexts/AppContext'
import {
  fetchHomeMarketplaceData,
  type HomeMarketplaceData,
  type HomeMetrics,
} from '../lib/homeMarketplace'

const EMPTY_METRICS: HomeMetrics = {
  professionals: 52000,
  reviews: 1800000,
  countries: 27,
  projects: 950000,
  appStoreUrl: '',
  playStoreUrl: '',
}

export function Home() {
  const { t } = useApp()
  const [data, setData] = useState<HomeMarketplaceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = t('homePremium.seoTitle')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('homePremium.seoDescription'))
  }, [t])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const payload = await fetchHomeMarketplaceData()
        if (!cancelled) setData(payload)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const metrics = data?.metrics ?? EMPTY_METRICS

  return (
    <div className="home-premium">
      <HomeHero
        metrics={metrics}
        professionals={data?.professionals ?? []}
        projects={data?.projects ?? []}
      />
      <HomeTrustBar metrics={metrics} />

      <div className="layout-page-gutter home-premium__ads">
        <MobileAdBanner variant="horizontal" page="home" outerClassName="mt-3 mb-1" />
        <SponsoredCompanies />
      </div>

      <HomeCategoriesPreview categories={data?.categories ?? []} loading={loading} />
      <HomePopularProjects projects={data?.projects ?? []} loading={loading} />
      <HomeTopProfessionals professionals={data?.professionals ?? []} loading={loading} />
      <HomeWhyDimarket />
      <HomeCustomerReviews reviews={data?.reviews ?? []} />
      <HomeFeaturedCompanies />
      <HomeInteractiveMap points={data?.mapPoints ?? []} loading={loading} />
      <HomeFaq />
      <HomeDownloadApp
        appStoreUrl={metrics.appStoreUrl}
        playStoreUrl={metrics.playStoreUrl}
      />
    </div>
  )
}
