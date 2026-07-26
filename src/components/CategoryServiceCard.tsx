import { ArrowRight, Briefcase, Star, Users } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon, resolveCategoryIconColor } from '../lib/categoryIcons'
import {
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'

export interface CategoryServiceCardProps {
  category: MarketplaceCategory
  className?: string
}

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '0'
  const value = Number(n)
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(Math.round(value))
}

/**
 * Icon-first category card (no cover photos).
 */
export function CategoryServiceCard({ category, className = '' }: CategoryServiceCardProps) {
  const { language, t } = useApp()
  const Icon = resolveCategoryIcon(category.icon_key)
  const iconColor = resolveCategoryIconColor(category.slug)
  const title = marketplaceCategoryLabel(category, language.code)
  const description = marketplaceCategoryDescription(category, language.code)
  const rating = category.avg_rating != null ? Number(category.avg_rating) : null
  const path = marketplaceCategoryPath(category.slug)
  const cardStyle = {
    '--category-icon-bg': iconColor.bg,
    '--category-icon-fg': iconColor.fg,
    '--category-icon-ring': iconColor.ring,
  } as CSSProperties & Record<string, string>

  return (
    <article
      className={`category-service-card category-service-card--icon group ${className}`.trim()}
      style={cardStyle}
    >
      <button
        type="button"
        className="category-service-card__media category-service-card__media--icon"
        onClick={() => navigateTo(path)}
        aria-label={title}
      >
        <span className="category-service-card__icon" aria-hidden>
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </span>
      </button>

      <div className="category-service-card__body">
        <h3 className="category-service-card__title">{title}</h3>
        {description ? <p className="category-service-card__desc">{description}</p> : null}

        <div className="category-service-card__stats">
          <span className="category-service-card__stat">
            <Users className="h-3.5 w-3.5" aria-hidden />
            <strong>{formatCount(category.professionals_count)}</strong>
            {t('marketplace.professionals')}
          </span>
          <span className="category-service-card__stat">
            <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" aria-hidden />
            <strong>{rating != null && rating > 0 ? rating.toFixed(1) : '—'}</strong>
            {t('marketplace.avgRating')}
          </span>
          <span className="category-service-card__stat">
            <Briefcase className="h-3.5 w-3.5" aria-hidden />
            <strong>{formatCount(category.completed_projects_count)}</strong>
            {t('marketplace.completedProjects')}
          </span>
        </div>

        <button type="button" className="category-service-card__cta" onClick={() => navigateTo(path)}>
          {t('marketplace.viewServices')}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
    </article>
  )
}
