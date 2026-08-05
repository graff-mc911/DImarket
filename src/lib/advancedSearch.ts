import { supabase } from './supabase'
import {
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  marketplaceServiceProsPath,
  type MarketplaceCategory,
} from './marketplaceCategories'
import { haversineKm } from './projectFeed'
import {
  matchesServiceProfile,
  resolveServiceQuery,
  serviceCanonicalPath,
  type ResolvedService,
} from './serviceTaxonomy'
import type { ListingWithImages, Profile } from './types'
import { excludeSuppressedFromQuery, isSuppressedListing } from './suppressedListings'

export type SearchEntityType =
  | 'professional'
  | 'category'
  | 'service'
  | 'project'
  | 'material'

export type SearchSuggestion = {
  id: string
  type: SearchEntityType
  label: string
  sublabel?: string
  path: string
}

export type SearchSort = 'best_match' | 'closest' | 'newest' | 'highest_rated'

export type SearchFilters = {
  country: string
  city: string
  distanceKm: number | null
  minRating: number
  availability: '' | 'available' | 'busy' | 'limited'
  priceMin: number | null
  priceMax: number | null
  languages: string[]
  verifiedOnly: boolean
  lat: number | null
  lng: number | null
}

export type AdvancedSearchResults = {
  professionals: Profile[]
  categories: MarketplaceCategory[]
  services: Array<MarketplaceCategory & { parentSlug?: string; href?: string }>
  projects: ListingWithImages[]
  materials: ListingWithImages[]
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  country: '',
  city: '',
  distanceKm: null,
  minRating: 0,
  availability: '',
  priceMin: null,
  priceMax: null,
  languages: [],
  verifiedOnly: false,
  lat: null,
  lng: null,
}

function scoreText(haystack: string, query: string): number {
  const h = haystack.toLowerCase()
  const q = query.toLowerCase()
  if (!q) return 0
  if (h === q) return 100
  if (h.startsWith(q)) return 80
  if (h.includes(q)) return 50
  const tokens = q.split(/\s+/).filter(Boolean)
  const hits = tokens.filter((t) => h.includes(t)).length
  return hits * 15
}

function taxonomyServiceSuggestions(resolved: ResolvedService[]): SearchSuggestion[] {
  return resolved.slice(0, 8).map((r) => ({
    id: `tax-${r.subcategory.slug}`,
    type: 'service' as const,
    label: r.subcategory.title.en,
    sublabel: r.category.title.en,
    path: serviceCanonicalPath(r.subcategory.slug),
  }))
}

/**
 * SERVICE INDEX ONLY — professionals, companies, categories, services, projects, materials.
 * Never calls Nominatim / geocoder.
 */
export async function fetchSearchSuggestions(
  query: string,
  lang: string,
): Promise<SearchSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const like = `%${q}%`
  const resolved = resolveServiceQuery(q)

  const [catsRes, prosRes, projectsRes, materialsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, icon_key, is_main, is_service, parent_id, name_i18n')
      .or(`name.ilike.${like},slug.ilike.${like}`)
      .limit(8),
    supabase
      .from('profiles')
      .select(
        'id, full_name, location, is_professional, user_role, bio, work_subcategory_slugs, professional_categories:professional_categories(category:categories(name, slug))',
      )
      .eq('is_professional', true)
      .in('user_role', ['professional', 'company'])
      .limit(40),
    excludeSuppressedFromQuery(
      supabase
        .from('listings')
        .select('id, title, city_name, location, status')
        .eq('listing_type', 'service_request')
        .eq('status', 'active')
        .ilike('title', like)
        .limit(6),
    ),
    supabase
      .from('listings')
      .select('id, title, city_name, location, status, listing_type')
      .eq('status', 'active')
      .neq('listing_type', 'service_request')
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(6),
  ])

  const suggestions: SearchSuggestion[] = []
  const seen = new Set<string>()

  for (const s of taxonomyServiceSuggestions(resolved)) {
    if (seen.has(s.path)) continue
    seen.add(s.path)
    suggestions.push(s)
  }

  for (const c of (catsRes.data as MarketplaceCategory[] | null) ?? []) {
    const label = marketplaceCategoryLabel(c, lang)
    const isService = c.is_service === true
    const path = isService
      ? marketplaceServiceProsPath(c.slug)
      : marketplaceCategoryPath(c.slug)
    if (seen.has(path)) continue
    seen.add(path)
    suggestions.push({
      id: `cat-${c.id}`,
      type: isService ? 'service' : 'category',
      label,
      sublabel: isService ? 'Service' : 'Category',
      path,
    })
  }

  const pros = (prosRes.data as Array<
    Pick<Profile, 'id' | 'full_name' | 'location' | 'bio' | 'work_subcategory_slugs'> & {
      professional_categories?: { category?: { name?: string | null; slug?: string | null } | null }[]
    }
  > | null) ?? []

  const matchedPros = resolved.length
    ? pros.filter((p) => resolved.some((r) => matchesServiceProfile(p, r.matcher)))
    : pros.filter(
        (p) =>
          scoreText(p.full_name ?? '', q) > 0 ||
          scoreText(p.bio ?? '', q) > 0 ||
          scoreText(p.location ?? '', q) > 0,
      )

  for (const p of matchedPros.slice(0, 6)) {
    suggestions.push({
      id: `pro-${p.id}`,
      type: 'professional',
      label: p.full_name || 'Professional',
      sublabel: p.location || undefined,
      path: `/professional/${p.id}`,
    })
  }

  for (const l of ((projectsRes.data as Array<{
    id: string
    title: string
    city_name: string | null
    location: string | null
    description?: string | null
  }> | null) ?? []).filter((row) => !isSuppressedListing(row))) {
    suggestions.push({
      id: `proj-${l.id}`,
      type: 'project',
      label: l.title,
      sublabel: l.city_name || l.location || undefined,
      path: `/listing/${l.id}`,
    })
  }

  for (const l of (materialsRes.data as Array<{
    id: string
    title: string
    city_name: string | null
    location: string | null
  }> | null) ?? []) {
    suggestions.push({
      id: `mat-${l.id}`,
      type: 'material',
      label: l.title,
      sublabel: l.city_name || l.location || undefined,
      path: `/listing/${l.id}`,
    })
  }

  return suggestions.slice(0, 16)
}

function passesLocationFilters(
  locHaystack: string,
  filters: SearchFilters,
  coords: { lat: number | null; lng: number | null },
): boolean {
  const cityNeedle = filters.city.trim().toLowerCase()
  const countryNeedle = filters.country.trim().toLowerCase()
  const loc = locHaystack.toLowerCase()
  if (cityNeedle && !loc.includes(cityNeedle)) {
    // If we have distance + coords, admin city string is optional
    if (!(filters.distanceKm != null && filters.lat != null && filters.lng != null && coords.lat != null && coords.lng != null)) {
      return false
    }
  }
  if (countryNeedle && !loc.includes(countryNeedle)) {
    if (!(filters.distanceKm != null && filters.lat != null && filters.lng != null && coords.lat != null && coords.lng != null)) {
      return false
    }
  }
  if (
    filters.distanceKm != null &&
    filters.lat != null &&
    filters.lng != null &&
    coords.lat != null &&
    coords.lng != null
  ) {
    const d = haversineKm(
      { lat: filters.lat, lon: filters.lng },
      { lat: coords.lat, lon: coords.lng },
    )
    if (d > filters.distanceKm) return false
  }
  return true
}

/**
 * Full SERVICE search. Location filters apply separately.
 * Never geocodes the service query.
 */
export async function runAdvancedSearch(
  query: string,
  filters: SearchFilters,
  sort: SearchSort,
  lang: string,
): Promise<AdvancedSearchResults> {
  const q = query.trim()
  const like = q ? `%${q}%` : null
  const resolved = q ? resolveServiceQuery(q) : []

  const catSelect =
    'id, name, slug, icon_key, is_main, is_service, parent_id, name_i18n, professionals_count, avg_rating, cover_image_url, description, description_i18n, services_count, completed_projects_count, sort_order'

  let catsQuery = supabase.from('categories').select(catSelect).eq('is_main', true).limit(24)
  let servicesQuery = supabase
    .from('categories')
    .select(catSelect)
    .eq('is_service', true)
    .limit(40)

  if (like && !resolved.length) {
    catsQuery = catsQuery.or(`name.ilike.${like},slug.ilike.${like}`)
    servicesQuery = servicesQuery.or(`name.ilike.${like},slug.ilike.${like}`)
  } else if (!like) {
    catsQuery = catsQuery.order('sort_order', { ascending: true })
    servicesQuery = servicesQuery.order('professionals_count', { ascending: false })
  }

  // When searching a profession, load directory broadly and match by work taxonomy.
  let prosQuery = supabase
    .from('profiles')
    .select('*, professional_categories:professional_categories(category:categories(name, slug))')
    .eq('is_professional', true)
    .in('user_role', ['professional', 'company'])
    .limit(resolved.length ? 120 : 80)

  if (like && !resolved.length) {
    prosQuery = prosQuery.or(
      `full_name.ilike.${like},bio.ilike.${like},location.ilike.${like}`,
    )
  }

  let projectsQuery = excludeSuppressedFromQuery(
    supabase
      .from('listings')
      .select('*, images:listing_images(*), category:categories(*)')
      .eq('listing_type', 'service_request')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(60),
  )

  if (like) {
    projectsQuery = projectsQuery.or(
      `title.ilike.${like},description.ilike.${like},location.ilike.${like},city_name.ilike.${like}`,
    )
  }

  let materialsQuery = supabase
    .from('listings')
    .select('*, images:listing_images(*), category:categories(*)')
    .eq('status', 'active')
    .neq('listing_type', 'service_request')
    .order('created_at', { ascending: false })
    .limit(40)

  if (like) {
    materialsQuery = materialsQuery.or(
      `title.ilike.${like},description.ilike.${like},location.ilike.${like},city_name.ilike.${like}`,
    )
  }

  const [catsRes, servicesRes, prosRes, projectsRes, materialsRes] = await Promise.all([
    catsQuery,
    servicesQuery,
    prosQuery,
    projectsQuery,
    materialsQuery,
  ])

  let categories = (catsRes.data as MarketplaceCategory[] | null) ?? []
  type ServiceRow = MarketplaceCategory & { parentSlug?: string; href?: string }
  let services: ServiceRow[] = ((servicesRes.data as MarketplaceCategory[] | null) ?? []).map((s) => ({
    ...s,
    parentSlug: undefined,
    href: undefined,
  }))

  // Merge taxonomy services into results (priority over empty DB hits)
  if (resolved.length) {
    const taxServices: ServiceRow[] = resolved.map((r) => ({
      ...( {
        id: `tax-${r.subcategory.slug}`,
        name: r.subcategory.title.en,
        slug: r.subcategory.slug,
        icon_key: r.subcategory.icon,
        is_main: false,
        is_service: true,
        parent_id: null,
        name_i18n: r.subcategory.title,
        professionals_count: 0,
        avg_rating: null,
        cover_image_url: r.subcategory.image,
        description: r.subcategory.description.en,
        description_i18n: r.subcategory.description,
        services_count: 0,
        completed_projects_count: 0,
        sort_order: 0,
      } as unknown as MarketplaceCategory),
      parentSlug: r.category.slug,
      href: serviceCanonicalPath(r.subcategory.slug),
    }))
    services = [
      ...taxServices,
      ...services.filter((s) => !resolved.some((r) => r.subcategory.slug === s.slug)),
    ]
  }

  if (q && !resolved.length) {
    categories = categories.filter((c) => {
      const label = marketplaceCategoryLabel(c, lang)
      return scoreText(label, q) > 0 || scoreText(c.slug, q) > 0 || scoreText(c.name, q) > 0
    })
    services = services.filter((s) => {
      const label = marketplaceCategoryLabel(s, lang)
      return scoreText(label, q) > 0 || scoreText(s.slug, q) > 0 || scoreText(s.name, q) > 0
    })
  } else if (resolved.length) {
    categories = categories.filter((c) =>
      resolved.some(
        (r) =>
          c.slug === r.category.slug ||
          scoreText(marketplaceCategoryLabel(c, lang), q) > 0,
      ),
    )
  }

  let professionals = (prosRes.data as Profile[] | null) ?? []
  let projects = ((projectsRes.data as ListingWithImages[] | null) ?? []).filter(
    (row) => !isSuppressedListing(row),
  )
  let materials = (materialsRes.data as ListingWithImages[] | null) ?? []

  if (resolved.length) {
    professionals = professionals.filter((p) =>
      resolved.some((r) => matchesServiceProfile(p, r.matcher)),
    )
  }

  professionals = professionals.filter((p) => {
    if (filters.verifiedOnly && !p.is_verified) return false
    if (filters.minRating > 0 && (p.rating ?? 0) < filters.minRating) return false
    if (filters.availability && p.availability_status !== filters.availability) return false
    if (filters.languages.length > 0) {
      const langs = (p.languages ?? []).map((l) => l.toLowerCase())
      if (!filters.languages.some((l) => langs.includes(l.toLowerCase()))) return false
    }
    return passesLocationFilters(p.location ?? '', filters, {
      lat: p.service_latitude ?? null,
      lng: p.service_longitude ?? null,
    })
  })

  projects = projects.filter((l) => {
    if (filters.priceMin != null && (l.budget_max ?? l.budget_min ?? 0) < filters.priceMin) {
      return false
    }
    if (filters.priceMax != null) {
      const price = l.budget_min ?? l.budget_max
      if (price != null && price > filters.priceMax) return false
    }
    return passesLocationFilters(
      `${l.city_name ?? ''} ${l.location ?? ''} ${l.country_name ?? ''}`,
      filters,
      { lat: l.latitude ?? null, lng: l.longitude ?? null },
    )
  })

  materials = materials.filter((l) =>
    passesLocationFilters(
      `${l.city_name ?? ''} ${l.location ?? ''} ${l.country_name ?? ''}`,
      filters,
      { lat: l.latitude ?? null, lng: l.longitude ?? null },
    ),
  )

  const sortPros = (list: Profile[]) => {
    const copy = [...list]
    switch (sort) {
      case 'highest_rated':
        return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      case 'newest':
        return copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      case 'closest':
        if (filters.lat == null || filters.lng == null) return copy
        return copy.sort((a, b) => {
          const da =
            a.service_latitude != null && a.service_longitude != null
              ? haversineKm(
                  { lat: filters.lat!, lon: filters.lng! },
                  { lat: a.service_latitude, lon: a.service_longitude },
                )
              : 99999
          const db =
            b.service_latitude != null && b.service_longitude != null
              ? haversineKm(
                  { lat: filters.lat!, lon: filters.lng! },
                  { lat: b.service_latitude, lon: b.service_longitude },
                )
              : 99999
          return da - db
        })
      case 'best_match':
      default:
        if (!q) return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        return copy.sort((a, b) => {
          const sa =
            scoreText(a.full_name ?? '', q) +
            scoreText(a.bio ?? '', q) * 0.3 +
            (a.rating ?? 0)
          const sb =
            scoreText(b.full_name ?? '', q) +
            scoreText(b.bio ?? '', q) * 0.3 +
            (b.rating ?? 0)
          return sb - sa
        })
    }
  }

  const sortListings = (list: ListingWithImages[]) => {
    const copy = [...list]
    switch (sort) {
      case 'newest':
        return copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      case 'closest':
        if (filters.lat == null || filters.lng == null) return copy
        return copy.sort((a, b) => {
          const da =
            a.latitude != null && a.longitude != null
              ? haversineKm(
                  { lat: filters.lat!, lon: filters.lng! },
                  { lat: a.latitude, lon: a.longitude },
                )
              : 99999
          const db =
            b.latitude != null && b.longitude != null
              ? haversineKm(
                  { lat: filters.lat!, lon: filters.lng! },
                  { lat: b.latitude, lon: b.longitude },
                )
              : 99999
          return da - db
        })
      case 'highest_rated':
        return copy
      case 'best_match':
      default:
        if (!q) return copy
        return copy.sort(
          (a, b) =>
            scoreText(b.title, q) +
            scoreText(b.description ?? '', q) * 0.2 -
            (scoreText(a.title, q) + scoreText(a.description ?? '', q) * 0.2),
        )
    }
  }

  return {
    professionals: sortPros(professionals).slice(0, 40),
    categories: categories.slice(0, 24),
    services: services.slice(0, 40),
    projects: sortListings(projects).slice(0, 40),
    materials: sortListings(materials).slice(0, 40),
  }
}

export function parseSearchParams(search: string): {
  q: string
  sort: SearchSort
  filters: SearchFilters
} {
  const params = new URLSearchParams(search)
  const sortRaw = params.get('sort') || 'best_match'
  const sort: SearchSort = (
    ['best_match', 'closest', 'newest', 'highest_rated'] as SearchSort[]
  ).includes(sortRaw as SearchSort)
    ? (sortRaw as SearchSort)
    : 'best_match'

  const langs = (params.get('languages') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    q: params.get('q') || params.get('search') || '',
    sort,
    filters: {
      ...EMPTY_SEARCH_FILTERS,
      country: params.get('country') || '',
      city: params.get('city') || '',
      distanceKm: params.get('distance') ? Number(params.get('distance')) : null,
      minRating: params.get('rating') ? Number(params.get('rating')) : 0,
      availability: (params.get('availability') as SearchFilters['availability']) || '',
      priceMin: params.get('priceMin') ? Number(params.get('priceMin')) : null,
      priceMax: params.get('priceMax') ? Number(params.get('priceMax')) : null,
      languages: langs,
      verifiedOnly: params.get('verified') === '1',
      lat: params.get('lat') ? Number(params.get('lat')) : null,
      lng: params.get('lng') ? Number(params.get('lng')) : null,
    },
  }
}

export function buildSearchUrl(
  q: string,
  filters: SearchFilters,
  sort: SearchSort,
): string {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (sort !== 'best_match') params.set('sort', sort)
  if (filters.country) params.set('country', filters.country)
  if (filters.city) params.set('city', filters.city)
  if (filters.distanceKm != null) params.set('distance', String(filters.distanceKm))
  if (filters.minRating > 0) params.set('rating', String(filters.minRating))
  if (filters.availability) params.set('availability', filters.availability)
  if (filters.priceMin != null) params.set('priceMin', String(filters.priceMin))
  if (filters.priceMax != null) params.set('priceMax', String(filters.priceMax))
  if (filters.languages.length) params.set('languages', filters.languages.join(','))
  if (filters.verifiedOnly) params.set('verified', '1')
  if (filters.lat != null) params.set('lat', String(filters.lat))
  if (filters.lng != null) params.set('lng', String(filters.lng))
  const qs = params.toString()
  return qs ? `/search?${qs}` : '/search'
}
