import { useCallback, useEffect, useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Building2,
  FileText,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import {
  COMPANY_DASH_THEME_KEY,
  fetchCompanyDashboardStats,
  upsertCompanyWorkspace,
  type CompanyDashboardStats,
  type CompanyEmployee,
  type CompanyBranch,
  type CompanyDocument,
} from '../lib/companyDashboard'
import { AreaSparkline, BarChart } from '../components/pro-dashboard/Charts'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { PaginatedList } from '../components/dashboard/PaginatedList'
import { useDashboardSection } from '../hooks/useDashboardSection'
import { loadDashboardTheme, saveDashboardTheme, dashboardTone } from '../lib/dashboard/theme'

function formatEuro(n: number): string {
  return `€${Math.round(n).toLocaleString()}`
}

const EMPTY: CompanyDashboardStats = {
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
  workspace: {
    employees: [],
    branches: [],
    documents: [],
    certificates: [],
    services: [],
  },
  companyName: 'Company',
}

/** Company Dashboard — /company/dashboard */
export function CompanyDashboard() {
  const { user, profile } = useApp()
  const [stats, setStats] = useState<CompanyDashboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [dark, setDark] = useState(() => loadDashboardTheme(COMPANY_DASH_THEME_KEY))
  const { section, setSection } = useDashboardSection('company', '/company/dashboard')
  const tone = dashboardTone(dark)

  const isCompany = profile?.user_role === 'company' || Boolean(profile?.is_professional)

  const refresh = useCallback(async () => {
    if (!user) return
    const data = await fetchCompanyDashboardStats(user.id, profile)
    setStats(data)
    setLoading(false)
  }, [user, profile])

  useEffect(() => {
    if (!user || !isCompany) return
    setLoading(true)
    void refresh()
  }, [user, isCompany, refresh])

  useEffect(() => {
    saveDashboardTheme(dark)
    try {
      localStorage.setItem(COMPANY_DASH_THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  useEffect(() => {
    if (!user || !isCompany) return
    let timer: number | null = null
    const bump = () => {
      setLive(true)
      window.setTimeout(() => setLive(false), 1500)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => void refresh(), 450)
    }
    const channel = supabase
      .channel(`company-dash:${user.id}`)
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
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        bump,
      )
      .subscribe()
    return () => {
      if (timer) window.clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [user, isCompany, refresh])

  const addEmployee = async () => {
    const name = window.prompt('Employee name')
    if (!name?.trim() || !user) return
    const role = window.prompt('Role (e.g. Project manager)') || 'Team member'
    const next: CompanyEmployee[] = [
      ...stats.workspace.employees,
      { id: crypto.randomUUID(), name: name.trim(), role: role.trim() },
    ]
    await upsertCompanyWorkspace(user.id, { employees: next })
    void refresh()
  }

  const addBranch = async () => {
    const name = window.prompt('Branch name')
    if (!name?.trim() || !user) return
    const city = window.prompt('City') || profile?.location || ''
    const next: CompanyBranch[] = [
      ...stats.workspace.branches,
      { id: crypto.randomUUID(), name: name.trim(), city: city.trim() },
    ]
    await upsertCompanyWorkspace(user.id, { branches: next })
    void refresh()
  }

  const addDoc = async (kind: 'document' | 'certificate') => {
    const title = window.prompt(kind === 'certificate' ? 'Certificate title' : 'Document title')
    if (!title?.trim() || !user) return
    const item: CompanyDocument = {
      id: crypto.randomUUID(),
      title: title.trim(),
      kind,
      issuedAt: new Date().toISOString().slice(0, 10),
    }
    if (kind === 'certificate') {
      await upsertCompanyWorkspace(user.id, {
        certificates: [...stats.workspace.certificates, item],
      })
    } else {
      await upsertCompanyWorkspace(user.id, {
        documents: [...stats.workspace.documents, item],
      })
    }
    void refresh()
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Company Dashboard</h1>
        <p className="mt-2 text-[#86868b]">Sign in with a company account.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  if (profile?.user_role !== 'company' && !profile?.is_site_owner) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Company accounts only</h1>
        <p className="mt-2 text-[#86868b]">Register as a company to access this dashboard.</p>
        <button type="button" className="btn-secondary mt-6" onClick={() => navigateTo('/for-companies')}>
          For companies
        </button>
        <button type="button" className="btn-primary mt-3" onClick={() => navigateTo('/pro/dashboard')}>
          Open pro dashboard
        </button>
      </div>
    )
  }

  const ws = stats.workspace

  return (
    <DashboardShell
      role="company"
      title={stats.companyName}
      subtitle="Company workspace · team, branches, projects & analytics"
      section={section}
      onSectionChange={setSection}
      dark={dark}
      onToggleDark={() => setDark((d) => !d)}
      live={live}
      badges={{
        messages: stats.unreadMessages,
        notifications: stats.unreadNotifications,
        leads: stats.leadStatusCounts.new,
        projects: stats.acceptedProjects.length,
      }}
      actions={
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}
          onClick={() => navigateTo('/leads')}
        >
          Browse leads
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
                <Card tone={tone} icon={<Users className="h-4 w-4" />} label="Employees" value={String(ws.employees.length)} onClick={() => setSection('employees')} />
                <Card tone={tone} icon={<Briefcase className="h-4 w-4" />} label="Projects" value={String(stats.acceptedProjects.length)} onClick={() => setSection('projects')} />
                <Card tone={tone} icon={<MapPin className="h-4 w-4" />} label="Branches" value={String(ws.branches.length)} onClick={() => setSection('branches')} />
                <Card tone={tone} icon={<Building2 className="h-4 w-4" />} label="Revenue" value={formatEuro(stats.revenue)} />
              </div>
              <div className={`${tone.card} p-5`}>
                <h2 className={`text-[16px] font-semibold ${tone.ink}`}>Analytics</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <BarChart values={stats.leadsByDay} labels={stats.dayLabels} color="#2563eb" />
                  <AreaSparkline values={stats.revenueByDay} color="#059669" />
                </div>
              </div>
            </div>
          )}

          {section === 'profile' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Company Profile</h2>
              <dl className="mt-4 space-y-3 text-[14px]">
                <Row tone={tone} label="Name" value={stats.companyName} />
                <Row tone={tone} label="Location" value={profile?.location || '—'} />
                <Row tone={tone} label="Rating" value={`${(stats.rating || 0).toFixed(1)}★ (${stats.totalReviews})`} />
                <Row tone={tone} label="Profile complete" value={`${stats.profileCompletion}%`} />
              </dl>
              <button
                type="button"
                className={`mt-4 rounded-full border px-4 py-2 text-[13px] font-semibold ${tone.btnGhost}`}
                onClick={() => navigateTo('/settings')}
              >
                Edit profile
              </button>
            </section>
          )}

          {section === 'employees' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Employees</h2>
                <button type="button" onClick={() => void addEmployee()} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <PaginatedList
                items={ws.employees}
                getKey={(e) => e.id}
                empty={<p className={`py-8 text-center text-[14px] ${tone.muted}`}>No employees yet.</p>}
                renderItem={(e) => (
                  <div className={`flex items-center justify-between rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <div>
                      <p className={`text-[14px] font-semibold ${tone.ink}`}>{e.name}</p>
                      <p className={`text-[12px] ${tone.muted}`}>{e.role}</p>
                    </div>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'projects' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Projects</h2>
              <PaginatedList
                items={stats.acceptedProjects}
                getKey={(p) => p.id}
                empty={<p className={`py-8 text-center text-[14px] ${tone.muted}`}>No active company projects.</p>}
                renderItem={(p) => (
                  <button
                    type="button"
                    className={`w-full rounded-2xl px-3 py-3 text-left ${tone.hoverRow}`}
                    onClick={() => navigateTo(`/leads/${p.id}/quote`)}
                  >
                    <p className={`text-[14px] font-semibold ${tone.ink}`}>{p.listing?.title || 'Project'}</p>
                    <p className={`text-[12px] ${tone.muted}`}>{p.listing?.city_name || '—'}</p>
                  </button>
                )}
              />
            </section>
          )}

          {section === 'services' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Services</h2>
                <button type="button" className={`text-[12px] font-semibold ${tone.muted}`} onClick={() => navigateTo('/settings')}>
                  Manage categories
                </button>
              </div>
              {ws.services.length ? (
                <ul className="flex flex-wrap gap-2">
                  {ws.services.map((s) => (
                    <li key={s} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${tone.chip}`}>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`py-8 text-center text-[14px] ${tone.muted}`}>Add service categories in your profile.</p>
              )}
            </section>
          )}

          {section === 'branches' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Branches</h2>
                <button type="button" onClick={() => void addBranch()} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <PaginatedList
                items={ws.branches}
                getKey={(b) => b.id}
                empty={<p className={`py-8 text-center text-[14px] ${tone.muted}`}>No branches yet.</p>}
                renderItem={(b) => (
                  <div className={`rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <p className={`text-[14px] font-semibold ${tone.ink}`}>{b.name}</p>
                    <p className={`text-[12px] ${tone.muted}`}>{b.city}{b.address ? ` · ${b.address}` : ''}</p>
                  </div>
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
                empty={<p className={`py-8 text-center text-[14px] ${tone.muted}`}>No reviews yet.</p>}
                renderItem={(r) => (
                  <div className={`rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <p className={`font-semibold ${tone.ink}`}>{r.rating}★ · {r.reviewer_name || 'Client'}</p>
                    <p className={`text-[13px] ${tone.soft}`}>{r.comment || '—'}</p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'documents' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Documents</h2>
                <button type="button" onClick={() => void addDoc('document')} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}>
                  <FileText className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <PaginatedList
                items={ws.documents}
                getKey={(d) => d.id}
                empty={<p className={`py-8 text-center text-[14px] ${tone.muted}`}>No documents yet.</p>}
                renderItem={(d) => (
                  <div className={`rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <p className={`font-semibold ${tone.ink}`}>{d.title}</p>
                    <p className={`text-[12px] ${tone.muted}`}>{d.issuedAt || ''}</p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'certificates' && (
            <section className={`${tone.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-[18px] font-semibold ${tone.ink}`}>Certificates</h2>
                <button type="button" onClick={() => void addDoc('certificate')} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold ${tone.btnPrimary}`}>
                  <BadgeCheck className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <PaginatedList
                items={ws.certificates}
                getKey={(d) => d.id}
                empty={<p className={`py-8 text-center text-[14px] ${tone.muted}`}>No certificates yet.</p>}
                renderItem={(d) => (
                  <div className={`rounded-2xl px-3 py-3 ${tone.hoverRow}`}>
                    <p className={`font-semibold ${tone.ink}`}>{d.title}</p>
                    <p className={`text-[12px] ${tone.muted}`}>{d.issuedAt || ''}</p>
                  </div>
                )}
              />
            </section>
          )}

          {section === 'analytics' && (
            <section className={`${tone.card} p-5`}>
              <h2 className={`mb-4 text-[18px] font-semibold ${tone.ink}`}>Analytics</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <BarChart values={stats.leadsByDay} labels={stats.dayLabels} color="#2563eb" />
                <AreaSparkline values={stats.revenueByDay} color="#059669" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Mini tone={tone} label="Revenue" value={formatEuro(stats.revenue)} />
                <Mini tone={tone} label="Leads (week)" value={String(stats.openLeads)} />
                <Mini tone={tone} label="Response" value={stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : '—'} />
              </div>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  )
}

function Card({
  tone,
  icon,
  label,
  value,
  onClick,
}: {
  tone: ReturnType<typeof dashboardTone>
  icon: React.ReactNode
  label: string
  value: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} className={`${tone.card} p-4 text-left`}>
      <div className={`mb-2 flex items-center gap-2 text-[12px] font-semibold ${tone.muted}`}>
        {icon}
        {label}
      </div>
      <p className={`text-[24px] font-semibold ${tone.ink}`}>{value}</p>
    </Comp>
  )
}

function Row({
  tone,
  label,
  value,
}: {
  tone: ReturnType<typeof dashboardTone>
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#f0f0f2] pb-2 last:border-0">
      <dt className={tone.muted}>{label}</dt>
      <dd className={`font-semibold ${tone.ink}`}>{value}</dd>
    </div>
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
