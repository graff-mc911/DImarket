// ============================================================
// Header.tsx — Шапка сайту DImarket
//
// Додано порівняно з оригіналом:
// 1. Глобальний банер оголошень від власника (announcements)
// 2. Лічильник непрочитаних повідомлень на іконці чату
// 3. Посилання на Messages і Favorites в меню
// 4. Посилання на My Listings для авторизованих
// Вся оригінальна логіка навігації, пошуку і мов — збережена.
// ============================================================

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Building2,
  Bookmark,
  Bot,
  ClipboardList,
  FileText,
  Globe,
  Hammer,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Shield,
  User,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { CURRENCIES, LANGUAGES } from '../lib/types'
import { navigateTo }  from '../lib/navigation'
import { useOnlineVisitors } from '../hooks/useOnlineVisitors'
import { buildHomeCategoryGroups } from '../lib/homeCategoryTiles'
import { LAUNCH_MARKETS } from '../lib/launchMarkets'
import { Logo }        from './Logo'
import { EmojiText } from './EmojiText'
import { NotificationCenter } from './notifications/NotificationCenter'
import { CategoriesMegaMenu } from './CategoriesMegaMenu'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

// Email власника сайту — для перевірки доступу до Dashboard
const OWNER_EMAIL = 'ivan.sovban@gmail.com'

function isOwnerEmail(email: string | null | undefined) {
  return (email || '').trim().toLowerCase() === OWNER_EMAIL.trim().toLowerCase()
}

// Тип глобального оголошення від власника
interface Announcement {
  id: string
  message: string
  type: 'info' | 'warning' | 'success' | 'promo'
}

export function Header() {
  const {
    user, profile, currency, language,
    setCurrency, setLanguage, signOut, t,
  } = useApp()

  // Оновлення при навігації
  const [routeTick, setRouteTick]         = useState(0)
  const [searchQuery, setSearchQuery]     = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [, setCurrencyOpen] = useState(false)
  const [languageOpen, setLanguageOpen]   = useState(false)
  const [accountOpen, setAccountOpen]     = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  // Глобальний банер від власника
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Лічильник непрочитаних повідомлень
  const [unreadCount, setUnreadCount]     = useState(0)
  const onlineVisitors = useOnlineVisitors()

  const languageRef = useRef<HTMLDivElement | null>(null)
  const currencyRef = useRef<HTMLDivElement | null>(null)
  const accountRef  = useRef<HTMLDivElement | null>(null)
  const categoriesRef = useRef<HTMLDivElement | null>(null)
  const fixedHeaderRef = useRef<HTMLDivElement | null>(null)
  const [headerSpacerPx, setHeaderSpacerPx] = useState(128)

  // Слухаємо popstate для оновлення активного маршруту
  useEffect(() => {
    const bump = () => setRouteTick(n => n + 1)
    window.addEventListener('popstate', bump)
    return () => window.removeEventListener('popstate', bump)
  }, [])

  const currentPath = useMemo(() => window.location.pathname, [routeTick])

  // Завантажуємо активний банер від власника
  useEffect(() => {
    void loadAnnouncement()
  }, [])

  // Рахуємо непрочитані повідомлення при авторизації
  useEffect(() => {
    if (user) {
      void loadUnreadCount()
      // Перевіряємо кожні 30 секунд
      const interval = setInterval(() => void loadUnreadCount(), 30000)
      return () => clearInterval(interval)
    } else {
      setUnreadCount(0)
    }
  }, [user])

  // Закриваємо меню при кліку поза ними
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (languageRef.current && !languageRef.current.contains(target)) setLanguageOpen(false)
      if (currencyRef.current && !currencyRef.current.contains(target)) setCurrencyOpen(false)
      if (accountRef.current  && !accountRef.current.contains(target))  setAccountOpen(false)
      if (categoriesRef.current && !categoriesRef.current.contains(target)) {
        // Full-screen mega closes via backdrop / Escape — don't auto-close on outside click of button only
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAllMenus()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Блокуємо скрол сторінки при відкритому меню (iOS: position fixed надійніше за overflow:hidden)
  useEffect(() => {
    if (!mobileMenuOpen) return

    const scrollY = window.scrollY
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevTop = document.body.style.top
    const prevWidth = document.body.style.width

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.top = prevTop
      document.body.style.width = prevWidth
      window.scrollTo(0, scrollY)
    }
  }, [mobileMenuOpen])

  // Завантаження активного банера від власника
  const loadAnnouncement = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('id, message, type')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12)

      setAnnouncements((data as Announcement[] | null) || [])
    } catch {
      // Таблиця може не існувати — ігноруємо
    }
  }

  // Кількість непрочитаних повідомлень
  const loadUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user!.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
    } catch {
      // Ігноруємо якщо таблиця не існує
    }
  }

  const isSiteOwner  = profile?.is_site_owner === true || isOwnerEmail(user?.email)
  const deliverCity = LAUNCH_MARKETS[0]?.city ?? 'Darmstadt'
  const accountGreeting = user && profile?.full_name
    ? profile.full_name.split(' ')[0]
    : t('header.signIn')

  // Навігаційні пункти
  const navItems: NavItem[] = [
    { label: t('header.findProfessionals'), path: '/professionals', icon: Hammer },
    { label: t('header.findCompanies'), path: '/companies', icon: Building2 },
  ]

  /** Центр нижньої панелі шапки — посилання з футера (між «Знайти майстрів» і «Перегляд оголошень») */
  const centerNavItems = useMemo(() => {
    const items: Array<{ label: string; path: string }> = [
      { label: t('footer.adsButton'), path: '/advertising' },
      { label: t('footer.contactButton'), path: '/contact' },
    ]
    if (!user) {
      items.push({ label: t('footer.signIn'), path: '/login' })
      items.push({ label: t('footer.register'), path: '/register' })
    }
    return items
  }, [user, t])

  const closeAllMenus = () => {
    setLanguageOpen(false)
    setCurrencyOpen(false)
    setAccountOpen(false)
    setCategoriesOpen(false)
    setMobileMenuOpen(false)
  }

  const closeDropdowns = () => {
    setLanguageOpen(false)
    setCurrencyOpen(false)
    setAccountOpen(false)
    setCategoriesOpen(false)
  }

  const goTo = (path: string) => {
    closeAllMenus()
    navigateTo(path)
  }

  const goToHowItWorks = () => {
    closeAllMenus()
    if (window.location.pathname === '/') {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigateTo('/')
    window.setTimeout(() => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const handleSignOut = async () => {
    await signOut()
    goTo('/')
  }

  const isActiveRoute = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const query = searchQuery.trim()
    closeAllMenus()
    if (!query) { navigateTo('/search'); return }
    navigateTo('/search?q=' + encodeURIComponent(query))
  }

  // Колір банера залежно від типу
  const getBannerStyle = (type: Announcement['type']) => {
    const styles = {
      info:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  color: '#1d4ed8' },
      warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#92400e' },
      success: { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   color: '#15803d' },
      promo:   { bg: 'rgba(199,138,96,0.12)',  border: 'rgba(199,138,96,0.3)',  color: '#92400e' },
    }
    return styles[type] || styles.info
  }

  // CSS класи (без змін від оригіналу)

  const navTextClass = (active: boolean, nowrap = false) =>
    [
      'amazon-dept-link header-link',
      nowrap ? 'shrink-0 whitespace-nowrap' : '',
      active ? 'header-link--active' : '',
    ].join(' ')




  const mobileIconButtonClass =
    'header-link flex h-8 w-8 items-center justify-center rounded-sm border-0 bg-transparent shadow-none outline-none sm:h-9 sm:w-9'

  const showAnnouncement = announcements.length > 0

  useEffect(() => {
    if (showAnnouncement) {
      document.documentElement.setAttribute('data-announcement', 'true')
    } else {
      document.documentElement.removeAttribute('data-announcement')
    }
    return () => document.documentElement.removeAttribute('data-announcement')
  }, [showAnnouncement])

  /** Висота фіксованої шапки → spacer і --header-offset для sticky-банерів */
  useLayoutEffect(() => {
    const node = fixedHeaderRef.current
    if (!node) return

    const sync = () => {
      const h = Math.ceil(node.getBoundingClientRect().height)
      setHeaderSpacerPx(h)
      document.documentElement.style.setProperty('--header-offset', `${h}px`)
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(node)
    window.addEventListener('resize', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [showAnnouncement, mobileMenuOpen, user, unreadCount, language.code, currency.code])

  const dropdownPanelClass =
    'absolute right-0 top-full mt-2 w-64 rounded-md border border-[#d5d9d9] bg-white p-2 shadow-[0_4px_12px_rgba(15,17,17,0.15)]'

  const dropdownItemClass =
    'block w-full rounded-sm px-3 py-2.5 text-left text-sm text-[var(--ink-900)] transition hover:bg-[#f7fafa]'

  const mobileNavItemClass =
    'flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-base font-medium text-[var(--ink-900)] transition hover:bg-[#f7fafa]'

  const categoryGroups = useMemo(
    () => buildHomeCategoryGroups(language.code, t),
    [language.code, t],
  )

  return (
    <>
      <div ref={fixedHeaderRef} className="fixed inset-x-0 top-0 z-50 w-full">
      {/* ===== Глобальний банер від власника ===== */}
      {showAnnouncement && (() => {
        const first = announcements[0]
        const style = getBannerStyle(first.type)
        return (
          <div
            className="w-full py-1.5"
            style={{ background: style.bg, borderBottom: '1px solid ' + style.border }}
          >
            <div className="px-[max(var(--layout-gutter),env(safe-area-inset-left,0px))]">
              <div className="global-announcement-marquee">
                <div className="global-announcement-marquee__track">
                  {[0, 1].map((dup) => (
                    <div key={dup} className="global-announcement-marquee__lane">
                      {announcements.map((ann) => (
                        <span
                          key={`${dup}-${ann.id}`}
                          className="global-announcement-marquee__item"
                          style={{ color: getBannerStyle(ann.type).color }}
                        >
                          <Bell className="h-3.5 w-3.5 shrink-0" />
                          <EmojiText text={ann.message} />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ===== Основна шапка (фіксована) ===== */}
      <header className="site-header-shell w-full">
        <div
          className={
            'w-full ' +
            (mobileMenuOpen ? 'xl:overflow-visible max-xl:flex max-xl:max-h-[100dvh] max-xl:flex-col max-xl:overflow-hidden' : '')
          }
        >
          <div className="shrink-0 px-[max(var(--layout-gutter),env(safe-area-inset-left,0px))] py-2 md:px-[max(1.25rem,var(--layout-gutter))] md:py-2.5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">

              {/* Логотип */}
              <button onClick={() => goTo('/')} type="button" className="shrink-0 text-left">
                <Logo variant="text" size="header" inverted />
              </button>

              {/* Deliver to (Amazon) */}
              <button
                type="button"
                onClick={() => goTo('/listings')}
                className="amazon-header-block hidden shrink-0 lg:flex"
              >
                <span className="amazon-header-block__top">{t('header.deliverTo')}</span>
                <span className="amazon-header-block__bottom flex items-center gap-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {deliverCity}
                </span>
              </button>

              {/* Пошук Amazon-style */}
              <form
                onSubmit={handleSearchSubmit}
                className="amazon-search-bar mx-2 hidden min-w-0 flex-1 sm:flex sm:max-w-3xl"
              >
                <div className="amazon-search-inner">
                  <select
                    className="amazon-search-cat"
                    defaultValue="all"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val && val !== 'all') goTo(val)
                    }}
                  >
                    <option value="all">{t('listings.allCategories')}</option>
                    {categoryGroups.flatMap((g) => g.tiles).slice(0, 14).map((tile) => (
                      <option key={tile.id} value={tile.path}>
                        {tile.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.headerSearchPlaceholder')}
                    className="amazon-search-input"
                  />
                  <button type="submit" className="amazon-search-submit" aria-label={t('home.search')}>
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Amazon: мова, акаунт, замовлення, збережене */}
              <div className="hidden items-center gap-0 sm:flex">

                <div ref={languageRef} className="relative">
                  <button
                    onClick={() => { setLanguageOpen(o => !o); setCurrencyOpen(false); setAccountOpen(false); setCategoriesOpen(false) }}
                    type="button"
                    className="amazon-header-lang"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{language.code.toUpperCase()}</span>
                  </button>
                  {languageOpen && (
                    <div className={dropdownPanelClass} style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang); setLanguageOpen(false) }}
                          type="button"
                          className={language.code === lang.code
                            ? dropdownItemClass + ' text-[var(--accent-700)]'
                            : dropdownItemClass}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div ref={accountRef} className="relative">
                  <button
                    onClick={() => {
                      if (user && profile) {
                        setAccountOpen(o => !o)
                        setLanguageOpen(false)
                        setCurrencyOpen(false)
                        setCategoriesOpen(false)
                      } else {
                        goTo('/login')
                      }
                    }}
                    type="button"
                    className="amazon-header-block"
                  >
                    <span className="amazon-header-block__top">
                      {user ? `${t('header.hello')}, ${accountGreeting}` : `${t('header.hello')}, ${t('header.signIn')}`}
                    </span>
                    <span className="amazon-header-block__bottom">{t('header.accountLists')}</span>
                  </button>

                  {user && profile && accountOpen && (
                    <div className={dropdownPanelClass}>
                      <button onClick={() => goTo('/profile')} type="button" className={dropdownItemClass}>
                        <User className="mr-2 inline h-4 w-4" />
                        {t('header.myProfile')}
                      </button>
                      {!(profile?.user_role === 'professional' ||
                        profile?.user_role === 'company' ||
                        profile?.is_professional) && (
                        <button onClick={() => goTo('/customer/dashboard')} type="button" className={dropdownItemClass}>
                          <LayoutDashboard className="mr-2 inline h-4 w-4" />
                          {t('header.customerDashboard' as never) || 'My Dashboard'}
                        </button>
                      )}
                      <button onClick={() => goTo('/settings')} type="button" className={dropdownItemClass}>
                        <Settings className="mr-2 inline h-4 w-4" />
                        {t('header.settings')}
                      </button>
                      {(profile?.user_role === 'professional' || profile?.user_role === 'company') && (
                        <button onClick={() => goTo('/verification')} type="button" className={dropdownItemClass}>
                          <Shield className="mr-2 inline h-4 w-4" />
                          {t('verification.menu')}
                        </button>
                      )}
                      {profile?.user_role === 'company' ? (
                        <button onClick={() => goTo('/company/dashboard')} type="button" className={dropdownItemClass}>
                          <LayoutDashboard className="mr-2 inline h-4 w-4" />
                          {t('header.companyDashboard' as never) || 'Company Dashboard'}
                        </button>
                      ) : null}
                      {(profile?.is_professional || profile?.user_role === 'professional') &&
                        profile?.user_role !== 'company' && (
                        <button onClick={() => goTo('/pro/dashboard')} type="button" className={dropdownItemClass}>
                          <LayoutDashboard className="mr-2 inline h-4 w-4" />
                          {t('header.proDashboard' as never) || 'Pro Dashboard'}
                        </button>
                      )}
                      <button onClick={() => goTo('/my-listings')} type="button" className={dropdownItemClass}>
                        <FileText className="mr-2 inline h-4 w-4" />
                        {t('header.myListings') || 'Мої оголошення'}
                      </button>
                      <button onClick={() => goTo('/my-projects')} type="button" className={dropdownItemClass}>
                        <FileText className="mr-2 inline h-4 w-4" />
                        {t('header.myProjects' as never) || 'Мої проекти'}
                      </button>
                      {(profile?.is_professional ||
                        profile?.user_role === 'professional' ||
                        profile?.user_role === 'company') && (
                        <button onClick={() => goTo('/projects')} type="button" className={dropdownItemClass}>
                          <Zap className="mr-2 inline h-4 w-4" />
                          {t('header.projects' as never) || t('header.leads' as never) || 'Projects'}
                        </button>
                      )}
                      <button onClick={() => goTo('/favorites')} type="button" className={dropdownItemClass}>
                        <Bookmark className="mr-2 inline h-4 w-4" />
                        {t('header.favorites')}
                      </button>
                      <button onClick={() => goTo('/messages')} type="button" className={dropdownItemClass}>
                        <MessageSquare className="mr-2 inline h-4 w-4" />
                        {t('header.messages')}
                        {unreadCount > 0 && (
                          <span className="ml-2 rounded-full px-1.5 py-0.5 text-xs font-bold text-white"
                            style={{ background: 'var(--accent-700)' }}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <div className="my-1 border-t border-[#e7e7e7]" />
                      <p className="px-3 py-1 text-[10px] font-bold uppercase text-[var(--ink-500)]">{t('header.currency')}</p>
                      {CURRENCIES.map(curr => (
                        <button
                          key={curr.code}
                          onClick={() => { setCurrency(curr); setAccountOpen(false) }}
                          type="button"
                          className={currency.code === curr.code
                            ? dropdownItemClass + ' text-[var(--accent-700)]'
                            : dropdownItemClass}
                        >
                          <span className="font-bold">{curr.symbol}</span> {curr.code}
                        </button>
                      ))}
                      {isSiteOwner && user && (
                        <>
                          <div className="my-1 border-t border-[#e7e7e7]" />
                          <button onClick={() => goTo('/admin')} type="button" className={dropdownItemClass}>
                            <ClipboardList className="mr-2 inline h-4 w-4" />
                            Admin Panel
                          </button>
                          <button onClick={() => goTo('/dashboard')} type="button" className={dropdownItemClass}>
                            <ClipboardList className="mr-2 inline h-4 w-4" />
                            {t('header.dashboard')}
                          </button>
                          <button onClick={() => goTo('/admin/ai')} type="button" className={dropdownItemClass}>
                            <Bot className="mr-2 inline h-4 w-4" />
                            {t('ai.admin.title')}
                          </button>
                          <button onClick={() => goTo('/admin/marketing-agent')} type="button" className={dropdownItemClass}>
                            <Megaphone className="mr-2 inline h-4 w-4" />
                            Marketing Agent
                          </button>
                        </>
                      )}
                      {user && profile && (
                        <>
                          <div className="my-1 border-t border-[#e7e7e7]" />
                          <button
                            onClick={handleSignOut}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-[#c7511f]"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>{t('header.signOut')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {user ? <NotificationCenter /> : null}

                <button
                  type="button"
                  onClick={() => goTo(user ? '/messages' : '/login')}
                  className="amazon-header-block hidden md:flex"
                >
                  <span className="amazon-header-block__top">{t('header.returns')}</span>
                  <span className="amazon-header-block__bottom">{t('header.orders')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => goTo(user ? '/favorites' : '/login')}
                  className="amazon-header-cart"
                >
                  <span className="amazon-header-cart__icon">
                    <Bookmark className="h-7 w-7" />
                    <span className="amazon-header-cart__count">0</span>
                  </span>
                  <span className="amazon-header-block__bottom hidden sm:inline">{t('header.saved')}</span>
                </button>
              </div>

              {/* Мобільні кнопки — Amazon: акаунт + збережене + меню */}
              <div className="flex shrink-0 items-center gap-0.5 sm:hidden">
                {user ? <NotificationCenter /> : null}
                <button
                  type="button"
                  onClick={() => goTo(user ? '/profile' : '/login')}
                  className="amazon-header-block px-1 py-0.5"
                >
                  <span className="amazon-header-block__top text-[10px]">{t('header.signIn')}</span>
                  <span className="amazon-header-block__bottom text-xs">{t('header.account')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => goTo(user ? '/favorites' : '/login')}
                  className="amazon-header-cart px-1"
                >
                  <span className="amazon-header-cart__icon">
                    <Bookmark className="h-6 w-6" />
                    <span className="amazon-header-cart__count text-sm">0</span>
                  </span>
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(o => !o); closeDropdowns() }}
                  type="button"
                  aria-expanded={mobileMenuOpen}
                  className={mobileIconButtonClass + (mobileMenuOpen ? ' text-[#ff9900]' : '')}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Amazon subnav */}
            <div className="site-header-subnav mt-1 hidden sm:block">
              <div className="amazon-dept-scroll px-3 py-1 md:px-4">
                <div
                  ref={categoriesRef}
                  className="categories-mega-anchor relative shrink-0"
                  onMouseEnter={() => {
                    setCategoriesOpen(true)
                    setLanguageOpen(false)
                    setCurrencyOpen(false)
                    setAccountOpen(false)
                  }}
                >
                  <button
                    onClick={() => {
                      setCategoriesOpen((o) => !o)
                      setLanguageOpen(false)
                      setCurrencyOpen(false)
                      setAccountOpen(false)
                    }}
                    type="button"
                    aria-expanded={categoriesOpen}
                    aria-haspopup="dialog"
                    className="amazon-dept-link flex items-center gap-1 font-bold"
                  >
                    <Menu className="h-4 w-4" />
                    <span>{t('header.categories')}</span>
                  </button>
                </div>

                <button type="button" onClick={() => goTo('/listings')} className="amazon-dept-link">
                  {t('header.todaysDeals')}
                </button>

                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => goTo(item.path)}
                    className={navTextClass(isActiveRoute(item.path), true)}
                  >
                    {item.label}
                  </button>
                ))}

                <button type="button" onClick={() => goTo('/create-project')} className="amazon-dept-link">
                  {t('header.postJob')}
                </button>
                <button type="button" onClick={() => goTo('/cost-estimator')} className="amazon-dept-link">
                  {t('header.costEstimator' as never) || 'Cost estimator'}
                </button>
                <button type="button" onClick={() => goTo('/create-ad')} className="amazon-dept-link">
                  {t('header.sell')}
                </button>

                <button type="button" onClick={() => goTo('/pricing')} className="amazon-dept-link">
                  Pricing
                </button>

                <button type="button" onClick={() => goTo('/assistant')} className="amazon-dept-link">
                  AI Assistant
                </button>

                <button type="button" onClick={() => goTo('/analytics')} className="amazon-dept-link">
                  Analytics
                </button>

                <button type="button" onClick={() => goTo('/contact')} className="amazon-dept-link">
                  {t('header.customerService')}
                </button>

                <button type="button" onClick={goToHowItWorks} className="amazon-dept-link">
                  {t('footer.howItWorks')}
                </button>
              </div>
            </div>

            <CategoriesMegaMenu
              open={categoriesOpen}
              variant="fullscreen"
              onClose={() => setCategoriesOpen(false)}
              onNavigate={(path) => {
                closeAllMenus()
                navigateTo(path)
              }}
            />

            {/* Пошук (мобільний) */}
            <form onSubmit={handleSearchSubmit} className="amazon-search-bar mt-2 sm:hidden">
              <div className="amazon-search-inner">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.headerSearchPlaceholder')}
                  className="amazon-search-input"
                />
                <button type="submit" className="amazon-search-submit" aria-label={t('home.search')}>
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Мобільне меню */}
          {mobileMenuOpen && (
            <div className="min-h-0 shrink-0 px-[max(var(--layout-gutter),env(safe-area-inset-left,0px))] pb-2 pt-3 xl:hidden">
              <div className="mobile-nav-menu">
                <div className="mobile-nav-menu__scroll">
                <div className="mb-3 flex justify-center">
                  <OnlineVisitorsPill count={onlineVisitors} />
                </div>
                <div className="grid gap-2">
                  {navItems.map(item => (
                    <button key={item.path} onClick={() => goTo(item.path)} type="button" className={mobileNavItemClass}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  ))}

                  {centerNavItems
                    .filter(item => item.path !== '/login' && item.path !== '/register')
                    .map(item => (
                    <button
                      key={item.path + item.label}
                      onClick={() => goTo(item.path)}
                      type="button"
                      className={mobileNavItemClass}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    className={mobileNavItemClass}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setCategoriesOpen(true)
                    }}
                  >
                    <Menu className="h-5 w-5" />
                    <span>{t('header.categories')}</span>
                  </button>

                  <button onClick={() => goTo('/listings')} type="button" className={mobileNavItemClass}>
                    <Search className="h-5 w-5" />
                    <span>{t('listings.title')}</span>
                  </button>
                </div>

                <div className="my-3 border-t border-[var(--glass-border)]" />

                {/* Мова та валюта */}
                <div className="grid gap-3 rounded-[24px] bg-[rgba(255,249,243,0.74)] p-3">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink-700)]">
                      <Globe className="h-4 w-4" />
                      <span>{t('header.language')}</span>
                    </label>
                    <select
                      value={language.code}
                      onChange={e => {
                        const lang = LANGUAGES.find(l => l.code === e.target.value)
                        if (lang) setLanguage(lang)
                      }}
                      className="select-glass"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink-700)]">
                      <span className="text-base">{currency.symbol}</span>
                      <span>{t('header.currency')}</span>
                    </label>
                    <select
                      value={currency.code}
                      onChange={e => {
                        const curr = CURRENCIES.find(c => c.code === e.target.value)
                        if (curr) setCurrency(curr)
                      }}
                      className="select-glass"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {user && profile ? (
                  <div className="mt-3 grid gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
                    <button onClick={() => goTo('/profile')} type="button" className={mobileNavItemClass}>
                      <User className="h-5 w-5" />
                      <span>{t('header.myProfile')}</span>
                    </button>

                    {!(profile?.user_role === 'professional' ||
                      profile?.user_role === 'company' ||
                      profile?.is_professional) && (
                      <button onClick={() => goTo('/customer/dashboard')} type="button" className={mobileNavItemClass}>
                        <LayoutDashboard className="h-5 w-5" />
                        <span>{t('header.customerDashboard' as never) || 'My Dashboard'}</span>
                      </button>
                    )}

                    <button onClick={() => goTo('/settings')} type="button" className={mobileNavItemClass}>
                      <Settings className="h-5 w-5" />
                      <span>{t('header.settings')}</span>
                    </button>

                    {profile?.user_role === 'company' ? (
                      <button onClick={() => goTo('/company/dashboard')} type="button" className={mobileNavItemClass}>
                        <LayoutDashboard className="h-5 w-5" />
                        <span>{t('header.companyDashboard' as never) || 'Company Dashboard'}</span>
                      </button>
                    ) : null}

                    {(profile?.is_professional || profile?.user_role === 'professional') &&
                      profile?.user_role !== 'company' && (
                      <button onClick={() => goTo('/pro/dashboard')} type="button" className={mobileNavItemClass}>
                        <LayoutDashboard className="h-5 w-5" />
                        <span>{t('header.proDashboard' as never) || 'Pro Dashboard'}</span>
                      </button>
                    )}

                    <button onClick={() => goTo('/my-listings')} type="button" className={mobileNavItemClass}>
                      <FileText className="h-5 w-5" />
                      <span>{t('header.myListings') || 'Мої оголошення'}</span>
                    </button>

                    <button onClick={() => goTo('/favorites')} type="button" className={mobileNavItemClass}>
                      <Bookmark className="h-5 w-5" />
                      <span>{t('header.favorites')}</span>
                    </button>

                    <button onClick={() => goTo('/messages')} type="button" className={mobileNavItemClass}>
                      <MessageSquare className="h-5 w-5" />
                      <div className="flex flex-1 items-center justify-between">
                        <span>{t('header.messages')}</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                            style={{ background: 'var(--accent-700)' }}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>

                    {isSiteOwner && (
                      <>
                        <button onClick={() => goTo('/admin')} type="button" className={mobileNavItemClass}>
                          <ClipboardList className="h-5 w-5" />
                          <span>Admin Panel</span>
                        </button>
                        <button onClick={() => goTo('/dashboard')} type="button" className={mobileNavItemClass}>
                          <ClipboardList className="h-5 w-5" />
                          <span>{t('header.dashboard')}</span>
                        </button>
                        <button onClick={() => goTo('/admin/ai')} type="button" className={mobileNavItemClass}>
                          <Bot className="h-5 w-5" />
                          <span>{t('ai.admin.title')}</span>
                        </button>
                        <button onClick={() => goTo('/admin/marketing-agent')} type="button" className={mobileNavItemClass}>
                          <Megaphone className="h-5 w-5" />
                          <span>{t('marketing.admin.title')}</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleSignOut}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-base font-semibold text-[#a04b39] transition-all hover:text-[#c2614a]"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>{t('header.signOut')}</span>
                    </button>
                  </div>
                ) : null}
                </div>

                {!user ? (
                  <div className="mobile-nav-menu__footer">
                    <button onClick={() => goTo('/login')} type="button" className={mobileNavItemClass}>
                      <User className="h-5 w-5" />
                      <span>{t('header.professionalLogin')}</span>
                    </button>
                    <button onClick={() => goTo('/register')} type="button" className={mobileNavItemClass}>
                      <User className="h-5 w-5" />
                      <span>{t('footer.register')}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </header>
      </div>

      <div style={{ height: headerSpacerPx }} className="shrink-0" aria-hidden />
    </>
  )
}

function OnlineVisitorsPill({
  count,
  className = '',
}: {
  count: number
  className?: string
}) {
  const { t, language } = useApp()
  const locale =
    language.code === 'uk' ? 'uk-UA' : language.code === 'de' ? 'de-DE' : 'en-US'
  const formatted = new Intl.NumberFormat(locale).format(Math.max(1, count))

  return (
    <div
      className={
        'inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-[#3a4553] bg-[#37475a] px-2.5 py-1 text-[11px] font-medium text-white sm:text-xs ' +
        className
      }
      aria-live="polite"
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-hidden />
      <span className="whitespace-nowrap">{t('header.onlineVisitors')}</span>
      <span className="tabular-nums font-extrabold text-[#ff9900]">{formatted}</span>
    </div>
  )
}