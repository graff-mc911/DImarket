import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon, resolveCategoryIconColor } from '../lib/categoryIcons'
import {
  fetchCategoryServices,
  fetchMainMarketplaceCategories,
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  marketplaceServiceProsPath,
  type MarketplaceCategory,
} from '../lib/marketplaceCategories'
import {
  getRecentCategories,
  pushRecentCategory,
  type RecentCategoryView,
} from '../lib/recentCategories'

interface CategoriesMegaMenuProps {
  open: boolean
  onClose: () => void
  onNavigate: (path: string) => void
  /** Full-screen panel (desktop) or slide-in drawer (mobile) */
  variant?: 'fullscreen' | 'drawer'
}

export function CategoriesMegaMenu({
  open,
  onClose,
  onNavigate,
  variant = 'fullscreen',
}: CategoriesMegaMenuProps) {
  const { language, t } = useApp()
  const [mains, setMains] = useState<MarketplaceCategory[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [servicesByParent, setServicesByParent] = useState<Record<string, MarketplaceCategory[]>>({})
  const [loadingServices, setLoadingServices] = useState(false)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<RecentCategoryView[]>([])
  const [mobileStep, setMobileStep] = useState<'mains' | 'services'>('mains')

  useEffect(() => {
    if (!open) {
      setQuery('')
      setMobileStep('mains')
      return
    }
    setRecent(getRecentCategories())
    let cancelled = false
    ;(async () => {
      const rows = await fetchMainMarketplaceCategories()
      if (cancelled) return
      setMains(rows)
      setActiveId((prev) => prev ?? rows[0]?.id ?? null)
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

  // Prefetch a few mains for popular chips
  useEffect(() => {
    if (!open || mains.length === 0) return
    const targets = mains.slice(0, 4)
    targets.forEach((cat) => {
      if (servicesByParent[cat.id]) return
      void fetchCategoryServices(cat.id).then((services) => {
        setServicesByParent((prev) =>
          prev[cat.id] ? prev : { ...prev, [cat.id]: services },
        )
      })
    })
  }, [open, mains, servicesByParent])

  const q = query.trim().toLowerCase()

  const filteredMains = useMemo(() => {
    if (!q) return mains
    return mains.filter((c) => {
      const label = marketplaceCategoryLabel(c, language.code).toLowerCase()
      return label.includes(q) || c.slug.includes(q)
    })
  }, [mains, q, language.code])

  const activeServices = active ? servicesByParent[active.id] ?? [] : []

  const filteredServices = useMemo(() => {
    if (!q) return activeServices
    return activeServices.filter((s) =>
      marketplaceCategoryLabel(s, language.code).toLowerCase().includes(q),
    )
  }, [activeServices, q, language.code])

  const popularServices = useMemo(() => {
    const picks: { service: MarketplaceCategory; parentSlug: string }[] = []
    for (const main of mains.slice(0, 6)) {
      const list = servicesByParent[main.id] ?? []
      for (const service of list.slice(0, 2)) {
        picks.push({ service, parentSlug: main.slug })
        if (picks.length >= 8) return picks
      }
    }
    return picks
  }, [mains, servicesByParent])

  const go = (path: string, category?: MarketplaceCategory | RecentCategoryView) => {
    if (category && 'slug' in category) {
      pushRecentCategory({
        id: category.id,
        slug: category.slug,
        name:
          'name_i18n' in category
            ? marketplaceCategoryLabel(category as MarketplaceCategory, language.code)
            : category.name,
        icon_key: 'icon_key' in category ? category.icon_key : null,
      })
    }
    onNavigate(path)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const isDrawer = variant === 'drawer' || isMobile

  if (!open) return null

  return (
    <div
      className={`mega-menu ${isDrawer ? 'mega-menu--drawer' : 'mega-menu--fullscreen'} is-open`}
      role="dialog"
      aria-modal="true"
      aria-label={t('marketplace.categories')}
    >
      <button type="button" className="mega-menu__backdrop" aria-label={t('mega.close')} onClick={onClose} />

      <div className="mega-menu__panel">
        <header className="mega-menu__header">
          <div className="mega-menu__header-left">
            {isDrawer && mobileStep === 'services' && active ? (
              <button
                type="button"
                className="mega-menu__back"
                onClick={() => setMobileStep('mains')}
              >
                <ChevronLeft className="h-5 w-5" />
                {marketplaceCategoryLabel(active, language.code)}
              </button>
            ) : (
              <h2 className="mega-menu__title">{t('header.categories')}</h2>
            )}
          </div>

          <label className="mega-menu__search">
            <Search className="h-4 w-4" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('mega.searchPlaceholder')}
              aria-label={t('mega.searchPlaceholder')}
              autoFocus={!isDrawer}
            />
          </label>

          <button type="button" className="mega-menu__close" onClick={onClose} aria-label={t('mega.close')}>
            <X className="h-5 w-5" />
          </button>
        </header>

        {(recent.length > 0 || popularServices.length > 0) && (
          <div className="mega-menu__chips">
            {recent.length > 0 && (
              <div className="mega-menu__chip-row">
                <p className="mega-menu__chip-label">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {t('mega.recentlyViewed')}
                </p>
                <div className="mega-menu__chip-list">
                  {recent.map((item) => {
                    const Icon = resolveCategoryIcon(item.icon_key)
                    const colors = resolveCategoryIconColor(item.slug)
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        className="mega-menu__chip"
                        onClick={() => go(marketplaceCategoryPath(item.slug), item)}
                      >
                        <span style={{ background: colors.bg, color: colors.fg }}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {item.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {popularServices.length > 0 && (
              <div className="mega-menu__chip-row">
                <p className="mega-menu__chip-label">
                  <Flame className="h-3.5 w-3.5" aria-hidden />
                  {t('mega.popularServices')}
                </p>
                <div className="mega-menu__chip-list">
                  {popularServices.map(({ service, parentSlug }) => (
                    <button
                      key={service.id}
                      type="button"
                      className="mega-menu__chip mega-menu__chip--service"
                      onClick={() =>
                        go(marketplaceServiceProsPath(service.slug, parentSlug))
                      }
                    >
                      {marketplaceCategoryLabel(service, language.code)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mega-menu__body">
          <aside
            className={`mega-menu__left ${
              isDrawer && mobileStep === 'services' ? 'is-hidden-mobile' : ''
            }`}
          >
            <p className="mega-menu__col-label">{t('marketplace.mainCategories')}</p>
            <ul className="mega-menu__mains">
              {filteredMains.map((cat) => {
                const Icon = resolveCategoryIcon(cat.icon_key)
                const colors = resolveCategoryIconColor(cat.slug)
                const label = marketplaceCategoryLabel(cat, language.code)
                const isActive = active?.id === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={`mega-menu__main ${isActive ? 'is-active' : ''}`}
                      onMouseEnter={() => {
                        if (!isDrawer) setActiveId(cat.id)
                      }}
                      onFocus={() => setActiveId(cat.id)}
                      onClick={() => {
                        setActiveId(cat.id)
                        if (isDrawer) setMobileStep('services')
                        else go(marketplaceCategoryPath(cat.slug), cat)
                      }}
                    >
                      <span
                        className="mega-menu__main-icon"
                        style={{ background: colors.bg, color: colors.fg, boxShadow: `inset 0 0 0 1px ${colors.ring}` }}
                        aria-hidden
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.85} />
                      </span>
                      <span className="mega-menu__main-text">{label}</span>
                      <ChevronRight className="h-4 w-4 opacity-35" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
            {filteredMains.length === 0 && (
              <p className="mega-menu__empty">{t('marketplace.noCategories')}</p>
            )}
          </aside>

          <div
            className={`mega-menu__right ${
              isDrawer && mobileStep === 'mains' ? 'is-hidden-mobile' : ''
            }`}
          >
            {active ? (
              <>
                <div className="mega-menu__right-head">
                  <div>
                    <p className="mega-menu__col-label">{t('mega.subcategories')}</p>
                    <h3 className="mega-menu__right-title">
                      {marketplaceCategoryLabel(active, language.code)}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="mega-menu__view-all"
                    onClick={() => go(marketplaceCategoryPath(active.slug), active)}
                  >
                    {t('marketplace.viewServices')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {loadingServices && filteredServices.length === 0 ? (
                  <p className="mega-menu__empty">{t('marketplace.loading')}</p>
                ) : filteredServices.length === 0 ? (
                  <p className="mega-menu__empty">{t('marketplace.noServices')}</p>
                ) : (
                  <div className="mega-menu__services">
                    {filteredServices.map((service, index) => (
                      <button
                        key={service.id}
                        type="button"
                        className="mega-menu__service"
                        style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
                        onClick={() =>
                          go(marketplaceServiceProsPath(service.slug, active.slug))
                        }
                      >
                        {marketplaceCategoryLabel(service, language.code)}
                        <ChevronRight className="h-3.5 w-3.5 opacity-40" aria-hidden />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mega-menu__empty">{t('marketplace.loading')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
