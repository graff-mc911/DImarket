import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, LayoutGrid, Map as MapIcon, Search, SlidersHorizontal } from 'lucide-react'
import {
  CompaniesMap,
  CompanyCard,
  CompanyCardSkeleton,
  CompanyFiltersPanel,
} from '../components/companies'
import { useApp } from '../contexts/AppContext'
import {
  COMPANY_PAGE_SIZE,
  companyFiltersToSearch,
  fetchCompanyMapPoints,
  fetchCompaniesCatalog,
  fetchFeaturedCompanies,
  fetchLatestCompanies,
  filterCompanies,
  parseCompanyFiltersFromSearch,
  popularCompanyCategories,
} from '../lib/companies/companies'
import { COMPANY_CATEGORIES, companyCategoryLabel } from '../lib/companies/categories'
import type { Company, CompanyFilters, CompanyMapPoint } from '../lib/companies/types'
import { EMPTY_COMPANY_FILTERS } from '../lib/companies/types'
import { navigateTo } from '../lib/navigation'

export function Companies() {
  const { t } = useApp()
  const [all, setAll] = useState<Company[]>([])
  const [featured, setFeatured] = useState<Company[]>([])
  const [latest, setLatest] = useState<Company[]>([])
  const [mapPoints, setMapPoints] = useState<CompanyMapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CompanyFilters>(() =>
    parseCompanyFiltersFromSearch(window.location.search),
  )
  const [page, setPage] = useState(0)
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState(filters.q)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [catalog, feat, late] = await Promise.all([
        fetchCompaniesCatalog(),
        fetchFeaturedCompanies(6),
        fetchLatestCompanies(8),
      ])
      setAll(catalog)
      setFeatured(feat)
      setLatest(late)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const prev = document.title
    document.title = t('companiesDir.seoTitle')
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content') || ''
    meta?.setAttribute('content', t('companiesDir.seoDescription'))

    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const prevOgTitle = ogTitle?.getAttribute('content') || ''
    const prevOgDesc = ogDesc?.getAttribute('content') || ''
    ogTitle?.setAttribute('content', t('companiesDir.seoTitle'))
    ogDesc?.setAttribute('content', t('companiesDir.seoDescription'))

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'companies-directory-jsonld'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('companiesDir.seoTitle'),
      description: t('companiesDir.seoDescription'),
      url: 'https://dimarket.app/companies',
    })
    document.getElementById('companies-directory-jsonld')?.remove()
    document.head.appendChild(script)

    return () => {
      document.title = prev
      meta?.setAttribute('content', prevDesc)
      ogTitle?.setAttribute('content', prevOgTitle)
      ogDesc?.setAttribute('content', prevOgDesc)
      document.getElementById('companies-directory-jsonld')?.remove()
    }
  }, [t])

  useEffect(() => {
    const qs = companyFiltersToSearch(filters)
    const next = `/companies${qs}`
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState({}, '', next)
    }
    setPage(0)
  }, [filters])

  useEffect(() => {
    if (view !== 'map') return
    let cancelled = false
    void fetchCompanyMapPoints(filters).then((pts) => {
      if (!cancelled) setMapPoints(pts)
    })
    return () => {
      cancelled = true
    }
  }, [view, filters])

  const filtered = useMemo(() => filterCompanies(all, filters), [all, filters])
  const pageItems = useMemo(() => {
    const start = page * COMPANY_PAGE_SIZE
    return filtered.slice(start, start + COMPANY_PAGE_SIZE)
  }, [filtered, page])
  const hasMore = (page + 1) * COMPANY_PAGE_SIZE < filtered.length
  const hasPrev = page > 0

  const cities = useMemo(
    () =>
      [...new Set(all.map((c) => c.city).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b),
      ),
    [all],
  )
  const countries = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of all) {
      if (c.country_code) map.set(c.country_code, c.country_name || c.country_code)
    }
    return [...map.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [all])
  const languages = useMemo(
    () => [...new Set(all.flatMap((c) => c.languages))].sort(),
    [all],
  )
  const popularCats = useMemo(() => popularCompanyCategories(all, 8), [all])

  const applySearch = () => {
    setFilters((f) => ({ ...f, q: searchDraft.trim() }))
  }

  const resetFilters = () => {
    setFilters(EMPTY_COMPANY_FILTERS)
    setSearchDraft('')
  }

  return (
    <div className="layout-page-gutter pb-12 pt-4">
      <div className="layout-page-content space-y-6">
        {/* Hero */}
        <section className="amazon-section-card overflow-hidden !p-0">
          <div className="relative bg-gradient-to-br from-[#232f3e] via-[#37475a] to-[#1a2330] px-5 py-8 text-white sm:px-8 sm:py-10">
            <div className="relative z-10 max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#ff9900]">
                <Building2 className="h-4 w-4" aria-hidden />
                DImarket
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t('companiesDir.heroTitle')}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/80 sm:text-[15px]">
                {t('companiesDir.heroSubtitle')}
              </p>
              <form
                className="mt-5 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault()
                  applySearch()
                }}
                role="search"
                aria-label={t('companiesDir.search')}
              >
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{t('companiesDir.search')}</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]"
                    aria-hidden
                  />
                  <input
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    placeholder={t('companiesDir.searchPlaceholder')}
                    className="input-glass w-full !rounded-full !bg-white py-3 pl-10 pr-3 text-sm text-[#1d1d1f]"
                  />
                </label>
                <button type="submit" className="btn-primary shrink-0 !rounded-full px-6">
                  {t('companiesDir.search')}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Popular categories */}
        <section aria-labelledby="companies-popular-cats">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="companies-popular-cats" className="text-lg font-bold text-[var(--ink-900)]">
              {t('companiesDir.popularCategories')}
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(popularCats.length
              ? popularCats
              : COMPANY_CATEGORIES.slice(0, 8).map((c) => ({ slug: c.slug, count: 0 }))
            ).map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, category: c.slug }))}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                  filters.category === c.slug
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                }`}
              >
                {companyCategoryLabel(c.slug, t)}
                {c.count ? ` (${c.count})` : ''}
              </button>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section aria-labelledby="companies-featured">
          <h2 id="companies-featured" className="mb-3 text-lg font-bold text-[var(--ink-900)]">
            {t('companiesDir.featured')}
          </h2>
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <CompanyCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {featured.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          )}
        </section>

        {/* Latest */}
        <section aria-labelledby="companies-latest">
          <h2 id="companies-latest" className="mb-3 text-lg font-bold text-[var(--ink-900)]">
            {t('companiesDir.latest')}
          </h2>
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <CompanyCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {latest.slice(0, 4).map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          )}
        </section>

        {/* Directory + filters */}
        <section aria-labelledby="companies-directory" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="companies-directory" className="text-lg font-bold text-[var(--ink-900)]">
              {t('companiesDir.directory')}
              <span className="ml-2 text-[13px] font-semibold text-[#86868b]">
                ({filtered.length} {t('companiesDir.countSuffix')})
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] lg:hidden"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                aria-expanded={mobileFiltersOpen}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                {t('companiesDir.filters')}
              </button>
              <div className="inline-flex rounded-full bg-[#f5f5f7] p-0.5" role="group" aria-label={t('companiesDir.viewToggle')}>
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    view === 'grid' ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f]'
                  }`}
                  aria-pressed={view === 'grid'}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                  {t('companiesDir.gridView')}
                </button>
                <button
                  type="button"
                  onClick={() => setView('map')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    view === 'map' ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f]'
                  }`}
                  aria-pressed={view === 'map'}
                >
                  <MapIcon className="h-3.5 w-3.5" aria-hidden />
                  {t('companiesDir.mapView')}
                </button>
              </div>
              {(filters.q ||
                filters.category ||
                filters.verifiedOnly ||
                filters.premiumOnly ||
                filters.openNow ||
                filters.city ||
                filters.country ||
                filters.language ||
                filters.minRating > 0) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="amazon-link text-[12px] font-semibold"
                >
                  {t('companiesDir.resetFilters')}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
              <div className="amazon-section-card">
                <CompanyFiltersPanel
                  filters={filters}
                  onChange={setFilters}
                  cities={cities}
                  countries={countries}
                  languages={languages}
                />
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              {view === 'map' ? (
                <CompaniesMap points={mapPoints} loading={loading} />
              ) : loading ? (
                <div className="product-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CompanyCardSkeleton key={i} />
                  ))}
                </div>
              ) : pageItems.length === 0 ? (
                <div className="amazon-section-card py-10 text-center text-[13px] text-[#6e6e73]">
                  {t('companiesDir.empty')}
                </div>
              ) : (
                <>
                  <div className="product-grid">
                    {pageItems.map((c) => (
                      <CompanyCard key={c.id} company={c} />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="btn-secondary text-sm disabled:opacity-40"
                    >
                      {t('companiesDir.prev')}
                    </button>
                    <span className="text-[13px] font-semibold text-[#6e6e73]">
                      {t('companiesDir.page').replace('{page}', String(page + 1))}
                    </span>
                    <button
                      type="button"
                      disabled={!hasMore}
                      onClick={() => setPage((p) => p + 1)}
                      className="btn-secondary text-sm disabled:opacity-40"
                    >
                      {t('companiesDir.next')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <p className="text-center text-[12px] text-[#86868b]">
          <button
            type="button"
            className="amazon-link font-semibold"
            onClick={() => navigateTo('/for-companies')}
          >
            {t('companiesDir.listYourCompany')}
          </button>
        </p>
      </div>
    </div>
  )
}
