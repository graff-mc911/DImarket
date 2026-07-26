import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  FileText,
  FolderKanban,
  MessageSquare,
  Receipt,
  Star,
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
import { AreaSparkline, BarChart } from '../components/pro-dashboard/Charts'
import { VerificationBadge } from '../components/MatchScoreBadge'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { PaginatedList } from '../components/dashboard/PaginatedList'
import {
  ProjectProgressBar,
  ProjectStatusBadge,
} from '../components/dashboard/ProjectStatusBadge'
import { useDashboardSection } from '../hooks/useDashboardSection'
import { mapListingLifecycle } from '../lib/dashboard/projectStatus'
import { loadDashboardTheme, saveDashboardTheme, dashboardTone } from '../lib/dashboard/theme'

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
  projectStatusCounts: {
    draft: 0,
    published: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  },
  completionRate: 0,
  quotes: [],
  quotesPending: 0,
  invoices: [],
  invoiceTotal: 0,
  payments: [],
  paymentTotal: 0,
  unreadMessages: 0,
  favoritePros: [],
  reviewsGiven: 0,
  notifications: [],
  unreadNotifications: 0,
  projectsByDay: [0, 0, 0, 0, 0, 0, 0],
  quotesByDay: [0, 0, 0, 0, 0, 0, 0],
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  profileComplete: 0,
  profileHints: [],
}

/** Customer Dashboard — /customer/dashboard */
export function CustomerDashboard() {
  const { user, profile, t } = useApp()
  const [stats, setStats] = useState<CustomerDashboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [dark, setDark] = useState(() => loadDashboardTheme(CUSTOMER_DASH_THEME_KEY))
  const [filter, setFilter] = useState('')
  const { section, setSection } = useDashboardSection('customer', '/customer/dashboard')
  const tone = dashboardTone(dark)

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
    saveDashboardTheme(dark)
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

  const filteredProjects = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return stats.projects
    return stats.projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.city_name || '').toLowerCase().includes(q),
    )
  }, [stats.projects, filter])

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

  const name = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <DashboardShell
      role="customer"
      title={t('customerDash.title' as never) || 'Your dashboard'}
      subtitle={`Welcome back, ${name}. Manage projects, quotes, and favorites.`}
      section={section}
      onSectionChange={setSection}
      dark={dark}
      onToggleDark={() => setDark((d) => !d)}
      live={live}
      badges={{
        messages: stats.unreadMessages,
        notifications: stats.unreadNotifications,
        projects: stats.activeProjects,
      }}
      onSearch={setFilter}
      actions={
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}
          onClick={() => navigateTo('/create-project')}
        >
          New project
        </button>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {section === 'overview' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi card={tone.card} ink={tone.ink} muted={tone.muted} icon={<FolderKanban className="h-4 w-4" />} label="My projects" value={String(stats.projects.length)} hint={`${stats.activeProjects} active`} onClick={() => setSection('projects')} />
                <Kpi card={tone.card} ink={tone.ink} muted={tone.muted} icon={<FileText className="h-4 w-4" />} label="Quotes" value={String(stats.quotes.length)} hint={`${stats.quotesPending} pending`} />
                <Kpi card={tone.card} ink={tone.ink} muted={tone.muted} icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={String(stats.unreadMessages)} hint="Unread" onClick={() => navigateTo('/messages')} />
                <Kpi card={tone.card} ink={tone.ink} muted={tone.muted} icon={<Receipt className="h-4 w-4" />} label="Invoices" value={formatEuro(stats.invoiceTotal)} hint={`${stats.invoices.length} documents`} onClick={() => setSection('invoices')} />
              </div>

              <div className={`${tone.card} p-5 md:p-6`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${tone.muted}`}>Statistics</p>
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Activity · last 7 days</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className={`mb-2 text-[13px] font-medium ${tone.soft}`}>Projects published</p>
                    <BarChart values={stats.projectsByDay} labels={stats.dayLabels} color={dark ? '#a78bfa' : '#7c3aed'} />
                  </div>
                  <div>
                    <p className={`mb-2 text-[13px] font-medium ${tone.soft}`}>Quotes received</p>
                    <AreaSparkline values={stats.quotesByDay} color={dark ? '#34d399' : '#059669'} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniStat tone={tone} label="Completion rate" value={`${stats.completionRate}%`} />
                  <MiniStat tone={tone} label="Payments" value={formatEuro(stats.paymentTotal)} />
                  <MiniStat tone={tone} label="Reviews given" value={String(stats.reviewsGiven)} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className={`${tone.card} p-5`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className={`text-[16px] font-semibold ${tone.ink}`}>Recent projects</h2>
                    <button type="button" className={`text-[12px] font-semibold ${tone.muted}`} onClick={() => setSection('projects')}>
                      View all
                    </button>
                  </div>
                  <ProjectList projects={stats.projects.slice(0, 5)} tone={tone} />
                </section>
                <section className={`${tone.card} p-5`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className={`text-[16px] font-semibold ${tone.ink}`}>Notifications</h2>
                    <button
                      type="button"
                      className={`text-[12px] font-semibold ${tone.muted}`}
                      onClick={() => void markAllNotificationsRead(user.id).then(refresh)}
                    >
                      Mark all read
                    </button>
                  </div>
                  <NotifList
                    items={stats.notifications.slice(0, 6)}
                    tone={tone}
                    onRead={(id) => void markNotificationRead(id).then(refresh)}
                  />
                </section>
              </div>
            </div>
          )}

          {section === 'projects' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className={`text-[18px] font-semibold ${tone.ink}`}>My Projects</h2>
                  <p className={`text-[13px] ${tone.muted}`}>Draft · Published · In Progress · Completed · Cancelled</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.projectStatusCounts).map(([k, v]) => (
                    <span key={k} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone.chip}`}>
                      {k.replace('_', ' ')}: {v}
                    </span>
                  ))}
                </div>
              </div>
              <PaginatedList
                items={filteredProjects}
                pageSize={8}
                getKey={(p) => p.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No projects yet. Create your first one.</p>}
                renderItem={(p) => {
                  const life = mapListingLifecycle(p)
                  return (
                    <button
                      type="button"
                      className={`w-full rounded-2xl px-3 py-3 text-left transition ${tone.hoverRow}`}
                      onClick={() => navigateTo(`/project/${p.id}/matches`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`truncate text-[14px] font-semibold ${tone.ink}`}>{p.title}</p>
                          <p className={`truncate text-[12px] ${tone.muted}`}>
                            {p.city_name || p.location}
                            {p.budget_max != null ? ` · €${p.budget_max}` : ''}
                          </p>
                        </div>
                        <ProjectStatusBadge status={life} />
                      </div>
                      <ProjectProgressBar status={life} />
                    </button>
                  )
                }}
              />
            </section>
          )}

          {section === 'saved' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Saved Professionals</h2>
              <PaginatedList
                items={stats.favoritePros}
                getKey={(f) => f.savedId}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No saved professionals yet.</p>}
                renderItem={(f) => {
                  const p = f.profile
                  if (!p) return null
                  return (
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${tone.hoverRow}`}
                      onClick={() => navigateTo(`/professional/${p.id}`)}
                    >
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f7]">
                        {p.profile_photo || p.avatar_url ? (
                          <img src={p.profile_photo || p.avatar_url || ''} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-[12px] font-bold">{(p.full_name || '?')[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`truncate text-[14px] font-semibold ${tone.ink}`}>{p.full_name}</p>
                          <VerificationBadge level={p.verification_level} />
                        </div>
                        <p className={`text-[12px] ${tone.muted}`}>
                          {(p.rating ?? 0).toFixed(1)}★ · {p.location || '—'}
                        </p>
                      </div>
                    </button>
                  )
                }}
              />
            </section>
          )}

          {section === 'reviews' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Reviews</h2>
              <p className={`mt-1 text-[14px] ${tone.muted}`}>
                You have left {stats.reviewsGiven} review{stats.reviewsGiven === 1 ? '' : 's'}.
              </p>
              <button
                type="button"
                className={`mt-4 rounded-full border px-4 py-2 text-[13px] font-semibold ${tone.btnGhost}`}
                onClick={() => navigateTo('/my-projects')}
              >
                <Star className="mr-1 inline h-3.5 w-3.5" />
                Review completed projects
              </button>
            </section>
          )}

          {section === 'invoices' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-1 text-[18px] font-semibold ${tone.ink}`}>Invoices</h2>
              <p className={`mb-4 text-[13px] ${tone.muted}`}>Total {formatEuro(stats.invoiceTotal)}</p>
              <PaginatedList
                items={stats.invoices}
                getKey={(q) => q.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No invoices yet.</p>}
                renderItem={(q) => (
                  <div className={`rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[14px] font-semibold ${tone.ink}`}>
                        {q.listing?.title || 'Project quote'}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tone.chip}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className={`text-[12px] ${tone.muted}`}>
                      {q.professional?.full_name || 'Professional'} · {formatEuro(Number(q.total) || 0)}
                    </p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'payments' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-1 text-[18px] font-semibold ${tone.ink}`}>Payments</h2>
              <p className={`mb-4 text-[13px] ${tone.muted}`}>
                Accepted quotes · {formatEuro(stats.paymentTotal)}
              </p>
              <PaginatedList
                items={stats.payments}
                getKey={(q) => q.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No payments yet.</p>}
                renderItem={(q) => (
                  <div className={`flex items-center justify-between rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <div>
                      <p className={`text-[14px] font-semibold ${tone.ink}`}>{q.listing?.title || 'Payment'}</p>
                      <p className={`text-[12px] ${tone.muted}`}>{relativeTime(q.updated_at || q.created_at)}</p>
                    </div>
                    <p className={`text-[14px] font-semibold ${tone.ink}`}>{formatEuro(Number(q.total) || 0)}</p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'notifications' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Notifications</h2>
                <button
                  type="button"
                  className={`text-[12px] font-semibold ${tone.muted}`}
                  onClick={() => void markAllNotificationsRead(user.id).then(refresh)}
                >
                  Mark all read
                </button>
              </div>
              <NotifList
                items={stats.notifications}
                tone={tone}
                onRead={(id) => void markNotificationRead(id).then(refresh)}
              />
            </section>
          )}
        </>
      )}
    </DashboardShell>
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
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${card} p-4 text-left transition ${onClick ? 'hover:shadow-md' : ''}`}
    >
      <div className={`mb-2 flex items-center gap-2 text-[12px] font-semibold ${muted}`}>
        {icon}
        {label}
      </div>
      <p className={`text-[26px] font-semibold tracking-tight ${ink}`}>{value}</p>
      <p className={`mt-1 text-[12px] ${muted}`}>{hint}</p>
    </Comp>
  )
}

function MiniStat({
  tone,
  label,
  value,
}: {
  tone: ReturnType<typeof dashboardTone>
  label: string
  value: string
}) {
  return (
    <div className={`rounded-2xl px-3 py-3 ${tone.dark ? 'bg-white/5' : 'bg-[#f5f5f7]'}`}>
      <p className={`text-[11px] font-semibold uppercase ${tone.muted}`}>{label}</p>
      <p className={`mt-1 text-[18px] font-semibold ${tone.ink}`}>{value}</p>
    </div>
  )
}

function ProjectList({
  projects,
  tone,
}: {
  projects: CustomerDashboardStats['projects']
  tone: ReturnType<typeof dashboardTone>
}) {
  if (!projects.length) {
    return <p className={`py-6 text-center text-[13px] ${tone.muted}`}>No projects yet</p>
  }
  return (
    <ul className="space-y-2">
      {projects.map((p) => {
        const life = mapListingLifecycle(p)
        return (
          <li key={p.id}>
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left ${tone.hoverRow}`}
              onClick={() => navigateTo(`/project/${p.id}/matches`)}
            >
              <div className="min-w-0">
                <p className={`truncate text-[14px] font-semibold ${tone.ink}`}>{p.title}</p>
                <p className={`truncate text-[12px] ${tone.muted}`}>{p.city_name || p.location}</p>
              </div>
              <ProjectStatusBadge status={life} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function NotifList({
  items,
  tone,
  onRead,
}: {
  items: CustomerDashboardStats['notifications']
  tone: ReturnType<typeof dashboardTone>
  onRead: (id: string) => void
}) {
  if (!items.length) {
    return (
      <p className={`flex items-center justify-center gap-2 py-8 text-[13px] ${tone.muted}`}>
        <Bell className="h-4 w-4" /> No notifications
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            className={`w-full rounded-2xl px-3 py-3 text-left ${tone.hoverRow} ${n.is_read ? 'opacity-70' : ''}`}
            onClick={() => {
              if (!n.is_read) onRead(n.id)
              if (n.link_path) navigateTo(n.link_path)
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`text-[13px] font-semibold ${tone.ink}`}>{n.title}</p>
              {!n.is_read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" /> : null}
            </div>
            {n.body ? <p className={`mt-0.5 line-clamp-2 text-[12px] ${tone.muted}`}>{n.body}</p> : null}
            <p className={`mt-1 text-[11px] ${tone.muted}`}>{relativeTime(n.created_at)}</p>
          </button>
        </li>
      ))}
    </ul>
  )
}
