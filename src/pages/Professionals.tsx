import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, Category } from '../lib/types'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { CenterPageAd } from '../components/CenterPageAd'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { ConstructionWorkTypesPanel } from '../components/ConstructionWorkTypesPanel'

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
  const { t } = useApp()
  const isCompanyCatalog = catalog === 'companies'

  const [professionals, setProfessionals] = useState<ProfessionalWithCategories[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [locationFilter, setLocationFilter] = useState('')
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([])

  useEffect(() => {
    void loadCategories()
    void loadProfessionals()
  }, [catalog])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
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
    const newValue = t(newKey)

    if (newValue !== newKey) {
      return newValue
    }

    const legacyKey = `category.${category.slug}`
    const legacyValue = t(legacyKey)

    if (legacyValue !== legacyKey) {
      return legacyValue
    }

    return category.name
  }

  const filteredProfessionals = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const normalizedLocation = locationFilter.trim().toLowerCase()

    return [...professionals]
      .filter((professional) => {
        const skills = (professional.professional_categories || [])
          .map((item) => item.category?.name?.toLowerCase() || '')
          .join(' ')

        const matchesSearch =
          normalizedSearch === '' ||
          professional.full_name?.toLowerCase().includes(normalizedSearch) ||
          professional.bio?.toLowerCase().includes(normalizedSearch) ||
          skills.includes(normalizedSearch)

        const matchesRating = minRating === 0 || (professional.rating || 0) >= minRating

        const matchesLocation =
          normalizedLocation === '' ||
          professional.location?.toLowerCase().includes(normalizedLocation)

        const matchesCategory =
          selectedCategory === '' ||
          (professional.professional_categories || []).some((item) => {
            const slug = item.category?.slug || ''
            return slug === selectedCategory || item.category_id === selectedCategory
          })

        const workSubs = professional.work_subcategory_slugs ?? []
        const matchesWorkTypes =
          selectedWorkTypes.length === 0 ||
          selectedWorkTypes.some((s) => workSubs.includes(s))

        return (
          matchesSearch &&
          matchesRating &&
          matchesLocation &&
          matchesCategory &&
          matchesWorkTypes
        )
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
    locationFilter,
    minRating,
    professionals,
    searchQuery,
    selectedCategory,
    selectedWorkTypes,
    sortBy,
  ])

  const activeFiltersCount = [
    selectedCategory,
    selectedWorkTypes.length > 0 ? 'work' : '',
    minRating > 0 ? 'rating' : '',
    locationFilter,
  ].filter(Boolean).length

  const resetFilters = () => {
    setMinRating(0)
    setLocationFilter('')
    setSortBy('rating')
    setSelectedCategory('')
    setSelectedWorkTypes([])
    setSearchQuery('')
  }

  return (
    <div className="py-6 pb-24 lg:pb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-900)] md:text-2xl">
            {isCompanyCatalog ? t('companies.simpleTitle') : t('professionals.simpleTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-600)]">
            {loading
              ? t('professionals.loadingSimple')
              : `${filteredProfessionals.length} ${
                  isCompanyCatalog ? t('companies.countSuffix') : t('professionals.countSuffix')
                }`}
          </p>
          {!isCompanyCatalog && (
            <p className="mt-1 text-xs text-[var(--ink-500)]">
              {t('professionals.mastersOnlyHint')}{' '}
              <button type="button" onClick={() => navigateTo('/companies')} className="amazon-link font-medium">
                {t('companies.browseLink')}
              </button>
            </p>
          )}
          {isCompanyCatalog && (
            <p className="mt-1 text-xs text-[var(--ink-500)]">
              {t('companies.catalogHint')}{' '}
              <button type="button" onClick={() => navigateTo('/professionals')} className="amazon-link font-medium">
                {t('professionals.browseLink')}
              </button>
            </p>
          )}
        </div>
        <button onClick={() => navigateTo('/create-ad')} type="button" className="btn-primary px-4 py-2 text-sm">
          {t('professionals.postJob')}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMobileFiltersOpen(v => !v)}
        className="btn-secondary mb-4 w-full py-2 text-sm lg:hidden"
      >
        {t('professionals.filtersButton')}
        {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside className={`amazon-filter-sidebar w-full lg:w-[220px] lg:shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
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
              />
            </div>

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

            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} type="button" className="btn-secondary mt-3 w-full py-2 text-sm">
                {t('professionals.clearFiltersSimple')}
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="amazon-section-card mb-4">
            <ConstructionWorkTypesPanel
              categorySlug="construction"
              selected={selectedWorkTypes}
              onChange={setSelectedWorkTypes}
            />
          </div>

          <CenterPageAd page="professionals" className="mb-4" />
          <MobileAdBanner variant="horizontal" page="professionals" outerClassName="mb-4" />

          {loading ? (
            <div className="amazon-section-card p-8 text-center text-[var(--ink-500)]">
              {t('professionals.loadingSimple')}
            </div>
          ) : filteredProfessionals.length > 0 ? (
            <div className="product-grid">
              {filteredProfessionals.map((professional, index) => (
                <div key={professional.id}>
                  <ProfessionalCard professional={professional} />
                  {(index + 1) % 6 === 0 && index < filteredProfessionals.length - 1 && (
                    <MobileAdBanner
                      variant="inline"
                      page="professionals"
                      inlineIndex={1}
                      outerClassName="mt-6"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="amazon-section-card p-10 text-center">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">
                {t('professionals.emptyTitle')}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--ink-600)]">
                {t('professionals.emptyText')}
              </p>
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

          <MobileAdBanner variant="inline" page="professionals" inlineIndex={2} outerClassName="mt-8" />
        </main>
      </div>
    </div>
  )
}
