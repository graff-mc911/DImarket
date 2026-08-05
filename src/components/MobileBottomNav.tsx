import { useEffect, useId, useRef, useState } from 'react'
import {
  Briefcase,
  Building2,
  FolderKanban,
  Grid3X3,
  Hammer,
  Heart,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'

type MoreItem = {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  auth?: boolean
}

/**
 * Marketplace-style mobile chrome: 5 primary tabs + overflow "More" sheet.
 * Jobs / Marketplace / Companies / Projects live in More (and Categories).
 */
export function MobileBottomNav() {
  const { t, user } = useApp()
  const [path, setPath] = useState(window.location.pathname)
  const [hash, setHash] = useState(window.location.hash)
  const [moreOpen, setMoreOpen] = useState(false)
  const sheetTitleId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname)
      setHash(window.location.hash)
    }
    // Do not call bindPathListener here — App owns the SPA path listener.
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
    if (target === '/') return path === '/'
    if (target === 'more') {
      return [
        '/listings',
        '/search',
        '/vacancies',
        '/jobs',
        '/sell-rent',
        '/buy-sell',
        '/companies',
        '/professionals',
        '/projects',
        '/leads',
        '/messages',
        '/favorites',
        '/profile',
        '/login',
      ].some((p) => path === p || path.startsWith(`${p}/`))
    }
    return path === target || path.startsWith(`${target}/`)
  }

  const go = (target: string) => {
    setMoreOpen(false)
    if (target === path) return
    navigateTo(target)
  }

  const goCategories = () => {
    setMoreOpen(false)
    if (path === '/') {
      document.getElementById('choose-category')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigateTo('/#choose-category')
  }

  const profilePath = user ? '/profile' : '/login'

  const moreItems: MoreItem[] = [
    {
      id: 'search',
      label: t('nav.search'),
      path: '/listings',
      icon: <Search className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'jobs',
      label: t('nav.jobs'),
      path: '/vacancies',
      icon: <Briefcase className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'marketplace',
      label: t('nav.marketplace'),
      path: '/sell-rent',
      icon: <ShoppingBag className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'professionals',
      label: t('nav.professionals'),
      path: '/professionals',
      icon: <Hammer className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'companies',
      label: t('nav.companies'),
      path: '/companies',
      icon: <Building2 className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'projects',
      label: t('nav.projects'),
      path: '/projects',
      icon: <FolderKanban className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'favorites',
      label: t('nav.favorites'),
      path: user ? '/favorites' : '/login',
      icon: <Heart className="h-5 w-5" aria-hidden />,
      auth: true,
    },
    {
      id: 'messages',
      label: t('nav.messages'),
      path: user ? '/messages' : '/login',
      icon: <MessageSquare className="h-5 w-5" aria-hidden />,
      auth: true,
    },
    {
      id: 'profile',
      label: t('nav.profile'),
      path: profilePath,
      icon: <User className="h-5 w-5" aria-hidden />,
    },
  ]

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#3a4553] bg-[#232f3e] text-white xl:hidden"
        aria-label={t('nav.mobileNavigation')}
      >
        <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch px-1 pb-[env(safe-area-inset-bottom,0px)]">
          <NavItem
            active={isActive('/') && !moreOpen}
            icon={<Home className="h-5 w-5" aria-hidden />}
            label={t('nav.home')}
            onClick={() => go('/')}
          />
          <NavItem
            active={path === '/' && hash === '#choose-category'}
            icon={<Grid3X3 className="h-5 w-5" aria-hidden />}
            label={t('nav.categories')}
            onClick={goCategories}
          />
          <button
            type="button"
            onClick={() => go('/create-ad')}
            className="relative -top-3 mx-0.5 flex flex-1 flex-col items-center justify-end"
            aria-label={t('nav.post')}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff9900] text-[#0f1111] shadow-[0_4px_14px_rgba(255,153,0,0.35)]">
              <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            </span>
          </button>
          <NavItem
            active={isActive('/map')}
            icon={<MapPin className="h-5 w-5" aria-hidden />}
            label={t('nav.map')}
            onClick={() => go('/map')}
          />
          <NavItem
            active={moreOpen || isActive('more')}
            icon={<Menu className="h-5 w-5" aria-hidden />}
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
              {moreItems.map((item) => (
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
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
        active ? 'text-[#ff9900]' : 'text-[#cccccc]'
      }`}
    >
      {icon}
      <span className="max-w-[4.5rem] truncate">{label}</span>
    </button>
  )
}
