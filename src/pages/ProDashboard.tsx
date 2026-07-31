import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CalendarDays,
  FileText,
  MessageSquare,
  Star,
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
import { MatchScoreBadge } from '../components/MatchScoreBadge'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { PaginatedList } from '../components/dashboard/PaginatedList'
import { useDashboardSection } from '../hooks/useDashboardSection'
import { mapLeadLifecycle } from '../lib/dashboard/projectStatus'
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
  rating: 0,
  totalReviews: 0,
  recentReviews: [],
  profileCompletion: 0,
  profileSteps: [],
  applications: [],
  leads: [],
  leadStatusCounts: { new: 0, accepted: 0, rejected: 0, expired: 0 },
  avgResponseHours: null,
  acceptedProjects: [],
  quotes: [],
  invoices: [],
  notifications: [],
  unreadNotifications: 0,
  activity: [],
  leadsByDay: [0, 0, 0, 0, 0, 0, 0],
  revenueByDay: [0, 0, 0, 0, 0, 0, 0],
  calendarMarks: {},
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  availabilityStatus: 'available',
}

/** Professional Dashboard — /pro/dashboard */
export function ProDashboard() {
  const { user, profile, t } = useApp()
  const [stats, setStats] = useState<ProDashboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [dark, setDark] = useState(() => loadDashboardTheme(PRO_DASH_THEME_KEY))
  const [filter, setFilter] = useState('')
  const { section, setSection } = useDashboardSection('professional', '/pro/dashboard')
  const tone = dashboardTone(dark)

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
    saveDashboardTheme(dark)
    try {
      localStorage.setItem(PRO_DASH_THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  useEffect(() => {
    if (!user || !isPro) return
    let timer: number | null = null
    const bump = () => {
      setLive(true)
      window.setTimeout(() => setLive(false), 1600)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => void refresh(), 400)
    }

    const channel = supabase
      .channel(`pro-dash:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, bump)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, bump)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        bump,
      )
      .subscribe()

    return () => {
      if (timer) window.clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [user, isPro, refresh])

  const filteredLeads = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return stats.leads
    return stats.leads.filter(
      (l) =>
        (l.listing?.title || '').toLowerCase().includes(q) ||
        (l.listing?.city_name || '').toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q),
    )
  }, [stats.leads, filter])

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
        <button type="button" className="btn-secondary mt-6" onClick={() => navigateTo('/for-professionals')}>
          Learn more
        </button>
      </div>
    )
  }

  // Companies landing on /pro get redirected to company dashboard
  if (profile?.user_role === 'company' && window.location.pathname.startsWith('/pro')) {
    // soft suggest — still allow /pro for companies
  }

  const name = profile?.full_name?.split(' ')[0] || 'Pro'

  return (
    <DashboardShell
      role="professional"
      title={t('proDash.title' as never) || 'Professional Dashboard'}
      subtitle={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${name}`}
      section={section}
      onSectionChange={setSection}
      dark={dark}
      onToggleDark={() => setDark((d) => !d)}
      live={live}
      badges={{
        messages: stats.unreadMessages,
        notifications: stats.unreadNotifications,
        leads: stats.leadStatusCounts.new,
      }}
      onSearch={setFilter}
      actions={
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}
          onClick={() => navigateTo('/projects')}
        >
          Browse leads
        </button>
      }
    >
      {loading ? (
        <DashboardSkeleton cards={5} />
      ) : (
        <>
          {section === 'overview' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Kpi tone={tone} icon={<Briefcase className="h-4 w-4" />} label="Today's leads" value={String(stats.todaysLeads)} hint={`${stats.openLeads} open this week`} onClick={() => setSection('leads')} />
                <Kpi tone={tone} icon={<Wallet className="h-4 w-4" />} label="Revenue" value={formatEuro(stats.revenue)} hint={`${formatEuro(stats.pipeline)} pipeline`} />
                <Kpi tone={tone} icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={String(stats.unreadMessages)} hint="Unread" onClick={() => navigateTo('/messages')} />
                <Kpi tone={tone} icon={<FileText className="h-4 w-4" />} label="Quotes" value={String(stats.quotesTotal)} hint={`${stats.quotesAccepted} accepted`} />
                <Kpi tone={tone} icon={<Star className="h-4 w-4" />} label="Reviews" value={(stats.rating || 0).toFixed(1)} hint={`${stats.totalReviews} total`} onClick={() => setSection('reviews')} />
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <section className={`${tone.card} p-5 lg:col-span-3`}>
                  <h2 className={`text-[16px] font-semibold ${tone.ink}`}>Statistics</h2>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className={`mb-2 text-[13px] ${tone.soft}`}>Leads · 7 days</p>
                      <BarChart values={stats.leadsByDay} labels={stats.dayLabels} color={dark ? '#60a5fa' : '#2563eb'} />
                    </div>
                    <div>
                      <p className={`mb-2 text-[13px] ${tone.soft}`}>Revenue · 7 days</p>
                      <AreaSparkline values={stats.revenueByDay} color={dark ? '#34d399' : '#059669'} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Mini tone={tone} label="Response time" value={stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : '—'} />
                    <Mini tone={tone} label="New leads" value={String(stats.leadStatusCounts.new)} />
                    <Mini tone={tone} label="Accepted" value={String(stats.leadStatusCounts.accepted)} />
                  </div>
                </section>
                <section className={`${tone.card} p-5 lg:col-span-2`}>
                  <h2 className={`mb-3 text-[16px] font-semibold ${tone.ink}`}>Profile</h2>
                  <DonutProgress value={stats.profileCompletion} label="Complete" />
                  <ul className="mt-4 space-y-2">
                    {stats.profileSteps.map((s) => (
                      <li key={s.id} className={`flex items-center justify-between text-[13px] ${tone.soft}`}>
                        <span>{s.label}</span>
                        <span className={s.done ? 'text-emerald-500' : tone.muted}>{s.done ? 'Done' : 'Todo'}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className={`${tone.card} p-5`}>
                  <div className="mb-3 flex justify-between">
                    <h2 className={`text-[16px] font-semibold ${tone.ink}`}>Activity</h2>
                    <button type="button" className={`text-[12px] font-semibold ${tone.muted}`} onClick={() => setSection('notifications')}>
                      Notifications
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {stats.activity.slice(0, 8).map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          className={`w-full rounded-2xl px-3 py-2.5 text-left ${tone.hoverRow}`}
                          onClick={() => a.href && navigateTo(a.href)}
                        >
                          <p className={`text-[13px] font-semibold ${tone.ink}`}>{a.title}</p>
                          <p className={`text-[12px] ${tone.muted}`}>
                            {a.subtitle ? `${a.subtitle} · ` : ''}
                            {relativeTime(a.at)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className={`${tone.card} p-5`}>
                  <h2 className={`mb-3 text-[16px] font-semibold ${tone.ink}`}>Calendar</h2>
                  <MiniCalendar marks={stats.calendarMarks} />
                  <button
                    type="button"
                    className={`mt-3 w-full rounded-full border px-4 py-2 text-[13px] font-semibold ${tone.btnGhost}`}
                    onClick={() => navigateTo('/pro/calendar')}
                  >
                    <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                    Open calendar
                  </button>
                </section>
              </div>
            </div>
          )}

          {section === 'leads' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className={`text-[18px] font-semibold ${tone.ink}`}>My Leads</h2>
                  <p className={`text-[13px] ${tone.muted}`}>New · Accepted · Rejected · Expired · AI Match Score</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.leadStatusCounts).map(([k, v]) => (
                    <span key={k} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone.chip}`}>
                      {k}: {v}
                    </span>
                  ))}
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.chip}`}>
                    Avg response: {stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : '—'}
                  </span>
                </div>
              </div>
              <PaginatedList
                items={filteredLeads}
                getKey={(l) => l.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No leads yet. Browse the project feed.</p>}
                renderItem={(l) => {
                  const life = mapLeadLifecycle({
                    status: l.status,
                    hidden: l.hidden,
                    listingStatus: l.listing?.status,
                    createdAt: l.created_at,
                  })
                  return (
                    <button
                      type="button"
                      className={`flex w-full flex-wrap items-center gap-3 rounded-2xl px-3 py-3 text-left ${tone.hoverRow}`}
                      onClick={() =>
                        navigateTo(l.status === 'applied' || l.status === 'accepted' ? `/leads/${l.id}/quote` : '/projects')
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[14px] font-semibold ${tone.ink}`}>
                          {l.listing?.title || 'Project lead'}
                        </p>
                        <p className={`text-[12px] ${tone.muted}`}>
                          {l.listing?.city_name || '—'} · {relativeTime(l.created_at)}
                        </p>
                      </div>
                      {l.matchScore != null ? <MatchScoreBadge score={l.matchScore} /> : null}
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone.chip}`}>
                        {life}
                      </span>
                    </button>
                  )
                }}
              />
            </section>
          )}

          {section === 'projects' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Accepted Projects</h2>
              <PaginatedList
                items={stats.acceptedProjects}
                getKey={(l) => l.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No accepted projects yet.</p>}
                renderItem={(l) => (
                  <button
                    type="button"
                    className={`w-full rounded-2xl px-3 py-3 text-left ${tone.hoverRow}`}
                    onClick={() => navigateTo(`/leads/${l.id}/quote`)}
                  >
                    <p className={`text-[14px] font-semibold ${tone.ink}`}>{l.listing?.title || 'Project'}</p>
                    <p className={`text-[12px] ${tone.muted}`}>{l.listing?.city_name || '—'}</p>
                  </button>
                )}
              />
            </section>
          )}

          {section === 'reviews' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Reviews</h2>
              <PaginatedList
                items={stats.recentReviews}
                getKey={(r) => r.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No reviews yet.</p>}
                renderItem={(r) => (
                  <div className={`rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <p className={`text-[14px] font-semibold ${tone.ink}`}>
                      {r.rating}★ · {r.reviewer_name || 'Client'}
                    </p>
                    <p className={`text-[13px] ${tone.soft}`}>{r.comment || 'No comment'}</p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'invoices' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Invoices</h2>
              <PaginatedList
                items={stats.invoices}
                getKey={(q) => q.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No invoices yet.</p>}
                renderItem={(q) => (
                  <div className={`flex items-center justify-between rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <div>
                      <p className={`text-[14px] font-semibold capitalize ${tone.ink}`}>Quote {q.status}</p>
                      <p className={`text-[12px] ${tone.muted}`}>{relativeTime(q.updated_at || q.created_at)}</p>
                    </div>
                    <p className={`font-semibold ${tone.ink}`}>{formatEuro(Number(q.total) || 0)}</p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'statistics' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Statistics</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <BarChart values={stats.leadsByDay} labels={stats.dayLabels} color="#2563eb" />
                <AreaSparkline values={stats.revenueByDay} color="#059669" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Mini tone={tone} label="Revenue" value={formatEuro(stats.revenue)} />
                <Mini tone={tone} label="Pipeline" value={formatEuro(stats.pipeline)} />
                <Mini tone={tone} label="Response" value={stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : '—'} />
                <Mini tone={tone} label="Rating" value={(stats.rating || 0).toFixed(1)} />
              </div>
            </section>
          )}

          {section === 'availability' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Availability</h2>
              <p className={`mt-2 text-[14px] ${tone.muted}`}>
                Current status:{' '}
                <span className={`font-semibold capitalize ${tone.ink}`}>{stats.availabilityStatus}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['available', 'busy', 'limited', 'unavailable'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-[13px] font-semibold capitalize ${
                      stats.availabilityStatus === s ? tone.btnPrimary : tone.btnGhost
                    }`}
                    onClick={() => {
                      void supabase
                        .from('profiles')
                        .update({ availability_status: s } as never)
                        .eq('id', user.id)
                        .then(() => refresh())
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`mt-4 rounded-full border px-4 py-2 text-[13px] font-semibold ${tone.btnGhost}`}
                onClick={() => navigateTo('/pro/calendar')}
              >
                Manage calendar
              </button>
            </section>
          )}

          {section === 'notifications' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Notifications</h2>
                <button
                  type="button"
                  className={`text-[12px] font-semibold ${tone.muted}`}
                  onClick={() => void markAllNotificationsRead(user.id).then(refresh)}
                >
                  Mark all read
                </button>
              </div>
              <PaginatedList
                items={stats.notifications}
                getKey={(n) => n.id}
                empty={<p className={`py-10 text-center text-[14px] ${tone.muted}`}>No notifications</p>}
                renderItem={(n) => (
                  <button
                    type="button"
                    className={`w-full rounded-2xl px-3 py-3 text-left ${tone.hoverRow}`}
                    onClick={() => {
                      if (!n.is_read) void markNotificationRead(n.id).then(refresh)
                      if (n.link_path) navigateTo(n.link_path)
                    }}
                  >
                    <p className={`text-[13px] font-semibold ${tone.ink}`}>{n.title}</p>
                    <p className={`text-[12px] ${tone.muted}`}>{relativeTime(n.created_at)}</p>
                  </button>
                )}
              />
            </section>
          )}
        </>
      )}
    </DashboardShell>
  )
}

function Kpi({
  tone,
  icon,
  label,
  value,
  hint,
  onClick,
}: {
  tone: ReturnType<typeof dashboardTone>
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} className={`${tone.card} p-4 text-left`}>
      <div className={`mb-2 flex items-center gap-2 text-[12px] font-semibold ${tone.muted}`}>
        {icon}
        {label}
      </div>
      <p className={`text-[24px] font-semibold tracking-tight ${tone.ink}`}>{value}</p>
      <p className={`mt-1 text-[12px] ${tone.muted}`}>{hint}</p>
    </Comp>
  )
}

function Mini({
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
      <p className={`mt-1 text-[16px] font-semibold ${tone.ink}`}>{value}</p>
    </div>
  )
}
