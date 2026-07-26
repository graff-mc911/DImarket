import { CalendarDays, ReceiptText, TrendingUp } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { MarketplaceCategory } from '../../lib/marketplaceCategories'
import type { ListingWithImages } from '../../lib/types'

interface CategoryPriceGuideProps {
  category: MarketplaceCategory
  categoryTitle: string
  projects: ListingWithImages[]
}

type Range = {
  min: number
  max: number
  unit: 'project' | 'sqm' | 'hour'
  durationDays: number
}

const FALLBACK_RANGES: Array<{ test: RegExp; range: Range }> = [
  { test: /paint|wallpaper|facade/, range: { min: 8, max: 24, unit: 'sqm', durationDays: 4 } },
  { test: /tiling|floor/, range: { min: 18, max: 55, unit: 'sqm', durationDays: 5 } },
  { test: /plumb|electro|hvac|repair/, range: { min: 45, max: 95, unit: 'hour', durationDays: 2 } },
  { test: /roof|masonry|concrete|demolition/, range: { min: 1200, max: 8500, unit: 'project', durationDays: 10 } },
]

function fallbackRange(slug: string): Range {
  const match = FALLBACK_RANGES.find((item) => item.test.test(slug))
  return match?.range ?? { min: 350, max: 3200, unit: 'project', durationDays: 6 }
}

function projectRange(projects: ListingWithImages[], slug: string): Range {
  const budgets = projects
    .flatMap((project) => [project.budget_min, project.budget_max, project.price])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)

  const durations = projects
    .map((project) => Number(project.duration_days))
    .filter((value) => Number.isFinite(value) && value > 0)

  const fallback = fallbackRange(slug)
  if (budgets.length === 0) {
    return {
      ...fallback,
      durationDays:
        durations.length > 0
          ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          : fallback.durationDays,
    }
  }

  return {
    min: Math.min(...budgets),
    max: Math.max(...budgets),
    unit: 'project',
    durationDays:
      durations.length > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : fallback.durationDays,
  }
}

function formatPrice(value: number, symbol: string): string {
  return `${symbol}${Math.round(value).toLocaleString()}`
}

export function CategoryPriceGuide({
  category,
  categoryTitle,
  projects,
}: CategoryPriceGuideProps) {
  const { currency, t } = useApp()
  const range = projectRange(projects, category.slug)
  const unit =
    range.unit === 'sqm'
      ? t('priceGuide.unit.sqm')
      : range.unit === 'hour'
        ? t('priceGuide.unit.hour')
        : t('catPage.perProject')

  return (
    <section className="cat-section" aria-labelledby="cat-price-guide">
      <div className="cat-section__head">
        <div>
          <h2 id="cat-price-guide">{t('catPage.priceGuide')}</h2>
          <p>{t('catPage.priceGuideSubtitle').replace('{category}', categoryTitle)}</p>
        </div>
      </div>

      <div className="cat-price-guide">
        <article className="cat-price-guide__card cat-price-guide__card--primary">
          <span className="cat-price-guide__icon" aria-hidden>
            <ReceiptText className="h-5 w-5" />
          </span>
          <p>{t('catPage.estimatedPriceRange')}</p>
          <strong>
            {formatPrice(range.min, currency.symbol)} - {formatPrice(range.max, currency.symbol)}
          </strong>
          <span>{unit}</span>
        </article>

        <article className="cat-price-guide__card">
          <span className="cat-price-guide__icon" aria-hidden>
            <CalendarDays className="h-5 w-5" />
          </span>
          <p>{t('catPage.averageDuration')}</p>
          <strong>{range.durationDays} {t('catPage.days')}</strong>
          <span>{t('catPage.durationHint')}</span>
        </article>

        <article className="cat-price-guide__card">
          <span className="cat-price-guide__icon" aria-hidden>
            <TrendingUp className="h-5 w-5" />
          </span>
          <p>{t('catPage.quoteAccuracy')}</p>
          <strong>{t('catPage.quoteAccuracyValue')}</strong>
          <span>{t('priceGuide.disclaimer')}</span>
        </article>
      </div>
    </section>
  )
}
