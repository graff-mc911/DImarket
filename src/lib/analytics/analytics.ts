import { supabase } from '../supabase'

export type AnalyticsKpis = {
  revenue_total?: number | null
  projects_total?: number | null
  listing_views?: number | null
  profile_views_total?: number | null
  avg_rating?: number | null
  recommend_pct?: number | null
  quotes_sent?: number | null
  quotes_accepted?: number | null
  payments_count?: number | null
  active_projects?: number | null
  apps_total?: number | null
  response_hours?: number | null
  response_rate?: number | null
}

export type AnalyticsSeries = {
  days: number
  labels: string[]
  dates: string[]
  revenue: number[]
  projects: number[]
  profile_views: number[]
  satisfaction: number[]
  kpis: AnalyticsKpis
  mode: 'platform' | 'pro'
  conversionPct: number
  source: 'rpc' | 'client'
}

function lastNDays(n: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = []
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    })
  }
  return out
}

function bucketByDay(
  rows: Array<{ day: string; value: number }>,
  days: string[],
): number[] {
  const map = new Map(rows.map((r) => [r.day, r.value]))
  return days.map((d) => map.get(d) || 0)
}

function conversionPct(sent?: number | null, accepted?: number | null) {
  const s = Number(sent || 0)
  const a = Number(accepted || 0)
  if (s <= 0) return 0
  return Math.round((a / s) * 1000) / 10
}

export async function recordProfileView(profileId: string): Promise<void> {
  try {
    await supabase.rpc('record_profile_view' as never, {
      p_profile_id: profileId,
    } as never)
  } catch {
    // Fallback: best-effort increment
    try {
      const { data } = await supabase
        .from('profiles')
        .select('profile_views')
        .eq('id', profileId)
        .maybeSingle()
      await supabase
        .from('profiles')
        .update({ profile_views: (data?.profile_views || 0) + 1 } as never)
        .eq('id', profileId)
    } catch {
      /* ignore */
    }
  }
}

export async function fetchPlatformAnalytics(days = 14): Promise<AnalyticsSeries> {
  try {
    const { data, error } = await supabase.rpc('admin_analytics_series' as never, {
      p_days: days,
    } as never)
    if (!error && data) {
      const raw = data as Record<string, unknown>
      const kpis = (raw.kpis || {}) as AnalyticsKpis
      return {
        days,
        labels: (raw.labels as string[]) || [],
        dates: (raw.dates as string[]) || [],
        revenue: toNums(raw.revenue),
        projects: toNums(raw.projects),
        profile_views: toNums(raw.profile_views),
        satisfaction: toNums(raw.satisfaction),
        kpis,
        mode: 'platform',
        conversionPct: conversionPct(kpis.quotes_sent, kpis.quotes_accepted),
        source: 'rpc',
      }
    }
  } catch (e) {
    console.error('admin_analytics_series:', e)
  }
  return fetchPlatformAnalyticsClient(days)
}

export async function fetchProAnalytics(days = 14): Promise<AnalyticsSeries> {
  try {
    const { data, error } = await supabase.rpc('pro_analytics_series' as never, {
      p_days: days,
    } as never)
    if (!error && data) {
      const raw = data as Record<string, unknown>
      const kpis = (raw.kpis || {}) as AnalyticsKpis
      return {
        days,
        labels: (raw.labels as string[]) || [],
        dates: (raw.dates as string[]) || [],
        revenue: toNums(raw.revenue),
        projects: toNums(raw.projects),
        profile_views: toNums(raw.profile_views),
        satisfaction: toNums(raw.satisfaction),
        kpis,
        mode: 'pro',
        conversionPct: conversionPct(
          kpis.quotes_sent || kpis.apps_total,
          kpis.quotes_accepted,
        ),
        source: 'rpc',
      }
    }
  } catch (e) {
    console.error('pro_analytics_series:', e)
  }
  return fetchProAnalyticsClient(days)
}

function toNums(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => Number(x) || 0)
}

async function fetchPlatformAnalyticsClient(days: number): Promise<AnalyticsSeries> {
  const range = lastNDays(days)
  const since = `${range[0].iso}T00:00:00`

  const [payments, listings, reviews, quotes] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, created_at, status')
      .eq('status', 'completed')
      .gte('created_at', since)
      .limit(2000),
    supabase
      .from('listings')
      .select('id, created_at, views_count, listing_type, status')
      .eq('listing_type', 'service_request')
      .gte('created_at', since)
      .limit(2000),
    supabase
      .from('reviews')
      .select('rating, would_recommend, created_at, is_hidden')
      .gte('created_at', since)
      .limit(2000),
    supabase.from('quotes').select('status').limit(2000),
  ])

  const dayKeys = range.map((d) => d.iso)
  const revenueRows = (payments.data || [])
    .filter((p) => p.status === 'completed')
    .map((p) => ({ day: String(p.created_at).slice(0, 10), value: Number(p.amount) || 0 }))
  const projectRows = (listings.data || []).map((l) => ({
    day: String(l.created_at).slice(0, 10),
    value: 1,
  }))
  const satMap = new Map<string, number[]>()
  for (const r of reviews.data || []) {
    if (r.is_hidden) continue
    const day = String(r.created_at).slice(0, 10)
    const arr = satMap.get(day) || []
    arr.push(Number(r.rating) || 0)
    satMap.set(day, arr)
  }

  const revenueByDay = dayKeys.map((d) =>
    revenueRows.filter((r) => r.day === d).reduce((s, r) => s + r.value, 0),
  )
  const projectsByDay = bucketByDay(
    Object.entries(
      projectRows.reduce<Record<string, number>>((acc, r) => {
        acc[r.day] = (acc[r.day] || 0) + 1
        return acc
      }, {}),
    ).map(([day, value]) => ({ day, value })),
    dayKeys,
  )
  const satisfaction = dayKeys.map((d) => {
    const arr = satMap.get(d) || []
    if (!arr.length) return 0
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
  })

  const allReviews = (reviews.data || []).filter((r) => !r.is_hidden)
  const recommendable = allReviews.filter((r) => typeof r.would_recommend === 'boolean')
  const recommendPct = recommendable.length
    ? Math.round(
        (1000 * recommendable.filter((r) => r.would_recommend).length) / recommendable.length,
      ) / 10
    : 0

  const quotesSent = (quotes.data || []).filter((q) =>
    ['sent', 'accepted', 'rejected', 'declined'].includes(String(q.status)),
  ).length
  const quotesAccepted = (quotes.data || []).filter((q) => q.status === 'accepted').length

  const kpis: AnalyticsKpis = {
    revenue_total: revenueByDay.reduce((a, b) => a + b, 0),
    projects_total: projectsByDay.reduce((a, b) => a + b, 0),
    listing_views: (listings.data || []).reduce((s, l) => s + (l.views_count || 0), 0),
    profile_views_total: 0,
    avg_rating: allReviews.length
      ? Math.round(
          (allReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / allReviews.length) * 100,
        ) / 100
      : 0,
    recommend_pct: recommendPct,
    quotes_sent: quotesSent,
    quotes_accepted: quotesAccepted,
    payments_count: (payments.data || []).length,
    active_projects: (listings.data || []).filter((l) => l.status === 'active').length,
  }

  return {
    days,
    labels: range.map((d) => d.label),
    dates: dayKeys,
    revenue: revenueByDay,
    projects: projectsByDay,
    profile_views: dayKeys.map(() => 0),
    satisfaction,
    kpis,
    mode: 'platform',
    conversionPct: conversionPct(quotesSent, quotesAccepted),
    source: 'client',
  }
}

async function fetchProAnalyticsClient(days: number): Promise<AnalyticsSeries> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return emptySeries(days, 'pro')
  }

  const range = lastNDays(days)
  const since = `${range[0].iso}T00:00:00`
  const dayKeys = range.map((d) => d.iso)

  const [quotes, apps, profile, listings, reviews] = await Promise.all([
    supabase
      .from('quotes')
      .select('total, status, created_at, updated_at')
      .eq('professional_id', user.id)
      .limit(500),
    supabase
      .from('project_applications')
      .select('created_at')
      .eq('professional_id', user.id)
      .gte('created_at', since)
      .limit(500),
    supabase
      .from('profiles')
      .select('profile_views, response_rate, rating, total_reviews')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('listings').select('views_count').eq('author_id', user.id).limit(500),
    supabase
      .from('reviews')
      .select('rating, would_recommend, created_at, is_hidden')
      .eq('professional_id', user.id)
      .limit(500),
  ])

  const accepted = (quotes.data || []).filter((q) => q.status === 'accepted')
  const revenueRows = accepted
    .filter((q) => String(q.updated_at || q.created_at) >= since)
    .map((q) => ({
      day: String(q.updated_at || q.created_at).slice(0, 10),
      value: Number(q.total) || 0,
    }))
  const revenueByDay = dayKeys.map((d) =>
    revenueRows.filter((r) => r.day === d).reduce((s, r) => s + r.value, 0),
  )
  const projectRows = (apps.data || []).map((a) => ({
    day: String(a.created_at).slice(0, 10),
    value: 1,
  }))
  const projectsByDay = bucketByDay(
    Object.entries(
      projectRows.reduce<Record<string, number>>((acc, r) => {
        acc[r.day] = (acc[r.day] || 0) + 1
        return acc
      }, {}),
    ).map(([day, value]) => ({ day, value })),
    dayKeys,
  )

  const satMap = new Map<string, number[]>()
  for (const r of reviews.data || []) {
    if (r.is_hidden) continue
    const day = String(r.created_at).slice(0, 10)
    if (day < range[0].iso) continue
    const arr = satMap.get(day) || []
    arr.push(Number(r.rating) || 0)
    satMap.set(day, arr)
  }
  const satisfaction = dayKeys.map((d) => {
    const arr = satMap.get(d) || []
    if (!arr.length) return 0
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
  })

  const visibleReviews = (reviews.data || []).filter((r) => !r.is_hidden)
  const recommendable = visibleReviews.filter((r) => typeof r.would_recommend === 'boolean')
  const quotesSent = (quotes.data || []).filter((q) =>
    ['sent', 'accepted', 'rejected', 'declined'].includes(String(q.status)),
  ).length
  const quotesAccepted = accepted.length

  const kpis: AnalyticsKpis = {
    revenue_total: revenueByDay.reduce((a, b) => a + b, 0),
    projects_total: projectsByDay.reduce((a, b) => a + b, 0),
    profile_views_total: profile.data?.profile_views || 0,
    listing_views: (listings.data || []).reduce((s, l) => s + (l.views_count || 0), 0),
    avg_rating: profile.data?.rating || (visibleReviews[0] ? visibleReviews.reduce((s, r) => s + Number(r.rating), 0) / visibleReviews.length : 0),
    recommend_pct: recommendable.length
      ? Math.round(
          (1000 * recommendable.filter((r) => r.would_recommend).length) / recommendable.length,
        ) / 10
      : 0,
    quotes_sent: quotesSent,
    quotes_accepted: quotesAccepted,
    apps_total: (apps.data || []).length,
    response_rate: profile.data?.response_rate || null,
    response_hours: null,
  }

  return {
    days,
    labels: range.map((d) => d.label),
    dates: dayKeys,
    revenue: revenueByDay,
    projects: projectsByDay,
    profile_views: dayKeys.map(() => 0),
    satisfaction,
    kpis,
    mode: 'pro',
    conversionPct: conversionPct(quotesSent || kpis.apps_total, quotesAccepted),
    source: 'client',
  }
}

function emptySeries(days: number, mode: 'platform' | 'pro'): AnalyticsSeries {
  const range = lastNDays(days)
  return {
    days,
    labels: range.map((d) => d.label),
    dates: range.map((d) => d.iso),
    revenue: range.map(() => 0),
    projects: range.map(() => 0),
    profile_views: range.map(() => 0),
    satisfaction: range.map(() => 0),
    kpis: {},
    mode,
    conversionPct: 0,
    source: 'client',
  }
}

export function formatEuro(n: number | null | undefined): string {
  const v = Number(n || 0)
  return `€${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function formatHours(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—'
  const v = Number(n)
  if (v < 1) return `${Math.round(v * 60)}m`
  return `${v.toFixed(1)}h`
}
