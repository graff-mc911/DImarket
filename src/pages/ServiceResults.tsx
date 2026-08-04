import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { DirectoryExpertCard, type DirectoryExpert } from '../components/DirectoryExpertCard'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { applyPageSeo } from '../lib/pageSeo'
import {
  findServiceBySlug,
  matchesServiceProfile,
  serviceCanonicalPath,
  servicesPath,
  type ResolvedService,
} from '../lib/serviceTaxonomy'
import { serviyaLabel } from '../config/categoriesI18n'
import type { TranslationKey } from '../lib/i18n'

const PAGE_SIZE = 12

type RoleFilter = 'all' | 'professional' | 'company'

interface ServiceResultsProps {
  /** Subcategory slug from /services/:slug or SEO alias */
  slug: string
}

export function ServiceResults({ slug }: ServiceResultsProps) {
  const { t, language } = useApp()
  const lang = language.code

  const resolved = useMemo(() => findServiceBySlug(slug), [slug])

  const [profiles, setProfiles] = useState<DirectoryExpert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating')
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location')
    if (loc) setLocationFilter(loc)
    const role = params.get('role')
    if (role === 'professional' || role === 'company') setRoleFilter(role)
    const q = params.get('q')
    if (q) setSearchQuery(q)
  }, [slug])

  useEffect(() => {
    void loadProfiles()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, locationFilter, roleFilter, minRating, verifiedOnly, availableOnly, sortBy, slug])

  useEffect(() => {
    if (!resolved) {
      document.title = `${t('services.notFoundTitle')} | DImarket`
      return
    }
    const subTitle = serviyaLabel(resolved.subcategory.slug, lang, resolved.subcategory.title.en)
    const catTitle = serviyaLabel(resolved.category.slug, lang, resolved.category.title.en)
    const title = t('services.seoTitle')
      .replace('{trade}', subTitle)
      .replace('{parent}', catTitle)
    const description = t('services.seoDescription')
      .replace('{trade}', subTitle)
      .replace('{parent}', catTitle)
    const canonical = serviceCanonicalPath(resolved.subcategory.slug)

    return applyPageSeo({
      title,
      description,
      canonicalPath: canonical,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dimarket.app/' },
            { '@type': 'ListItem', position: 2, name: catTitle, item: 'https://dimarket.app/#choose-category' },
            { '@type': 'ListItem', position: 3, name: subTitle, item: `https://dimarket.app${canonical}` },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `https://dimarket.app${canonical}`,
        },
      ],
    })
  }, [resolved, t, lang])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select(
          `
          *,
          professional_categories(
            category_id,
            category:categories(*)
          )
        `,
        )
        .eq('is_professional', true)
        .in('user_role', ['professional', 'company'])
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(500)

      setProfiles((data as DirectoryExpert[] | null) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const serviceMatches = useMemo(() => {
    if (!resolved) return []
    return profiles.filter((p) => matchesServiceProfile(p, resolved.matcher))
  }, [profiles, resolved])

  const specialistCount = useMemo(
    () => serviceMatches.filter((p) => p.user_role === 'professional').length,
    [serviceMatches],
  )
  const companyCount = useMemo(
    () => serviceMatches.filter((p) => p.user_role === 'company').length,
    [serviceMatches],
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const loc = locationFilter.trim().toLowerCase()

    return [...serviceMatches]
      .filter((p) => {
        if (roleFilter === 'professional' && p.user_role !== 'professional') return false
        if (roleFilter === 'company' && p.user_role !== 'company') return false

        const skills = (p.professional_categories || [])
          .map((item) => item.category?.name?.toLowerCase() || '')
          .join(' ')

        const matchesSearch =
          !q ||
          p.full_name?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          skills.includes(q)

        const matchesLocation = !loc || p.location?.toLowerCase().includes(loc)
        const matchesRating = minRating === 0 || (p.rating || 0) >= minRating
        const matchesVerified =
          !verifiedOnly ||
          Boolean(p.verification_level && p.verification_level !== 'none')
        const matchesAvailable =
          !availableOnly || p.availability_status === 'available' || !p.availability_status

        return matchesSearch && matchesLocation && matchesRating && matchesVerified && matchesAvailable
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'reviews':
            return (b.total_reviews || 0) - (a.total_reviews || 0)
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'rating':
          default:
            return (b.rating || 0) - (a.rating || 0)
        }
      })
  }, [
    serviceMatches,
    searchQuery,
    locationFilter,
    roleFilter,
    minRating,
    verifiedOnly,
    availableOnly,
    sortBy,
  ])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paged.length < filtered.length

  const activeFiltersCount = [
    searchQuery,
    locationFilter,
    roleFilter !== 'all' ? roleFilter : '',
    minRating > 0 ? 'rating' : '',
    verifiedOnly ? 'verified' : '',
    availableOnly ? 'available' : '',
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearchQuery('')
    setLocationFilter('')
    setRoleFilter('all')
    setMinRating(0)
    setVerifiedOnly(false)
    setAvailableOnly(false)
    setSortBy('rating')
    setPage(1)
  }

  if (!resolved) {
    return (
      <div className="directory-page pb-24 lg:pb-8">
        <div className="amazon-section-card p-10 text-center">
          <h1 className="text-lg font-bold text-[var(--ink-900)]">{t('services.notFoundTitle')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--ink-600)]">{t('services.notFoundText')}</p>
          <button type="button" className="btn-primary mt-6 text-sm" onClick={() => navigateTo('/#choose-category')}>
            {t('services.backToCategories')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <ServiceResultsView
      resolved={resolved}
      lang={lang}
      t={t}
      loading={loading}
      specialistCount={specialistCount}
      companyCount={companyCount}
      filteredCount={filtered.length}
      paged={paged}
      hasMore={hasMore}
      page={page}
      pageCount={pageCount}
      setPage={setPage}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      locationFilter={locationFilter}
      setLocationFilter={setLocationFilter}
      roleFilter={roleFilter}
      setRoleFilter={setRoleFilter}
      minRating={minRating}
      setMinRating={setMinRating}
      verifiedOnly={verifiedOnly}
      setVerifiedOnly={setVerifiedOnly}
      availableOnly={availableOnly}
      setAvailableOnly={setAvailableOnly}
      sortBy={sortBy}
      setSortBy={setSortBy}
      mobileFiltersOpen={mobileFiltersOpen}
      setMobileFiltersOpen={setMobileFiltersOpen}
      activeFiltersCount={activeFiltersCount}
      resetFilters={resetFilters}
    />
  )
}

function ServiceResultsView({
  resolved,
  lang,
  t,
  loading,
  specialistCount,
  companyCount,
  filteredCount,
  paged,
  hasMore,
  setPage,
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter,
  roleFilter,
  setRoleFilter,
  minRating,
  setMinRating,
  verifiedOnly,
  setVerifiedOnly,
  availableOnly,
  setAvailableOnly,
  sortBy,
  setSortBy,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  activeFiltersCount,
  resetFilters,
}: {
  resolved: ResolvedService
  lang: string
  t: (key: TranslationKey) => string
  loading: boolean
  specialistCount: number
  companyCount: number
  filteredCount: number
  paged: DirectoryExpert[]
  hasMore: boolean
  page: number
  pageCount: number
  setPage: (n: number | ((p: number) => number)) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  locationFilter: string
  setLocationFilter: (v: string) => void
  roleFilter: RoleFilter
  setRoleFilter: (v: RoleFilter) => void
  minRating: number
  setMinRating: (v: number) => void
  verifiedOnly: boolean
  setVerifiedOnly: (v: boolean) => void
  availableOnly: boolean
  setAvailableOnly: (v: boolean) => void
  sortBy: 'rating' | 'reviews' | 'newest'
  setSortBy: (v: 'rating' | 'reviews' | 'newest') => void
  mobileFiltersOpen: boolean
  setMobileFiltersOpen: (v: boolean | ((x: boolean) => boolean)) => void
  activeFiltersCount: number
  resetFilters: () => void
}) {
  const subTitle = serviyaLabel(resolved.subcategory.slug, lang, resolved.subcategory.title.en)
  const catTitle = serviyaLabel(resolved.category.slug, lang, resolved.category.title.en)

  const siblingSubs = resolved.category.subcategories

  return (
    <div className="directory-page pb-24 lg:pb-8">
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: t('services.crumbHome'), href: '/' },
          { label: catTitle, href: '/#choose-category' },
          { label: subTitle },
        ]}
      />

      <section className="directory-hero mb-6 overflow-hidden rounded-xl border border-[#d5d9d9] bg-gradient-to-br from-[#f7fafc] via-white to-[#fff8ef]">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">
              {catTitle}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] md:text-3xl">
              {subTitle}
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-600)] md:text-base">
              {resolved.subcategory.description[lang] ?? resolved.subcategory.description.en}
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--ink-700)] sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              <li className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--brand-ai)]" aria-hidden />
                {t('services.statSpecialists').replace('{n}', String(specialistCount))}
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--brand-ai)]" aria-hidden />
                {t('services.statCompanies').replace('{n}', String(companyCount))}
              </li>
              <li className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--brand-ai)]" aria-hidden />
                {t('directory.benefitQuotes')}
              </li>
            </ul>
            <p className="mt-3 text-xs text-[var(--ink-500)]">
              {loading
                ? t('professionals.loadingSimple')
                : t('services.showingCount').replace('{n}', String(filteredCount))}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <button
              type="button"
              className="btn-primary shrink-0 px-5 py-2.5 text-sm"
              onClick={() => navigateTo('/create-ad')}
            >
              {t('directory.requestQuote')}
            </button>
            <p className="text-xs text-[var(--ink-500)]">{t('directory.quoteHint')}</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setMobileFiltersOpen((v) => !v)}
        className="btn-secondary mb-4 w-full py-2 text-sm lg:hidden"
      >
        {t('professionals.filtersButton')}
        {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside
          className={`amazon-filter-sidebar w-full lg:w-[220px] lg:shrink-0 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <h2 className="text-base font-bold text-[var(--ink-900)]">{t('professionals.filtersButton')}</h2>
          <div className="mt-3 space-y-0">
            <div className="amazon-filter-group">
              <label>{t('professionals.nameSkillService')}</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass h-9 text-sm"
              />
            </div>
            <div className="amazon-filter-group">
              <label>{t('professionals.cityOrCountry')}</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input-glass h-9 text-sm"
                placeholder={t('services.locationPlaceholder')}
              />
            </div>
            <div className="amazon-filter-group">
              <label>{t('services.roleLabel')}</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="select-glass h-9 text-sm"
              >
                <option value="all">{t('services.roleAll')}</option>
                <option value="professional">{t('services.roleSpecialists')}</option>
                <option value="company">{t('services.roleCompanies')}</option>
              </select>
            </div>
            <div className="amazon-filter-group">
              <label>{t('professionals.sortLabel')}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'reviews' | 'newest')}
                className="select-glass h-9 text-sm"
              >
                <option value="rating">{t('professionals.sortRating')}</option>
                <option value="reviews">{t('professionals.sortReviews')}</option>
                <option value="newest">{t('professionals.sortNewest')}</option>
              </select>
            </div>
            <div className="amazon-filter-group">
              <label>{t('professionals.minRatingLabel')}</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="select-glass h-9 text-sm"
              >
                <option value="0">{t('professionals.anyRatingSimple')}</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
            <div className="amazon-filter-group">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                {t('services.filterVerified')}
              </label>
            </div>
            <div className="amazon-filter-group">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                />
                {t('services.filterAvailable')}
              </label>
            </div>
            {activeFiltersCount > 0 && (
              <button type="button" onClick={resetFilters} className="btn-secondary mt-3 w-full py-2 text-sm">
                {t('professionals.clearFiltersSimple')}
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <MobileAdBanner variant="horizontal" page="professionals" outerClassName="mb-4" />

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl bg-[#f3f4f4]" />
              ))}
            </div>
          ) : paged.length > 0 ? (
            <>
              <div className="directory-expert-list flex flex-col gap-4">
                {paged.map((professional, index) => (
                  <div key={professional.id}>
                    <DirectoryExpertCard professional={professional} />
                    {(index + 1) % 8 === 0 && index < paged.length - 1 && (
                      <MobileAdBanner
                        variant="inline"
                        page="professionals"
                        inlineIndex={2}
                        outerClassName="mt-4"
                      />
                    )}
                  </div>
                ))}
              </div>
              {hasMore ? (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    className="btn-secondary px-6 py-2.5 text-sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('services.loadMore')}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="amazon-section-card p-10 text-center">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('services.emptyTitle')}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--ink-600)]">
                {t('services.emptyText').replace('{trade}', subTitle)}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={resetFilters} className="btn-secondary text-sm">
                  {t('professionals.clearFiltersSimple')}
                </button>
                <button type="button" onClick={() => navigateTo('/register')} className="btn-primary text-sm">
                  {t('services.registerCta')}
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="directory-services-sidebar hidden w-full shrink-0 xl:block xl:w-[240px]">
          <div className="sticky top-24 rounded-xl border border-[#d5d9d9] bg-white p-4">
            <h2 className="text-base font-bold text-[var(--ink-900)]">{catTitle}</h2>
            <ul className="mt-3 space-y-1">
              {siblingSubs.map((sub) => {
                const label = serviyaLabel(sub.slug, lang, sub.title.en)
                const active = sub.slug === resolved.subcategory.slug
                return (
                  <li key={sub.id}>
                    <button
                      type="button"
                      onClick={() => navigateTo(servicesPath(sub.slug))}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-[#f3f4f4] ${
                        active
                          ? 'bg-[#f3f4f4] font-semibold text-[var(--ink-900)]'
                          : 'text-[var(--ink-700)]'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
