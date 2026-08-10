import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Radio,
  Star,
  Sun,
  Wallet,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import {
  fetchProDashboardStats,
  PRO_DASH_THEME_KEY,
  type ProDashboardStats,
} from '../lib/proDashboard'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notifications/notifications'
import { AreaSparkline, BarChart, DonutProgress } from '../components/pro-dashboard/Charts'
import { MiniCalendar } from '../components/pro-dashboard/MiniCalendar'
import { OwnerCabinetEntry } from '../components/OwnerCabinetEntry'
import { ConnectPayoutPanel } from '../components/ConnectPayoutPanel'

function formatEuro(n: number): string {
  return `€${Math.round(n).toLocaleString()}`
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const EMPTY: ProDashboardStats = {
  todaysLeads: 0,
  openLeads: 0,
  revenue: 0,
  revenueCurrency: 'EUR',
  pipeline: 0,
  unreadMessages: 0,
  quotesDraft: 0,
  quotesSent: 0,
  quotesAccepted: 0,
  quotesTotal: 0,
  activeJobs: [],
  rating: 0,
  totalReviews: 0,
  recentReviews: [],
  profileCompletion: 0,
  profileSteps: [],
  applications: [],
  quotes: [],
  notifications: [],
  unreadNotifications: 0,
  activity: [],
  leadsByDay: [0, 0, 0, 0, 0, 0, 0],
  revenueByDay: [0, 0, 0, 0, 0, 0, 0],
  calendarMarks: {},
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

/** Modern Professional Dashboard — /pro/dashboard */
export function ProDashboard() {
  const { user, profile, t } = useApp()
  const [stats, setStats] = useState<ProDashboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(PRO_DASH_THEME_KEY) === 'dark'
    } catch {
      return false
    }
  })

  const isPro =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    Boolean(profile?.is_professional)

  const refresh = useCallback(async () => {
    if (!user) return
    const data = await fetchProDashboardStats(user.id, profile)
    setStats(data)
    setLoading(false)
  }, [user, profile])

  useEffect(() => {
    if (!user || !isPro) return
    setLoading(true)
    void refresh()
  }, [user, isPro, refresh])

  useEffect(() => {
    try {
      localStorage.setItem(PRO_DASH_THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  // Realtime refresh on key tables
  useEffect(() => {
    if (!user || !isPro) return

    let timer: number | null = null
    const bump = () => {
      setLive(true)
      window.setTimeout(() => setLive(false), 1600)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        void refresh()
      }, 400)
    }

    const channel = supabase
      .channel(`pro-dash:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        bump,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_applications', filter: `professional_id=eq.${user.id}` },
        bump,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes', filter: `professional_id=eq.${user.id}` },
        bump,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        bump,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        bump,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews', filter: `professional_id=eq.${user.id}` },
        bump,
      )
      .subscribe()

    return () => {
      if (timer) window.clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [user, isPro, refresh])

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Professional Dashboard</h1>
        <p className="mt-2 text-[#86868b]">Sign in to view your workspace.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Professionals only</h1>
        <p className="mt-2 text-[#86868b]">This dashboard is for professional accounts.</p>
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => navigateTo('/for-professionals')}
        >
          Learn more
        </button>
      </div>
    )
  }

  const card = dark
    ? 'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.04)]'
    : 'rounded-2xl border border-[#e8e8ed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
  const muted = dark ? 'text-white/50' : 'text-[#86868b]'
  const ink = dark ? 'text-white' : 'text-[#1d1d1f]'
  const soft = dark ? 'text-white/70' : 'text-[#6e6e73]'
  const chip = dark ? 'bg-white/10 text-white/80' : 'bg-[#f5f5f7] text-[#6e6e73]'
  const btnGhost = dark
    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
    : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
  const btnPrimary = dark
    ? 'bg-blue-500 text-white hover:bg-blue-400'
    : 'bg-[#1d1d1f] text-white hover:bg-black'

  const name = profile?.full_name?.split(' ')[0] || 'Pro'

  return (
    <div
      className={`min-h-[80vh] pb-24 transition-colors ${
        dark
          ? 'bg-[#0b0b0f] text-white'
          : 'bg-[#f5f5f7] text-[#1d1d1f]'
      }`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-20 border-b backdrop-blur-xl ${
          dark ? 'border-white/10 bg-[#0b0b0f]/85' : 'border-[#e8e8ed] bg-white/85'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                dark ? 'bg-blue-500/20 text-blue-400' : 'bg-[#1d1d1f] text-white'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-[20px] font-semibold tracking-tight md:text-[22px] ${ink}`}>
                  {t('proDash.title' as never) || 'Professional Dashboard'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    live
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : dark
                        ? 'bg-white/10 text-white/40'
                        : 'bg-[#f5f5f7] text-[#86868b]'
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  Live
                </span>
              </div>
              <p className={`text-[13px] ${muted}`}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
                {name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold ${btnGhost}`}
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {dark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-[12px] font-semibold ${btnGhost}`}
              onClick={() => navigateTo('/pro/calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-[12px] font-semibold ${btnGhost}`}
              onClick={() => navigateTo('/projects')}
            >
              Leads
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-[12px] font-semibold ${btnPrimary}`}
              onClick={() => navigateTo('/messages')}
            >
              Messages
              {stats.unreadMessages > 0 ? ` (${stats.unreadMessages})` : ''}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <OwnerCabinetEntry variant="banner" className="mb-4" />
        <ConnectPayoutPanel variant="banner" returnPath="/pro/dashboard?connect=return" />
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${card} h-28 animate-pulse`} />
            ))}
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Kpi
                card={card}
                ink={ink}
                muted={muted}
                icon={<Briefcase className="h-4 w-4" />}
                label="Today's leads"
                value={String(stats.todaysLeads)}
                hint={`${stats.openLeads} open this week`}
                onClick={() => navigateTo('/projects')}
              />
              <Kpi
                card={card}
                ink={ink}
                muted={muted}
                icon={<Wallet className="h-4 w-4" />}
                label="Revenue"
                value={formatEuro(stats.revenue)}
                hint={`${formatEuro(stats.pipeline)} pipeline`}
              />
              <Kpi
                card={card}
                ink={ink}
                muted={muted}
                icon={<MessageSquare className="h-4 w-4" />}
                label="New messages"
                value={String(stats.unreadMessages)}
                hint="Unread inbox"
                onClick={() => navigateTo('/messages')}
              />
              <Kpi
                card={card}
                ink={ink}
                muted={muted}
                icon={<FileText className="h-4 w-4" />}
                label="Quotes"
                value={String(stats.quotesTotal)}
                hint={`${stats.quotesSent} sent · ${stats.quotesAccepted} accepted`}
              />
              <Kpi
                card={card}
                ink={ink}
                muted={muted}
                icon={<Star className="h-4 w-4" />}
                label="Reviews"
                value={stats.rating.toFixed(1)}
                hint={`${stats.totalReviews} total`}
                onClick={() => navigateTo('/profile')}
              />
            </div>

            {/* Analytics + calendar */}
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className={`${card} p-5 lg:col-span-2`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-wide ${muted}`}>
                      Analytics
                    </p>
                    <h2 className={`text-[17px] font-semibold ${ink}`}>Leads · last 7 days</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('/analytics')}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      dark ? 'bg-white/10 text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
                    }`}
                  >
                    Full analytics
                  </button>
                </div>
                <div className={ink}>
                  <BarChart
                    values={stats.leadsByDay}
                    labels={stats.dayLabels}
                    color={dark ? '#60a5fa' : '#2563eb'}
                  />
                </div>
                <div className="mt-6 border-t border-dashed pt-4" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '#e8e8ed' }}>
                  <p className={`mb-2 text-[13px] font-semibold ${ink}`}>Accepted revenue trend</p>
                  <div className={ink}>
                    <AreaSparkline
                      values={stats.revenueByDay}
                      color={dark ? '#34d399' : '#10b981'}
                    />
                  </div>
                </div>
              </div>

              <div className={`${card} p-5`}>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className={`h-4 w-4 ${muted}`} />
                  <h2 className={`text-[17px] font-semibold ${ink}`}>Calendar</h2>
                </div>
                <MiniCalendar marks={stats.calendarMarks} dark={dark} />
                <p className={`mt-3 text-[12px] ${muted}`}>
                  Highlighted days have leads or quote activity.
                </p>
              </div>
            </div>

            {/* Profile + quotes + reviews */}
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className={`${card} p-5`}>
                <h2 className={`text-[17px] font-semibold ${ink}`}>Profile completion</h2>
                <div className="mt-4 flex items-center gap-4">
                  <DonutProgress
                    percent={stats.profileCompletion}
                    color={dark ? '#60a5fa' : '#2563eb'}
                    track={dark ? '#fff' : '#1d1d1f'}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    {stats.profileSteps.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className={s.done ? soft : muted}>{s.label}</span>
                        <span className={s.done ? 'text-emerald-500' : muted}>
                          {s.done ? 'Done' : 'Todo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`mt-4 w-full rounded-full border px-4 py-2 text-[13px] font-semibold ${btnGhost}`}
                  onClick={() => navigateTo('/settings')}
                >
                  Complete profile
                </button>
              </div>

              <div className={`${card} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className={`text-[17px] font-semibold ${ink}`}>
                    {t('pipeline.activeJobs' as never) || 'Active jobs'}
                  </h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip}`}>
                    {stats.activeJobs.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {stats.activeJobs.slice(0, 5).map((j) => (
                    <li key={j.listingId}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                          dark ? 'hover:bg-white/5' : 'hover:bg-[#f5f5f7]'
                        }`}
                        onClick={() => navigateTo(`/project/${j.listingId}/manage`)}
                      >
                        <span className={`truncate text-[13px] font-medium ${ink}`}>{j.title}</span>
                        <span className={`shrink-0 text-[11px] font-semibold capitalize ${muted}`}>
                          {(j.stage || 'in_progress').replace(/_/g, ' ')}
                        </span>
                      </button>
                    </li>
                  ))}
                  {stats.activeJobs.length === 0 ? (
                    <p className={`py-4 text-center text-[13px] ${muted}`}>
                      {t('pipeline.noActiveJobs' as never) || 'No hired jobs yet'}
                    </p>
                  ) : null}
                </ul>
              </div>

              <div className={`${card} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className={`text-[17px] font-semibold ${ink}`}>Quotes</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip}`}>
                    {stats.quotesDraft} draft
                  </span>
                </div>
                <ul className="space-y-2">
                  {stats.quotes.slice(0, 5).map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                          dark ? 'hover:bg-white/5' : 'hover:bg-[#f5f5f7]'
                        }`}
                        onClick={() =>
                          navigateTo(
                            q.status === 'accepted' && q.listing_id
                              ? `/project/${q.listing_id}/manage`
                              : q.application_id
                                ? `/leads/${q.application_id}/quote`
                                : '/projects',
                          )
                        }
                      >
                        <span className={`text-[13px] font-medium capitalize ${ink}`}>
                          {q.status}
                        </span>
                        <span className={`text-[13px] font-semibold tabular-nums ${soft}`}>
                          {formatEuro(Number(q.total) || 0)}
                        </span>
                      </button>
                    </li>
                  ))}
                  {stats.quotes.length === 0 ? (
                    <p className={`py-6 text-center text-[13px] ${muted}`}>No quotes yet</p>
                  ) : null}
                </ul>
              </div>

              <div className={`${card} p-5`}>
                <h2 className={`text-[17px] font-semibold ${ink}`}>Reviews</h2>
                <ul className="mt-3 space-y-3">
                  {stats.recentReviews.map((r) => (
                    <li
                      key={r.id}
                      className={`rounded-xl px-3 py-2.5 ${dark ? 'bg-white/5' : 'bg-[#f5f5f7]'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-semibold ${ink}`}>
                          {r.reviewer_name || 'Client'}
                        </span>
                        <span className="text-[12px] font-semibold text-amber-500">
                          {r.rating}★
                        </span>
                      </div>
                      {r.comment ? (
                        <p className={`mt-1 line-clamp-2 text-[12px] ${soft}`}>{r.comment}</p>
                      ) : null}
                    </li>
                  ))}
                  {stats.recentReviews.length === 0 ? (
                    <p className={`py-6 text-center text-[13px] ${muted}`}>No reviews yet</p>
                  ) : null}
                </ul>
              </div>
            </div>

            {/* Activity + notifications */}
            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              <div className={`${card} p-5 lg:col-span-3`}>
                <h2 className={`text-[17px] font-semibold ${ink}`}>Recent activity</h2>
                <ul className="mt-3 divide-y" style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : '#f0f0f2' }}>
                  {stats.activity.map((a) => (
                    <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 text-left"
                        onClick={() => a.href && navigateTo(a.href)}
                      >
                        <div className="min-w-0">
                          <p className={`truncate text-[13px] font-semibold ${ink}`}>{a.title}</p>
                          {a.subtitle ? (
                            <p className={`truncate text-[12px] ${muted}`}>{a.subtitle}</p>
                          ) : null}
                        </div>
                        <span className={`shrink-0 text-[11px] ${muted}`}>
                          {relativeTime(a.at)}
                        </span>
                      </button>
                    </li>
                  ))}
                  {stats.activity.length === 0 ? (
                    <p className={`py-8 text-center text-[13px] ${muted}`}>No recent activity</p>
                  ) : null}
                </ul>
              </div>

              <div className={`${card} p-5 lg:col-span-2`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className={`h-4 w-4 ${muted}`} />
                    <h2 className={`text-[17px] font-semibold ${ink}`}>Notifications</h2>
                    {stats.unreadNotifications > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {stats.unreadNotifications}
                      </span>
                    ) : null}
                  </div>
                  {stats.unreadNotifications > 0 && user ? (
                    <button
                      type="button"
                      className={`text-[11px] font-semibold ${muted}`}
                      onClick={async () => {
                        await markAllNotificationsRead(user.id)
                        void refresh()
                      }}
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <ul className="space-y-2">
                  {stats.notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                          n.is_read
                            ? dark
                              ? 'opacity-60'
                              : 'opacity-70'
                            : dark
                              ? 'bg-blue-500/10'
                              : 'bg-blue-50'
                        } ${dark ? 'hover:bg-white/5' : 'hover:bg-[#f5f5f7]'}`}
                        onClick={async () => {
                          if (!n.is_read) await markNotificationRead(n.id)
                          if (n.link_path) navigateTo(n.link_path)
                          void refresh()
                        }}
                      >
                        <p className={`text-[13px] font-semibold ${ink}`}>{n.title}</p>
                        <p className={`mt-0.5 line-clamp-2 text-[12px] ${muted}`}>{n.body}</p>
                        <p className={`mt-1 text-[10px] ${muted}`}>{relativeTime(n.created_at)}</p>
                      </button>
                    </li>
                  ))}
                  {stats.notifications.length === 0 ? (
                    <p className={`py-8 text-center text-[13px] ${muted}`}>You&apos;re all caught up</p>
                  ) : null}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Kpi({
  card,
  ink,
  muted,
  icon,
  label,
  value,
  hint,
  onClick,
}: {
  card: string
  ink: string
  muted: string
  icon: ReactNode
  label: string
  value: string
  hint: string
  onClick?: () => void
}) {
  const className = `${card} p-4 text-left transition ${onClick ? 'hover:scale-[1.01]' : ''}`
  const body = (
    <>
      <div className={`mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide ${muted}`}>
        {icon}
        {label}
      </div>
      <p className={`text-[26px] font-semibold tabular-nums tracking-tight ${ink}`}>{value}</p>
      <p className={`mt-1 text-[12px] ${muted}`}>{hint}</p>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    )
  }
  return <div className={className}>{body}</div>
}
