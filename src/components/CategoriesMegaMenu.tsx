import { ChevronRight, Menu } from 'lucide-react'
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

interface CategoriesMegaMenuProps {
  open: boolean
  onClose: () => void
  onNavigate: (path: string) => void
}

export function CategoriesMegaMenu({ open, onClose, onNavigate }: CategoriesMegaMenuProps) {
  const { language, t } = useApp()
  const [mains, setMains] = useState<MarketplaceCategory[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [servicesByParent, setServicesByParent] = useState<Record<string, MarketplaceCategory[]>>({})
  const [loadingServices, setLoadingServices] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const rows = await fetchMainMarketplaceCategories()
      if (cancelled) return
      setMains(rows)
      if (rows[0] && !activeId) setActiveId(rows[0].id)
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const active = useMemo(
    () => mains.find((c) => c.id === activeId) ?? mains[0] ?? null,
    [mains, activeId],
  )

  useEffect(() => {
    if (!open || !active) return
    if (servicesByParent[active.id]) return

    let cancelled = false
    ;(async () => {
      setLoadingServices(true)
      try {
        const services = await fetchCategoryServices(active.id)
        if (!cancelled) {
          setServicesByParent((prev) => ({ ...prev, [active.id]: services }))
        }
      } finally {
        if (!cancelled) setLoadingServices(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, active, servicesByParent])

  if (!open) return null

  const services = active ? servicesByParent[active.id] ?? [] : []

  const go = (path: string) => {
    onNavigate(path)
    onClose()
  }

  return (
    <div className="categories-mega-menu" role="menu" aria-label={t('marketplace.categories')}>
      <div className="categories-mega-menu__inner">
        <aside className="categories-mega-menu__left">
          <p className="categories-mega-menu__label">
            <Menu className="h-3.5 w-3.5" aria-hidden />
            {t('marketplace.mainCategories')}
          </p>
          <ul className="categories-mega-menu__mains">
            {mains.map((cat) => {
              const Icon = resolveCategoryIcon(cat.icon_key)
              const label = marketplaceCategoryLabel(cat, language.code)
              const isActive = active?.id === cat.id
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    className={`categories-mega-menu__main-item ${isActive ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveId(cat.id)}
                    onFocus={() => setActiveId(cat.id)}
                    onClick={() => go(marketplaceCategoryPath(cat.slug))}
                  >
                    <span className="categories-mega-menu__main-icon" aria-hidden>
                      {cat.icon ? <span>{cat.icon}</span> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="categories-mega-menu__main-text">{label}</span>
                    <ChevronRight className="h-4 w-4 opacity-40" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="categories-mega-menu__right">
          {active ? (
            <>
              <div className="categories-mega-menu__right-head">
                <div>
                  <p className="categories-mega-menu__label">{t('marketplace.services')}</p>
                  <h3 className="categories-mega-menu__right-title">
                    {marketplaceCategoryLabel(active, language.code)}
                  </h3>
                </div>
                <button
                  type="button"
                  className="categories-mega-menu__view-all"
                  onClick={() => go(marketplaceCategoryPath(active.slug))}
                >
                  {t('marketplace.viewCategory')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {loadingServices && services.length === 0 ? (
                <p className="categories-mega-menu__empty">{t('marketplace.loading')}</p>
              ) : services.length === 0 ? (
                <p className="categories-mega-menu__empty">{t('marketplace.noServices')}</p>
              ) : (
                <div className="categories-mega-menu__services">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      className="categories-mega-menu__service"
                      onClick={() =>
                        go(marketplaceServiceProsPath(service.slug, active.slug))
                      }
                    >
                      {marketplaceCategoryLabel(service, language.code)}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="categories-mega-menu__empty">{t('marketplace.loading')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Simple helper used when clicking outside isn't enough */
export function openCategoryHome(navigate: (path: string) => void) {
  navigate('/#choose-category')
}
