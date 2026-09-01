import { MainCategoriesSection } from '../MainCategoriesSection'
import { useApp } from '../../contexts/AppContext'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'

interface HomeCategoriesPreviewProps {
  categories: MarketplaceCategory[]
  loading?: boolean
}

export function HomeCategoriesPreview({ categories, loading }: HomeCategoriesPreviewProps) {
  const { t } = useApp()
  return (
    <MainCategoriesSection
      id="choose-category"
      title={t('header.categories')}
      categories={categories}
      loading={loading}
      showSearch={false}
    />
  )
}
