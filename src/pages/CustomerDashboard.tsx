import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  Bookmark,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Radio,
  Receipt,
  Settings,
  Sparkles,
  Sun,
  User,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import {
  CUSTOMER_DASH_THEME_KEY,
  fetchCustomerDashboardStats,
  type CustomerDashboardStats,
} from '../lib/customerDashboard'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notifications/notifications'
import { AreaSparkline, BarChart, DonutProgress } from '../components/pro-dashboard/Charts'

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
  return `${Math.floor(h / 24)}d ago`
}

const EMPTY: CustomerDashboardStats = {
  projects: [],
  activeProjects: 0,
  quotes: [],
  quotesPending: 0,
  invoices: [],
  invoiceTotal: 0,
  unreadMessages: 0,
  favoritePros: [],
  notifications: [],
  unreadNotifications: 0,
  projectsByDay: [0, 0, 0, 0, 0, 0, 0],
  quotesByDay: [0, 0, 0, 0, 0, 0, 0],
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  profileComplete: 0,
  profileHints: [],
}

/** Premium Customer Dashboard — /customer/dashboard */
export function CustomerDashboard() {
  const { user, profile, t } = useApp()
  const [stats, setStats] = useState<CustomerDashboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(CUSTOMER_DASH_THEME_KEY) === 'dark'
    } catch {
      return false
    }
  })

  const refresh = useCallback(async () => {
    if (!user) return
    const data = await fetchCustomerDashboardStats(user.id, profile)
    setStats(data)
    setLoading(false)
  }, [user, profile])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    void refresh()
  }, [user, refresh])

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_DASH_THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  useEffect(() => {
    if (!user) return
    let timer: number | null = null
    const bump = () => {
      setLive(true)
      window.setTimeout(() => setLive(false), 1500)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => void refresh(), 450)
    }

    const channel = supabase
      .channel(`customer-dash:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `author_id=eq.${user.id}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, bump)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        bump,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_items', filter: `user_id=eq.${user.id}` },
        bump,
      )
      .subscribe()

    return () => {
      if (timer) window.clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [user, refresh])

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Customer Dashboard</h1>
        <p className="mt-2 text-[#86868b]">Sign in to manage your projects and quotes.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  const card = dark
    ? 'rounded-[22px] border border-white/[0.08] bg-white/[0.04]'
    : 'rounded-[22px] border border-[#e8e8ed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
  const ink = dark ? 'text-white' : 'text-[#1d1d1f]'
  const muted = dark ? 'text-white/45' : 'text-[#86868b]'
  const soft = dark ? 'text-white/70' : 'text-[#6e6e73]'
  const chip = dark ? 'bg-white/10 text-white/75' : 'bg-[#f5f5f7] text-[#6e6e73]'
  const btnGhost = dark
    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
    : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
  const btnPrimary = dark
    ? 'bg-white text-[#0b0b0f] hover:bg-white/90'
    : 'bg-[#1d1d1f] text-white hover:bg-black'
  const hoverRow = dark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#fafafa]'

  const name = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className={`min-h-[80vh] pb-24 transition-colors ${dark ? 'bg-[#0a0a0c] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
      <div
        className={`sticky top-0 z-20 border-b backdrop-blur-2xl ${
          dark ? 'border-white/10 bg-[#0a0a0c]/80' : 'border-[#e8e8ed]/80 bg-white/80'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 md:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${chip}`}>
                <Sparkles className="h-3 w-3" />
                Customer
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  live ? 'bg-emerald-500/15 text-emerald-400' : muted
                }`}
              >
                <Radio className="h-3 w-3" />
                Live
              </span>
            </div>
            <h1 className={`text-[28px] font-semibold tracking-tight md:text-[32px] ${ink}`}>
              {t('customerDash.title' as never) || 'Your dashboard'}
            </h1>
            <p className={`mt-1 text-[15px] ${muted}`}>
              Welcome back, {name}. Manage projects, quotes, and favorites.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold ${btnGhost}`}
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {dark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold ${btnGhost}`}
              onClick={() => navigateTo('/settings')}
            >
              <Settings className="mr-1 inline h-3.5 w-3.5" />
              Settings
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-[12px] font-semibold ${btnPrimary}`}
              onClick={() => navigateTo('/create-project')}
            >
              New project
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${card} h-28 animate-pulse`} />
            ))}
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                card={card}
                ink={ink}
                muted={muted}
                icon={<FolderKanban className="h-4 w-4" />}
                label="My projects"
                value={String(stats.projects.length)}
                hint={`${stats.activeProjects} active`}
                onClick={() => navigateTo('/my-projects')}
              />
              <Stat
                card={card}
                ink={ink}
                muted={muted}
                icon={<FileText className="h-4 w-4" />}
                label="Quotes received"
                value={String(stats.quotes.length)}
                hint={`${stats.quotesPending} awaiting decision`}
              />
              <Stat
                card={card}
                ink={ink}
                muted={muted}
                icon={<MessageSquare className="h-4 w-4" />}
                label="Messages"
                value={String(stats.unreadMessages)}
                hint="Unread"
                onClick={() => navigateTo('/messages')}
              />
              <Stat
                card={card}
                ink={ink}
                muted={muted}
                icon={<Receipt className="h-4 w-4" />}
                label="Invoices"
                value={formatEuro(stats.invoiceTotal)}
                hint={`${stats.invoices.length} documents`}
              />
            </div>

            {/* Statistics graphs */}
            <div className={`${card} mt-4 p-5 md:p-6`}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${muted}`}>
                    Statistics
                  </p>
                  <h2 className={`text-[18px] font-semibold tracking-tight ${ink}`}>
                    Activity · last 7 days
                  </h2>
                </div>
                <LayoutDashboard className={`h-4 w-4 ${muted}`} />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className={`mb-2 text-[13px] font-medium ${soft}`}>Projects published</p>
                  <div className={ink}>
                    <BarChart
                      values={stats.projectsByDay}
                      labels={stats.dayLabels}
                      color={dark ? '#a78bfa' : '#7c3aed'}
                    />
                  </div>
                </div>
                <div>
                  <p className={`mb-2 text-[13px] font-medium ${soft}`}>Quotes received</p>
                  <div className={ink}>
                    <AreaSparkline
                      values={stats.quotesByDay}
                      color={dark ? '#34d399' : '#059669'}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              {/* My Projects */}
              <section className={`${card} p-5 lg:col-span-3`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-[17px] font-semibold ${ink}`}>My Projects</h2>
                  <button
                    type="button"
                    className={`text-[12px] font-semibold ${muted}`}
                    onClick={() => navigateTo('/my-projects')}
                  >
                    View all
                  </button>
                </div>
                <ul className="space-y-2">
                  {stats.projects.slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition ${hoverRow}`}
                        onClick={() => navigateTo(`/project/${p.id}/matches`)}
                      >
                        <div className="min-w-0">
                          <p className={`truncate text-[14px] font-semibold ${ink}`}>{p.title}</p>
                          <p className={`truncate text-[12px] ${muted}`}>
                            {p.status} · {p.city_name || p.location}
                            {p.budget_min != null || p.budget_max != null
                              ? ` · €${p.budget_min ?? '—'}–€${p.budget_max ?? '—'}`
                              : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${chip}`}>
                          {p.urgency || 'normal'}
                        </span>
                      </button>
                    </li>
                  ))}
                  {stats.projects.length === 0 ? (
                    <Empty
                      muted={muted}
                      text="No projects yet"
                      action="Create project"
                      onClick={() => navigateTo('/create-project')}
                      btnGhost={btnGhost}
                    />
                  ) : null}
                </ul>
              </section>

              {/* Profile settings + completion */}
              <section className={`${card} p-5 lg:col-span-2`}>
                <div className="mb-3 flex items-center gap-2">
                  <User className={`h-4 w-4 ${muted}`} />
                  <h2 className={`text-[17px] font-semibold ${ink}`}>Profile Settings</h2>
                </div>
                <div className="flex items-center gap-4">
                  <DonutProgress
                    percent={stats.profileComplete}
                    color={dark ? '#a78bfa' : '#7c3aed'}
                    track={dark ? '#fff' : '#1d1d1f'}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {stats.profileHints.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 text-left text-[12px]"
                        onClick={() => navigateTo(h.href)}
                      >
                        <span className={h.done ? soft : muted}>{h.label}</span>
                        <span className={h.done ? 'text-emerald-500' : muted}>
                          {h.done ? 'Done' : 'Add'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`mt-4 w-full rounded-full border px-4 py-2.5 text-[13px] font-semibold ${btnGhost}`}
                  onClick={() => navigateTo('/settings')}
                >
                  Open settings
                </button>
              </section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {/* Quotes received */}
              <section className={`${card} p-5`}>
                <h2 className={`mb-3 text-[17px] font-semibold ${ink}`}>Quotes Received</h2>
                <ul className="space-y-2">
                  {stats.quotes.slice(0, 6).map((q) => {
                    const pro = q.professional
                    const photo = pro?.profile_photo || pro?.avatar_url
                    return (
                      <li
                        key={q.id}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${dark ? 'bg-white/[0.03]' : 'bg-[#fafafa]'}`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8e8ed]">
                          {photo ? (
                            <img src={photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-[#86868b]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[13px] font-semibold ${ink}`}>
                            {pro?.full_name || 'Professional'}
                          </p>
                          <p className={`truncate text-[11px] ${muted}`}>
                            {q.listing?.title || 'Project'} · {q.status}
                          </p>
                        </div>
                        <p className={`shrink-0 text-[13px] font-semibold tabular-nums ${ink}`}>
                          {formatEuro(Number(q.total) || 0)}
                        </p>
                      </li>
                    )
                  })}
                  {stats.quotes.length === 0 ? (
                    <Empty muted={muted} text="No quotes yet — publish a project to get offers" />
                  ) : null}
                </ul>
              </section>

              {/* Invoices */}
              <section className={`${card} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className={`text-[17px] font-semibold ${ink}`}>Invoices</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${chip}`}>
                    {formatEuro(stats.invoiceTotal)}
                  </span>
                </div>
                <ul className="space-y-2">
                  {stats.invoices.slice(0, 6).map((inv) => (
                    <li
                      key={inv.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ${hoverRow}`}
                    >
                      <div className="min-w-0">
                        <p className={`truncate text-[13px] font-semibold ${ink}`}>
                          Invoice · {inv.professional?.full_name || 'Pro'}
                        </p>
                        <p className={`text-[11px] capitalize ${muted}`}>
                          {inv.status} · {relativeTime(inv.updated_at || inv.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`text-[13px] font-semibold tabular-nums ${ink}`}>
                          {formatEuro(Number(inv.total) || 0)}
                        </span>
                        {inv.pdf_url ? (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${btnGhost}`}
                          >
                            PDF
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                  {stats.invoices.length === 0 ? (
                    <Empty muted={muted} text="No invoices yet" />
                  ) : null}
                </ul>
              </section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              {/* Favorite professionals */}
              <section className={`${card} p-5 lg:col-span-3`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className={`h-4 w-4 ${muted}`} />
                    <h2 className={`text-[17px] font-semibold ${ink}`}>Favorite Professionals</h2>
                  </div>
                  <button
                    type="button"
                    className={`text-[12px] font-semibold ${muted}`}
                    onClick={() => navigateTo('/favorites')}
                  >
                    Manage
                  </button>
                </div>
                {stats.favoritePros.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.favoritePros.slice(0, 6).map((f) => {
                      const p = f.profile
                      if (!p) return null
                      const photo = p.profile_photo || p.avatar_url
                      return (
                        <button
                          key={f.savedId}
                          type="button"
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                            dark ? 'border-white/10 hover:bg-white/5' : 'border-[#f0f0f2] hover:bg-[#fafafa]'
                          }`}
                          onClick={() => navigateTo(`/professional/${p.id}`)}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8e8ed]">
                            {photo ? (
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-[#86868b]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-[14px] font-semibold ${ink}`}>
                              {p.full_name || 'Professional'}
                            </p>
                            <p className={`truncate text-[12px] ${muted}`}>
                              ★ {(p.rating ?? 0).toFixed(1)} · {p.location || 'EU'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <Empty
                    muted={muted}
                    text="Save professionals you like"
                    action="Browse"
                    onClick={() => navigateTo('/professionals')}
                    btnGhost={btnGhost}
                  />
                )}
              </section>

              {/* Notifications + Messages shortcut */}
              <section className={`${card} p-5 lg:col-span-2`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`h-4 w-4 ${muted}`} />
                    <h2 className={`text-[17px] font-semibold ${ink}`}>Notifications</h2>
                    {stats.unreadNotifications > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {stats.unreadNotifications}
                      </span>
                    ) : null}
                  </div>
                  {stats.unreadNotifications > 0 ? (
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
                <ul className="max-h-[320px] space-y-2 overflow-auto">
                  {stats.notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`w-full rounded-2xl px-3 py-2.5 text-left transition ${
                          n.is_read
                            ? 'opacity-65'
                            : dark
                              ? 'bg-violet-500/15'
                              : 'bg-violet-50'
                        } ${hoverRow}`}
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
                    <Empty muted={muted} text="You're all caught up" />
                  ) : null}
                </ul>
                <button
                  type="button"
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold ${btnGhost}`}
                  onClick={() => navigateTo('/messages')}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Open messages
                  {stats.unreadMessages > 0 ? ` (${stats.unreadMessages})` : ''}
                </button>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({
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
      <div className={`mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] ${muted}`}>
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

function Empty({
  muted,
  text,
  action,
  onClick,
  btnGhost,
}: {
  muted: string
  text: string
  action?: string
  onClick?: () => void
  btnGhost?: string
}) {
  return (
    <div className="px-2 py-8 text-center">
      <p className={`text-[13px] ${muted}`}>{text}</p>
      {action && onClick && btnGhost ? (
        <button
          type="button"
          className={`mt-3 rounded-full border px-4 py-2 text-[12px] font-semibold ${btnGhost}`}
          onClick={onClick}
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}
