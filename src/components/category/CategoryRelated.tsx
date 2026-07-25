import { CategoryServiceCard } from '../CategoryServiceCard'
import { useApp } from '../../contexts/AppContext'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'

interface CategoryRelatedProps {
  categories: MarketplaceCategory[]
}

export function CategoryRelated({ categories }: CategoryRelatedProps) {
  const { t } = useApp()

  if (categories.length === 0) return null

  return (
    <section className="cat-section" aria-labelledby="cat-related">
      <div className="cat-section__head">
        <h2 id="cat-related">{t('catPage.relatedCategories')}</h2>
      </div>
      <div className="category-service-grid">
        {categories.slice(0, 4).map((category) => (
          <CategoryServiceCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}
