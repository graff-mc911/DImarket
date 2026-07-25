import { ArrowRight, Briefcase, MessageSquareText, Star, Users } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon, resolveCategoryIconColor } from '../lib/categoryIcons'
import {
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'
import type { CSSProperties } from 'react'

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

function formatRating(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n)) || Number(n) <= 0) return '—'
  return Number(n).toFixed(1)
}

/**
 * Premium main-category card: 16:9 cover, icon, title, description,
 * professionals, rating, completed projects, View Services CTA.
 * All display fields come from Supabase-backed MarketplaceCategory.
 */
export function CategoryServiceCard({ category, className = '' }: CategoryServiceCardProps) {
  const { language, t } = useApp()
  const Icon = resolveCategoryIcon(category.icon_key)
  const iconColor = resolveCategoryIconColor(category.slug)
  const title = marketplaceCategoryLabel(category, language.code)
  const description = marketplaceCategoryDescription(category, language.code)
  const cover = category.cover_image_url?.trim() || null
  const rating = category.avg_rating != null ? Number(category.avg_rating) : null
  const path = marketplaceCategoryPath(category.slug)
  const viewServicesLabel = t('marketplace.viewServices')
  const cardStyle = {
    '--category-icon-bg': iconColor.bg,
    '--category-icon-fg': iconColor.fg,
    '--category-icon-ring': iconColor.ring,
  } as CSSProperties & Record<string, string>

  return (
    <article
      className={`category-service-card group ${className}`.trim()}
      style={cardStyle}
      aria-labelledby={`category-card-${category.id}-title`}
    >
      <button
        type="button"
        className="category-service-card__media"
        onClick={() => navigateTo(path)}
        aria-label={`${viewServicesLabel}: ${title}`}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <span className="category-service-card__media-empty" aria-hidden />
        )}
        <span className="category-service-card__fade" aria-hidden />
        <span className="category-service-card__icon" aria-hidden>
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </span>
      </button>

      <div className="category-service-card__body">
        <h3 id={`category-card-${category.id}-title`} className="category-service-card__title">
          {title}
        </h3>
        {description ? (
          <p className="category-service-card__desc">{description}</p>
        ) : null}

        <div className="category-service-card__stats" aria-label={t('marketplace.categoryStats')}>
          <span className="category-service-card__stat">
            <Users className="h-3.5 w-3.5" aria-hidden />
            <strong>{formatCount(category.professionals_count)}</strong>
            {t('marketplace.professionals')}
          </span>
          <span className="category-service-card__stat">
            <Briefcase className="h-3.5 w-3.5" aria-hidden />
            <strong>{formatCount(category.completed_projects_count)}</strong>
            {t('marketplace.completedProjects')}
          </span>
          <span className="category-service-card__stat">
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
            <strong>{formatCount(category.reviews_count)}</strong>
            {t('marketplace.reviews')}
          </span>
          <span className="category-service-card__stat">
            <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" aria-hidden />
            <strong>{formatRating(rating)}</strong>
            {t('marketplace.avgRating')}
          </span>
        </div>

        <button
          type="button"
          className="category-service-card__cta"
          onClick={() => navigateTo(path)}
          aria-label={`${viewServicesLabel}: ${title}`}
        >
          {viewServicesLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
    </article>
  )
}
