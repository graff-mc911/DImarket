import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calculator,
  ClipboardList,
  CreditCard,
  Flame,
  FolderKanban,
  Grid3X3,
  Hammer,
  Heart,
  Home,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { CURRENCIES } from '../lib/types'
import { navigateTo } from '../lib/navigation'
import {
  labelKeyFor,
  navEntriesFor,
  resolveNavPath,
  type NavEntry,
} from '../lib/navMap'
import { isSiteOwner } from '../lib/siteOwner'
import { LanguageSelector } from './LanguageSelector'

type MoreItem = {
  id: string
  label: string
  path: string
  icon: ReactNode
}

const MORE_ICONS: Record<string, ReactNode> = {
  trending: <Flame className="h-5 w-5" aria-hidden />,
  professionals: <Hammer className="h-5 w-5" aria-hidden />,
  companies: <Building2 className="h-5 w-5" aria-hidden />,
  'publish-request': <ClipboardList className="h-5 w-5" aria-hidden />,
  'cost-estimator': <Calculator className="h-5 w-5" aria-hidden />,
  publish: <Plus className="h-5 w-5" aria-hidden />,
  pricing: <CreditCard className="h-5 w-5" aria-hidden />,
  assistant: <Bot className="h-5 w-5" aria-hidden />,
  analytics: <BarChart3 className="h-5 w-5" aria-hidden />,
  jobs: <Briefcase className="h-5 w-5" aria-hidden />,
  marketplace: <ShoppingBag className="h-5 w-5" aria-hidden />,
  projects: <FolderKanban className="h-5 w-5" aria-hidden />,
  favorites: <Heart className="h-5 w-5" aria-hidden />,
  messages: <MessageSquare className="h-5 w-5" aria-hidden />,
  settings: <Settings className="h-5 w-5" aria-hidden />,
  profile: <User className="h-5 w-5" aria-hidden />,
  'owner-dashboard': <BarChart3 className="h-5 w-5" aria-hidden />,
  'owner-ai': <Bot className="h-5 w-5" aria-hidden />,
  'owner-marketing': <Megaphone className="h-5 w-5" aria-hidden />,
}

/**
 * Single mobile navigation SSoT (bottom bar + More sheet).
 * Routes/labels come from lib/navMap.ts — do not hardcode paths here.
 * Do not add a second mobile menu (no Header hamburger).
 *
 * Layout contract (native app style):
 * - Content row height is independent of safe-area
 * - safe-area is padding on the outer nav only (never eats content height)
 * - Icon + label always fully visible (no overflow clipping)
 */
export function MobileBottomNav() {
  const { t, user, profile, currency, setCurrency } = useApp()
  const [path, setPath] = useState(window.location.pathname)
  const [hash, setHash] = useState(window.location.hash)
  const [moreOpen, setMoreOpen] = useState(false)
  const sheetTitleId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const owner = Boolean(user && isSiteOwner(profile, user.email))

  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname)
      setHash(window.location.hash)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [moreOpen])

  const isActive = (target: string) => {
    if (target === '/') return path === '/' && hash !== '#choose-category'
    if (target === '/listings' || target === '/search') {
      return path === '/listings' || path === '/search' || path.startsWith('/listings/')
    }
    return path === target || path.startsWith(`${target}/`)
  }

  const go = (target: string) => {
    setMoreOpen(false)
    if (target === path && !target.includes('#')) return
    navigateTo(target)
  }

  const goCategories = () => {
    setMoreOpen(false)
    if (path === '/') {
      document.getElementById('choose-category')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (window.location.hash !== '#choose-category') {
        window.history.replaceState({}, '', '/#choose-category')
        setHash('#choose-category')
      }
      return
    }
    navigateTo('/#choose-category')
  }

  const toMoreItem = (entry: NavEntry, surface: 'mobile-more' | 'mobile-account'): MoreItem => ({
    id: entry.id,
    label: t(labelKeyFor(entry, surface)),
    path: resolveNavPath(entry, Boolean(user)),
    icon: MORE_ICONS[entry.id] ?? <Menu className="h-5 w-5" aria-hidden />,
  })

  const primaryMore = navEntriesFor('mobile-more').map((e) => toMoreItem(e, 'mobile-more'))
  const accountEntries = navEntriesFor('mobile-account').filter((e) =>
    e.ownerOnly ? owner : true,
  )
  const ownerAccount = accountEntries.filter((e) => e.ownerOnly)
  const regularAccount = accountEntries.filter((e) => !e.ownerOnly)
  const accountMore = regularAccount.map((e) => toMoreItem(e, 'mobile-account'))
  const ownerMore = ownerAccount.map((e) => toMoreItem(e, 'mobile-account'))

  return (
    <>
      <nav
        className="mobile-bottom-nav xl:hidden"
        aria-label={t('nav.mobileNavigation')}
      >
        <div className="mobile-bottom-nav__bar">
          <NavItem
            active={isActive('/') && !moreOpen}
            icon={<Home className="mobile-bottom-nav__icon" aria-hidden />}
            label={t('nav.home')}
            onClick={() => go('/')}
          />
          <NavItem
            active={isActive('/listings') && !moreOpen}
            icon={<Search className="mobile-bottom-nav__icon" aria-hidden />}
            label={t('nav.search')}
            onClick={() => go('/listings')}
          />
          <NavItem
            active={path === '/' && hash === '#choose-category' && !moreOpen}
            icon={<Grid3X3 className="mobile-bottom-nav__icon" aria-hidden />}
            label={t('nav.categories')}
            onClick={goCategories}
          />
          <NavItem
            active={isActive('/map') && !moreOpen}
            icon={<MapPin className="mobile-bottom-nav__icon" aria-hidden />}
            label={t('nav.map')}
            onClick={() => go('/map')}
          />
          <NavItem
            active={moreOpen}
            icon={<Menu className="mobile-bottom-nav__icon" aria-hidden />}
            label={t('nav.more')}
            onClick={() => setMoreOpen((open) => !open)}
            ariaExpanded={moreOpen}
            ariaControls="mobile-nav-more-sheet"
          />
        </div>
      </nav>

      {moreOpen ? (
        <div className="mobile-nav-more xl:hidden" role="presentation">
          <button
            type="button"
            className="mobile-nav-more__backdrop"
            aria-label={t('nav.closeMore')}
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="mobile-nav-more-sheet"
            className="mobile-nav-more__sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
          >
            <div className="mobile-nav-more__head">
              <h2 id={sheetTitleId}>{t('nav.moreMenu')}</h2>
              <button
                ref={closeBtnRef}
                type="button"
                className="mobile-nav-more__close"
                onClick={() => setMoreOpen(false)}
                aria-label={t('nav.closeMore')}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <ul className="mobile-nav-more__list">
              {primaryMore.map((item) => (
                <li key={item.id}>
                  <button type="button" className="mobile-nav-more__item" onClick={() => go(item.path)}>
                    <span className="mobile-nav-more__icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mobile-nav-more__section">{t('nav.accountSection')}</p>
            <ul className="mobile-nav-more__list">
              {accountMore.map((item) => (
                <li key={item.id}>
                  <button type="button" className="mobile-nav-more__item" onClick={() => go(item.path)}>
                    <span className="mobile-nav-more__icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            {ownerMore.length > 0 ? (
              <>
                <p className="mobile-nav-more__section">{t('nav.ownerSection')}</p>
                <ul className="mobile-nav-more__list">
                  {ownerMore.map((item) => (
                    <li key={item.id}>
                      <button type="button" className="mobile-nav-more__item" onClick={() => go(item.path)}>
                        <span className="mobile-nav-more__icon" aria-hidden>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <div className="mobile-nav-more__prefs">
              <div>
                <p className="mobile-nav-more__prefs-label">{t('header.language')}</p>
                <LanguageSelector variant="menu" />
              </div>
              <div>
                <label className="mobile-nav-more__prefs-label" htmlFor="mobile-nav-currency">
                  {t('header.currency')}
                </label>
                <select
                  id="mobile-nav-currency"
                  value={currency.code}
                  onChange={(event) => {
                    const next = CURRENCIES.find((c) => c.code === event.target.value)
                    if (next) setCurrency(next)
                  }}
                  className="mobile-nav-more__select"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function NavItem({
  active,
  icon,
  label,
  onClick,
  ariaExpanded,
  ariaControls,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
  ariaExpanded?: boolean
  ariaControls?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className={`mobile-bottom-nav__item${active ? ' is-active' : ''}`}
    >
      <span className="mobile-bottom-nav__glyph" aria-hidden>
        {icon}
      </span>
      <span className="mobile-bottom-nav__label">{label}</span>
    </button>
  )
}
