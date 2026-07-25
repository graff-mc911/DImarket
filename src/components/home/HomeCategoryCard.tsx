import { CategoryServiceCard } from '../CategoryServiceCard'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'

/** @deprecated Use CategoryServiceCard */
export function HomeCategoryCard({ category }: { category: MarketplaceCategory }) {
  return <CategoryServiceCard category={category} />
}
