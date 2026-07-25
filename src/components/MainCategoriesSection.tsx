import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { CategoryServiceCard } from './CategoryServiceCard'
import { useApp } from '../contexts/AppContext'
import {
  fetchMainMarketplaceCategories,
  filterCategoriesByQuery,
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { getRecentCategories, type RecentCategoryView } from '../lib/recentCategories'
import type { TranslationKey } from '../lib/i18n'
import { BarChart3, Search, Sparkles, TrendingUp } from 'lucide-react'

export interface MainCategoriesSectionProps {
  id?: string
  title?: string
  subtitle?: string
  eyebrow?: string
  showSearch?: boolean
  /** Preloaded categories (skip internal fetch) */
  categories?: MarketplaceCategory[]
  loading?: boolean
  className?: string
}

type CategoryFilterId =
  | 'all'
  | 'interior'
  | 'exterior'
  | 'engineering'
  | 'emergency'
  | 'renovation'

const CATEGORY_FILTERS: Array<{ id: CategoryFilterId; labelKey: TranslationKey }> = [
  { id: 'all', labelKey: 'marketplace.filterAll' },
  { id: 'interior', labelKey: 'marketplace.filterInterior' },
  { id: 'exterior', labelKey: 'marketplace.filterExterior' },
  { id: 'engineering', labelKey: 'marketplace.filterEngineering' },
  { id: 'emergency', labelKey: 'marketplace.filterEmergency' },
  { id: 'renovation', labelKey: 'marketplace.filterRenovation' },
]

const FILTER_KEYWORDS: Record<Exclude<CategoryFilterId, 'all'>, string[]> = {
  interior: [
    'interior',
    'painting',
    'paint',
    'wallpaper',
    'drywall',
    'tiling',
    'flooring',
    'carpentry',
    'plaster',
    'kitchen',
    'bathroom',
    'glass',
  ],
  exterior: [
    'exterior',
    'roof',
    'roofing',
    'facade',
    'windows',
    'landscaping',
    'garden',
    'pools',
    'pool',
    'fence',
    'solar',
    'earthworks',
  ],
  engineering: [
    'engineering',
    'design-engineering',
    'plumbing',
    'electro',
    'electric',
    'hvac',
    'heating',
    'ventilation',
    'insulation',
    'smart-home',
    'solar',
    'gas',
  ],
  emergency: [
    'emergency',
    'urgent',
    'repair',
    'leak',
    'plumbing',
    'electro',
    'electric',
    'hvac',
    'roof',
    'welding',
  ],
  renovation: [
    'renovation',
    'remodel',
    'demolition',
    'masonry',
    'concrete',
    'plaster',
    'painting',
    'flooring',
    'carpentry',
    'finishing',
  ],
}

function searchableCategoryText(category: MarketplaceCategory, lang: string): string {
  return [
    category.slug,
    category.icon_key ?? '',
    category.name,
    category.description ?? '',
    marketplaceCategoryLabel(category, lang),
    marketplaceCategoryDescription(category, lang),
  ]
    .join(' ')
    .toLowerCase()
}

function recentCategoryText(category: RecentCategoryView): string {
  return [category.slug, category.name, category.icon_key ?? ''].join(' ').toLowerCase()
}

function categoryMatchesFilter(
  category: MarketplaceCategory,
  filterId: CategoryFilterId,
  lang: string,
): boolean {
  if (filterId === 'all') return true
  const text = searchableCategoryText(category, lang)
  return FILTER_KEYWORDS[filterId].some((keyword) => text.includes(keyword))
}

function filterIdsForText(text: string): CategoryFilterId[] {
  return CATEGORY_FILTERS.map((filter) => filter.id).filter((filterId) => {
    if (filterId === 'all') return false
    return FILTER_KEYWORDS[filterId].some((keyword) => text.includes(keyword))
  })
}

function categoryPopularityScore(category: MarketplaceCategory): number {
  const professionals = Number(category.professionals_count ?? 0)
  const projects = Number(category.completed_projects_count ?? 0)
  const reviews = Number(category.reviews_count ?? 0)
  const services = Number(category.services_count ?? 0)
  const rating = Number(category.avg_rating ?? 0)
  return professionals * 4 + projects * 3 + reviews * 2 + services + rating * 20
}

function formatStat(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(Math.round(n))
}

/**
 * Displays ONLY main construction categories from Supabase (`is_main = true`).
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  subtitle,
  eyebrow,
  showSearch = false,
  categories: externalCategories,
  loading: externalLoading,
  className = '',
}: MainCategoriesSectionProps) {
  const { language, t } = useApp()
  const [internal, setInternal] = useState<MarketplaceCategory[]>([])
  const [internalLoading, setInternalLoading] = useState(!externalCategories)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<CategoryFilterId>('all')
  const [recentCategories, setRecentCategories] = useState<RecentCategoryView[]>([])

  useEffect(() => {
    if (externalCategories) return
    let cancelled = false
    ;(async () => {
      setInternalLoading(true)
      try {
        const rows = await fetchMainMarketplaceCategories()
        if (!cancelled) setInternal(rows)
      } finally {
        if (!cancelled) setInternalLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [externalCategories])

  useEffect(() => {
    setRecentCategories(getRecentCategories())
  }, [])

  const source = externalCategories ?? internal
  const loading = externalLoading ?? internalLoading
  const searched = useMemo(
    () => filterCategoriesByQuery(source, query, language.code),
    [source, query, language.code],
  )
  const filtered = useMemo(
    () =>
      searched.filter((category) =>
        categoryMatchesFilter(category, activeFilter, language.code),
      ),
    [searched, activeFilter, language.code],
  )
  const trending = useMemo(
    () =>
      [...source]
        .sort((a, b) => categoryPopularityScore(b) - categoryPopularityScore(a))
        .slice(0, 6),
    [source],
  )
  const recommended = useMemo(() => {
    if (recentCategories.length === 0 || source.length === 0) return []

    const recentSlugs = new Set(recentCategories.map((category) => category.slug))
    const relatedFilters = new Set<CategoryFilterId>()
    for (const recent of recentCategories) {
      for (const filterId of filterIdsForText(recentCategoryText(recent))) {
        relatedFilters.add(filterId)
      }
    }

    return [...source]
      .filter((category) => {
        if (recentSlugs.has(category.slug)) return true
        return CATEGORY_FILTERS.some(
          (filter) =>
            filter.id !== 'all' &&
            relatedFilters.has(filter.id) &&
            categoryMatchesFilter(category, filter.id, language.code),
        )
      })
      .sort((a, b) => {
        const aExact = recentSlugs.has(a.slug) ? 1 : 0
        const bExact = recentSlugs.has(b.slug) ? 1 : 0
        if (bExact !== aExact) return bExact - aExact
        return categoryPopularityScore(b) - categoryPopularityScore(a)
      })
      .slice(0, 4)
  }, [recentCategories, source, language.code])
  const visibleStats = useMemo(() => {
    const ratings = filtered
      .map((category) => Number(category.avg_rating ?? 0))
      .filter((rating) => Number.isFinite(rating) && rating > 0)
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0

    return {
      professionals: filtered.reduce(
        (sum, category) => sum + Number(category.professionals_count ?? 0),
        0,
      ),
      projects: filtered.reduce(
        (sum, category) => sum + Number(category.completed_projects_count ?? 0),
        0,
      ),
      reviews: filtered.reduce(
        (sum, category) => sum + Number(category.reviews_count ?? 0),
        0,
      ),
      averageRating,
    }
  }, [filtered])

  const sectionTitle = title ?? t('homePremium.categoriesTitle')
  const sectionSubtitle = subtitle ?? t('homePremium.categoriesSubtitle')
  const sectionEyebrow = eyebrow ?? t('homePremium.categoriesEyebrow')

  const handleFilterKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()

    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % CATEGORY_FILTERS.length
    if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + CATEGORY_FILTERS.length) % CATEGORY_FILTERS.length
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = CATEGORY_FILTERS.length - 1

    const nextFilter = CATEGORY_FILTERS[nextIndex]
    setActiveFilter(nextFilter.id)
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    )
    buttons?.[nextIndex]?.focus()
  }

  return (
    <section
      id={id}
      className={`main-categories-section home-section layout-page-gutter ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="home-section__head main-categories-section__head">
        <div>
          <p className="home-section__eyebrow">{sectionEyebrow}</p>
          <h2 id={`${id}-title`} className="home-section__title">
            {sectionTitle}
          </h2>
          <p className="home-section__subtitle">{sectionSubtitle}</p>
        </div>

        <div className="main-categories-section__tools">
          {showSearch ? (
            <label className="main-categories-section__search">
              <Search className="h-4 w-4 shrink-0 text-[#8a4b20]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('marketplace.searchCategories')}
                aria-label={t('marketplace.searchCategories')}
              />
            </label>
          ) : null}
        </div>
      </div>

      <div
        className="main-categories-section__filters"
        role="tablist"
        aria-label={t('marketplace.categoryFilters')}
      >
        {CATEGORY_FILTERS.map((filter, index) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.id}
            className={
              activeFilter === filter.id
                ? 'main-categories-section__filter main-categories-section__filter--active'
                : 'main-categories-section__filter'
            }
            onClick={() => setActiveFilter(filter.id)}
            onKeyDown={(event) => handleFilterKeyDown(event, index)}
          >
            {t(filter.labelKey)}
          </button>
        ))}
      </div>

      <dl className="main-categories-section__stats" aria-label={t('marketplace.categoryStats')}>
        <div>
          <dt>{t('marketplace.professionals')}</dt>
          <dd>{formatStat(visibleStats.professionals)}</dd>
        </div>
        <div>
          <dt>{t('marketplace.projects')}</dt>
          <dd>{formatStat(visibleStats.projects)}</dd>
        </div>
        <div>
          <dt>{t('marketplace.reviews')}</dt>
          <dd>{formatStat(visibleStats.reviews)}</dd>
        </div>
        <div>
          <dt>{t('marketplace.avgRating')}</dt>
          <dd>{visibleStats.averageRating > 0 ? visibleStats.averageRating.toFixed(1) : '—'}</dd>
        </div>
      </dl>

      {loading ? (
        <div className="category-service-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="category-service-card category-service-card--skeleton"
              aria-hidden
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="home-section__empty">{t('marketplace.noCategories')}</p>
      ) : (
        <>
          {recommended.length > 0 ? (
            <div className="main-categories-section__rail" aria-labelledby={`${id}-recommended`}>
              <div className="main-categories-section__rail-head">
                <span className="main-categories-section__rail-icon" aria-hidden>
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="main-categories-section__rail-kicker">
                    {t('marketplace.aiRecommendations')}
                  </p>
                  <h3 id={`${id}-recommended`}>
                    {t('marketplace.recommendedForYou')}
                  </h3>
                </div>
              </div>
              <div className="category-service-grid category-service-grid--featured">
                {recommended.map((category) => (
                  <CategoryServiceCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          ) : null}

          {trending.length > 0 ? (
            <div className="main-categories-section__rail" aria-labelledby={`${id}-trending`}>
              <div className="main-categories-section__rail-head">
                <span className="main-categories-section__rail-icon" aria-hidden>
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <p className="main-categories-section__rail-kicker">
                    {t('marketplace.categoryStats')}
                  </p>
                  <h3 id={`${id}-trending`}>{t('marketplace.trendingCategories')}</h3>
                </div>
              </div>
              <div className="category-service-grid category-service-grid--featured">
                {trending.map((category) => (
                  <CategoryServiceCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="main-categories-section__all" aria-labelledby={`${id}-all`}>
            <div className="main-categories-section__rail-head main-categories-section__rail-head--plain">
              <span className="main-categories-section__rail-icon" aria-hidden>
                <BarChart3 className="h-4 w-4" />
              </span>
              <h3 id={`${id}-all`}>{t('marketplace.mainCategories')}</h3>
            </div>
            <div className="category-service-grid">
              {filtered.map((category) => (
                <CategoryServiceCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
