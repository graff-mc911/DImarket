import { useApp } from '../../contexts/AppContext'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'
import { MainCategoriesSection } from '../MainCategoriesSection'

interface HomeCategoriesPreviewProps {
  categories?: MarketplaceCategory[]
  loading?: boolean
}

/**
 * Home «Категорії» — full static catalog (`serviceCategories`) with
 * «Усі категорії» → /categories. See docs/CATEGORIES_SOURCE_OF_TRUTH.md.
 */
export function HomeCategoriesPreview({ categories, loading }: HomeCategoriesPreviewProps) {
  const { t } = useApp()
  return (
    <MainCategoriesSection
      id="choose-category"
      title={t('header.categories')}
      categories={categories}
      loading={loading}
      showSearch={false}
      seeAllHref="/categories"
      headingAs="h2"
    />
  )
}
