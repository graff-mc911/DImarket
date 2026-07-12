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
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  Hammer,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  Shield,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { CURRENCIES, LANGUAGES } from '../lib/types'
import { navigateTo }  from '../lib/navigation'
import { useOnlineVisitors } from '../hooks/useOnlineVisitors'
import { buildHomeCategoryGroups } from '../lib/homeCategoryTiles'
import { Logo }        from './Logo'
import { EmojiText } from './EmojiText'
import { TrustStrip } from './TrustStrip'
import { NotificationCenter } from './notifications/NotificationCenter'

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
      if (categoriesRef.current && !categoriesRef.current.contains(target)) setCategoriesOpen(false)
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
  const accountLabel = profile?.full_name || t('header.account')

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
    'absolute right-0 top-full mt-3 w-64 rounded-[24px] border border-[var(--glass-border)] bg-[rgba(255,252,248,0.94)] p-2.5 shadow-[0_22px_50px_rgba(67,44,26,0.10)] backdrop-blur-xl'

  const categoriesDropdownClass =
    'absolute left-1/2 top-full z-50 mt-2 w-80 max-h-[min(28rem,70vh)] -translate-x-1/2 overflow-y-auto rounded-[20px] border border-[var(--glass-border)] bg-[rgba(255,252,248,0.96)] p-2 shadow-[0_18px_42px_rgba(67,44,26,0.12)] backdrop-blur-xl'

  const dropdownItemClass =
    'block w-full rounded-[18px] px-4 py-3 text-left text-sm font-semibold text-[var(--ink-700)] transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_12px_rgba(196,122,61,0.16)]'

  const mobileNavItemClass =
    'flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-base font-semibold text-[var(--ink-700)] transition-all duration-300 hover:text-[var(--accent-700)] hover:[text-shadow:0_0_12px_rgba(196,122,61,0.16)]'

  const mobileCategoryItemClass =
    'rounded-[16px] px-4 py-2.5 text-left text-sm font-semibold text-[var(--ink-700)] transition hover:bg-white/50 hover:text-[var(--accent-700)]'

  const categoryGroups = useMemo(
    () => buildHomeCategoryGroups(language.code, t),
    [language.code, t],
  )

  const renderCategoryMenu = (itemClass: string, role?: 'menuitem') => (
    <>
      {categoryGroups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && (
            <div className="my-1 border-t border-[var(--glass-border)]" aria-hidden />
          )}
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-500)]">
            {t(group.titleKey)}
          </p>
          {group.tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              role={role}
              onClick={() => goTo(tile.path)}
              className={itemClass}
            >
              {tile.label}
            </button>
          ))}
        </div>
      ))}
      <div className="my-1 border-t border-[var(--glass-border)]" aria-hidden />
      <button
        type="button"
        role={role}
        onClick={() => goTo('/listings')}
        className={itemClass + ' text-[var(--accent-700)]'}
      >
        {t('listings.allCategories')}
      </button>
    </>
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
                <Logo variant="text" size="header" animated />
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
                    placeholder={t('home.headerSearchPlaceholder')}
                    className="input-glass h-10 rounded-xl pl-10 pr-3 text-sm"
                  />
                </div>
              </form>

              {/* Десктоп: права панель */}
              <div className="hidden items-center gap-2 xl:flex">

                {/* Вибір мови */}
                <div ref={languageRef} className="relative">
                  <button
                    onClick={() => { setLanguageOpen(o => !o); setCurrencyOpen(false); setAccountOpen(false); setCategoriesOpen(false) }}
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
                    onClick={() => { setCurrencyOpen(o => !o); setLanguageOpen(false); setAccountOpen(false); setCategoriesOpen(false) }}
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

                {user && <NotificationCenter />}

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
                      onClick={() => { setAccountOpen(o => !o); setLanguageOpen(false); setCurrencyOpen(false); setCategoriesOpen(false) }}
                      type="button"
                      className={textButtonClass(accountOpen) + ' max-w-[240px]'}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{accountLabel}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-current" />
                    </button>

                    {accountOpen && (
                      <div className={dropdownPanelClass}>
                        <button onClick={() => goTo('/profile')} type="button" className={dropdownItemClass}>
                          <User className="mr-2 inline h-4 w-4" />
                          {t('header.myProfile')}
                        </button>
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
                          <>
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
                              {t('marketing.admin.title')}
                            </button>
                          </>
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
                    {t('header.signIn')}
                  </button>
                )}

                <button
                  onClick={() => goTo('/assistant/job')}
                  type="button"
                  className="btn-outline hidden px-4 py-2 text-xs xl:inline-flex"
                >
                  <Bot className="h-4 w-4" />
                  {t('header.aiAssistant')}
                </button>

                <button onClick={() => goTo('/create-ad')} type="button" className="btn-primary px-4 py-2 text-xs">
                  <PlusCircle className="h-4 w-4" />
                  {t('header.postJob')}
                </button>
              </div>

              {/* Мобільні кнопки */}
              <div className="flex shrink-0 items-center gap-1.5 xl:hidden">
                <OnlineVisitorsPill count={onlineVisitors} className="hidden min-[400px]:inline-flex" />

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
                  className="btn-primary px-2.5 py-1.5 text-xs sm:px-3"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden min-[430px]:inline">{t('header.postJob')}</span>
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

            {/* Десктопна навігація (промпт 3) */}
            <nav className="mt-2 hidden w-full items-center justify-center gap-6 border-t border-[var(--glass-border)] pt-2 xl:flex">
              <div ref={categoriesRef} className="relative shrink-0">
                <button
                  onClick={() => {
                    setCategoriesOpen((o) => !o)
                    setLanguageOpen(false)
                    setCurrencyOpen(false)
                    setAccountOpen(false)
                  }}
                  type="button"
                  aria-expanded={categoriesOpen}
                  className={navTextClass(categoriesOpen, true)}
                >
                  <span>{t('header.categories')}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {categoriesOpen && (
                  <div className={categoriesDropdownClass} role="menu">
                    {renderCategoryMenu(dropdownItemClass, 'menuitem')}
                  </div>
                )}
              </div>

              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  type="button"
                  className={navTextClass(isActiveRoute(item.path), true)}
                >
                  <span>{item.label}</span>
                </button>
              ))}

              <button type="button" onClick={goToHowItWorks} className={navTextClass(false, true)}>
                <span>{t('footer.howItWorks')}</span>
              </button>
            </nav>

            {/* Додаткова навігація — планшет / мобільний ряд під шапкою */}
            <nav
              className={
                'mt-2 hidden w-full flex-wrap items-center justify-center overflow-visible border-t border-[var(--glass-border)] pt-2 max-xl:flex max-lg:hidden ' +
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

              <div ref={categoriesRef} className="relative shrink-0">
                <button
                  onClick={() => {
                    setCategoriesOpen((o) => !o)
                    setLanguageOpen(false)
                    setCurrencyOpen(false)
                    setAccountOpen(false)
                  }}
                  type="button"
                  aria-expanded={categoriesOpen}
                  aria-haspopup="menu"
                  className={navTextClass(categoriesOpen, true)}
                >
                  <span>{t('header.categories')}</span>
                  <ChevronDown
                    className={
                      'h-4 w-4 transition-transform duration-200 ' +
                      (categoriesOpen ? 'rotate-180' : '')
                    }
                  />
                </button>
                {categoriesOpen && (
                  <div className={categoriesDropdownClass} role="menu">
                    {renderCategoryMenu(dropdownItemClass, 'menuitem')}
                  </div>
                )}
              </div>

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

              <OnlineVisitorsPill count={onlineVisitors} />
            </nav>

            {/* Пошук (мобільний) */}
            <form onSubmit={handleSearchSubmit} className="mt-2.5 xl:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('home.headerSearchPlaceholder')}
                  className="input-glass h-12 rounded-full pl-11 pr-4"
                />
              </div>
            </form>
          </div>

          <TrustStrip />

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

                  <p className="px-4 pt-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink-500)]">
                    {t('header.categories')}
                  </p>
                  <div className="grid gap-1 px-1 pb-2">
                    {renderCategoryMenu(mobileCategoryItemClass)}
                  </div>

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

                    <button onClick={() => goTo('/settings')} type="button" className={mobileNavItemClass}>
                      <Settings className="h-5 w-5" />
                      <span>{t('header.settings')}</span>
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
                      <>
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[rgba(255,255,255,0.45)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-700)] sm:text-xs ' +
        className
      }
      aria-live="polite"
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-hidden />
      <span className="whitespace-nowrap">{t('header.onlineVisitors')}</span>
      <span className="tabular-nums font-extrabold text-[var(--accent-700)]">{formatted}</span>
    </div>
  )
}