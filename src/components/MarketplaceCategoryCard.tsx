import { CategoryServiceCard } from './CategoryServiceCard'
import type { MarketplaceCategory } from '../lib/marketplaceCategories'

interface MarketplaceCategoryCardProps {
  category: MarketplaceCategory
  className?: string
}

/** @deprecated Prefer CategoryServiceCard for photo cards */
export function MarketplaceCategoryCard({ category, className }: MarketplaceCategoryCardProps) {
  return <CategoryServiceCard category={category} className={className} />
}
