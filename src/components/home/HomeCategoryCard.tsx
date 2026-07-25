import { ArrowRight, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { resolveCategoryIcon } from '../../lib/categoryIcons'
import {
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  type MarketplaceCategory,
} from '../../lib/marketplaceCategories'
import { navigateTo } from '../../lib/navigation'

interface HomeCategoryCardProps {
  category: MarketplaceCategory
}

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

export function HomeCategoryCard({ category }: HomeCategoryCardProps) {
  const { language, t } = useApp()
  const Icon = resolveCategoryIcon(category.icon_key)
  const title = marketplaceCategoryLabel(category, language.code)
  const cover =
    category.cover_image_url ||
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80'
  const rating = category.avg_rating != null ? Number(category.avg_rating) : null
  const path = marketplaceCategoryPath(category.slug)

  return (
    <article className="home-category-card group">
      <button
        type="button"
        className="home-category-card__media"
        onClick={() => navigateTo(path)}
        aria-label={title}
      >
        <img src={cover} alt="" loading="lazy" decoding="async" />
        <span className="home-category-card__fade" aria-hidden />
        <span className="home-category-card__icon" aria-hidden>
          <Icon className="h-6 w-6" strokeWidth={1.85} />
        </span>
      </button>

      <div className="home-category-card__body">
        <h3 className="home-category-card__title">{title}</h3>
        <div className="home-category-card__meta">
          <span>
            <strong>{formatCount(category.professionals_count)}</strong>{' '}
            {t('marketplace.professionals')}
          </span>
          <span className="home-category-card__rating">
            <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" aria-hidden />
            {rating != null && rating > 0 ? rating.toFixed(1) : '—'}
          </span>
        </div>
        <button
          type="button"
          className="home-category-card__cta"
          onClick={() => navigateTo(path)}
        >
          {t('homePremium.viewCategory')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  )
}
