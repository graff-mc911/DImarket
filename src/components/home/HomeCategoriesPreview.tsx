import { useApp } from '../../contexts/AppContext'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'
import { navigateTo } from '../../lib/navigation'
import { HomeCategoryCard } from './HomeCategoryCard'

interface HomeCategoriesPreviewProps {
  categories: MarketplaceCategory[]
  loading?: boolean
}

export function HomeCategoriesPreview({ categories, loading }: HomeCategoriesPreviewProps) {
  const { t } = useApp()

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-categories-title">
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.categoriesEyebrow')}</p>
          <h2 id="home-categories-title" className="home-section__title">
            {t('homePremium.categoriesTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.categoriesSubtitle')}</p>
        </div>
        <button
          type="button"
          className="home-section__link"
          onClick={() => navigateTo('/#choose-category')}
        >
          {t('homePremium.seeAllCategories')}
        </button>
      </div>

      {loading ? (
        <div className="home-category-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="home-category-card home-category-card--skeleton" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="home-section__empty">{t('marketplace.noCategories')}</p>
      ) : (
        <div className="home-category-grid" id="choose-category">
          {categories.map((category) => (
            <HomeCategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  )
}
