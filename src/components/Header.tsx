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
  Briefcase,
  Building2,
  Bookmark,
  Bot,
  Factory,
  FileText,
  Hammer,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  MapPin,
  MessageSquare,
  Settings,
  Shield,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { CURRENCIES } from '../lib/types'
import { navigateTo }  from '../lib/navigation'
import { HeaderLocationControl } from './HeaderLocationControl'
import { LanguageSelector } from './LanguageSelector'
import { Logo }        from './Logo'
import { EmojiText } from './EmojiText'
import { NotificationCenter } from './notifications/NotificationCenter'
import {
  headerDeptAfterEntries,
  headerDeptBeforeEntries,
  labelKeyFor,
  navEntriesFor,
} from '../lib/navMap'
import { isSiteOwner as checkSiteOwner } from '../lib/siteOwner'
import { PwaInstallButton } from './PwaInstallButton'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
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
    setCurrency, signOut, t,
  } = useApp()

  // Оновлення при навігації
  const [routeTick, setRouteTick]         = useState(0)
  const [searchQuery, setSearchQuery]     = useState('')
  const [, setCurrencyOpen] = useState(false)
  const [languageOpen, setLanguageOpen]   = useState(false)
  const [accountOpen, setAccountOpen]     = useState(false)

  // Глобальний банер від власника
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Лічильник непрочитаних повідомлень
  const [unreadCount, setUnreadCount]     = useState(0)

  const languageRef = useRef<HTMLDivElement | null>(null)
  const currencyRef = useRef<HTMLDivElement | null>(null)
  const accountRef  = useRef<HTMLDivElement | null>(null)
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

  const isSiteOwner  = checkSiteOwner(profile, user?.email)
  const accountDisplayName = (() => {
    if (!user) return ''
    const fromProfile = profile?.full_name?.trim()
    if (fromProfile) return fromProfile.split(/\s+/)[0]
    const metaName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name.trim()
        : ''
    if (metaName) return metaName.split(/\s+/)[0]
    const emailLocal = user.email?.split('@')[0]?.trim()
    if (emailLocal) return emailLocal
    return t('header.account')
  })()
  const accountGreeting = user ? accountDisplayName : t('header.signIn')
  const isLoggedIn = Boolean(user)

  // Навігаційні пункти — paths/labels from navMap SSoT
  const HEADER_DEPT_ICONS: Record<string, LucideIcon> = {
    professionals: Hammer,
    companies: Building2,
    manufacturers: Factory,
    jobs: Briefcase,
  }
  const navItems: NavItem[] = navEntriesFor('header-dept').map((entry) => ({
    label: t(labelKeyFor(entry, 'header-dept')),
    path: entry.path,
    icon: HEADER_DEPT_ICONS[entry.id] ?? MapPin,
  }))

  const closeAllMenus = () => {
    setLanguageOpen(false)
    setCurrencyOpen(false)
    setAccountOpen(false)
  }

  const goTo = (path: string) => {
    closeAllMenus()
    navigateTo(path)
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
    setSearchQuery('')
    if (!query) {
      navigateTo('/assistant/job')
      return
    }
    navigateTo(`/assistant/job?q=${encodeURIComponent(query)}`)
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

  const deptTail = [
    ...headerDeptBeforeEntries().map((entry) => ({
      key: entry.id,
      label: t(labelKeyFor(entry, 'header-dept-extra')),
      onClick: () => goTo(entry.path),
      className: 'amazon-dept-link',
    })),
    ...navItems.map((item) => ({
      key: item.path,
      label: item.label,
      onClick: () => goTo(item.path),
      className: navTextClass(isActiveRoute(item.path), true),
    })),
    ...headerDeptAfterEntries().map((entry) => ({
      key: entry.id,
      label: t(labelKeyFor(entry, 'header-dept-extra')),
      onClick: () => goTo(entry.path),
      className: 'amazon-dept-link',
    })),
  ]

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
  }, [showAnnouncement, user, unreadCount, language.code, currency.code])

  const dropdownPanelClass =
    'absolute right-0 top-full mt-2 w-64 rounded-md border border-[#d5d9d9] bg-white p-2 shadow-[0_4px_12px_rgba(15,17,17,0.15)]'

  const dropdownItemClass =
    'block w-full rounded-sm px-3 py-2.5 text-left text-sm text-[var(--ink-900)] transition hover:bg-[#f7fafa]'

  return (
    <>
      <div ref={fixedHeaderRef} className="site-header-fixed">
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
      <header className="site-header-shell w-full min-w-0">
        <div
          className="w-full min-w-0"
        >
            <div className="min-w-0 px-[max(var(--layout-gutter),env(safe-area-inset-left,0px))] py-2 md:px-[max(1.25rem,var(--layout-gutter))] md:py-2.5">
            <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">

              {/* Логотип */}
              <button onClick={() => goTo('/')} type="button" className="shrink-0 text-left">
                <Logo variant="text" size="header" inverted />
              </button>

              {/* Work in / Deliver to — global location */}
              <HeaderLocationControl />

              {/* AI assistant — replaces classic category + search */}
              <form
                onSubmit={handleSearchSubmit}
                className="amazon-search-bar mx-2 hidden min-w-0 flex-1 sm:flex sm:max-w-3xl"
                role="search"
                aria-label={t('ai.widget.open')}
              >
                <div className="amazon-search-inner">
                  <span className="amazon-search-ai-badge" aria-hidden>
                    <Bot className="h-4 w-4" />
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.headerSearchPlaceholder')}
                    className="amazon-search-input"
                    enterKeyHint="go"
                    autoComplete="off"
                  />
                  <button type="submit" className="amazon-search-submit" aria-label={t('ai.widget.open')}>
                    <Bot className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Amazon: мова, акаунт, замовлення, збережене */}
              <div className="hidden items-center gap-2 sm:flex">

                <PwaInstallButton variant="header" />

                <div ref={languageRef} className="relative">
                  <LanguageSelector
                    variant="header"
                    open={languageOpen}
                    onOpenChange={(next) => {
                      setLanguageOpen(next)
                      if (next) {
                        setCurrencyOpen(false)
                        setAccountOpen(false)
                      }
                    }}
                  />
                </div>

                <div ref={accountRef} className="relative">
                  <button
                    onClick={() => {
                      if (isLoggedIn) {
                        setAccountOpen(o => !o)
                        setLanguageOpen(false)
                        setCurrencyOpen(false)
                      } else {
                        goTo('/login')
                      }
                    }}
                    type="button"
                    className="amazon-header-block"
                    aria-label={
                      isLoggedIn
                        ? `${t('header.hello')}, ${accountGreeting}`
                        : `${t('header.hello')}, ${t('header.signIn')}`
                    }
                    aria-expanded={isLoggedIn ? accountOpen : undefined}
                  >
                    <span className="amazon-header-block__top">
                      {isLoggedIn
                        ? `${t('header.hello')}, ${accountGreeting}`
                        : `${t('header.hello')}, ${t('header.signIn')}`}
                    </span>
                    <span className="amazon-header-block__bottom">{t('header.accountLists')}</span>
                  </button>

                  {isLoggedIn && accountOpen && (
                    <div className={dropdownPanelClass}>
                      {isSiteOwner && user && (
                        <>
                          <p className="px-3 py-1 text-[10px] font-bold uppercase text-[var(--ink-500)]">
                            {t('nav.ownerSection')}
                          </p>
                          <button onClick={() => goTo('/dashboard')} type="button" className={dropdownItemClass}>
                            <LayoutDashboard className="mr-2 inline h-4 w-4" />
                            {t('header.dashboard')}
                          </button>
                          <button onClick={() => goTo('/admin/ai')} type="button" className={dropdownItemClass}>
                            <Bot className="mr-2 inline h-4 w-4" />
                            {t('ai.admin.title')}
                          </button>
                          <button onClick={() => goTo('/admin/marketing-agent')} type="button" className={dropdownItemClass}>
                            <Megaphone className="mr-2 inline h-4 w-4" />
                            {t('header.marketingAgent')}
                          </button>
                          <button onClick={() => goTo('/admin/official-sources')} type="button" className={dropdownItemClass}>
                            <Shield className="mr-2 inline h-4 w-4" />
                            {t('header.officialSources')}
                          </button>
                          <div className="my-1 border-t border-[#e7e7e7]" />
                        </>
                      )}
                      <button onClick={() => goTo('/profile')} type="button" className={dropdownItemClass}>
                        <User className="mr-2 inline h-4 w-4" />
                        {t('header.myProfile')}
                      </button>
                      {!(profile?.user_role === 'professional' ||
                        profile?.user_role === 'company' ||
                        profile?.is_professional) && (
                        <button onClick={() => goTo('/customer/dashboard')} type="button" className={dropdownItemClass}>
                          <LayoutDashboard className="mr-2 inline h-4 w-4" />
                          {t('header.customerDashboard')}
                        </button>
                      )}
                      <button onClick={() => goTo('/settings')} type="button" className={dropdownItemClass}>
                        <Settings className="mr-2 inline h-4 w-4" />
                        {t('header.settings')}
                      </button>
                      <button
                        onClick={handleSignOut}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-[#c7511f]"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('header.signOut')}</span>
                      </button>
                      {(profile?.user_role === 'professional' || profile?.user_role === 'company') && (
                        <button onClick={() => goTo('/verification')} type="button" className={dropdownItemClass}>
                          <Shield className="mr-2 inline h-4 w-4" />
                          {t('verification.menu')}
                        </button>
                      )}
                      {(profile?.is_professional ||
                        profile?.user_role === 'professional' ||
                        profile?.user_role === 'company') && (
                        <button onClick={() => goTo('/pro/dashboard')} type="button" className={dropdownItemClass}>
                          <LayoutDashboard className="mr-2 inline h-4 w-4" />
                          {t('header.proDashboard')}
                        </button>
                      )}
                      <button onClick={() => goTo('/my-listings')} type="button" className={dropdownItemClass}>
                        <FileText className="mr-2 inline h-4 w-4" />
                        {t('header.myListings')}
                      </button>
                      <button onClick={() => goTo('/my-projects')} type="button" className={dropdownItemClass}>
                        <FileText className="mr-2 inline h-4 w-4" />
                        {t('header.myProjects')}
                      </button>
                      {(profile?.is_professional ||
                        profile?.user_role === 'professional' ||
                        profile?.user_role === 'company') && (
                        <button onClick={() => goTo('/projects')} type="button" className={dropdownItemClass}>
                          <Zap className="mr-2 inline h-4 w-4" />
                          {t('header.projects')}
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
                    </div>
                  )}
                </div>

                {user ? <NotificationCenter /> : null}

                <button
                  type="button"
                  onClick={() => goTo(user ? '/messages' : '/login')}
                  className="amazon-header-cart hidden md:flex"
                  aria-label={t('header.messages')}
                >
                  <span className="amazon-header-cart__icon">
                    <Mail className="h-7 w-7" />
                    {unreadCount > 0 ? (
                      <span className="amazon-header-cart__count">{unreadCount}</span>
                    ) : null}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => goTo(user ? '/favorites' : '/login')}
                  className="amazon-header-cart"
                  aria-label={t('header.saved')}
                >
                  <span className="amazon-header-cart__icon">
                    <Bookmark className="h-7 w-7" />
                    <span className="amazon-header-cart__count">0</span>
                  </span>
                </button>
              </div>

              {/* Мобільні кнопки — Amazon: акаунт + збережене + меню */}
              <div className="flex shrink-0 items-center gap-0.5 sm:hidden">
                <PwaInstallButton variant="header-mobile" />
                {user ? <NotificationCenter /> : null}
                <button
                  type="button"
                  onClick={() => goTo(isLoggedIn ? '/profile' : '/login')}
                  className="amazon-header-block px-1 py-0.5"
                  aria-label={
                    isLoggedIn
                      ? `${t('header.hello')}, ${accountGreeting}`
                      : `${t('header.hello')}, ${t('header.signIn')}`
                  }
                >
                  <span className="amazon-header-block__top text-[10px]">
                    {isLoggedIn ? accountGreeting : t('header.signIn')}
                  </span>
                  <span className="amazon-header-block__bottom text-xs">{t('header.account')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => goTo(user ? '/favorites' : '/login')}
                  className="amazon-header-cart px-1"
                  aria-label={t('header.saved')}
                >
                  <span className="amazon-header-cart__icon">
                    <Bookmark className="h-6 w-6" />
                    <span className="amazon-header-cart__count text-sm">0</span>
                  </span>
                </button>

              </div>
            </div>

            {/* One centered department row */}
            <div className="site-header-subnav hidden min-w-0 sm:block">
              <nav
                className="amazon-dept-scroll px-3 md:px-4"
                aria-label={t('header.categories')}
              >
                <div className="amazon-dept-row">
                  <button
                    onClick={() => goTo('/categories')}
                    type="button"
                    aria-current={isActiveRoute('/categories') ? 'page' : undefined}
                    className={`${navTextClass(isActiveRoute('/categories'))} font-bold`}
                  >
                    {t('header.categories')}
                  </button>
                  {deptTail.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      className={item.className}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            {/* AI assistant (mobile) */}
            <form
              onSubmit={handleSearchSubmit}
              className="amazon-search-bar mt-2 sm:hidden"
              role="search"
              aria-label={t('ai.widget.open')}
            >
              <div className="amazon-search-inner">
                <span className="amazon-search-ai-badge" aria-hidden>
                  <Bot className="h-4 w-4" />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.headerSearchPlaceholder')}
                  className="amazon-search-input"
                  enterKeyHint="go"
                  autoComplete="off"
                />
                <button type="submit" className="amazon-search-submit" aria-label={t('ai.widget.open')}>
                  <Bot className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>


        </div>
      </header>
      </div>

      <div
        style={{ height: headerSpacerPx, backgroundColor: '#232f3e' }}
        className="site-header-spacer shrink-0"
        aria-hidden
      />
    </>
  )
}

