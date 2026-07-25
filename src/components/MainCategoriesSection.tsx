import { useEffect, useState } from 'react'
import { CategoryServiceCard } from './CategoryServiceCard'
import { useApp } from '../contexts/AppContext'
import {
  fetchMainMarketplaceCategories,
  filterCategoriesByQuery,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { Search } from 'lucide-react'

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

  const source = externalCategories ?? internal
  const loading = externalLoading ?? internalLoading
  const filtered = filterCategoriesByQuery(source, query, language.code)

  const sectionTitle = title ?? t('homePremium.categoriesTitle')
  const sectionSubtitle = subtitle ?? t('homePremium.categoriesSubtitle')
  const sectionEyebrow = eyebrow ?? t('homePremium.categoriesEyebrow')

  return (
    <section
      id={id}
      className={`main-categories-section home-section layout-page-gutter ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{sectionEyebrow}</p>
          <h2 id={`${id}-title`} className="home-section__title">
            {sectionTitle}
          </h2>
          <p className="home-section__subtitle">{sectionSubtitle}</p>
        </div>

        {showSearch ? (
          <label className="main-categories-section__search">
            <Search className="h-4 w-4 shrink-0 text-[#b07e55]" aria-hidden />
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

      {loading ? (
        <div className="category-service-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="category-service-card category-service-card--skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="home-section__empty">{t('marketplace.noCategories')}</p>
      ) : (
        <div className="category-service-grid">
          {filtered.map((category) => (
            <CategoryServiceCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  )
}
