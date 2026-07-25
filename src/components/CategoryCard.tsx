import { MarketplaceCategoryCard } from './MarketplaceCategoryCard'
import type { MarketplaceCategory } from '../lib/marketplaceCategories'

interface CategoryCardProps {
  category: MarketplaceCategory
}

/** @deprecated Prefer MarketplaceCategoryCard */
export function CategoryCard({ category }: CategoryCardProps) {
  return <MarketplaceCategoryCard category={category} />
}
