import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Loader2, Radio, RefreshCw } from 'lucide-react'
import {
  AreaSparkline,
  BarChart,
  ChartCard,
  DonutChart,
  FunnelChart,
  HorizontalBarList,
  MetricCard,
} from './Charts'
import { DateRangeFilter } from './DateRangeFilter'
import { ExportMenu } from './ExportMenu'
import {
  fetchAdminBundle,
  fetchCategoryBundle,
  fetchCompanyBundle,
  fetchCustomerBundle,
  fetchMapAnalyticsPoints,
  fetchProfessionalBundle,
  fetchSearchBundle,
  type AdminBundle,
  type CategoryBundle,
  type CompanyBundle,
  type CustomerBundle,
  type MapPoint,
  type ProfessionalBundle,
  type SearchBundle,
} from '../../lib/analytics/bundles'
import { formatEuro, formatHours } from '../../lib/analytics/analytics'
import {
  rangeFromPreset,
  sparseLabels,
  type DatePreset,
} from '../../lib/analytics/dateRange'
import { useAnalyticsRealtime } from '../../lib/analytics/useAnalyticsRealtime'

const AnalyticsMap = lazy(() =>
  import('./AnalyticsMap').then((m) => ({ default: m.AnalyticsMap })),
)

export type AnalyticsRole = 'professional' | 'customer' | 'company' | 'admin'

type HubTab =
  | 'overview'
  | 'search'
  | 'categories'
  | 'map'

const ROLE_TABS: Record<AnalyticsRole, { id: HubTab; label: string }[]> = {
  professional: [
    { id: 'overview', label: 'Overview' },
    { id: 'categories', label: 'Services' },
    { id: 'map', label: 'Map' },
  ],
  customer: [
    { id: 'overview', label: 'Overview' },
    { id: 'categories', label: 'Categories' },
  ],
  company: [
    { id: 'overview', label: 'Overview' },
    { id: 'search', label: 'Demand' },
    { id: 'map', label: 'Map' },
  ],
  admin: [
    { id: 'overview', label: 'Platform' },
    { id: 'search', label: 'Search' },
    { id: 'categories', label: 'Categories' },
    { id: 'map', label: 'Map' },
  ],
}

export function AnalyticsHub({
  role,
  userId,
  compact = false,
  showHeader = true,
}: {
  role: AnalyticsRole
  userId: string
  compact?: boolean
  showHeader?: boolean
}) {
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [tab, setTab] = useState<HubTab>('overview')
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(true)
  const [error, setError] = useState('')

  const [pro, setPro] = useState<ProfessionalBundle | null>(null)
  const [customer, setCustomer] = useState<CustomerBundle | null>(null)
  const [company, setCompany] = useState<CompanyBundle | null>(null)
  const [admin, setAdmin] = useState<AdminBundle | null>(null)
  const [search, setSearch] = useState<SearchBundle | null>(null)
  const [categories, setCategories] = useState<CategoryBundle | null>(null)
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])

  const range = useMemo(
    () => rangeFromPreset(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (role === 'professional') {
        setPro(await fetchProfessionalBundle(range))
      } else if (role === 'customer') {
        setCustomer(await fetchCustomerBundle(userId, range))
      } else if (role === 'company') {
        setCompany(await fetchCompanyBundle(userId, range))
      } else {
        setAdmin(await fetchAdminBundle(range))
      }

      if (tab === 'search' || role === 'admin' || role === 'company') {
        setSearch(await fetchSearchBundle(range))
      }
      if (tab === 'categories' || role === 'admin' || role === 'customer' || role === 'professional') {
        setCategories(await fetchCategoryBundle(range))
      }
      if (tab === 'map' || (!compact && (role === 'admin' || role === 'company' || role === 'professional'))) {
        setMapPoints(await fetchMapAnalyticsPoints(compact ? 80 : 220))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [role, userId, range, tab, compact])

  useEffect(() => {
    void load()
  }, [load])

  useAnalyticsRealtime(live, () => {
    void load()
  }, `analytics-${role}`)

  const tabs = ROLE_TABS[role]
  const exportKpis = useMemo(() => {
    if (role === 'professional' && pro) return pro.kpis as unknown as Record<string, unknown>
    if (role === 'customer' && customer) return customer.kpis as unknown as Record<string, unknown>
    if (role === 'company' && company) return company.kpis as unknown as Record<string, unknown>
    if (role === 'admin' && admin) return admin.kpis as unknown as Record<string, unknown>
    return {}
  }, [role, pro, customer, company, admin])

  const labels =
    role === 'professional'
      ? sparseLabels(pro?.series.labels || [])
      : role === 'customer'
        ? sparseLabels(customer?.labels || [])
        : role === 'company'
          ? sparseLabels(company?.labels || [])
          : sparseLabels(admin?.labels || [])

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'} id="analytics-print-root">
      {showHeader ? (
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
              <BarChart3 className="h-4 w-4" />
              Analytics
              {live ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#1b5e20]">
                  <Radio className="h-3 w-3" />
                  Live
                </span>
              ) : null}
            </p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[32px]">
              {role === 'admin'
                ? 'Platform analytics'
                : role === 'company'
                  ? 'Company analytics'
                  : role === 'customer'
                    ? 'Your project analytics'
                    : 'Professional analytics'}
            </h1>
            <p className="mt-1 text-[14px] text-[#6e6e73]">
              KPIs · charts · search · categories · map · export · {range.label}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <DateRangeFilter
              preset={preset}
              customFrom={customFrom}
              customTo={customTo}
              onPreset={setPreset}
              onCustomFrom={setCustomFrom}
              onCustomTo={setCustomTo}
            />
            <div className="flex flex-wrap gap-1.5">
              <ExportMenu filename={`dimarket-${role}-analytics`} kpis={exportKpis} />
              <button
                type="button"
                onClick={() => setLive((v) => !v)}
                className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold"
              >
                {live ? 'Pause live' : 'Enable live'}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </header>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <DateRangeFilter
            preset={preset}
            customFrom={customFrom}
            customTo={customTo}
            onPreset={setPreset}
            onCustomFrom={setCustomFrom}
            onCustomTo={setCustomTo}
          />
          <ExportMenu filename={`dimarket-${role}-analytics`} kpis={exportKpis} />
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${
              tab === t.id
                ? 'bg-[#1d1d1f] text-white'
                : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !pro && !customer && !company && !admin ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#86868b]" />
        </div>
      ) : null}

      {tab === 'overview' && role === 'professional' && pro ? (
        <ProfessionalOverview pro={pro} labels={labels} compact={compact} />
      ) : null}
      {tab === 'overview' && role === 'customer' && customer ? (
        <CustomerOverview data={customer} labels={labels} />
      ) : null}
      {tab === 'overview' && role === 'company' && company ? (
        <CompanyOverview data={company} labels={labels} />
      ) : null}
      {tab === 'overview' && role === 'admin' && admin ? (
        <AdminOverview data={admin} labels={labels} compact={compact} />
      ) : null}

      {tab === 'search' && search ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Most searched categories" subtitle={range.label}>
            <HorizontalBarList items={search.categories} color="#2563eb" />
          </ChartCard>
          <ChartCard title="Most searched cities" subtitle={range.label}>
            <HorizontalBarList items={search.cities} color="#059669" />
          </ChartCard>
          <ChartCard title="Popular keywords" subtitle={range.label}>
            <HorizontalBarList items={search.keywords} color="#1d1d1f" />
          </ChartCard>
          <ChartCard title="Searches with no results" subtitle={range.label}>
            <HorizontalBarList items={search.noResults} color="#c2410c" />
          </ChartCard>
        </div>
      ) : null}

      {tab === 'categories' && categories ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Most popular categories">
            <HorizontalBarList items={categories.popular} />
          </ChartCard>
          <ChartCard title="Fastest growing">
            <HorizontalBarList items={categories.fastestGrowing} color="#2563eb" />
          </ChartCard>
          <ChartCard title="Highest rated" subtitle="Avg rating ×10 display">
            <HorizontalBarList items={categories.highestRated} color="#d97706" valueSuffix="★" />
          </ChartCard>
        </div>
      ) : null}

      {tab === 'map' ? (
        <ChartCard title="Map analytics" subtitle="Professionals · Projects · Companies">
          <Suspense
            fallback={
              <div className="flex h-[320px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#86868b]" />
              </div>
            }
          >
            <AnalyticsMap points={mapPoints} loading={loading} />
          </Suspense>
        </ChartCard>
      ) : null}
    </div>
  )
}

function ProfessionalOverview({
  pro,
  labels,
  compact,
}: {
  pro: ProfessionalBundle
  labels: string[]
  compact?: boolean
}) {
  const k = pro.kpis
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Profile views" value={String(k.profileViews)} />
        <MetricCard label="Search appearances" value={String(k.searchAppearances)} />
        <MetricCard label="Quote requests" value={String(k.quoteRequests)} />
        <MetricCard label="Accepted jobs" value={String(k.acceptedJobs)} />
        <MetricCard label="Completed projects" value={String(k.completedProjects)} />
        <MetricCard label="Reviews" value={String(k.reviews)} />
        <MetricCard label="Average rating" value={k.avgRating ? k.avgRating.toFixed(1) : '—'} accent="#d97706" />
        <MetricCard label="Revenue" value={formatEuro(k.revenue)} hint="Optional · accepted quotes" />
        <MetricCard
          label="Response time"
          value={
            formatHours(k.responseTimeHours) !== '—'
              ? formatHours(k.responseTimeHours)
              : k.responseRate != null
                ? `${k.responseRate}%`
                : '—'
          }
        />
        <MetricCard label="Profile completion" value={`${k.profileCompletion}%`} accent="#059669" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Profile views over time">
          <BarChart values={pro.series.profile_views} labels={labels} color="#6366f1" />
        </ChartCard>
        <ChartCard title="Revenue trend">
          <AreaSparkline values={pro.series.revenue} labels={labels} color="#059669" />
        </ChartCard>
        <ChartCard title="Reviews trend">
          <AreaSparkline values={pro.series.satisfaction} labels={labels} color="#d97706" />
        </ChartCard>
        <ChartCard title="Lead conversion">
          <FunnelChart
            steps={pro.leadFunnel.map((s, i) => ({
              ...s,
              color: ['#94a3b8', '#64748b', '#059669'][i] || '#1d1d1f',
            }))}
          />
        </ChartCard>
        {!compact ? (
          <>
            <ChartCard title="Projects by category">
              <HorizontalBarList items={pro.projectsByCategory} color="#2563eb" />
            </ChartCard>
            <ChartCard title="Top performing services">
              <HorizontalBarList items={pro.topServices} />
            </ChartCard>
            <ChartCard title="Customer locations">
              <HorizontalBarList items={pro.customerLocations} color="#059669" />
            </ChartCard>
            <ChartCard title="Traffic sources">
              <HorizontalBarList items={pro.trafficSources} color="#1d1d1f" />
            </ChartCard>
            <ChartCard title="Profile completion">
              <DonutChart value={k.profileCompletion} label="Complete" />
            </ChartCard>
          </>
        ) : null}
      </div>
    </>
  )
}

function CustomerOverview({ data, labels }: { data: CustomerBundle; labels: string[] }) {
  const k = data.kpis
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Projects created" value={String(k.projectsCreated)} />
        <MetricCard label="Completed projects" value={String(k.completedProjects)} />
        <MetricCard label="Average budget" value={formatEuro(k.averageBudget)} />
        <MetricCard label="Saved professionals" value={String(k.savedProfessionals)} />
        <MetricCard label="Reviews written" value={String(k.reviewsWritten)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Project timeline" subtitle="Projects created">
          <BarChart values={data.projectsByDay} labels={labels} color="#7c3aed" />
        </ChartCard>
        <ChartCard title="Spending overview" subtitle="Accepted quotes">
          <AreaSparkline values={data.spendingByDay} labels={labels} color="#059669" />
        </ChartCard>
        <ChartCard title="Favorite categories">
          <HorizontalBarList items={data.favoriteCategories} color="#7c3aed" />
        </ChartCard>
        <ChartCard title="Recent projects">
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {data.timeline.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2 text-[13px]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#1d1d1f]">{p.title}</p>
                  <p className="text-[11px] capitalize text-[#86868b]">{p.status}</p>
                </div>
                <span className="shrink-0 tabular-nums text-[#6e6e73]">
                  {p.budget ? formatEuro(p.budget) : '—'}
                </span>
              </li>
            ))}
            {!data.timeline.length ? (
              <p className="py-6 text-center text-[13px] text-[#86868b]">No projects in range</p>
            ) : null}
          </ul>
        </ChartCard>
      </div>
    </>
  )
}

function CompanyOverview({ data, labels }: { data: CompanyBundle; labels: string[] }) {
  const k = data.kpis
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Total leads" value={String(k.totalLeads)} />
        <MetricCard label="Lead conversion" value={`${k.leadConversion}%`} accent="#059669" />
        <MetricCard label="Projects" value={String(k.projects)} />
        <MetricCard label="Employees" value={String(k.employees)} />
        <MetricCard label="Revenue" value={formatEuro(k.revenue)} />
        <MetricCard
          label="Avg response time"
          value={formatHours(k.avgResponseTime)}
        />
        <MetricCard
          label="Customer satisfaction"
          value={k.satisfaction != null ? `${k.satisfaction.toFixed(1)}★` : '—'}
          accent="#d97706"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Leads over time">
          <BarChart values={data.leadsByDay} labels={labels} color="#2563eb" />
        </ChartCard>
        <ChartCard title="Revenue">
          <AreaSparkline values={data.revenueByDay} labels={labels} color="#059669" />
        </ChartCard>
        <ChartCard title="Branches performance">
          <HorizontalBarList items={data.branches} />
        </ChartCard>
        <ChartCard title="Most requested services">
          <HorizontalBarList items={data.topServices} color="#2563eb" />
        </ChartCard>
        <ChartCard title="Top cities">
          <HorizontalBarList items={data.topCities} color="#059669" />
        </ChartCard>
      </div>
    </>
  )
}

function AdminOverview({
  data,
  labels,
  compact,
}: {
  data: AdminBundle
  labels: string[]
  compact?: boolean
}) {
  const k = data.kpis
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="New users" value={String(k.newUsers)} />
        <MetricCard label="Active users" value={String(k.activeUsers)} />
        <MetricCard label="Professionals" value={String(k.professionals)} />
        <MetricCard label="Companies" value={String(k.companies)} />
        <MetricCard label="Projects" value={String(k.projects)} />
        <MetricCard label="Categories" value={String(k.categories)} />
        <MetricCard label="Reviews" value={String(k.reviews)} />
        <MetricCard label="Subscriptions" value={String(k.subscriptions)} />
        <MetricCard label="Premium users" value={String(k.premiumUsers)} />
        <MetricCard label="Revenue" value={formatEuro(k.revenue)} />
        <MetricCard
          label="Monthly growth"
          value={`${k.monthlyGrowth}%`}
          accent={k.monthlyGrowth >= 0 ? '#059669' : '#c2410c'}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Platform activity" subtitle="New projects">
          <BarChart values={data.activityByDay} labels={labels} />
        </ChartCard>
        <ChartCard title="New users">
          <AreaSparkline values={data.newUsersByDay} labels={labels} color="#2563eb" />
        </ChartCard>
        <ChartCard title="Revenue">
          <AreaSparkline values={data.series.revenue} labels={labels} color="#059669" />
        </ChartCard>
        <ChartCard title="Satisfaction">
          <AreaSparkline values={data.series.satisfaction} labels={labels} color="#d97706" />
        </ChartCard>
        {!compact ? (
          <>
            <ChartCard title="Countries">
              <HorizontalBarList items={data.countries} color="#059669" />
            </ChartCard>
            <ChartCard title="Languages">
              <HorizontalBarList items={data.languages} color="#2563eb" />
            </ChartCard>
          </>
        ) : null}
      </div>
    </>
  )
}

/** Compact embed used inside role dashboards */
export function AnalyticsEmbed({
  role,
  userId,
}: {
  role: AnalyticsRole
  userId: string
}) {
  return <AnalyticsHub role={role} userId={userId} compact showHeader={false} />
}
