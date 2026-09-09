import { useApp } from '../../contexts/AppContext'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'
import { MainCategoriesSection } from '../MainCategoriesSection'

/** Home hubs only — full catalog stays on /categories. */
export const HOME_CATEGORY_SLUGS = [
  'specialists',
  'jobs',
  'buy-sell',
  'hvac',
  'rentals',
  'accounting-finance',
] as const

interface HomeCategoriesPreviewProps {
  categories?: MarketplaceCategory[]
  loading?: boolean
}

/**
 * Home «Категорії» — short hub list + «Усі категорії» → /categories.
 * See docs/CATEGORIES_SOURCE_OF_TRUTH.md.
 */
export function HomeCategoriesPreview({ categories, loading }: HomeCategoriesPreviewProps) {
  const { t } = useApp()
  return (
    <MainCategoriesSection
      id="choose-category"
      className="home-categories-preview"
      title={t('header.categories')}
      categories={categories}
      loading={loading}
      showSearch={false}
      includeSlugs={HOME_CATEGORY_SLUGS}
      seeAllHref="/categories"
      headingAs="h2"
    />
  )
}
