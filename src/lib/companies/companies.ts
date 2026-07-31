import { countryFlag } from '../homeReviews'
import { supabase } from '../supabase'
import { COMPANY_CATEGORIES } from './categories'
import { enrichFallbackDetail, FALLBACK_COMPANIES } from './fallback'
import { isCompanyOpenNow } from './hours'
import type {
  Company,
  CompanyDetail,
  CompanyFilters,
  CompanyMapPoint,
  CompanyOpeningHours,
  CompanySocial,
  CompanySort,
} from './types'
import { COMPANY_PAGE_SIZE, EMPTY_COMPANY_FILTERS } from './types'

export { COMPANY_PAGE_SIZE, EMPTY_COMPANY_FILTERS }
export type { CompanyFilters, CompanySort }

function normalizeCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    owner_id: (row.owner_id as string | null) ?? null,
    slug: String(row.slug),
    name: String(row.name),
    logo_url: (row.logo_url as string | null) ?? null,
    cover_url: (row.cover_url as string | null) ?? null,
    short_description: (row.short_description as string | null) ?? null,
    about: (row.about as string | null) ?? null,
    category_slug: String(row.category_slug || ''),
    is_verified: Boolean(row.is_verified),
    is_premium: Boolean(row.is_premium),
    is_featured: Boolean(row.is_featured),
    rating: Number(row.rating) || 0,
    reviews_count: Number(row.reviews_count) || 0,
    completed_projects: Number(row.completed_projects) || 0,
    employees_count: row.employees_count == null ? null : Number(row.employees_count),
    founded_year: row.founded_year == null ? null : Number(row.founded_year),
    country_code: (row.country_code as string | null) ?? null,
    country_name: (row.country_name as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    postal_code: (row.postal_code as string | null) ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
    website: (row.website as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    opening_hours: (row.opening_hours as CompanyOpeningHours) || {},
    social: (row.social as CompanySocial) || {},
    status: (row.status as Company['status']) || 'published',
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function sortCompanies(items: Company[], sort: CompanySort): Company[] {
  const copy = [...items]
  if (sort === 'newest') {
    copy.sort((a, b) => b.created_at.localeCompare(a.created_at))
  } else if (sort === 'most_projects') {
    copy.sort(
      (a, b) =>
        b.completed_projects - a.completed_projects || b.rating - a.rating,
    )
  } else if (sort === 'alphabetically') {
    copy.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    copy.sort(
      (a, b) =>
        b.rating - a.rating ||
        b.reviews_count - a.reviews_count ||
        b.completed_projects - a.completed_projects,
    )
  }
  return copy
}

export function filterCompanies(items: Company[], filters: CompanyFilters): Company[] {
  const q = filters.q.trim().toLowerCase()
  const city = filters.city.trim().toLowerCase()
  const country = filters.country.trim().toLowerCase()
  const language = filters.language.trim().toLowerCase()

  return sortCompanies(
    items.filter((c) => {
      if (filters.category && c.category_slug !== filters.category) return false
      if (filters.verifiedOnly && !c.is_verified) return false
      if (filters.premiumOnly && !c.is_premium) return false
      if (filters.minRating > 0 && c.rating < filters.minRating) return false
      if (filters.openNow && !isCompanyOpenNow(c.opening_hours)) return false
      if (city && !(c.city || '').toLowerCase().includes(city)) return false
      if (
        country &&
        !(c.country_code || '').toLowerCase().includes(country) &&
        !(c.country_name || '').toLowerCase().includes(country)
      ) {
        return false
      }
      if (language && !c.languages.some((l) => l.toLowerCase() === language)) return false
      if (!q) return true
      const hay = [
        c.name,
        c.short_description,
        c.about,
        c.city,
        c.country_name,
        c.category_slug,
        ...c.languages,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    }),
    filters.sort,
  )
}

async function fetchAllPublishedFromDb(): Promise<Company[] | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('status', 'published')
    .order('rating', { ascending: false })
    .limit(500)

  if (error) {
    if (/relation|schema cache|does not exist/i.test(error.message)) return null
    console.error('fetchCompanies:', error)
    return null
  }
  return ((data ?? []) as Array<Record<string, unknown>>).map(normalizeCompany)
}

export async function fetchCompaniesCatalog(): Promise<Company[]> {
  const rows = await fetchAllPublishedFromDb()
  if (rows && rows.length) return rows
  if (rows && rows.length === 0) {
    // Table exists but empty — still show fallback for UX until seed applied
    return FALLBACK_COMPANIES
  }
  return FALLBACK_COMPANIES
}

export async function searchCompaniesPaged(
  filters: CompanyFilters,
  page = 0,
  pageSize = COMPANY_PAGE_SIZE,
): Promise<{ items: Company[]; total: number; hasMore: boolean }> {
  const all = filterCompanies(await fetchCompaniesCatalog(), filters)
  const start = page * pageSize
  const items = all.slice(start, start + pageSize)
  return {
    items,
    total: all.length,
    hasMore: start + pageSize < all.length,
  }
}

export async function fetchFeaturedCompanies(limit = 6): Promise<Company[]> {
  const all = await fetchCompaniesCatalog()
  const featured = all.filter((c) => c.is_featured)
  const pool = featured.length ? featured : all
  return sortCompanies(pool, 'highest_rated').slice(0, limit)
}

export async function fetchLatestCompanies(limit = 8): Promise<Company[]> {
  const all = await fetchCompaniesCatalog()
  return sortCompanies(all, 'newest').slice(0, limit)
}

export async function fetchCompanyMapPoints(filters?: Partial<CompanyFilters>): Promise<CompanyMapPoint[]> {
  const merged = { ...EMPTY_COMPANY_FILTERS, ...filters }
  const all = filterCompanies(await fetchCompaniesCatalog(), merged)
  return all
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      lat: c.latitude as number,
      lng: c.longitude as number,
      category_slug: c.category_slug,
      is_verified: c.is_verified,
      rating: c.rating,
      city: c.city,
      country_code: c.country_code,
    }))
}

export async function fetchCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!error && data) {
    const company = normalizeCompany(data as Record<string, unknown>)
    const id = company.id
    const [
      services,
      gallery,
      reviews,
      brands,
      team,
      certificates,
      licenses,
      portfolio,
    ] = await Promise.all([
      supabase.from('company_services').select('*').eq('company_id', id).order('sort_order'),
      supabase.from('company_gallery').select('*').eq('company_id', id).order('sort_order'),
      supabase
        .from('company_reviews')
        .select('*')
        .eq('company_id', id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false }),
      supabase.from('company_brands').select('*').eq('company_id', id).order('sort_order'),
      supabase.from('company_team').select('*').eq('company_id', id).order('sort_order'),
      supabase.from('company_certificates').select('*').eq('company_id', id).order('sort_order'),
      supabase.from('company_licenses').select('*').eq('company_id', id).order('sort_order'),
      supabase.from('company_portfolio').select('*').eq('company_id', id).order('sort_order'),
    ])

    return {
      ...company,
      services: (services.data as CompanyDetail['services']) ?? [],
      gallery: (gallery.data as CompanyDetail['gallery']) ?? [],
      reviews: (reviews.data as CompanyDetail['reviews']) ?? [],
      brands: (brands.data as CompanyDetail['brands']) ?? [],
      team: (team.data as CompanyDetail['team']) ?? [],
      certificates: (certificates.data as CompanyDetail['certificates']) ?? [],
      licenses: (licenses.data as CompanyDetail['licenses']) ?? [],
      portfolio: (portfolio.data as CompanyDetail['portfolio']) ?? [],
    }
  }

  const fb = FALLBACK_COMPANIES.find((c) => c.slug === slug)
  return fb ? enrichFallbackDetail(fb) : null
}

export function companyCountryFlag(code: string | null | undefined): string {
  if (!code) return ''
  return countryFlag(code)
}

export function popularCompanyCategories(
  companies: Company[],
  limit = 8,
): Array<{ slug: string; count: number }> {
  const counts = new Map<string, number>()
  for (const c of companies) {
    counts.set(c.category_slug, (counts.get(c.category_slug) || 0) + 1)
  }
  const known = new Set(COMPANY_CATEGORIES.map((c) => c.slug))
  return [...counts.entries()]
    .filter(([slug]) => known.has(slug as never))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, count]) => ({ slug, count }))
}

export function parseCompanyFiltersFromSearch(search: string): CompanyFilters {
  const params = new URLSearchParams(search)
  const sort = (params.get('sort') || 'highest_rated') as CompanySort
  const allowed: CompanySort[] = [
    'highest_rated',
    'newest',
    'most_projects',
    'alphabetically',
  ]
  return {
    q: params.get('q') || '',
    category: params.get('category') || '',
    city: params.get('city') || '',
    country: params.get('country') || '',
    language: params.get('language') || '',
    verifiedOnly: params.get('verified') === '1',
    premiumOnly: params.get('premium') === '1',
    openNow: params.get('open') === '1',
    minRating: Number(params.get('rating') || 0) || 0,
    sort: allowed.includes(sort) ? sort : 'highest_rated',
  }
}

export function companyFiltersToSearch(filters: CompanyFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.city) params.set('city', filters.city)
  if (filters.country) params.set('country', filters.country)
  if (filters.language) params.set('language', filters.language)
  if (filters.verifiedOnly) params.set('verified', '1')
  if (filters.premiumOnly) params.set('premium', '1')
  if (filters.openNow) params.set('open', '1')
  if (filters.minRating > 0) params.set('rating', String(filters.minRating))
  if (filters.sort !== 'highest_rated') params.set('sort', filters.sort)
  const s = params.toString()
  return s ? `?${s}` : ''
}
