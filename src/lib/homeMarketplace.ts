import { supabase } from './supabase'
import {
  fetchMainMarketplaceCategories,
  type MarketplaceCategory,
} from './marketplaceCategories'
import type { ListingWithImages, Profile } from './types'

export type HomeMetrics = {
  professionals: number
  reviews: number
  countries: number
  projects: number
  appStoreUrl: string
  playStoreUrl: string
}

export type HomeProfessional = Profile & {
  professional_categories?: {
    category_id: string
    category?: { id: string; name: string; slug: string } | null
  }[]
}

export type HomeReview = {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
  is_verified_customer: boolean
  professional_id: string
  country_code?: string | null
  country_name?: string | null
  category?: string | null
  avatar_url?: string | null
}

export type HomeMapPoint = {
  id: string
  kind: 'professional' | 'project' | 'company'
  title: string
  subtitle?: string
  lat: number
  lng: number
  path: string
}

export type HomeMarketplaceData = {
  metrics: HomeMetrics
  categories: MarketplaceCategory[]
  projects: ListingWithImages[]
  professionals: HomeProfessional[]
  companies: HomeProfessional[]
  reviews: HomeReview[]
  mapPoints: HomeMapPoint[]
}

const DEFAULT_METRICS: HomeMetrics = {
  professionals: 52000,
  reviews: 1800000,
  countries: 27,
  projects: 950000,
  appStoreUrl: '',
  playStoreUrl: '',
}

function numFromMetric(row: unknown, fallback: number): number {
  if (!row || typeof row !== 'object') return fallback
  const n = Number((row as { value_num?: unknown }).value_num)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function textFromMetric(row: unknown): string {
  if (!row || typeof row !== 'object') return ''
  const t = (row as { value_text?: unknown }).value_text
  return typeof t === 'string' ? t.trim() : ''
}

export async function fetchHomepageMetrics(): Promise<HomeMetrics> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_homepage_metrics' as never,
  )

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    const map = rpcData as Record<string, unknown>
    return {
      professionals: numFromMetric(map.professionals, DEFAULT_METRICS.professionals),
      reviews: numFromMetric(map.reviews, DEFAULT_METRICS.reviews),
      countries: numFromMetric(map.countries, DEFAULT_METRICS.countries),
      projects: numFromMetric(map.projects, DEFAULT_METRICS.projects),
      appStoreUrl: textFromMetric(map.app_store_url),
      playStoreUrl: textFromMetric(map.play_store_url),
    }
  }

  const { data: rows } = await supabase.from('homepage_metrics' as never).select('*')
  if (Array.isArray(rows) && rows.length > 0) {
    const map: Record<string, unknown> = {}
    for (const row of rows) {
      if (row && typeof row === 'object' && 'key' in row) {
        map[String((row as { key: string }).key)] = row
      }
    }
    return {
      professionals: numFromMetric(map.professionals, DEFAULT_METRICS.professionals),
      reviews: numFromMetric(map.reviews, DEFAULT_METRICS.reviews),
      countries: numFromMetric(map.countries, DEFAULT_METRICS.countries),
      projects: numFromMetric(map.projects, DEFAULT_METRICS.projects),
      appStoreUrl: textFromMetric(map.app_store_url),
      playStoreUrl: textFromMetric(map.play_store_url),
    }
  }

  // Live fallbacks
  const metrics = { ...DEFAULT_METRICS }
  try {
    const { data: publicStats } = await supabase.rpc('get_public_footer_stats' as never)
    if (publicStats && typeof publicStats === 'object') {
      const row = publicStats as Record<string, unknown>
      const pros = Number(row.total_professionals ?? 0)
      const countries = Number(row.countries_count ?? 0)
      const projects = Number(row.total_listings_created ?? 0)
      if (pros > 0) metrics.professionals = Math.max(pros, metrics.professionals)
      if (countries > 0) metrics.countries = Math.max(countries, metrics.countries)
      if (projects > 0) metrics.projects = Math.max(projects, metrics.projects)
    }

    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)
      .or('is_hidden.is.null,is_hidden.eq.false')

    if (count && count > 0) {
      metrics.reviews = Math.max(count, metrics.reviews)
    }
  } catch {
    // keep defaults
  }

  return metrics
}

export async function fetchHomeProjects(limit = 12): Promise<ListingWithImages[]> {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('listings')
    .select('*, images:listing_images(*), category:categories(*)')
    .eq('listing_type', 'service_request')
    .eq('status', 'active')
    .gte('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as ListingWithImages[] | null) ?? []
}

export async function fetchHomeProfessionals(limit = 12): Promise<HomeProfessional[]> {
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      professional_categories(
        category_id,
        category:categories(id, name, slug)
      )
    `)
    .eq('is_professional', true)
    .eq('user_role', 'professional')
    .order('created_at', { ascending: false })
    .limit(Math.max(limit * 2, 24))

  return sortHomeProfiles((data as HomeProfessional[] | null) ?? []).slice(0, limit)
}

export async function fetchHomeCompanies(limit = 12): Promise<HomeProfessional[]> {
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      professional_categories(
        category_id,
        category:categories(id, name, slug)
      )
    `)
    .eq('is_professional', true)
    .eq('user_role', 'company')
    .order('created_at', { ascending: false })
    .limit(Math.max(limit * 2, 24))

  return sortHomeProfiles((data as HomeProfessional[] | null) ?? []).slice(0, limit)
}

function sortHomeProfiles(rows: HomeProfessional[]): HomeProfessional[] {
  return [...rows].sort((a, b) => {
    const af = a.is_featured ? 1 : 0
    const bf = b.is_featured ? 1 : 0
    if (bf !== af) return bf - af
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export async function fetchHomeReviews(limit = 8): Promise<HomeReview[]> {
  type Row = HomeReview & {
    listing?: {
      country_name?: string | null
      category?: { name?: string; slug?: string } | null
    } | null
  }

  const withListing = await supabase
    .from('reviews')
    .select(
      `
      id, reviewer_name, rating, comment, created_at, is_verified_customer, professional_id,
      listing:listings(id, country_name, category:categories(name, slug))
    `,
    )
    .eq('is_approved', true)
    .or('is_hidden.is.null,is_hidden.eq.false')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  let rows: Row[] = []
  if (!withListing.error && withListing.data) {
    rows = (withListing.data as Row[]) ?? []
  } else {
    const { data } = await supabase
      .from('reviews')
      .select(
        'id, reviewer_name, rating, comment, created_at, is_verified_customer, professional_id',
      )
      .eq('is_approved', true)
      .or('is_hidden.is.null,is_hidden.eq.false')
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    rows = (data as Row[] | null) ?? []
  }

  return rows
    .filter((r) => (r.comment ?? '').trim().length > 20)
    .map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      is_verified_customer: r.is_verified_customer,
      professional_id: r.professional_id,
      country_name: r.listing?.country_name ?? null,
      country_code: guessCountryCode(r.listing?.country_name),
      category: r.listing?.category?.name ?? null,
      avatar_url: null,
    }))
}

function guessCountryCode(name: string | null | undefined): string | null {
  if (!name) return null
  const n = name.toLowerCase()
  if (n.includes('german') || n === 'deutschland') return 'DE'
  if (n.includes('spain') || n.includes('espa')) return 'ES'
  if (n.includes('ukrain')) return 'UA'
  if (n.includes('france') || n.includes('frankreich')) return 'FR'
  if (n.includes('poland') || n.includes('polska')) return 'PL'
  if (n.includes('ital')) return 'IT'
  if (n.includes('portug')) return 'PT'
  if (n.includes('nether') || n.includes('holland')) return 'NL'
  if (n.includes('austria') || n.includes('öster')) return 'AT'
  if (n.includes('swiss') || n.includes('schweiz')) return 'CH'
  if (n.includes('romania') || n.includes('românia')) return 'RO'
  if (n.includes('czech')) return 'CZ'
  return null
}

const EUROPE_FALLBACK_COORDS: Array<{ lat: number; lng: number; city: string }> = [
  { lat: 52.52, lng: 13.405, city: 'Berlin' },
  { lat: 48.8566, lng: 2.3522, city: 'Paris' },
  { lat: 40.4168, lng: -3.7038, city: 'Madrid' },
  { lat: 52.2297, lng: 21.0122, city: 'Warsaw' },
  { lat: 50.4501, lng: 30.5234, city: 'Kyiv' },
  { lat: 41.9028, lng: 12.4964, city: 'Rome' },
  { lat: 48.2082, lng: 16.3738, city: 'Vienna' },
  { lat: 52.3676, lng: 4.9041, city: 'Amsterdam' },
  { lat: 50.0755, lng: 14.4378, city: 'Prague' },
  { lat: 38.7223, lng: -9.1393, city: 'Lisbon' },
]

export async function fetchHomeMapPoints(limit = 40): Promise<HomeMapPoint[]> {
  const [prosRes, companiesRes, projectsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, location, service_latitude, service_longitude, user_role')
      .eq('is_professional', true)
      .eq('user_role', 'professional')
      .not('service_latitude', 'is', null)
      .not('service_longitude', 'is', null)
      .order('rating', { ascending: false })
      .limit(limit),
    supabase
      .from('profiles')
      .select('id, full_name, location, service_latitude, service_longitude, user_role')
      .eq('user_role', 'company')
      .not('service_latitude', 'is', null)
      .not('service_longitude', 'is', null)
      .order('rating', { ascending: false })
      .limit(Math.ceil(limit / 2)),
    supabase
      .from('listings')
      .select('id, title, city_name, location, latitude, longitude, status')
      .eq('listing_type', 'service_request')
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  type GeoProfile = {
    id: string
    full_name: string | null
    location: string | null
    service_latitude: number | null
    service_longitude: number | null
  }
  type GeoListing = {
    id: string
    title: string
    city_name: string | null
    location: string | null
    latitude: number | null
    longitude: number | null
  }

  const points: HomeMapPoint[] = []

  for (const p of (prosRes.data as GeoProfile[] | null) ?? []) {
    if (p.service_latitude == null || p.service_longitude == null) continue
    points.push({
      id: `pro-${p.id}`,
      kind: 'professional',
      title: p.full_name || 'Professional',
      subtitle: p.location || undefined,
      lat: Number(p.service_latitude),
      lng: Number(p.service_longitude),
      path: `/professional/${p.id}`,
    })
  }

  for (const c of (companiesRes.data as GeoProfile[] | null) ?? []) {
    if (c.service_latitude == null || c.service_longitude == null) continue
    points.push({
      id: `co-${c.id}`,
      kind: 'company',
      title: c.full_name || 'Company',
      subtitle: c.location || undefined,
      lat: Number(c.service_latitude),
      lng: Number(c.service_longitude),
      path: `/professional/${c.id}`,
    })
  }

  for (const l of (projectsRes.data as GeoListing[] | null) ?? []) {
    if (l.latitude == null || l.longitude == null) continue
    points.push({
      id: `proj-${l.id}`,
      kind: 'project',
      title: l.title,
      subtitle: l.city_name || l.location || undefined,
      lat: Number(l.latitude),
      lng: Number(l.longitude),
      path: `/listing/${l.id}`,
    })
  }

  if (points.length >= 6) return points

  // Seed sample Europe markers so the map is useful before geo data is dense
  EUROPE_FALLBACK_COORDS.forEach((c, i) => {
    if (points.length >= 18) return
    const kind: HomeMapPoint['kind'] =
      i % 3 === 0 ? 'professional' : i % 3 === 1 ? 'project' : 'company'
    points.push({
      id: `seed-${kind}-${i}`,
      kind,
      title:
        kind === 'professional'
          ? `Pro near ${c.city}`
          : kind === 'project'
            ? `Project in ${c.city}`
            : `Company in ${c.city}`,
      subtitle: c.city,
      lat: c.lat + (i % 5) * 0.03,
      lng: c.lng + (i % 4) * 0.03,
      path:
        kind === 'project'
          ? '/projects'
          : kind === 'company'
            ? '/companies'
            : '/professionals',
    })
  })

  return points
}

export async function fetchHomeMarketplaceData(): Promise<HomeMarketplaceData> {
  const [metrics, categories, projects, professionals, companies, reviews, mapPoints] =
    await Promise.all([
      fetchHomepageMetrics(),
      fetchMainMarketplaceCategories(),
      fetchHomeProjects(),
      fetchHomeProfessionals(),
      fetchHomeCompanies(),
      fetchHomeReviews(),
      fetchHomeMapPoints(),
    ])

  return { metrics, categories, projects, professionals, companies, reviews, mapPoints }
}

export function formatHomeBudget(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = 'EUR',
  locale = 'en',
): string | null {
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(n)

  if (min != null && max != null && min > 0 && max > 0) {
    return `${fmt(min)} – ${fmt(max)}`
  }
  if (max != null && max > 0) return fmt(max)
  if (min != null && min > 0) return `${fmt(min)}+`
  return null
}
