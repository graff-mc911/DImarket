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

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Bookmark,
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  Hammer,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { CURRENCIES, LANGUAGES } from '../lib/types'
import { navigateTo }  from '../lib/navigation'
import { Logo }        from './Logo'

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
  const [currencyOpen, setCurrencyOpen]   = useState(false)
  const [languageOpen, setLanguageOpen]   = useState(false)
  const [accountOpen, setAccountOpen]     = useState(false)

  // Глобальний банер від власника
  const [announcement, setAnnouncement]   = useState<Announcement | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Лічильник непрочитаних повідомлень
  const [unreadCount, setUnreadCount]     = useState(0)

  const languageRef = useRef<HTMLDivElement | null>(null)
  const currencyRef = useRef<HTMLDivElement | null>(null)
  const accountRef  = useRef<HTMLDivElement | null>(null)

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

  // Блокуємо скрол при відкритому мобільному меню
  useEffect(() => {
    const prev = document.body.style.overflow
    if (mobileMenuOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [mobileMenuOpen])

  // Завантаження активного банера від власника
  const loadAnnouncement = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('id, message, type')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) setAnnouncement(data as Announcement)
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
  const accountLabel = profile?.full_name || t('header.account')

  // Навігаційні пункти
  const navItems: NavItem[] = [
    { label: t('header.findProfessionals'), path: '/professionals', icon: Hammer },
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
    setMobileMenuOpen(false)
  }

  const closeDropdowns = () => {
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
    if (!query) { navigateTo('/listings'); return }
    navigateTo('/listings?search=' + encodeURIComponent(query))
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
  const hoverGlowClass =
    'transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_14px_rgba(196,122,61,0.18)]'

  const navTextClass = (active: boolean, nowrap = false) =>
    [
      'relative inline-flex items-center gap-1.5 pb-1 text-sm font-semibold transition-all duration-300',
      nowrap ? 'shrink-0 whitespace-nowrap' : '',
      active
        ? 'text-[var(--accent-700)] [text-shadow:0_0_14px_rgba(196,122,61,0.18)]'
        : 'text-[var(--ink-700)] ' + hoverGlowClass,
    ].join(' ')

  const bottomNavGapClass = 'gap-7'

  const textButtonClass = (active = false) =>
    ['inline-flex items-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-1 text-sm font-semibold shadow-none outline-none',
      active
        ? 'text-[var(--accent-700)] [text-shadow:0_0_14px_rgba(196,122,61,0.18)]'
        : 'text-[var(--ink-700)] ' + hoverGlowClass,
    ].join(' ')

  const createButtonClass =
    'inline-flex items-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-1 text-sm font-semibold text-[var(--ink-800)] shadow-none outline-none transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_16px_rgba(196,122,61,0.22)]'

  const mobileIconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-700)] shadow-none outline-none transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_16px_rgba(196,122,61,0.22)] sm:h-9 sm:w-9'

  const showAnnouncement = announcement && !bannerDismissed
  const headerSpacerClass = showAnnouncement
    ? 'h-[11.5rem] lg:h-[12rem] xl:h-[12.5rem]'
    : 'h-[8rem] lg:h-[10rem] xl:h-[10.5rem]'

  const dropdownPanelClass =
    'absolute right-0 top-full mt-3 w-64 rounded-[24px] border border-[var(--glass-border)] bg-[rgba(255,252,248,0.94)] p-2.5 shadow-[0_22px_50px_rgba(67,44,26,0.10)] backdrop-blur-xl'

  const dropdownItemClass =
    'block w-full rounded-[18px] px-4 py-3 text-left text-sm font-semibold text-[var(--ink-700)] transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_12px_rgba(196,122,61,0.16)]'

  const mobilePanelClass =
    'max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[26px] border border-[var(--glass-border)] bg-[rgba(255,252,248,0.92)] p-3 shadow-[0_18px_42px_rgba(67,44,26,0.08)] backdrop-blur-xl'

  const mobileNavItemClass =
    'flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-base font-semibold text-[var(--ink-700)] transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_12px_rgba(196,122,61,0.16)]'

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 w-full">
      {/* ===== Глобальний банер від власника ===== */}
      {showAnnouncement && (() => {
        const style = getBannerStyle(announcement!.type)
        return (
          <div
            className="w-full px-3 py-1.5"
            style={{ background: style.bg, borderBottom: '1px solid ' + style.border }}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 shrink-0" style={{ color: style.color }} />
                <p className="text-sm font-semibold" style={{ color: style.color }}>
                  {announcement!.message}
                </p>
              </div>
              {/* Кнопка закрити банер */}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:scale-110"
                style={{ background: 'rgba(0,0,0,0.08)' }}
              >
                <X className="h-3.5 w-3.5" style={{ color: style.color }} />
              </button>
            </div>
          </div>
        )
      })()}

      {/* ===== Основна шапка (фіксована) ===== */}
      <header className="w-full px-2 pb-2 pt-2 md:px-3 md:pt-2">
        <div className="w-full rounded-[22px] border border-[var(--glass-border)] bg-[rgba(255,252,248,0.88)] shadow-[0_10px_28px_rgba(67,44,26,0.06)] backdrop-blur-xl">
          <div className="px-3 py-2 md:px-4 md:py-2.5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">

              {/* Логотип */}
              <button onClick={() => goTo('/')} type="button" className="shrink-0 text-left">
                <Logo variant="text" size="header" />
              </button>

              {/* Пошук (десктоп) */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden min-w-0 flex-1 items-center xl:flex xl:max-w-[620px]"
              >
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('home.search')}
                    className="input-glass h-9 rounded-full pl-10 pr-3 text-sm"
                  />
                </div>
              </form>

              {/* Десктоп: права панель */}
              <div className="hidden items-center gap-2 xl:flex">

                {/* Вибір мови */}
                <div ref={languageRef} className="relative">
                  <button
                    onClick={() => { setLanguageOpen(o => !o); setCurrencyOpen(false); setAccountOpen(false) }}
                    type="button"
                    className={textButtonClass(languageOpen)}
                  >
                    <Globe className="h-4 w-4" />
                    <span>{language.code.toUpperCase()}</span>
                    <ChevronDown className="h-4 w-4 text-current" />
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

                {/* Вибір валюти */}
                <div ref={currencyRef} className="relative">
                  <button
                    onClick={() => { setCurrencyOpen(o => !o); setLanguageOpen(false); setAccountOpen(false) }}
                    type="button"
                    className={textButtonClass(currencyOpen)}
                  >
                    <span className="text-base">{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <ChevronDown className="h-4 w-4 text-current" />
                  </button>
                  {currencyOpen && (
                    <div className={dropdownPanelClass} style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {CURRENCIES.map(curr => (
                        <button
                          key={curr.code}
                          onClick={() => { setCurrency(curr); setCurrencyOpen(false) }}
                          type="button"
                          className={currency.code === curr.code
                            ? dropdownItemClass + ' text-[var(--accent-700)]'
                            : dropdownItemClass}
                        >
                          <span className="font-bold">{curr.symbol}</span> {curr.code} - {curr.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Іконка повідомлень з лічильником */}
                {user && (
                  <button
                    type="button"
                    onClick={() => goTo('/messages')}
                    className={textButtonClass(isActiveRoute('/messages')) + ' relative'}
                    title="Повідомлення"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'var(--accent-700)' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Іконка збережених */}
                {user && (
                  <button
                    type="button"
                    onClick={() => goTo('/favorites')}
                    className={textButtonClass(isActiveRoute('/favorites'))}
                    title="Збережені"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                )}

                {/* Акаунт */}
                {user && profile ? (
                  <div ref={accountRef} className="relative">
                    <button
                      onClick={() => { setAccountOpen(o => !o); setLanguageOpen(false); setCurrencyOpen(false) }}
                      type="button"
                      className={textButtonClass(accountOpen) + ' max-w-[240px]'}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{accountLabel}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-current" />
                    </button>

                    {accountOpen && (
                      <div className={dropdownPanelClass}>
                        <button onClick={() => goTo('/settings')} type="button" className={dropdownItemClass}>
                          <User className="mr-2 inline h-4 w-4" />
                          {t('header.myProfile')}
                        </button>
                        <button onClick={() => goTo('/my-listings')} type="button" className={dropdownItemClass}>
                          <FileText className="mr-2 inline h-4 w-4" />
                          {t('header.myListings') || 'Мої оголошення'}
                        </button>
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

                        {isSiteOwner && (
                          <button onClick={() => goTo('/dashboard')} type="button" className={dropdownItemClass}>
                            <ClipboardList className="mr-2 inline h-4 w-4" />
                            {t('header.dashboard')}
                          </button>
                        )}

                        <div className="my-2 border-t border-[var(--glass-border)]" />

                        <button
                          onClick={handleSignOut}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-[18px] px-4 py-3 text-left text-sm font-semibold text-[#a04b39] transition-all hover:text-[#c2614a]"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('header.signOut')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => goTo('/login')} type="button" className={textButtonClass()}>
                    {t('header.professionalLogin')}
                  </button>
                )}

                {/* Кнопка "Подати оголошення" */}
                <button onClick={() => goTo('/create-ad')} type="button" className={createButtonClass}>
                  <PlusCircle className="h-4 w-4" />
                  {t('header.createAd')}
                </button>
              </div>

              {/* Мобільні кнопки */}
              <div className="flex shrink-0 items-center gap-1.5 xl:hidden">

                {/* Повідомлення (мобільний) */}
                {user && (
                  <button
                    type="button"
                    onClick={() => goTo('/messages')}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-700)]"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'var(--accent-700)' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => goTo('/create-ad')}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border-0 bg-transparent px-1.5 py-1 text-xs font-semibold text-[var(--ink-800)] shadow-none outline-none sm:gap-1.5 sm:px-2 sm:text-sm"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span className="hidden min-[430px]:inline">{t('header.createAd')}</span>
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(o => !o); closeDropdowns() }}
                  type="button"
                  aria-expanded={mobileMenuOpen}
                  className={mobileIconButtonClass + (mobileMenuOpen ? ' text-[var(--accent-700)]' : '')}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Нижня навігаційна панель (десктоп) — однаковий gap між усіма пунктами */}
            <nav
              className={
                'mt-2 hidden w-full flex-wrap items-end justify-center border-t border-[var(--glass-border)] pt-2 lg:flex ' +
                bottomNavGapClass
              }
            >
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  type="button"
                  className={navTextClass(isActiveRoute(item.path), true)}
                >
                  <span>{item.label}</span>
                  <span
                    className={
                      'absolute bottom-0 left-0 h-[2px] rounded-full bg-[var(--accent-700)] transition-all duration-300 ' +
                      (isActiveRoute(item.path) ? 'w-full opacity-100' : 'w-0 opacity-0')
                    }
                  />
                </button>
              ))}

              {centerNavItems.map(item => (
                <button
                  key={item.path + item.label}
                  onClick={() => goTo(item.path)}
                  type="button"
                  className={navTextClass(isActiveRoute(item.path), true)}
                >
                  <span>{item.label}</span>
                  <span
                    className={
                      'absolute bottom-0 left-0 h-[2px] rounded-full bg-[var(--accent-700)] transition-all duration-300 ' +
                      (isActiveRoute(item.path) ? 'w-full opacity-100' : 'w-0 opacity-0')
                    }
                  />
                </button>
              ))}

              <button
                onClick={() => goTo('/listings')}
                type="button"
                className={textButtonClass(isActiveRoute('/listings')) + ' shrink-0 whitespace-nowrap'}
              >
                {t('listings.title')}
              </button>
            </nav>

            {/* Пошук (мобільний) */}
            <form onSubmit={handleSearchSubmit} className="mt-2.5 xl:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('home.search')}
                  className="input-glass h-12 rounded-full pl-11 pr-4"
                />
              </div>
            </form>
          </div>

          {/* Мобільне меню */}
          {mobileMenuOpen && (
            <div className="border-t border-[var(--glass-border)] px-3 pb-4 pt-3 lg:hidden">
              <div className={mobilePanelClass}>
                <div className="grid gap-2">
                  {navItems.map(item => (
                    <button key={item.path} onClick={() => goTo(item.path)} type="button" className={mobileNavItemClass}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  ))}

                  {centerNavItems.map(item => (
                    <button
                      key={item.path + item.label}
                      onClick={() => goTo(item.path)}
                      type="button"
                      className={mobileNavItemClass}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}

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

                <div className="mt-3 grid gap-2">
                  {user && profile ? (
                    <>
                      <button onClick={() => goTo('/settings')} type="button" className={mobileNavItemClass}>
                        <User className="h-5 w-5" />
                        <span>{t('header.myProfile')}</span>
                      </button>

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
                        <button onClick={() => goTo('/dashboard')} type="button" className={mobileNavItemClass}>
                          <ClipboardList className="h-5 w-5" />
                          <span>{t('header.dashboard')}</span>
                        </button>
                      )}

                      <button
                        onClick={handleSignOut}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-base font-semibold text-[#a04b39] transition-all hover:text-[#c2614a]"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{t('header.signOut')}</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => goTo('/login')} type="button" className={mobileNavItemClass}>
                      <User className="h-5 w-5" />
                      <span>{t('header.professionalLogin')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      </div>

      <div className={headerSpacerClass} aria-hidden />
    </>
  )
}