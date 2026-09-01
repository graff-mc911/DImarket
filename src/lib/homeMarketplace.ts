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
import { isBusinessNamedProfessional } from './professionalDisplay'
import { canonicalCountryName, countryQueryNames } from './geoAliases'
import { matchProfileGeo, type GeoSearchState } from './geoSearch'
import { listingLocationMatches } from './listingLocation'
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

/** Seeded marketing numbers historically stored in homepage_metrics — never show as live truth. */
function looksLikePlaceholderMetric(n: number, kind: 'professionals' | 'reviews' | 'countries' | 'projects'): boolean {
  if (kind === 'professionals' && n >= 10000) return true
  if (kind === 'reviews' && n >= 100000) return true
  if (kind === 'projects' && n >= 100000) return true
  if (kind === 'countries' && n === 27) return true
  return false
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

async function fetchLiveMarketplaceMetrics(): Promise<Partial<HomeMetrics>> {
  const out: Partial<HomeMetrics> = {}
  try {
    const { data: publicStats } = await supabase.rpc('get_public_footer_stats' as never)
    if (publicStats && typeof publicStats === 'object') {
      const row = publicStats as Record<string, unknown>
      const pros = Number(row.total_professionals ?? 0)
      const countries = Number(row.countries_count ?? 0)
      const projects = Number(row.total_listings_created ?? 0)
      if (pros > 0) out.professionals = pros
      if (countries > 0) out.countries = countries
      if (projects > 0) out.projects = projects
    }
  } catch {
    /* ignore */
  }
  try {
    const { count: proCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_professional', true)
    if (proCount && proCount > 0) {
      out.professionals = Math.max(out.professionals ?? 0, proCount)
    }
  } catch {
    /* ignore */
  }
  try {
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)
      .or('is_hidden.is.null,is_hidden.eq.false')
    if (count && count > 0) out.reviews = count
  } catch {
    /* ignore */
  }
  return out
}

export async function fetchHomepageMetrics(): Promise<HomeMetrics> {
  const live = await fetchLiveMarketplaceMetrics()
  const metrics: HomeMetrics = {
    professionals: live.professionals ?? 0,
    reviews: live.reviews ?? 0,
    countries: live.countries ?? 0,
    projects: live.projects ?? 0,
    appStoreUrl: '',
    playStoreUrl: '',
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_homepage_metrics' as never,
  )

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    const map = rpcData as Record<string, unknown>
    const seededPros = numFromMetric(map.professionals, 0)
    const seededCountries = numFromMetric(map.countries, 0)
    const seededProjects = numFromMetric(map.projects, 0)
    // Prefer live counts; only use seeded if live missing AND seed is not a known placeholder inflate.
    if (!metrics.professionals && seededPros && !looksLikePlaceholderMetric(seededPros, 'professionals')) {
      metrics.professionals = seededPros
    }
    // Never use seeded/marketing review counts — only live approved rows.
    if (!metrics.countries && seededCountries && !looksLikePlaceholderMetric(seededCountries, 'countries')) {
      metrics.countries = seededCountries
    }
    if (!metrics.projects && seededProjects && !looksLikePlaceholderMetric(seededProjects, 'projects')) {
      metrics.projects = seededProjects
    }
    metrics.appStoreUrl = textFromMetric(map.app_store_url)
    metrics.playStoreUrl = textFromMetric(map.play_store_url)
  }

  return metrics
}

export async function fetchHomeProjects(
  limit = 12,
  geo?: GeoSearchState,
): Promise<ListingWithImages[]> {
  const now = new Date().toISOString()
  let query = supabase
    .from('listings')
    .select('*, images:listing_images(*), category:categories(*)')
    .eq('listing_type', 'service_request')
    .eq('status', 'active')
    .gte('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(geo?.country ? Math.max(limit * 8, 48) : limit)

  if (geo?.country) {
    const country = canonicalCountryName(geo.country)
    query = query.or(`location.ilike.%${country}%,country_name.ilike.%${country}%`)
  }

  const { data } = await excludeSuppressedFromQuery(query)
  return filterHomeProjectsByGeo(
    filterSuppressedListings((data as ListingWithImages[] | null) ?? []),
    geo,
    limit,
  )
}

function applyCountryLocationFilter(query: any, country?: string | null) {
  const name = country?.trim()
  if (!name) return query
  return query.ilike('location', `%${canonicalCountryName(name)}%`)
}

function listingMatchesGeo(listing: ListingWithImages, geo: GeoSearchState | undefined): boolean {
  if (!geo?.country && !geo?.city && !geo?.region) return true
  const blob = [listing.country_name, listing.city_name, listing.location].filter(Boolean).join(', ')
  if (geo.country) {
    const countryOk = countryQueryNames(canonicalCountryName(geo.country)).some((name) =>
      listingLocationMatches(name, blob),
    )
    if (!countryOk) return false
  }
  if (geo.city && !listingLocationMatches(geo.city, blob)) return false
  if (geo.region && !geo.city && !listingLocationMatches(geo.region, blob)) return false
  return true
}

export function filterHomeProfessionalsByGeo(
  rows: HomeProfessional[],
  geo: GeoSearchState | undefined,
  limit = 4,
): HomeProfessional[] {
  const matched = geo ? rows.filter((row) => matchProfileGeo(row, geo).matches) : rows
  return matched.slice(0, limit)
}

export function filterHomeProjectsByGeo(
  rows: ListingWithImages[],
  geo: GeoSearchState | undefined,
  limit = 12,
): ListingWithImages[] {
  const matched = geo ? rows.filter((row) => listingMatchesGeo(row, geo)) : rows
  return matched.slice(0, limit)
}

export async function fetchHomeProfessionals(
  limit = 12,
  geo?: GeoSearchState,
): Promise<HomeProfessional[]> {
  const select = `
      *,
      professional_categories(
        category_id,
        category:categories(id, name, slug)
      )
    `

  const rowLimit = Math.max(limit * 8, 96)
  let query = supabase
    .from('profiles')
    .select(select)
    .eq('is_professional', true)
    .eq('user_role', 'professional')
    .order('rating', { ascending: false })
    .limit(rowLimit)

  query = applyCountryLocationFilter(query, geo?.country)

  // Soft-delete / hide columns (APPLY_OWNER_PROFILE_MODERATION.sql)
  let { data, error } = await (query as any).is('deleted_at', null).is('hidden_at', null)
  if (error && /deleted_at|hidden_at|42703/i.test(error.message || '')) {
    let fallback = supabase
      .from('profiles')
      .select(select)
      .eq('is_professional', true)
      .eq('user_role', 'professional')
      .order('rating', { ascending: false })
      .limit(rowLimit)
    fallback = applyCountryLocationFilter(fallback, geo?.country)
    ;({ data, error } = await fallback)
  }

  const rows = filterPublicProfiles((data as HomeProfessional[] | null) ?? [], {
    requireReachability: false,
  })
  return sortProfilesForPublicDiscovery(rows)
}

export async function fetchHomeCompanies(
  limit = 12,
  geo?: GeoSearchState,
): Promise<HomeProfessional[]> {
  const select = `
      *,
      professional_categories(
        category_id,
        category:categories(id, name, slug)
      )
    `

  const rowLimit = Math.max(limit * 8, 96)
  let query = supabase
    .from('profiles')
    .select(select)
    .eq('is_professional', true)
    .eq('user_role', 'company')
    .order('rating', { ascending: false })
    .limit(rowLimit)

  query = applyCountryLocationFilter(query, geo?.country)

  let { data, error } = await (query as any).is('deleted_at', null).is('hidden_at', null)
  if (error && /deleted_at|hidden_at|42703/i.test(error.message || '')) {
    let fallback = supabase
      .from('profiles')
      .select(select)
      .eq('is_professional', true)
      .eq('user_role', 'company')
      .order('rating', { ascending: false })
      .limit(rowLimit)
    fallback = applyCountryLocationFilter(fallback, geo?.country)
    ;({ data } = await fallback)
  }

  const rows = filterPublicProfiles((data as HomeProfessional[] | null) ?? [], {
    requireReachability: false,
  })
  return sortProfilesForPublicDiscovery(rows)
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

export async function fetchHomeMarketplaceData(
  geo?: GeoSearchState,
): Promise<HomeMarketplaceData> {
  const [metrics, categories, projects, professionals, companies, reviews] =
    await Promise.all([
      fetchHomepageMetrics(),
      fetchMainMarketplaceCategories(),
      fetchHomeProjects(12, geo),
      fetchHomeProfessionals(12, geo),
      fetchHomeCompanies(12, geo),
      fetchHomeReviews(),
    ])

  const misplacedCompanies = professionals.filter(isBusinessNamedProfessional)
  const masterPros = professionals.filter((p) => !isBusinessNamedProfessional(p))
  const companyRows = sortProfilesForPublicDiscovery([...companies, ...misplacedCompanies])

  return {
    metrics,
    categories,
    projects,
    professionals: masterPros,
    companies: companyRows,
    reviews,
  }
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
