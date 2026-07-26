import { useEffect, useMemo, useState } from 'react'
import {
  CategoryAiRecommendation,
  CategoryBeforeAfterGallery,
  CategoryCustomerReviews,
  CategoryFaq,
  CategoryFeaturedPros,
  CategoryHero,
  CategoryLatestProjects,
  CategoryPopularServices,
  CategoryPriceGuide,
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
import { findServiceSubcategory } from '../config/categories'
import { pushRecentCategory } from '../lib/recentCategories'
import { navigateTo } from '../lib/navigation'

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
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availability, setAvailability] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')

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
  const title = category ? marketplaceCategoryLabel(category, language.code) : slug
  const description = category
    ? marketplaceCategoryDescription(category, language.code)
    : ''
  const configSubcategory = useMemo(() => findServiceSubcategory(slug), [slug])
  const breadcrumbParent = configSubcategory?.category.title.en ?? null

  useEffect(() => {
    const prev = document.title
    const seoTitle = category
      ? t('catPage.seoTitle').replace('{category}', title)
      : t('catPage.seoFallback')
    document.title = seoTitle
    const meta = document.querySelector('meta[name="description"]')
    const seoDesc = description
      ? description
      : t('catPage.seoDescription').replace('{category}', title)
    if (meta) meta.setAttribute('content', seoDesc)
    upsertMeta('property', 'og:title', seoTitle)
    upsertMeta('property', 'og:description', seoDesc)
    upsertMeta('property', 'og:url', window.location.href)
    upsertMeta('property', 'og:type', 'website')
    upsertJsonLd('category-page-schema', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: seoDesc,
      url: window.location.href,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          breadcrumbItem(1, 'Home', `${window.location.origin}/`),
          ...(breadcrumbParent
            ? [breadcrumbItem(2, breadcrumbParent, `${window.location.origin}/category/${configSubcategory?.category.slug}`)]
            : []),
          breadcrumbItem(breadcrumbParent ? 3 : 2, title, window.location.href),
        ],
      },
    })

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
      document.getElementById('category-page-schema')?.remove()
    }
  }, [category, title, description, t, breadcrumbParent, configSubcategory])

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
    if (city.trim()) {
      const q = city.trim().toLowerCase()
      list = list.filter((p) => (p.location ?? '').toLowerCase().includes(q))
    }
    if (country.trim()) {
      const q = country.trim().toLowerCase()
      list = list.filter((p) => (p.location ?? '').toLowerCase().includes(q))
    }
    if (availability) list = list.filter((p) => p.availability_status === availability)
    if (languageFilter.trim()) {
      const q = languageFilter.trim().toLowerCase()
      list = list.filter((p) => (p.languages ?? []).some((lang) => lang.toLowerCase().includes(q)))
    }
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
  }, [page?.professionals, minRating, verifiedOnly, city, country, availability, languageFilter, search])

  const companies = useMemo(() => {
    let list = page?.companies ?? []
    if (minRating > 0) list = list.filter((p) => (p.rating ?? 0) >= minRating)
    if (verifiedOnly) list = list.filter((p) => p.is_verified)
    if (city.trim()) {
      const q = city.trim().toLowerCase()
      list = list.filter((p) => (p.location ?? '').toLowerCase().includes(q))
    }
    if (country.trim()) {
      const q = country.trim().toLowerCase()
      list = list.filter((p) => (p.location ?? '').toLowerCase().includes(q))
    }
    if (availability) list = list.filter((p) => p.availability_status === availability)
    if (languageFilter.trim()) {
      const q = languageFilter.trim().toLowerCase()
      list = list.filter((p) => (p.languages ?? []).some((lang) => lang.toLowerCase().includes(q)))
    }
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
  }, [page?.companies, minRating, verifiedOnly, city, country, availability, languageFilter, search])

  const projects = useMemo(() => {
    const list = page?.projects ?? []
    const q = search.trim().toLowerCase()
    return list.filter(
      (p) =>
        (!q ||
          p.title.toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q) ||
          (p.city_name ?? '').toLowerCase().includes(q)) &&
        (!city.trim() || (p.city_name ?? p.location ?? '').toLowerCase().includes(city.trim().toLowerCase())) &&
        (!country.trim() || (p.country_name ?? '').toLowerCase().includes(country.trim().toLowerCase())) &&
        (!maxPrice || projectPrice(p) <= Number(maxPrice)),
    )
  }, [page?.projects, search, city, country, maxPrice])

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
          onClick={() => navigateTo('/#choose-category')}
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

      <div className="layout-page-gutter cat-page__body">
        <nav className="cat-breadcrumbs" aria-label="Breadcrumb">
          <button type="button" onClick={() => navigateTo('/')}>Home</button>
          <span aria-hidden>›</span>
          {breadcrumbParent ? (
            <>
              <button
                type="button"
                onClick={() => navigateTo(`/category/${configSubcategory?.category.slug}`)}
              >
                {breadcrumbParent}
              </button>
              <span aria-hidden>›</span>
            </>
          ) : null}
          <span>{title}</span>
        </nav>

        <CategorySearchFilters
          search={search}
          onSearchChange={setSearch}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          verifiedOnly={verifiedOnly}
          onVerifiedOnlyChange={setVerifiedOnly}
          city={city}
          onCityChange={setCity}
          country={country}
          onCountryChange={setCountry}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          availability={availability}
          onAvailabilityChange={setAvailability}
          languageFilter={languageFilter}
          onLanguageFilterChange={setLanguageFilter}
        />

        <CategoryPopularServices services={services} categorySlug={category.slug} />
        <CategoryPriceGuide category={category} categoryTitle={title} projects={projects} />
        <CategoryAiRecommendation
          categoryTitle={title}
          services={page.services}
          professionals={professionals}
        />
        <CategoryFeaturedPros professionals={professionals} categorySlug={category.slug} />
        <CategoryFeaturedPros
          professionals={companies}
          categorySlug={category.slug}
          sectionId="cat-companies"
          title={t('marketplace.companies')}
          emptyLabel={t('marketplace.noCompanies')}
        />
        <CategoryBeforeAfterGallery items={page.gallery} />
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

function projectPrice(project: { budget_max?: number | null; budget_min?: number | null; price?: number | null }): number {
  return Number(project.budget_max ?? project.budget_min ?? project.price ?? 0)
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let node = document.querySelector(`meta[${attr}="${key}"]`)
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute(attr, key)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function upsertJsonLd(id: string, data: unknown) {
  document.getElementById(id)?.remove()
  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.text = JSON.stringify(data)
  document.head.appendChild(script)
}

function breadcrumbItem(position: number, name: string, item: string) {
  return {
    '@type': 'ListItem',
    position,
    name,
    item,
  }
}
