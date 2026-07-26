import { ArrowRight } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon } from '../lib/categoryIcons'
import {
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'

export interface ServiyaCategoryItemProps {
  category: MarketplaceCategory
  /** When set, service tiles route to professionals filtered by work slug */
  parentSlug?: string
  className?: string
  hidden?: boolean
}

/**
 * Serviya.es category tile: icon + title + arrow, gray surface, orange hover.
 */
export function ServiyaCategoryItem({
  category,
  parentSlug,
  className = '',
  hidden = false,
}: ServiyaCategoryItemProps) {
  const { language } = useApp()
  const Icon = resolveCategoryIcon(category.icon_key)
  const title = marketplaceCategoryLabel(category, language.code)
  const path = parentSlug
    ? `/professionals?work=${encodeURIComponent(category.slug)}&category=${encodeURIComponent(parentSlug)}`
    : marketplaceCategoryPath(category.slug)

  return (
    <a
      href={path}
      className={`serviya-cat__item ${hidden ? 'serviya-cat__item--hidden' : ''} ${className}`.trim()}
      title={title}
      data-group={category.parent_id ?? category.id}
      onClick={(e) => {
        e.preventDefault()
        navigateTo(path)
      }}
    >
      <span className="serviya-cat__item-icon" aria-hidden>
        <Icon size={32} strokeWidth={1.75} />
      </span>
      <span className="serviya-cat__item-bottom">
        <span className="serviya-cat__item-title">{title}</span>
        <ArrowRight className="serviya-cat__item-arrow" aria-hidden />
      </span>
    </a>
  )
}
