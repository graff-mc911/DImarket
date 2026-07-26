import { supabase } from '../supabase'
import { analyticsCacheGet, analyticsCacheSet } from './cache'
import { lastNDayKeys, type AnalyticsDateRange } from './dateRange'
import {
  fetchPlatformAnalytics,
  fetchProAnalytics,
  type AnalyticsSeries,
} from './analytics'

export type NamedCount = { name: string; count: number }

export type ProfessionalBundle = {
  series: AnalyticsSeries
  kpis: {
    profileViews: number
    searchAppearances: number
    quoteRequests: number
    acceptedJobs: number
    completedProjects: number
    reviews: number
    avgRating: number
    revenue: number
    responseTimeHours: number | null
    responseRate: number | null
    profileCompletion: number
  }
  projectsByCategory: NamedCount[]
  topServices: NamedCount[]
  customerLocations: NamedCount[]
  trafficSources: NamedCount[]
  leadFunnel: { label: string; value: number }[]
}

export type CustomerBundle = {
  kpis: {
    projectsCreated: number
    completedProjects: number
    averageBudget: number
    savedProfessionals: number
    reviewsWritten: number
  }
  projectsByDay: number[]
  spendingByDay: number[]
  labels: string[]
  favoriteCategories: NamedCount[]
  timeline: Array<{ id: string; title: string; status: string; createdAt: string; budget: number }>
}

export type CompanyBundle = {
  kpis: {
    totalLeads: number
    leadConversion: number
    projects: number
    employees: number
    revenue: number
    avgResponseTime: number | null
    satisfaction: number | null
  }
  branches: NamedCount[]
  topServices: NamedCount[]
  topCities: NamedCount[]
  leadsByDay: number[]
  revenueByDay: number[]
  labels: string[]
}

export type AdminBundle = {
  series: AnalyticsSeries
  kpis: {
    newUsers: number
    activeUsers: number
    professionals: number
    companies: number
    projects: number
    categories: number
    reviews: number
    subscriptions: number
    premiumUsers: number
    revenue: number
    monthlyGrowth: number
  }
  countries: NamedCount[]
  languages: NamedCount[]
  activityByDay: number[]
  labels: string[]
  newUsersByDay: number[]
}

export type SearchBundle = {
  categories: NamedCount[]
  cities: NamedCount[]
  keywords: NamedCount[]
  noResults: NamedCount[]
}

export type CategoryBundle = {
  popular: NamedCount[]
  fastestGrowing: NamedCount[]
  highestRated: NamedCount[]
}

export type MapPoint = {
  id: string
  lat: number
  lng: number
  kind: 'professional' | 'project' | 'company'
  label: string
}

function sinceIso(range: AnalyticsDateRange) {
  return range.from.toISOString()
}

function topCounts(map: Map<string, number>, limit = 8): NamedCount[] {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function profileCompletion(p: Record<string, unknown> | null | undefined): number {
  if (!p) return 0
  const checks = [
    Boolean(p.full_name),
    Boolean(p.bio),
    Boolean(p.phone),
    Boolean(p.location),
    Boolean(p.profile_photo || p.avatar_url),
    Array.isArray(p.work_subcategory_slugs) && (p.work_subcategory_slugs as string[]).length > 0,
    Array.isArray(p.portfolio_images) && (p.portfolio_images as string[]).length > 0,
    Boolean(p.is_verified) || (p.verification_level && p.verification_level !== 'none'),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export async function fetchProfessionalBundle(
  range: AnalyticsDateRange,
): Promise<ProfessionalBundle> {
  const cacheKey = `pro:${range.days}:${range.from.toISOString()}`
  const cached = analyticsCacheGet<ProfessionalBundle>(cacheKey)
  if (cached) return cached

  const series = await fetchProAnalytics(range.days)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      series,
      kpis: {
        profileViews: 0,
        searchAppearances: 0,
        quoteRequests: 0,
        acceptedJobs: 0,
        completedProjects: 0,
        reviews: 0,
        avgRating: 0,
        revenue: 0,
        responseTimeHours: null,
        responseRate: null,
        profileCompletion: 0,
      },
      projectsByCategory: [],
      topServices: [],
      customerLocations: [],
      trafficSources: [],
      leadFunnel: [],
    }
  }

  const since = sinceIso(range)
  const [profile, quotes, apps, reviews, viewsPeriod, listings] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'profile_views, response_rate, rating, total_reviews, completed_jobs, full_name, bio, phone, location, profile_photo, avatar_url, work_subcategory_slugs, portfolio_images, is_verified, verification_level',
      )
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('quotes')
      .select('total, status, created_at, listing_id')
      .eq('professional_id', user.id)
      .gte('created_at', since)
      .limit(1000),
    supabase
      .from('project_applications')
      .select('id, created_at, listing_id, status')
      .eq('professional_id', user.id)
      .gte('created_at', since)
      .limit(1000),
    supabase
      .from('reviews')
      .select('id, rating, created_at, is_hidden')
      .eq('professional_id', user.id)
      .gte('created_at', since)
      .limit(1000),
    supabase
      .from('profile_view_events')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('created_at', since),
    supabase
      .from('listings')
      .select('id, subcategory_slugs, location, city_name, category:categories(name, slug)')
      .eq('listing_type', 'service_request')
      .limit(500),
  ])

  const quoteRows = quotes.data || []
  const accepted = quoteRows.filter((q) => q.status === 'accepted')
  const visibleReviews = (reviews.data || []).filter((r) => !r.is_hidden)
  const listingMap = new Map(
    (listings.data || []).map((l) => [l.id, l as Record<string, unknown>]),
  )

  const catMap = new Map<string, number>()
  const locMap = new Map<string, number>()
  const serviceMap = new Map<string, number>()
  for (const app of apps.data || []) {
    const listing = listingMap.get(app.listing_id as string)
    const cat =
      (listing?.category as { name?: string } | null)?.name ||
      ((listing?.subcategory_slugs as string[] | null)?.[0] ?? 'Other')
    catMap.set(cat, (catMap.get(cat) || 0) + 1)
    const city =
      (listing?.city_name as string) ||
      String(listing?.location || '')
        .split(',')[0]
        ?.trim() ||
      'Unknown'
    locMap.set(city, (locMap.get(city) || 0) + 1)
    const slug = (listing?.subcategory_slugs as string[] | null)?.[0]
    if (slug) serviceMap.set(slug, (serviceMap.get(slug) || 0) + 1)
  }

  const trafficSources: NamedCount[] = [
    { name: 'Profile views', count: viewsPeriod.count || 0 },
    { name: 'Quote requests', count: quoteRows.length },
    { name: 'Project applications', count: (apps.data || []).length },
    { name: 'Search (estimated)', count: Math.max(0, Math.round((viewsPeriod.count || 0) * 0.35)) },
  ]

  const bundle: ProfessionalBundle = {
    series,
    kpis: {
      profileViews: viewsPeriod.count || Number(profile.data?.profile_views || 0),
      searchAppearances: Math.max(
        0,
        Math.round((viewsPeriod.count || Number(profile.data?.profile_views || 0)) * 0.4),
      ),
      quoteRequests: quoteRows.length,
      acceptedJobs: accepted.length,
      completedProjects: Number(profile.data?.completed_jobs || accepted.length),
      reviews: visibleReviews.length || Number(profile.data?.total_reviews || 0),
      avgRating: Number(profile.data?.rating || series.kpis.avg_rating || 0),
      revenue: Number(series.kpis.revenue_total || 0),
      responseTimeHours: series.kpis.response_hours ?? null,
      responseRate: profile.data?.response_rate ?? series.kpis.response_rate ?? null,
      profileCompletion: profileCompletion(profile.data as Record<string, unknown>),
    },
    projectsByCategory: topCounts(catMap),
    topServices: topCounts(serviceMap),
    customerLocations: topCounts(locMap),
    trafficSources,
    leadFunnel: [
      { label: 'Leads / applications', value: (apps.data || []).length },
      { label: 'Quotes sent', value: quoteRows.filter((q) => q.status !== 'draft').length },
      { label: 'Accepted jobs', value: accepted.length },
    ],
  }

  analyticsCacheSet(cacheKey, bundle)
  return bundle
}

export async function fetchCustomerBundle(
  userId: string,
  range: AnalyticsDateRange,
): Promise<CustomerBundle> {
  const cacheKey = `customer:${userId}:${range.days}:${range.from.toISOString()}`
  const cached = analyticsCacheGet<CustomerBundle>(cacheKey)
  if (cached) return cached

  const keys = lastNDayKeys(Math.min(range.days, 90), range.to)
  const since = sinceIso(range)

  const [projects, quotes, saved, reviews] = await Promise.all([
    supabase
      .from('listings')
      .select(
        'id, title, status, created_at, budget_min, budget_max, price, subcategory_slugs, category:categories(name, slug)',
      )
      .eq('author_id', userId)
      .eq('listing_type', 'service_request')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('quotes')
      .select('total, status, created_at, listing:listings!inner(author_id)')
      .eq('listing.author_id', userId)
      .eq('status', 'accepted')
      .gte('created_at', since)
      .limit(500),
    supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('item_type', 'profile')
      .limit(500),
    supabase
      .from('reviews')
      .select('id')
      .eq('author_id', userId)
      .gte('created_at', since)
      .limit(500),
  ])

  // Fallback quotes query if join fails
  let spendingRows = quotes.data || []
  if (quotes.error) {
    const listingIds = (projects.data || []).map((p) => p.id)
    if (listingIds.length) {
      const { data } = await supabase
        .from('quotes')
        .select('total, status, created_at, listing_id')
        .in('listing_id', listingIds)
        .eq('status', 'accepted')
        .gte('created_at', since)
        .limit(500)
      spendingRows = (data || []) as typeof spendingRows
    }
  }

  const dayKeys = keys.map((k) => k.iso)
  const projectsByDay = dayKeys.map(
    (d) => (projects.data || []).filter((p) => String(p.created_at).slice(0, 10) === d).length,
  )
  const spendingByDay = dayKeys.map((d) =>
    spendingRows
      .filter((q) => String(q.created_at).slice(0, 10) === d)
      .reduce((s, q) => s + (Number(q.total) || 0), 0),
  )

  const budgets = (projects.data || [])
    .map((p) => Number(p.budget_max || p.budget_min || p.price || 0))
    .filter((n) => n > 0)
  const catMap = new Map<string, number>()
  for (const p of projects.data || []) {
    const name =
      (p.category as { name?: string } | null)?.name ||
      (p.subcategory_slugs as string[] | null)?.[0] ||
      'Other'
    catMap.set(name, (catMap.get(name) || 0) + 1)
  }

  const completed = (projects.data || []).filter((p) =>
    ['completed', 'closed', 'done'].includes(String(p.status)),
  ).length

  const bundle: CustomerBundle = {
    kpis: {
      projectsCreated: (projects.data || []).length,
      completedProjects: completed,
      averageBudget: budgets.length
        ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
        : 0,
      savedProfessionals: (saved.data || []).length,
      reviewsWritten: (reviews.data || []).length,
    },
    projectsByDay,
    spendingByDay,
    labels: keys.map((k) => k.label),
    favoriteCategories: topCounts(catMap),
    timeline: (projects.data || []).slice(0, 12).map((p) => ({
      id: p.id,
      title: p.title || 'Project',
      status: String(p.status || 'active'),
      createdAt: String(p.created_at),
      budget: Number(p.budget_max || p.budget_min || p.price || 0),
    })),
  }

  analyticsCacheSet(cacheKey, bundle)
  return bundle
}

export async function fetchCompanyBundle(
  userId: string,
  range: AnalyticsDateRange,
): Promise<CompanyBundle> {
  const cacheKey = `company:${userId}:${range.days}`
  const cached = analyticsCacheGet<CompanyBundle>(cacheKey)
  if (cached) return cached

  // Company shares professional metrics + team/branch heuristics
  const pro = await fetchProfessionalBundle(range)
  const keys = lastNDayKeys(Math.min(range.days, 90), range.to)

  const [{ data: employees }, { data: branches }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id')
      .or(`company_id.eq.${userId},parent_company_id.eq.${userId}`)
      .limit(200),
    supabase
      .from('company_branches')
      .select('id, name, city')
      .eq('company_id', userId)
      .limit(50),
  ])

  // Fallbacks when company tables missing
  const employeeCount = employees?.length ?? 0
  const branchCounts = new Map<string, number>()
  if (branches?.length) {
    for (const b of branches) {
      const name = (b as { name?: string; city?: string }).name || (b as { city?: string }).city || 'Branch'
      branchCounts.set(name, (branchCounts.get(name) || 0) + 1)
    }
  } else {
    for (const loc of pro.customerLocations.slice(0, 5)) {
      branchCounts.set(loc.name, loc.count)
    }
  }

  const bundle: CompanyBundle = {
    kpis: {
      totalLeads: pro.kpis.quoteRequests + (pro.series.kpis.apps_total || 0),
      leadConversion: pro.series.conversionPct,
      projects: pro.kpis.acceptedJobs,
      employees: employeeCount || 1,
      revenue: pro.kpis.revenue,
      avgResponseTime: pro.kpis.responseTimeHours,
      satisfaction: pro.kpis.avgRating || null,
    },
    branches: topCounts(branchCounts),
    topServices: pro.topServices,
    topCities: pro.customerLocations,
    leadsByDay: pro.series.projects,
    revenueByDay: pro.series.revenue,
    labels: pro.series.labels.length ? pro.series.labels : keys.map((k) => k.label),
  }

  analyticsCacheSet(cacheKey, bundle)
  return bundle
}

export async function fetchAdminBundle(range: AnalyticsDateRange): Promise<AdminBundle> {
  const cacheKey = `admin:${range.days}:${range.from.toISOString()}`
  const cached = analyticsCacheGet<AdminBundle>(cacheKey)
  if (cached) return cached

  const series = await fetchPlatformAnalytics(range.days)
  const since = sinceIso(range)
  const keys = lastNDayKeys(Math.min(range.days, 90), range.to)

  const [profiles, categories, subs, premium, langs] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, user_role, is_professional, is_premium, location, preferred_language, created_at, updated_at')
      .gte('created_at', since)
      .limit(3000),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_premium', true),
    supabase.from('profiles').select('preferred_language, location').limit(2000),
  ])

  // Active = updated in range
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('updated_at', since)

  const countryMap = new Map<string, number>()
  const langMap = new Map<string, number>()
  for (const p of langs.data || []) {
    const loc = String(p.location || '')
    const country = loc.split(',').pop()?.trim() || 'Unknown'
    countryMap.set(country, (countryMap.get(country) || 0) + 1)
    const lang = p.preferred_language || 'en'
    langMap.set(lang, (langMap.get(lang) || 0) + 1)
  }

  const dayKeys = keys.map((k) => k.iso)
  const newUsersByDay = dayKeys.map(
    (d) => (profiles.data || []).filter((p) => String(p.created_at).slice(0, 10) === d).length,
  )

  const prosAll = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .or('is_professional.eq.true,user_role.eq.professional')
  const companiesAll = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_role', 'company')

  const newUsers = (profiles.data || []).length
  const prevEstimate = Math.max(1, newUsers)
  const monthlyGrowth =
    range.days >= 30
      ? Math.round(
          ((newUsersByDay.slice(-15).reduce((a, b) => a + b, 0) -
            newUsersByDay.slice(0, 15).reduce((a, b) => a + b, 0)) /
            prevEstimate) *
            1000,
        ) / 10
      : 0

  const bundle: AdminBundle = {
    series,
    kpis: {
      newUsers,
      activeUsers: activeUsers || 0,
      professionals: prosAll.count || 0,
      companies: companiesAll.count || 0,
      projects: Number(series.kpis.projects_total || 0),
      categories: categories.count || 0,
      reviews: Number((series.kpis as { reviews_total?: number }).reviews_total || 0),
      subscriptions: subs.count || 0,
      premiumUsers:
        premium.count || Number((series.kpis as { premium_users?: number }).premium_users || 0),
      revenue: Number(series.kpis.revenue_total || 0),
      monthlyGrowth,
    },
    countries: topCounts(countryMap, 10),
    languages: topCounts(langMap, 10),
    activityByDay: series.projects,
    labels: series.labels.length ? series.labels : keys.map((k) => k.label),
    newUsersByDay,
  }

  analyticsCacheSet(cacheKey, bundle)
  return bundle
}

export async function fetchSearchBundle(range: AnalyticsDateRange): Promise<SearchBundle> {
  const cacheKey = `search:${range.days}`
  const cached = analyticsCacheGet<SearchBundle>(cacheKey)
  if (cached) return cached

  const since = sinceIso(range)
  const { data, error } = await supabase
    .from('search_events')
    .select('query, category_slug, city, result_count')
    .gte('created_at', since)
    .limit(3000)

  if (error || !data?.length) {
    // Derive soft fallbacks from categories / listings
    const { data: cats } = await supabase
      .from('categories')
      .select('name, slug, professionals_count, services_count')
      .order('professionals_count', { ascending: false })
      .limit(10)
    const empty: SearchBundle = {
      categories: (cats || []).map((c) => ({
        name: c.name,
        count: Number(c.professionals_count || c.services_count || 0),
      })),
      cities: [],
      keywords: [],
      noResults: [],
    }
    analyticsCacheSet(cacheKey, empty)
    return empty
  }

  const catMap = new Map<string, number>()
  const cityMap = new Map<string, number>()
  const kwMap = new Map<string, number>()
  const noMap = new Map<string, number>()
  for (const row of data) {
    if (row.category_slug) catMap.set(row.category_slug, (catMap.get(row.category_slug) || 0) + 1)
    if (row.city) cityMap.set(row.city, (cityMap.get(row.city) || 0) + 1)
    if (row.query) {
      const q = String(row.query).toLowerCase().trim()
      if (q) kwMap.set(q, (kwMap.get(q) || 0) + 1)
      if ((row.result_count || 0) === 0) noMap.set(q, (noMap.get(q) || 0) + 1)
    }
  }

  const bundle: SearchBundle = {
    categories: topCounts(catMap),
    cities: topCounts(cityMap),
    keywords: topCounts(kwMap),
    noResults: topCounts(noMap),
  }
  analyticsCacheSet(cacheKey, bundle)
  return bundle
}

export async function fetchCategoryBundle(range: AnalyticsDateRange): Promise<CategoryBundle> {
  const cacheKey = `cats:${range.days}`
  const cached = analyticsCacheGet<CategoryBundle>(cacheKey)
  if (cached) return cached

  const since = sinceIso(range)
  const [{ data: cats }, { data: listings }, { data: reviews }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, professionals_count, avg_rating, completed_projects_count')
      .order('professionals_count', { ascending: false })
      .limit(40),
    supabase
      .from('listings')
      .select('category_id, created_at')
      .eq('listing_type', 'service_request')
      .gte('created_at', since)
      .limit(2000),
    supabase
      .from('reviews')
      .select('rating, professional_id')
      .eq('is_hidden', false)
      .limit(2000),
  ])

  const growth = new Map<string, number>()
  const idToName = new Map((cats || []).map((c) => [c.id, c.name]))
  for (const l of listings || []) {
    const name = idToName.get(l.category_id as string) || 'Other'
    growth.set(name, (growth.get(name) || 0) + 1)
  }

  const popular = (cats || []).slice(0, 10).map((c) => ({
    name: c.name,
    count: Number(c.professionals_count || c.completed_projects_count || 0),
  }))
  const highestRated = [...(cats || [])]
    .filter((c) => c.avg_rating != null)
    .sort((a, b) => Number(b.avg_rating) - Number(a.avg_rating))
    .slice(0, 10)
    .map((c) => ({ name: c.name, count: Math.round(Number(c.avg_rating) * 10) / 10 }))

  void reviews
  const bundle: CategoryBundle = {
    popular,
    fastestGrowing: topCounts(growth, 10),
    highestRated,
  }
  analyticsCacheSet(cacheKey, bundle)
  return bundle
}

export async function fetchMapAnalyticsPoints(limit = 200): Promise<MapPoint[]> {
  const cacheKey = `map:${limit}`
  const cached = analyticsCacheGet<MapPoint[]>(cacheKey)
  if (cached) return cached

  const [pros, projects, companies] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, service_latitude, service_longitude, user_role, is_professional')
      .not('service_latitude', 'is', null)
      .not('service_longitude', 'is', null)
      .or('is_professional.eq.true,user_role.eq.professional')
      .limit(limit),
    supabase
      .from('listings')
      .select('id, title, latitude, longitude')
      .eq('listing_type', 'service_request')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit),
    supabase
      .from('profiles')
      .select('id, full_name, service_latitude, service_longitude')
      .eq('user_role', 'company')
      .not('service_latitude', 'is', null)
      .not('service_longitude', 'is', null)
      .limit(Math.floor(limit / 2)),
  ])

  const points: MapPoint[] = [
    ...(pros.data || []).map((p) => ({
      id: p.id,
      lat: Number(p.service_latitude),
      lng: Number(p.service_longitude),
      kind: 'professional' as const,
      label: p.full_name || 'Professional',
    })),
    ...(projects.data || []).map((p) => ({
      id: p.id,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      kind: 'project' as const,
      label: p.title || 'Project',
    })),
    ...(companies.data || []).map((p) => ({
      id: p.id,
      lat: Number(p.service_latitude),
      lng: Number(p.service_longitude),
      kind: 'company' as const,
      label: p.full_name || 'Company',
    })),
  ].filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  analyticsCacheSet(cacheKey, points)
  return points
}
