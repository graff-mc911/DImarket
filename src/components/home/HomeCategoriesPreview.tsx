import { MainCategoriesSection } from '../MainCategoriesSection'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'

interface HomeCategoriesPreviewProps {
  categories: MarketplaceCategory[]
  loading?: boolean
}

export function HomeCategoriesPreview({ categories, loading }: HomeCategoriesPreviewProps) {
  return (
    <MainCategoriesSection
      id="choose-category"
      categories={categories}
      loading={loading}
      showSearch={false}
    />
  )
}
