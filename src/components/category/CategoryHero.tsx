import type { ReactNode } from 'react'
import { Briefcase, Star, Users, Wrench } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { resolveCategoryIcon } from '../../lib/categoryIcons'
import { coverImageForCategory } from '../../lib/categoryCoverImages'
import {
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  type MarketplaceCategory,
} from '../../lib/marketplaceCategories'

interface CategoryHeroProps {
  category: MarketplaceCategory
  servicesCount: number
  reviewsCount: number
}

export function CategoryHero({ category, servicesCount, reviewsCount }: CategoryHeroProps) {
  const { language, t } = useApp()
  const Icon = resolveCategoryIcon(category.icon_key)
  const title = marketplaceCategoryLabel(category, language.code)
  const description = marketplaceCategoryDescription(category, language.code)
  const cover = coverImageForCategory(category.slug, category.cover_image_url)

  return (
    <header className="cat-hero">
      {cover ? (
        <img src={cover} alt="" className="cat-hero__image" />
      ) : (
        <div className="cat-hero__image cat-hero__image--empty" aria-hidden />
      )}
      <div className="cat-hero__overlay" />
      <div className="cat-hero__content layout-page-gutter">
        <div className="cat-hero__icon" aria-hidden>
          <Icon className="h-10 w-10" strokeWidth={1.6} />
        </div>
        <h1 className="cat-hero__title">{title}</h1>
        {description ? <p className="cat-hero__desc">{description}</p> : null}

        <div className="cat-hero__stats">
          <StatPill
            icon={<Wrench className="h-4 w-4" />}
            label={t('marketplace.services')}
            value={String(category.services_count ?? servicesCount)}
          />
          <StatPill
            icon={<Users className="h-4 w-4" />}
            label={t('marketplace.professionals')}
            value={String(category.professionals_count ?? 0)}
          />
          <StatPill
            icon={<Briefcase className="h-4 w-4" />}
            label={t('marketplace.completedProjects')}
            value={String(category.completed_projects_count ?? 0)}
          />
          <StatPill
            icon={<Star className="h-4 w-4" />}
            label={t('marketplace.avgRating')}
            value={
              category.avg_rating != null && Number(category.avg_rating) > 0
                ? Number(category.avg_rating).toFixed(1)
                : '—'
            }
          />
          <StatPill
            icon={<Star className="h-4 w-4" />}
            label={t('catPage.reviewsStat')}
            value={String(reviewsCount)}
          />
        </div>
      </div>
    </header>
  )
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="cat-stat-pill">
      <span className="cat-stat-pill__icon">{icon}</span>
      <div>
        <p className="cat-stat-pill__value">{value}</p>
        <p className="cat-stat-pill__label">{label}</p>
      </div>
    </div>
  )
}
