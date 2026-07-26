import { useEffect, useMemo, useState } from 'react'
import { ServiyaCategoryItem } from './ServiyaCategoryItem'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon } from '../lib/categoryIcons'
import {
  fetchCategoryServices,
  fetchMainMarketplaceCategories,
  marketplaceCategoryLabel,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'

export interface MainCategoriesSectionProps {
  id?: string
  title?: string
  subtitle?: string
  eyebrow?: string
  showSearch?: boolean
  /** Preloaded main categories (skip internal fetch) */
  categories?: MarketplaceCategory[]
  loading?: boolean
  className?: string
}

/**
 * “Select category” block matching serviya.es:
 * main-category toggler pills + service tiles grid.
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  categories: externalCategories,
  loading: externalLoading,
  className = '',
}: MainCategoriesSectionProps) {
  const { language, t } = useApp()
  const [internal, setInternal] = useState<MarketplaceCategory[]>([])
  const [internalLoading, setInternalLoading] = useState(!externalCategories)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [servicesByParent, setServicesByParent] = useState<Record<string, MarketplaceCategory[]>>(
    {},
  )
  const [servicesLoading, setServicesLoading] = useState(false)

  useEffect(() => {
    if (externalCategories) return
    let cancelled = false
    ;(async () => {
      setInternalLoading(true)
      try {
        const rows = await fetchMainMarketplaceCategories()
        if (!cancelled) setInternal(rows)
      } finally {
        if (!cancelled) setInternalLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [externalCategories])

  const mains = externalCategories ?? internal
  const loading = externalLoading ?? internalLoading

  useEffect(() => {
    if (!mains.length) return
    if (!activeId || !mains.some((c) => c.id === activeId)) {
      setActiveId(mains[0].id)
    }
  }, [mains, activeId])

  useEffect(() => {
    if (!activeId) return
    if (Object.prototype.hasOwnProperty.call(servicesByParent, activeId)) return
    let cancelled = false
    ;(async () => {
      setServicesLoading(true)
      try {
        const rows = await fetchCategoryServices(activeId)
        if (!cancelled) {
          setServicesByParent((prev) => ({ ...prev, [activeId]: rows }))
        }
      } finally {
        if (!cancelled) setServicesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeId, servicesByParent])

  const activeMain = useMemo(
    () => mains.find((c) => c.id === activeId) ?? null,
    [mains, activeId],
  )

  const tiles = useMemo(() => {
    if (!activeId) return [] as MarketplaceCategory[]
    const children = servicesByParent[activeId]
    if (children == null) return []
    if (children.length > 0) return children
    // Fallback: show the main category itself when it has no children yet
    return activeMain ? [activeMain] : []
  }, [activeId, servicesByParent, activeMain])

  const sectionTitle = title ?? t('homePremium.categoriesTitle')
  const showTilesLoading = Boolean(activeId) && servicesByParent[activeId!] == null && servicesLoading

  return (
    <section
      id={id}
      className={`serviya-cat layout-page-gutter ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="serviya-cat__container">
        <h2 id={`${id}-title`} className="serviya-cat__title">
          {sectionTitle}
        </h2>

        {loading ? (
          <div className="serviya-cat__togglers" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="serviya-cat__toggler serviya-cat__toggler--skeleton" />
            ))}
          </div>
        ) : mains.length === 0 ? (
          <p className="serviya-cat__empty">{t('marketplace.noCategories')}</p>
        ) : (
          <div className="serviya-cat__togglers" role="tablist" aria-label={sectionTitle}>
            {mains.map((cat) => {
              const Icon = resolveCategoryIcon(cat.icon_key)
              const label = marketplaceCategoryLabel(cat, language.code)
              const active = cat.id === activeId
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`serviya-cat__toggler${active ? ' is-active' : ''}`}
                  onClick={() => setActiveId(cat.id)}
                >
                  <Icon className="serviya-cat__toggler-icon" aria-hidden />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        )}

        {showTilesLoading ? (
          <div className="serviya-cat__grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="serviya-cat__item serviya-cat__item--skeleton" />
            ))}
          </div>
        ) : tiles.length === 0 && !loading ? (
          <p className="serviya-cat__empty">{t('marketplace.noServices')}</p>
        ) : (
          <div className="serviya-cat__grid">
            {tiles.map((service) => (
              <ServiyaCategoryItem
                key={service.id}
                category={service}
                parentSlug={
                  activeMain && service.id !== activeMain.id ? activeMain.slug : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
