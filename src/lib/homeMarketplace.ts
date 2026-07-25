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
}

export type HomeMarketplaceData = {
  metrics: HomeMetrics
  categories: MarketplaceCategory[]
  projects: ListingWithImages[]
  professionals: HomeProfessional[]
  reviews: HomeReview[]
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
    .order('rating', { ascending: false })
    .limit(limit)

  return ((data as HomeProfessional[] | null) ?? []).sort((a, b) => {
    const af = a.is_featured ? 1 : 0
    const bf = b.is_featured ? 1 : 0
    if (bf !== af) return bf - af
    return (b.rating ?? 0) - (a.rating ?? 0)
  })
}

export async function fetchHomeReviews(limit = 8): Promise<HomeReview[]> {
  const { data } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, comment, created_at, is_verified_customer, professional_id')
    .eq('is_approved', true)
    .or('is_hidden.is.null,is_hidden.eq.false')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = (data as HomeReview[] | null) ?? []
  return rows.filter((r) => (r.comment ?? '').trim().length > 20)
}

export async function fetchHomeMarketplaceData(): Promise<HomeMarketplaceData> {
  const [metrics, categories, projects, professionals, reviews] = await Promise.all([
    fetchHomepageMetrics(),
    fetchMainMarketplaceCategories(),
    fetchHomeProjects(),
    fetchHomeProfessionals(),
    fetchHomeReviews(),
  ])

  return { metrics, categories, projects, professionals, reviews }
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
