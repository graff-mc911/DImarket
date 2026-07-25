import { Star } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon } from '../lib/categoryIcons'
import {
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'

interface MarketplaceCategoryCardProps {
  category: MarketplaceCategory
  className?: string
}

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

export function MarketplaceCategoryCard({ category, className = '' }: MarketplaceCategoryCardProps) {
  const { language, t } = useApp()
  const Icon = resolveCategoryIcon(category.icon_key)
  const title = marketplaceCategoryLabel(category, language.code)
  const cover =
    category.cover_image_url ||
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80'
  const rating = category.avg_rating != null ? Number(category.avg_rating) : null

  return (
    <button
      type="button"
      onClick={() => navigateTo(marketplaceCategoryPath(category.slug))}
      className={`marketplace-category-card group text-left ${className}`}
      aria-label={title}
    >
      <div className="marketplace-category-card__media">
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className="marketplace-category-card__image"
        />
        <div className="marketplace-category-card__media-fade" aria-hidden />
        <div className="marketplace-category-card__icon-badge" aria-hidden>
          {category.icon ? (
            <span className="text-2xl leading-none">{category.icon}</span>
          ) : (
            <Icon className="h-7 w-7" strokeWidth={1.75} />
          )}
        </div>
      </div>

      <div className="marketplace-category-card__body">
        <h3 className="marketplace-category-card__title">{title}</h3>

        <div className="marketplace-category-card__stats">
          <span>
            <strong>{formatCount(category.services_count)}</strong>{' '}
            {t('marketplace.services')}
          </span>
          <span className="marketplace-category-card__dot" aria-hidden />
          <span>
            <strong>{formatCount(category.professionals_count)}</strong>{' '}
            {t('marketplace.professionals')}
          </span>
        </div>

        <div className="marketplace-category-card__rating">
          <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" aria-hidden />
          <span>
            {rating != null && rating > 0 ? rating.toFixed(1) : '—'}
          </span>
          <span className="marketplace-category-card__rating-label">
            {t('marketplace.avgRating')}
          </span>
        </div>
      </div>
    </button>
  )
}

