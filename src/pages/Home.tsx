// ============================================================
// Home.tsx — Premium European construction marketplace homepage
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  HomeCategoriesPreview,
  HomeCustomerReviews,
  HomeFaq,
  HomeFeaturedCompanies,
  HomeFindContractor,
  HomeHero,
  HomeInteractiveMap,
  HomePopularProjects,
  HomeTopProfessionals,
  HomeTopCompanies,
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
  professionals: 0,
  reviews: 0,
  countries: 0,
  projects: 0,
  appStoreUrl: '',
  playStoreUrl: '',
}

export function Home() {
  const { t } = useApp()
  const [data, setData] = useState<HomeMarketplaceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const title = t('homePremium.seoTitle')
    const description = t('homePremium.seoDescription')
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
    const setProp = (selector: string, content: string) => {
      const el = document.querySelector(selector)
      if (el) el.setAttribute('content', content)
    }
    setProp('meta[property="og:title"]', title)
    setProp('meta[property="og:description"]', description)
    setProp('meta[name="twitter:title"]', title)
    setProp('meta[name="twitter:description"]', description)
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

  useEffect(() => {
    if (loading) return
    if (window.location.hash !== '#choose-category') return
    const node = document.getElementById('choose-category')
    if (!node) return
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [loading])

  const metrics = data?.metrics ?? EMPTY_METRICS
  const professionals = useMemo(() => {
    return (data?.professionals ?? []).slice(0, 4)
  }, [data?.professionals])
  const companies = useMemo(() => {
    return (data?.companies ?? []).slice(0, 4)
  }, [data?.companies])


  return (
    <div className="home-premium">
      <HomeHero categories={data?.categories ?? []} />
      <HomeTrustBar metrics={metrics} />

      <div className="layout-page-gutter home-premium__ads">
        <MobileAdBanner variant="horizontal" page="home" outerClassName="mt-3 mb-1" />
        <SponsoredCompanies />
      </div>

      <HomeCategoriesPreview categories={data?.categories ?? []} loading={loading} />
      <HomePopularProjects projects={data?.projects ?? []} loading={loading} />
      <HomeFindContractor />
      <HomeTopProfessionals professionals={professionals} loading={loading} />
      <HomeTopCompanies companies={companies} loading={loading} />
      <HomeWhyDimarket />
      <HomeCustomerReviews reviews={data?.reviews ?? []} />
      <HomeFeaturedCompanies />
      <HomeInteractiveMap loading={loading} />
      <HomeFaq />
    </div>
  )
}
