import { ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon } from '../lib/categoryIcons'
import {
  fetchCategoryServices,
  fetchMainMarketplaceCategories,
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  marketplaceServiceProsPath,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'
import { pushRecentCategory } from '../lib/recentCategories'

export type CabinetCategoryBrowserMode = 'categories' | 'professionals'

interface CabinetCategoryBrowserProps {
  mode: CabinetCategoryBrowserMode
  onSelectService?: (serviceSlug: string, categorySlug: string) => void
  onSelectCategory?: (categorySlug: string) => void
  className?: string
  /** Home embeds this under an existing page H1 — use h2 there. */
  headingAs?: 'h1' | 'h2'
}

/** Owner-cabinet category cards: white square tiles with icon / title / chevron. */
export function CabinetCategoryBrowser({
  mode,
  onSelectService,
  onSelectCategory,
  className = '',
  headingAs = 'h1',
}: CabinetCategoryBrowserProps) {
  const { language, t } = useApp()
  const [mains, setMains] = useState<MarketplaceCategory[]>([])
  const [servicesByParent, setServicesByParent] = useState<Record<string, MarketplaceCategory[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingServices, setLoadingServices] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const rows = await fetchMainMarketplaceCategories()
        if (!cancelled) setMains(rows)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!expandedId || servicesByParent[expandedId]) return
    let cancelled = false
    ;(async () => {
      setLoadingServices(true)
      try {
        const services = await fetchCategoryServices(expandedId)
        if (!cancelled) {
          setServicesByParent((prev) => ({ ...prev, [expandedId]: services }))
        }
      } finally {
        if (!cancelled) setLoadingServices(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [expandedId, servicesByParent])

  const q = query.trim().toLowerCase()
  const filteredMains = useMemo(() => {
    if (!q) return mains
    return mains.filter((c) => {
      const label = marketplaceCategoryLabel(c, language.code).toLowerCase()
      return label.includes(q) || c.slug.includes(q)
    })
  }, [mains, q, language.code])

  const remember = (cat: MarketplaceCategory) => {
    pushRecentCategory({
      id: cat.id,
      slug: cat.slug,
      name: marketplaceCategoryLabel(cat, language.code),
      icon_key: cat.icon_key ?? null,
    })
  }

  const toggle = (cat: MarketplaceCategory) => {
    const next = expandedId === cat.id ? null : cat.id
    setExpandedId(next)
    if (next) onSelectCategory?.(cat.slug)
  }

  const goCategory = (cat: MarketplaceCategory) => {
    remember(cat)
    if (mode === 'professionals') {
      onSelectCategory?.(cat.slug)
      setExpandedId(cat.id)
      return
    }
    navigateTo(marketplaceCategoryPath(cat.slug))
  }

  const goService = (service: MarketplaceCategory, parent: MarketplaceCategory) => {
    remember(service)
    if (mode === 'professionals' && onSelectService) {
      onSelectService(service.slug, parent.slug)
      return
    }
    navigateTo(marketplaceServiceProsPath(service.slug, parent.slug))
  }

  const title =
    mode === 'professionals' ? t('professionals.simpleTitle') : t('header.categories')
  const subtitle =
    mode === 'professionals'
      ? t('professionals.simpleDescription')
      : t('catPage.seoDescription').replace('{category}', t('header.categories'))

  return (
    <section className={`dimarket-categories layout-page-gutter py-6 ${className}`.trim()}>
      <div className="dimarket-categories__head mb-5" style={{ textAlign: 'left' }}>
        <p className="dimarket-categories__eyebrow" style={{ textAlign: 'left' }}>
          {mode === 'professionals' ? t('professionals.eyebrow') : t('marketplace.mainCategories')}
        </p>
        {headingAs === 'h2' ? (
          <h2 className="dimarket-categories__title" style={{ textAlign: 'left' }}>
            {title}
          </h2>
        ) : (
          <h1 className="dimarket-categories__title" style={{ textAlign: 'left' }}>
            {title}
          </h1>
        )}
        <p className="mt-2 max-w-2xl text-sm leading-6 md:text-base">{subtitle}</p>
      </div>

      <label className="dimarket-search__input mb-5 max-w-xl">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('mega.searchPlaceholder')}
          aria-label={t('mega.searchPlaceholder')}
        />
      </label>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--dimarket-muted)' }}>
          {t('marketplace.loading')}
        </p>
      ) : filteredMains.length === 0 ? (
        <p className="dimarket-categories__empty">{t('marketplace.noCategories')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMains.map((cat) => {
            const Icon = resolveCategoryIcon(cat.icon_key)
            const label = marketplaceCategoryLabel(cat, language.code)
            const isOpen = expandedId === cat.id
            const services = servicesByParent[cat.id] ?? []
            const countHint =
              typeof cat.professionals_count === 'number' && cat.professionals_count > 0
                ? `${cat.professionals_count} проф.`
                : typeof cat.services_count === 'number' && cat.services_count > 0
                  ? `${cat.services_count} послуг`
                  : null
            const sub = isOpen
              ? loadingServices
                ? t('marketplace.loading')
                : services.length > 0
                  ? `${services.length} · ${t('marketplace.viewServices')}`
                  : t('marketplace.noServices')
              : countHint || 'Натисніть, щоб відкрити'

            return (
              <article
                key={cat.id}
                className={`dimarket-category-card ${isOpen ? 'sm:col-span-2 xl:col-span-3' : ''}`}
              >
                <button
                  type="button"
                  className="dimarket-category-card__button"
                  onClick={() => toggle(cat)}
                  onDoubleClick={() => goCategory(cat)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Згорнути' : 'Відкрити'}: ${label}`}
                >
                  <span className="dimarket-category-card__icon" aria-hidden>
                    <Icon className="h-8 w-8 text-[#1b4d3e]" />
                  </span>
                  <span className="dimarket-category-card__body">
                    <strong>{label}</strong>
                    <span>{sub}</span>
                  </span>
                  <ChevronRight className="dimarket-category-card__chevron h-5 w-5" aria-hidden />
                </button>

                {isOpen ? (
                  <div className="dimarket-subcategories">
                    <div>
                      <button
                        type="button"
                        className="dimarket-subcategory-chip dimarket-subcategory-chip--primary"
                        onClick={() => goCategory(cat)}
                      >
                        {mode === 'professionals'
                          ? t('professionals.browseLink')
                          : t('marketplace.viewServices')}
                      </button>
                      {loadingServices && services.length === 0 ? (
                        <p className="basis-full px-1 py-1 text-sm" style={{ color: 'var(--dimarket-muted)' }}>
                          {t('marketplace.loading')}
                        </p>
                      ) : null}
                      {services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          className="dimarket-subcategory-chip"
                          onClick={() => goService(service, cat)}
                        >
                          {marketplaceCategoryLabel(service, language.code)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-sm" style={{ color: 'var(--dimarket-muted)' }}>
        {`Показано ${filteredMains.length} з ${mains.length}.`}
      </p>
    </section>
  )
}
