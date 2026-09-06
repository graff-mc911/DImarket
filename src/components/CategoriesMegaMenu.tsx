import {
  ChevronLeft,
  ChevronRight,
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
  pushRecentCategory,
  type RecentCategoryView,
} from '../lib/recentCategories'

interface CategoriesMegaMenuProps {
  open: boolean
  onClose: () => void
  onNavigate: (path: string) => void
  /** Full-screen overlay, slide-in drawer, or in-page browser (header/footer stay visible). */
  variant?: 'fullscreen' | 'drawer' | 'page'
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
  const [mobileStep, setMobileStep] = useState<'mains' | 'services'>('mains')

  useEffect(() => {
    if (!open) {
      setQuery('')
      setMobileStep('mains')
      return
    }
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

  const isPage = variant === 'page'

  useEffect(() => {
    if (!open || isPage) return
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
  }, [open, onClose, isPage])

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const isOverlayDrawer = !isPage && (variant === 'drawer' || isMobile)
  const isTwoStepMobile = isPage ? isMobile : isOverlayDrawer
  const variantClass = isPage
    ? 'mega-menu--page'
    : isOverlayDrawer
      ? 'mega-menu--drawer'
      : 'mega-menu--fullscreen'
  const TitleTag = isPage ? 'h1' : 'h2'
  const HeaderTag = isPage ? 'div' : 'header'

  if (!open) return null

  return (
    <div
      className={`mega-menu ${variantClass} is-open`}
      role={isPage ? 'region' : 'dialog'}
      aria-modal={isPage ? undefined : 'true'}
      aria-label={t('marketplace.categories')}
    >
      {isPage ? null : (
        <button type="button" className="mega-menu__backdrop" aria-label={t('mega.close')} onClick={onClose} />
      )}

      <div className="mega-menu__panel">
        <HeaderTag className="mega-menu__header">
          <div className="mega-menu__header-left">
            {isTwoStepMobile && mobileStep === 'services' && active ? (
              <button
                type="button"
                className="mega-menu__back"
                onClick={() => setMobileStep('mains')}
              >
                <ChevronLeft className="h-5 w-5" />
                {marketplaceCategoryLabel(active, language.code)}
              </button>
            ) : (
              <TitleTag className="mega-menu__title">{t('header.categories')}</TitleTag>
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
              autoFocus={!isPage && !isTwoStepMobile}
            />
          </label>

          {isPage ? null : (
            <button type="button" className="mega-menu__close" onClick={onClose} aria-label={t('mega.close')}>
              <X className="h-5 w-5" />
            </button>
          )}
        </HeaderTag>

        <div className="mega-menu__body">
          <aside
            className={`mega-menu__left ${
              isTwoStepMobile && mobileStep === 'services' ? 'is-hidden-mobile' : ''
            }`}
          >
            <p className="mega-menu__col-label">{t('marketplace.mainCategories')}</p>
            <ul className="mega-menu__mains">
              {filteredMains.map((cat) => {
                const Icon = resolveCategoryIcon(cat.icon_key || cat.slug)
                const colors = resolveCategoryIconColor(cat.slug)
                const label = marketplaceCategoryLabel(cat, language.code)
                const isActive = active?.id === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={`mega-menu__main ${isActive ? 'is-active' : ''}`}
                      onMouseEnter={() => {
                        if (!isTwoStepMobile) setActiveId(cat.id)
                      }}
                      onFocus={() => setActiveId(cat.id)}
                      onClick={() => {
                        setActiveId(cat.id)
                        if (isTwoStepMobile) setMobileStep('services')
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
              isTwoStepMobile && mobileStep === 'mains' ? 'is-hidden-mobile' : ''
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
