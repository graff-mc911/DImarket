import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MarketplaceCategoryCard } from './MarketplaceCategoryCard'
import { useApp } from '../contexts/AppContext'
import {
  fetchMainMarketplaceCategories,
  filterCategoriesByQuery,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'

interface ChooseCategorySectionProps {
  id?: string
  compact?: boolean
}

export function ChooseCategorySection({
  id = 'choose-category',
  compact = false,
}: ChooseCategorySectionProps) {
  const { language, t } = useApp()
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const rows = await fetchMainMarketplaceCategories()
        if (!cancelled) setCategories(rows)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => filterCategoriesByQuery(categories, query, language.code),
    [categories, query, language.code],
  )

  return (
    <section id={id} className={`choose-category-section ${compact ? 'choose-category-section--compact' : ''}`}>
      <div className="choose-category-section__header">
        <div>
          <p className="choose-category-section__eyebrow">{t('marketplace.eyebrow')}</p>
          <h2 className="choose-category-section__title">{t('marketplace.chooseCategory')}</h2>
          <p className="choose-category-section__subtitle">{t('marketplace.chooseCategorySubtitle')}</p>
        </div>

        <label className="choose-category-section__search">
          <Search className="h-4 w-4 shrink-0 text-[#b07e55]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('marketplace.searchCategories')}
            aria-label={t('marketplace.searchCategories')}
          />
        </label>
      </div>

      {loading ? (
        <div className="marketplace-category-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="marketplace-category-card marketplace-category-card--skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="choose-category-section__empty">{t('marketplace.noCategories')}</p>
      ) : (
        <div className="marketplace-category-grid">
          {filtered.map((category) => (
            <MarketplaceCategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  )
}
