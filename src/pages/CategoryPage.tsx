import { useEffect, useMemo, useState } from 'react'
import {
  CategoryAiRecommendation,
  CategoryCustomerReviews,
  CategoryFaq,
  CategoryFeaturedPros,
  CategoryHero,
  CategoryLatestProjects,
  CategoryPopularServices,
  CategoryRelated,
  CategorySearchFilters,
} from '../components/category'
import { useApp } from '../contexts/AppContext'
import {
  fetchMarketplaceCategoryPage,
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  type MarketplaceCategoryPage,
} from '../lib/marketplaceCategories'
import { pushRecentCategory } from '../lib/recentCategories'
import { navigateTo } from '../lib/navigation'
import { MobileAdBanner } from '../components/MobileAdBanner'

interface CategoryPageProps {
  slug: string
}

export function CategoryPage({ slug }: CategoryPageProps) {
  const { language, t } = useApp()
  const [page, setPage] = useState<MarketplaceCategoryPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchMarketplaceCategoryPage(slug)
        if (!cancelled) setPage(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const category = page?.category ?? null
  const title = marketplaceCategoryLabel(
    category ?? { name: '', slug, name_i18n: null },
    language.code,
  )
  const description = category
    ? marketplaceCategoryDescription(category, language.code)
    : ''

  useEffect(() => {
    const prev = document.title
    document.title = t('catPage.seoTitle').replace('{category}', title)
    const meta = document.querySelector('meta[name="description"]')
    const seoDesc = description
      ? description
      : t('catPage.seoDescription').replace('{category}', title)
    if (meta) meta.setAttribute('content', seoDesc)

    if (category) {
      pushRecentCategory({
        id: category.id,
        slug: category.slug,
        name: title,
        icon_key: category.icon_key,
      })
    }

    return () => {
      document.title = prev
    }
  }, [category, title, description, t])

  const services = useMemo(() => {
    const list = page?.services ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((s) =>
      marketplaceCategoryLabel(s, language.code).toLowerCase().includes(q),
    )
  }, [page?.services, search, language.code])

  const professionals = useMemo(() => {
    let list = page?.professionals ?? []
    if (minRating > 0) list = list.filter((p) => (p.rating ?? 0) >= minRating)
    if (verifiedOnly) list = list.filter((p) => p.is_verified)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          (p.full_name ?? '').toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q) ||
          (p.bio ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [page?.professionals, minRating, verifiedOnly, search])

  const projects = useMemo(() => {
    const list = page?.projects ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.location ?? '').toLowerCase().includes(q) ||
        (p.city_name ?? '').toLowerCase().includes(q),
    )
  }, [page?.projects, search])

  if (loading) {
    return (
      <div className="cat-page cat-page--loading layout-page-gutter py-16">
        <p className="text-[var(--ink-600)]">{t('marketplace.loading')}</p>
      </div>
    )
  }

  if (!page?.ok || !category) {
    return (
      <div className="cat-page layout-page-gutter py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">{t('marketplace.notFound')}</h1>
        <button
          type="button"
          className="mt-6 font-semibold text-[#c96d2c]"
          onClick={() => navigateTo('/categories')}
        >
          {t('marketplace.backToCategories')}
        </button>
      </div>
    )
  }

  return (
    <div className="cat-page">
      <CategoryHero
        category={category}
        servicesCount={page.services.length}
        reviewsCount={page.reviews.length}
      />

      <div className="layout-page-gutter">
        <MobileAdBanner variant="horizontal" page="categories" outerClassName="mt-3 mb-1" />
      </div>

      <div className="layout-page-gutter cat-page__body">
        <CategorySearchFilters
          search={search}
          onSearchChange={setSearch}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          verifiedOnly={verifiedOnly}
          onVerifiedOnlyChange={setVerifiedOnly}
        />

        <CategoryPopularServices services={services} categorySlug={category.slug} />
        <CategoryAiRecommendation categoryTitle={title} services={page.services} />
        <CategoryFeaturedPros professionals={professionals} categorySlug={category.slug} />
        <CategoryLatestProjects projects={projects} />
        <CategoryCustomerReviews
          reviews={page.reviews}
          averageRating={
            category.avg_rating != null ? Number(category.avg_rating) : null
          }
        />
        <CategoryFaq categoryTitle={title} />
        <CategoryRelated categories={page.related} />
      </div>
    </div>
  )
}
