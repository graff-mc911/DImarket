import { supabase } from './supabase'
import {
  fetchMainMarketplaceCategories,
  type MarketplaceCategory,
} from './marketplaceCategories'
import {
  excludeSuppressedFromQuery,
  filterSuppressedListings,
} from './suppressedListings'
import {
  filterPublicProfiles,
  sortProfilesForPublicDiscovery,
} from './publicProfileVisibility'
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


export type HomeMarketplaceData = {
  metrics: HomeMetrics
  categories: MarketplaceCategory[]
  projects: ListingWithImages[]
  professionals: HomeProfessional[]
  companies: HomeProfessional[]
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
  const { data } = await excludeSuppressedFromQuery(
    supabase
      .from('listings')
      .select('*, images:listing_images(*), category:categories(*)')
      .eq('listing_type', 'service_request')
      .eq('status', 'active')
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(limit),
  )

  return filterSuppressedListings((data as ListingWithImages[] | null) ?? [])
}

export async function fetchHomeProfessionals(limit = 12): Promise<HomeProfessional[]> {
  const select = `
      *,
      professional_categories(
        category_id,
        category:categories(id, name, slug)
      )
    `

  let query = supabase
    .from('profiles')
    .select(select)
    .eq('is_professional', true)
    .eq('user_role', 'professional')
    .order('rating', { ascending: false })
    .limit(Math.max(limit * 4, 48))

  // Soft-delete / hide columns (APPLY_OWNER_PROFILE_MODERATION.sql)
  let { data, error } = await (query as any).is('deleted_at', null).is('hidden_at', null)
  if (error && /deleted_at|hidden_at|42703/i.test(error.message || '')) {
    ;({ data, error } = await supabase
      .from('profiles')
      .select(select)
      .eq('is_professional', true)
      .eq('user_role', 'professional')
      .order('rating', { ascending: false })
      .limit(Math.max(limit * 4, 48)))
  }

  const rows = filterPublicProfiles((data as HomeProfessional[] | null) ?? [])
  return sortProfilesForPublicDiscovery(rows).slice(0, limit)
}

export async function fetchHomeCompanies(limit = 12): Promise<HomeProfessional[]> {
  const select = `
      *,
      professional_categories(
        category_id,
        category:categories(id, name, slug)
      )
    `

  let query = supabase
    .from('profiles')
    .select(select)
    .eq('is_professional', true)
    .eq('user_role', 'company')
    .order('rating', { ascending: false })
    .limit(Math.max(limit * 4, 48))

  let { data, error } = await (query as any).is('deleted_at', null).is('hidden_at', null)
  if (error && /deleted_at|hidden_at|42703/i.test(error.message || '')) {
    ;({ data } = await supabase
      .from('profiles')
      .select(select)
      .eq('is_professional', true)
      .eq('user_role', 'company')
      .order('rating', { ascending: false })
      .limit(Math.max(limit * 4, 48)))
  }

  const rows = filterPublicProfiles((data as HomeProfessional[] | null) ?? [])
  return sortProfilesForPublicDiscovery(rows).slice(0, limit)
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

export async function fetchHomeMarketplaceData(): Promise<HomeMarketplaceData> {
  const [metrics, categories, projects, professionals, companies, reviews] =
    await Promise.all([
      fetchHomepageMetrics(),
      fetchMainMarketplaceCategories(),
      fetchHomeProjects(),
      fetchHomeProfessionals(),
      fetchHomeCompanies(),
      fetchHomeReviews(),
    ])

  return { metrics, categories, projects, professionals, companies, reviews }
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
