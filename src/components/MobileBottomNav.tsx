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
  Factory,
  FileText,
  FolderKanban,
  Grid3X3,
  Hammer,
  Handshake,
  Heart,
  Home,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { CURRENCIES } from '../lib/types'
import { navigateTo } from '../lib/navigation'
import { SCB_LIGHT_URL } from '../lib/scbLight'
import {
  labelKeyFor,
  navEntriesFor,
  resolveNavPath,
  type NavEntry,
} from '../lib/navMap'
import { isSiteOwner } from '../lib/siteOwner'
import { LanguageSelector } from './LanguageSelector'
import { PwaInstallButton } from './PwaInstallButton'

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
  manufacturers: <Factory className="h-5 w-5" aria-hidden />,
  'commercial-agents': <Handshake className="h-5 w-5" aria-hidden />,
  'documents-procedures': <FileText className="h-5 w-5" aria-hidden />,
  'official-documents': <FileText className="h-5 w-5" aria-hidden />,
  'publish-request': <ClipboardList className="h-5 w-5" aria-hidden />,
  'cost-estimator': <Calculator className="h-5 w-5" aria-hidden />,
  publish: <Plus className="h-5 w-5" aria-hidden />,
  pricing: <CreditCard className="h-5 w-5" aria-hidden />,
  assistant: <Bot className="h-5 w-5" aria-hidden />,
  analytics: <BarChart3 className="h-5 w-5" aria-hidden />,
  jobs: <Briefcase className="h-5 w-5" aria-hidden />,
  marketplace: <ShoppingBag className="h-5 w-5" aria-hidden />,
  projects: <FolderKanban className="h-5 w-5" aria-hidden />,
  'my-projects': <FolderKanban className="h-5 w-5" aria-hidden />,
  favorites: <Heart className="h-5 w-5" aria-hidden />,
  messages: <MessageSquare className="h-5 w-5" aria-hidden />,
  settings: <Settings className="h-5 w-5" aria-hidden />,
  profile: <User className="h-5 w-5" aria-hidden />,
  'owner-dashboard': <BarChart3 className="h-5 w-5" aria-hidden />,
  'owner-ai': <Bot className="h-5 w-5" aria-hidden />,
  'owner-marketing': <Megaphone className="h-5 w-5" aria-hidden />,
  'owner-official-sources': <ShieldCheck className="h-5 w-5" aria-hidden />,
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
  const { t, user, profile, currency, setCurrency, signOut } = useApp()
  const [path, setPath] = useState(window.location.pathname)
  const [hash, setHash] = useState(window.location.hash)
  const [moreOpen, setMoreOpen] = useState(false)
  const sheetTitleId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const owner = Boolean(user && isSiteOwner(profile, user.email))
  const isPro =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    Boolean(profile?.is_professional) ||
    owner

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
    // Always navigateTo so same-route taps still jump to top (and clear hash).
    if (target === '/' && path === '/' && hash) {
      window.history.replaceState({}, '', '/')
      setHash('')
    }
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
              <PwaInstallButton variant="menu" />
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
              {user ? (
                <li>
                  <button
                    type="button"
                    className="mobile-nav-more__item mobile-nav-more__item--signout"
                    onClick={() => {
                      setMoreOpen(false)
                      void (async () => {
                        await signOut()
                        navigateTo('/')
                      })()
                    }}
                  >
                    <span className="mobile-nav-more__icon" aria-hidden>
                      <LogOut className="h-5 w-5" />
                    </span>
                    <span>{t('header.signOut')}</span>
                  </button>
                </li>
              ) : null}
              {user && isPro ? (
                <li>
                  <button
                    type="button"
                    className="mobile-nav-more__item"
                    onClick={() => {
                      setMoreOpen(false)
                      window.open(SCB_LIGHT_URL, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <span className="mobile-nav-more__icon" aria-hidden>
                      <Calculator className="h-5 w-5" />
                    </span>
                    <span>{t('scbLight.open')}</span>
                  </button>
                </li>
              ) : null}
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

            {user ? (
              <ul className="mobile-nav-more__list mobile-nav-more__list--account-actions">
                <li>
                  <button
                    type="button"
                    className="mobile-nav-more__item mobile-nav-more__item--danger"
                    onClick={() => go('/settings#danger')}
                  >
                    <span className="mobile-nav-more__icon" aria-hidden>
                      <Trash2 className="h-5 w-5" />
                    </span>
                    <span>{t('settings.deleteAccountButton')}</span>
                  </button>
                </li>
              </ul>
            ) : null}
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
