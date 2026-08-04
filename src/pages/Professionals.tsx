import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Profile, Category } from '../lib/types'
import { DirectoryExpertCard } from '../components/DirectoryExpertCard'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { buildDisplayCategories, SITE_CATEGORY_SLUGS } from '../lib/siteCategories'
import { findServiceBySlug, matchesServiceProfile } from '../lib/serviceTaxonomy'
import { GeoSearchFilters } from '../components/GeoSearchFilters'
import {
  EMPTY_GEO_SEARCH,
  geoSearchFromQuery,
  matchProfileGeo,
  sortByDistanceAsc,
} from '../lib/geoSearch'

interface ProfessionalCategoryLink {
  category_id: string
  category?: Category | null
}

interface ProfessionalWithCategories extends Profile {
  professional_categories?: ProfessionalCategoryLink[]
}

export type ProfessionalCatalog = 'masters' | 'companies'

interface ProfessionalsProps {
  catalog?: ProfessionalCatalog
}

export function Professionals({ catalog = 'masters' }: ProfessionalsProps) {
  const { t, location, setLocation } = useApp()
  const isCompanyCatalog = catalog === 'companies'

  const [professionals, setProfessionals] = useState<ProfessionalWithCategories[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedWork, setSelectedWork] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest' | 'closest'>('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const category = params.get('category')
    if (category) setSelectedCategory(category)
    const work = params.get('work')
    if (work) setSelectedWork(work)
    const fromQuery = geoSearchFromQuery(params)
    if (fromQuery.country || fromQuery.city || fromQuery.region || fromQuery.fromGps) {
      setLocation({ ...EMPTY_GEO_SEARCH, ...location, ...fromQuery })
    } else {
      const locParam = params.get('location')
      if (locParam) {
        const map: Record<string, string> = {
          spain: 'Spain',
          germany: 'Germany',
          france: 'France',
          italy: 'Italy',
          poland: 'Poland',
        }
        const country = map[locParam.toLowerCase()]
        if (country) setLocation({ ...location, country })
        else setLocation({ ...location, city: locParam })
      }
    }
    const q = params.get('q')
    if (q) setSearchQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadCategories()
    void loadProfessionals()
  }, [catalog])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    const fromDb = data ?? []
    // Ensure site menu categories (incl. legal-notary, accounting-finance) appear even if DB rows are missing.
    const merged = buildDisplayCategories(fromDb, t)
    const bySlug = new Map<string, Category>()
    for (const c of fromDb) bySlug.set(c.slug, c)
    for (const c of merged) {
      if (SITE_CATEGORY_SLUGS.includes(c.slug as (typeof SITE_CATEGORY_SLUGS)[number])) {
        bySlug.set(c.slug, bySlug.get(c.slug) ?? c)
      }
    }
    setCategories([...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const loadProfessionals = async () => {
    setLoading(true)

    try {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          professional_categories(
            category_id,
            category:categories(*)
          )
        `)
        .eq('is_professional', true)
        .eq('user_role', isCompanyCatalog ? 'company' : 'professional')
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })

      setProfessionals((data as ProfessionalWithCategories[] | null) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const translateCategory = (category: Category) => {
    const newKey = `category.name.${category.slug}`
    const newValue = t(newKey as never)

    if (newValue !== newKey) {
      return newValue
    }

    const legacyKey = `category.${category.slug}`
    const legacyValue = t(legacyKey as never)

    if (legacyValue !== legacyKey) {
      return legacyValue
    }

    return category.name
  }

  const filteredProfessionals = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    const rows = professionals
      .map((professional) => {
        const skills = (professional.professional_categories || [])
          .map((item) => item.category?.name?.toLowerCase() || '')
          .join(' ')

        const matchesSearch =
          normalizedSearch === '' ||
          professional.full_name?.toLowerCase().includes(normalizedSearch) ||
          professional.bio?.toLowerCase().includes(normalizedSearch) ||
          skills.includes(normalizedSearch)

        const matchesRating = minRating === 0 || (professional.rating || 0) >= minRating

        const geoHit = matchProfileGeo(professional, location)

        const matchesCategory =
          selectedCategory === '' ||
          (professional.professional_categories || []).some((item) => {
            const slug = item.category?.slug || ''
            return slug === selectedCategory || item.category_id === selectedCategory
          }) ||
          (professional.work_subcategory_slugs ?? []).some(
            (w) => w === selectedCategory || w.startsWith(`${selectedCategory}-`),
          )

        const workResolved = selectedWork ? findServiceBySlug(selectedWork) : null
        const matchesWork =
          selectedWork === '' ||
          (workResolved
            ? matchesServiceProfile(professional, workResolved.matcher)
            : (professional.work_subcategory_slugs ?? []).some(
                (w) =>
                  w === selectedWork ||
                  w.startsWith(`${selectedWork}-`) ||
                  w.includes(selectedWork),
              ))

        if (!(matchesSearch && matchesRating && geoHit.matches && matchesCategory && matchesWork)) {
          return null
        }
        return { ...professional, distanceKm: geoHit.distanceKm }
      })
      .filter(Boolean) as Array<(typeof professionals)[number] & { distanceKm?: number | null }>

    if (sortBy === 'closest') return sortByDistanceAsc(rows)

    return [...rows].sort((a, b) => {
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
  }, [location, minRating, professionals, searchQuery, selectedCategory, selectedWork, sortBy])

  const activeFiltersCount = [
    selectedCategory,
    selectedWork,
    location.country,
    location.city,
    location.region,
    minRating > 0 ? 'rating' : '',
  ].filter(Boolean).length

  const resetFilters = () => {
    setMinRating(0)
    setLocation({ ...EMPTY_GEO_SEARCH })
    setSortBy('rating')
    setSelectedCategory('')
    setSelectedWork('')
    setSearchQuery('')
  }

  const sidebarCategories = useMemo(() => {
    return categories
      .map((category) => ({
        id: category.id,
        slug: category.slug,
        label: translateCategory(category),
        count: filteredProfessionals.filter((professional) =>
          (professional.professional_categories || []).some(
            (item) => item.category?.slug === category.slug || item.category_id === category.id,
          ),
        ).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 14)
  }, [categories, filteredProfessionals, t])

  return (
    <div className="directory-page pb-24 lg:pb-8">
      <section className="directory-hero mb-6 overflow-hidden rounded-xl border border-[#d5d9d9] bg-gradient-to-br from-[#f7fafc] via-white to-[#fff8ef]">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">
              {isCompanyCatalog ? t('header.findCompanies') : t('professionals.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] md:text-3xl">
              {isCompanyCatalog ? t('companies.simpleTitle') : t('professionals.simpleTitle')}
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-600)] md:text-base">
              {isCompanyCatalog ? t('companies.catalogHint') : t('professionals.simpleDescription')}
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--ink-700)] sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              <li className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--brand-ai)]" aria-hidden />
                {t('directory.benefitExperts')}
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--brand-ai)]" aria-hidden />
                {t('directory.benefitCompare')}
              </li>
              <li className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--brand-ai)]" aria-hidden />
                {t('directory.benefitQuotes')}
              </li>
            </ul>
            <p className="mt-3 text-xs text-[var(--ink-500)]">
              {loading
                ? t('professionals.loadingSimple')
                : `${filteredProfessionals.length} ${
                    isCompanyCatalog ? t('companies.countSuffix') : t('professionals.countSuffix')
                  }`}
              {' · '}
              {!isCompanyCatalog ? (
                <button type="button" onClick={() => navigateTo('/companies')} className="amazon-link font-medium">
                  {t('companies.browseLink')}
                </button>
              ) : (
                <button type="button" onClick={() => navigateTo('/professionals')} className="amazon-link font-medium">
                  {t('professionals.browseLink')}
                </button>
              )}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <button onClick={() => navigateTo('/create-ad')} type="button" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
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

            <GeoSearchFilters value={location} onChange={setLocation} />

            <div className="amazon-filter-group">
              <label>{t('professionals.categoryLabel')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select-glass h-9 text-sm"
              >
                <option value="">{t('professionals.allCategoriesSimple')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {translateCategory(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="amazon-filter-group">
              <label>{t('professionals.sortLabel')}</label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'rating' | 'reviews' | 'newest' | 'closest')
                }
                className="select-glass h-9 text-sm"
              >
                <option value="rating">{t('professionals.sortRating')}</option>
                <option value="closest">{t('advancedSearch.sortClosest')}</option>
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

            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} type="button" className="btn-secondary mt-3 w-full py-2 text-sm">
                {t('professionals.clearFiltersSimple')}
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <MobileAdBanner variant="horizontal" page="professionals" outerClassName="mb-4" />

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-xl bg-[#f3f4f4]" />
              ))}
            </div>
          ) : filteredProfessionals.length > 0 ? (
            <div className="directory-expert-list flex flex-col gap-4">
              {filteredProfessionals.map((professional, index) => (
                <div key={professional.id}>
                  <DirectoryExpertCard
                    professional={professional}
                    distanceKm={
                      'distanceKm' in professional
                        ? (professional as { distanceKm?: number | null }).distanceKm
                        : null
                    }
                  />
                  {(index + 1) % 8 === 0 && index < filteredProfessionals.length - 1 && (
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
          ) : (
            <div className="amazon-section-card p-10 text-center">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('professionals.emptyTitle')}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--ink-600)]">{t('professionals.emptyText')}</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button onClick={resetFilters} type="button" className="btn-secondary text-sm">
                  {t('professionals.clearFiltersSimple')}
                </button>
                <button onClick={() => navigateTo('/register')} type="button" className="btn-primary text-sm">
                  {t('professionals.registerAsProfessional')}
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="directory-services-sidebar hidden w-full shrink-0 xl:block xl:w-[240px]">
          <div className="sticky top-24 rounded-xl border border-[#d5d9d9] bg-white p-4">
            <h2 className="text-base font-bold text-[var(--ink-900)]">{t('directory.servicesSidebar')}</h2>
            {sidebarCategories.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-500)]">{t('professionals.emptyText')}</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {sidebarCategories.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategory(selectedCategory === item.slug ? '' : item.slug)
                      }
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-[#f3f4f4] ${
                        selectedCategory === item.slug
                          ? 'bg-[#f3f4f4] font-semibold text-[var(--ink-900)]'
                          : 'text-[var(--ink-700)]'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <span className="text-xs text-[var(--ink-400)]">{item.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
