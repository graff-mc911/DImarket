import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { isSiteOwner } from '../lib/siteOwner'
import {
  fetchPlatformAnalytics,
  fetchProAnalytics,
  formatEuro,
  formatHours,
  type AnalyticsSeries,
} from '../lib/analytics/analytics'
import {
  AreaSparkline,
  BarChart,
  ChartCard,
  FunnelChart,
  MetricCard,
} from '../components/analytics/Charts'
import { OwnerMarketHealth } from '../components/OwnerMarketHealth'

type RangeDays = 7 | 14 | 30

export function Analytics() {
  const { user, profile, t } = useApp()
  const owner = isSiteOwner(profile, user?.email)
  const isPro =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    Boolean(profile?.is_professional)

  const defaultMode: 'platform' | 'pro' = owner ? 'platform' : 'pro'
  const [mode, setMode] = useState<'platform' | 'pro'>(defaultMode)
  const [days, setDays] = useState<RangeDays>(14)
  const [data, setData] = useState<AnalyticsSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    if (!owner && !isPro) {
      navigateTo('/customer/dashboard')
    }
  }, [user?.id, owner, isPro])

  useEffect(() => {
    if (owner && !isPro) setMode('platform')
    else if (!owner && isPro) setMode('pro')
  }, [owner, isPro])

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const series =
        mode === 'platform' && owner
          ? await fetchPlatformAnalytics(days)
          : await fetchProAnalytics(days)
      setData(series)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('analytics.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [user?.id, mode, days])

  const sparseLabels = useMemo(() => {
    if (!data?.labels?.length) return []
    const step = data.labels.length > 14 ? 2 : 1
    return data.labels.map((l, i) => (i % step === 0 ? l.slice(0, 2) : ''))
  }, [data?.labels])

  if (!user) return null

  const k = data?.kpis || {}
  const lastDays = t('analytics.chart.lastDays').replace('{n}', String(days))

  return (
    <div className="py-6 pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8178]">
              <BarChart3 className="h-4 w-4" />
              {t('analytics.eyebrow')}
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#2f2a24] sm:text-[32px]">
              {mode === 'platform' ? t('analytics.title.platform') : t('analytics.title.pro')}
            </h1>
            <p className="mt-1 text-[14px] text-[#6f665d]">{t('analytics.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {owner && isPro ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('platform')}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    mode === 'platform' ? 'bg-[#2f2a24] text-white' : 'bg-[#f3f0ea] text-[#2f2a24]'
                  }`}
                >
                  {t('analytics.mode.platform')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pro')}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    mode === 'pro' ? 'bg-[#2f2a24] text-white' : 'bg-[#f3f0ea] text-[#2f2a24]'
                  }`}
                >
                  {t('analytics.mode.pro')}
                </button>
              </>
            ) : null}
            {([7, 14, 30] as RangeDays[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  days === d ? 'bg-[#2f2a24] text-white' : 'border border-[rgba(148,163,184,0.35)] bg-white'
                }`}
              >
                {t('analytics.rangeDays').replace('{n}', String(d))}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-3 py-1.5 text-[12px] font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('analytics.refresh')}
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#8a8178]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label={t('analytics.revenue')}
                value={formatEuro(k.revenue_total)}
                hint={
                  mode === 'platform'
                    ? t('analytics.hint.completedPayments')
                    : t('analytics.hint.acceptedQuotes')
                }
              />
              <MetricCard
                label={t('analytics.projects')}
                value={String(k.projects_total ?? 0)}
                hint={
                  mode === 'platform'
                    ? t('analytics.hint.newRequests')
                    : t('analytics.hint.applications')
                }
              />
              <MetricCard
                label={t('analytics.conversion')}
                value={`${data?.conversionPct ?? 0}%`}
                hint={t('analytics.hint.quotesAcceptedSent')}
                accent="#059669"
              />
              <MetricCard
                label={t('analytics.views')}
                value={String(k.listing_views ?? 0)}
                hint={t('analytics.hint.listingViews')}
              />
              <MetricCard
                label={t('analytics.profileVisitors')}
                value={String(k.profile_views_total ?? 0)}
                hint={
                  mode === 'platform'
                    ? t('analytics.hint.lastDays').replace('{n}', String(days))
                    : t('analytics.hint.totalProfileViews')
                }
              />
              <MetricCard
                label={t('analytics.leadResponse')}
                value={
                  mode === 'pro'
                    ? formatHours(k.response_hours) !== '—'
                      ? formatHours(k.response_hours)
                      : k.response_rate != null
                        ? `${k.response_rate}%`
                        : '—'
                    : k.response_rate != null
                      ? `${k.response_rate}%`
                      : '—'
                }
                hint={
                  mode === 'pro'
                    ? t('analytics.hint.avgFirstReply')
                    : t('analytics.hint.platformAvg')
                }
              />
              <MetricCard
                label={t('analytics.satisfaction')}
                value={k.avg_rating != null ? `${Number(k.avg_rating).toFixed(1)}★` : '—'}
                hint={
                  k.recommend_pct != null
                    ? t('analytics.hint.wouldRecommend').replace('{n}', String(k.recommend_pct))
                    : t('analytics.hint.fromReviews')
                }
                accent="#d97706"
              />
              <MetricCard
                label={mode === 'platform' ? t('analytics.activeProjects') : t('analytics.quotesWon')}
                value={String(
                  mode === 'platform' ? k.active_projects ?? 0 : k.quotes_accepted ?? 0,
                )}
                hint={
                  data?.source === 'rpc'
                    ? t('analytics.hint.liveData')
                    : t('analytics.hint.clientAggregate')
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t('analytics.revenue')} subtitle={lastDays}>
                <AreaSparkline
                  values={data?.revenue || []}
                  labels={sparseLabels}
                  color="#059669"
                />
              </ChartCard>
              <ChartCard title={t('analytics.projects')} subtitle={lastDays}>
                <BarChart
                  values={data?.projects || []}
                  labels={sparseLabels}
                  color="#2f2a24"
                />
              </ChartCard>
              <ChartCard
                title={t('analytics.profileVisitors')}
                subtitle={t('analytics.chart.dailyViews').replace('{n}', String(days))}
              >
                <BarChart
                  values={data?.profile_views || []}
                  labels={sparseLabels}
                  color="#6366f1"
                />
              </ChartCard>
              <ChartCard
                title={t('analytics.satisfaction')}
                subtitle={t('analytics.chart.avgRatingByDay')}
              >
                <AreaSparkline
                  values={data?.satisfaction || []}
                  labels={sparseLabels}
                  color="#d97706"
                  height={140}
                />
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t('analytics.funnel.title')} subtitle={t('analytics.funnel.subtitle')}>
                <FunnelChart
                  steps={[
                    {
                      label:
                        mode === 'pro'
                          ? t('analytics.funnel.applications')
                          : t('analytics.funnel.quotesCreated'),
                      value: Number(
                        mode === 'pro'
                          ? k.apps_total || k.quotes_sent || 0
                          : k.quotes_sent || 0,
                      ),
                      color: '#94a3b8',
                    },
                    {
                      label: t('analytics.funnel.quotesSent'),
                      value: Number(k.quotes_sent || 0),
                      color: '#64748b',
                    },
                    {
                      label: t('analytics.funnel.accepted'),
                      value: Number(k.quotes_accepted || 0),
                      color: '#059669',
                    },
                  ]}
                />
                <p className="mt-3 text-[12px] text-[#8a8178]">
                  {t('analytics.funnel.rate')}{' '}
                  <strong className="text-[#2f2a24]">{data?.conversionPct ?? 0}%</strong>
                </p>
              </ChartCard>

              {mode === 'platform' && owner ? (
                <ChartCard title={t('analytics.market.title')} subtitle={t('analytics.market.subtitle')}>
                  <OwnerMarketHealth />
                </ChartCard>
              ) : (
                <ChartCard
                  title={t('analytics.quality.title')}
                  subtitle={t('analytics.quality.subtitle')}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f3f0ea] p-4">
                      <p className="text-[11px] font-semibold uppercase text-[#8a8178]">
                        {t('analytics.quality.responseTime')}
                      </p>
                      <p className="mt-2 text-[22px] font-semibold tabular-nums">
                        {formatHours(k.response_hours)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f3f0ea] p-4">
                      <p className="text-[11px] font-semibold uppercase text-[#8a8178]">
                        {t('analytics.quality.responseRate')}
                      </p>
                      <p className="mt-2 text-[22px] font-semibold tabular-nums">
                        {k.response_rate != null ? `${k.response_rate}%` : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f3f0ea] p-4">
                      <p className="text-[11px] font-semibold uppercase text-[#8a8178]">
                        {t('analytics.quality.recommend')}
                      </p>
                      <p className="mt-2 text-[22px] font-semibold tabular-nums">
                        {k.recommend_pct != null ? `${k.recommend_pct}%` : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f3f0ea] p-4">
                      <p className="text-[11px] font-semibold uppercase text-[#8a8178]">
                        {t('analytics.quality.rating')}
                      </p>
                      <p className="mt-2 text-[22px] font-semibold tabular-nums">
                        {k.avg_rating != null ? Number(k.avg_rating).toFixed(1) : '—'}
                      </p>
                    </div>
                  </div>
                </ChartCard>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Compact embed for Admin Panel analytics tab */
export function AnalyticsEmbed({ days = 14 }: { days?: number }) {
  const { t } = useApp()
  const [data, setData] = useState<AnalyticsSeries | null>(null)

  useEffect(() => {
    void fetchPlatformAnalytics(days).then(setData)
  }, [days])

  if (!data) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-[#8a8178]" />
      </div>
    )
  }

  const k = data.kpis
  const labels = data.labels.map((l, i) => (i % 2 === 0 ? l.slice(0, 2) : ''))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label={t('analytics.revenue')} value={formatEuro(k.revenue_total)} />
        <MetricCard label={t('analytics.projects')} value={String(k.projects_total ?? 0)} />
        <MetricCard label={t('analytics.conversion')} value={`${data.conversionPct}%`} />
        <MetricCard
          label={t('analytics.satisfaction')}
          value={k.avg_rating != null ? `${Number(k.avg_rating).toFixed(1)}★` : '—'}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('analytics.revenue')}>
          <AreaSparkline values={data.revenue} labels={labels} color="#059669" />
        </ChartCard>
        <ChartCard title={t('analytics.projects')}>
          <BarChart values={data.projects} labels={labels} />
        </ChartCard>
        <ChartCard title={t('analytics.profileVisitors')}>
          <BarChart values={data.profile_views} labels={labels} color="#6366f1" />
        </ChartCard>
        <ChartCard title={t('analytics.satisfaction')}>
          <AreaSparkline values={data.satisfaction} labels={labels} color="#d97706" />
        </ChartCard>
      </div>
    </div>
  )
}
