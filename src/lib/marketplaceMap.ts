/**
 * Marketplace map data: professionals, companies, manufacturers, agents, listings.
 * Loaded live from Supabase — never hardcoded for production markers.
 */

import { supabase } from './supabase'
import {
  formatLocationParts,
  inferCoordsFromLocationText,
  matchProfileGeo,
  radiusModeToKm,
  type GeoSearchState,
} from './geoSearch'
import { resolveDirectoryAvatarUrl } from './directoryAvatars'
import { matchesServiceProfile, resolveServiceQuery } from './serviceTaxonomy'
import {
  excludeSuppressedFromQuery,
  filterSuppressedListings,
} from './suppressedListings'
import { isLikelyQaOrTestName } from './publicProfileVisibility'
import { formatDistanceKm, haversineKm } from './projectFeed'

/** Default Leaflet view — Europe overview (sole constant for map init). */
export const DEFAULT_EUROPE_VIEW = {
  center: [50.1, 10.5] as [number, number],
  zoom: 4,
}

/** Country focus centers for mapFocusFromGeo (extend when adding directory countries). */
export const COUNTRY_MAP_CENTERS: Record<string, [number, number]> = {
  germany: [51.1, 10.4],
  spain: [40.4, -3.7],
  france: [46.6, 2.2],
  italy: [42.5, 12.5],
  poland: [52.1, 19.4],
  portugal: [39.4, -8.2],
  ukraine: [48.4, 31.2],
  slovakia: [48.7, 19.7],
  romania: [45.9, 24.97],
  netherlands: [52.1, 5.3],
  belgium: [50.5, 4.5],
  czech: [49.8, 15.5],
  austria: [47.6, 14.1],
}

export type MapMarkerKind =
  | 'professional'
  | 'company'
  | 'manufacturer'
  | 'agent'
  | 'project'
  | 'marketplace'
  | 'job'

export type MarketplaceMapMarker = {
  id: string
  kind: MapMarkerKind
  title: string
  subtitle: string
  description: string
  city: string
  country: string
  rating: number | null
  verified: boolean
  photoUrl: string | null
  category: string
  budgetLabel: string
  status: string
  availability: string
  /** True when professional signals available / online-ready */
  online: boolean
  lat: number
  lng: number
  path: string
  location: string | null
  service_latitude: number | null
  service_longitude: number | null
  service_radius_km: number | null
  work_subcategory_slugs: string[] | null
  user_role: string | null
  listingType: string | null
  distanceKm: number | null
}

export type MapExploreFilters = {
  kinds: Set<MapMarkerKind> | 'all'
  categorySlug: string
  subcategorySlug: string
  serviceQuery: string
  verifiedOnly: boolean
  minRating: number
  availableOnly: boolean
}

export const EMPTY_MAP_FILTERS: MapExploreFilters = {
  kinds: 'all',
  categorySlug: '',
  subcategorySlug: '',
  serviceQuery: '',
  verifiedOnly: false,
  minRating: 0,
  availableOnly: false,
}

export const MAP_KIND_COLORS: Record<MapMarkerKind | 'mixed', string> = {
  professional: '#16a34a', // green — master / online-capable
  company: '#2563eb', // blue
  manufacturer: '#0f766e', // teal — B2B manufacturer / brand
  agent: '#0891b2', // cyan — commercial agent
  project: '#ea580c', // orange — active project
  job: '#7c3aed', // purple — vacancy
  marketplace: '#92400e', // brown — shop / manufacturer listing
  mixed: '#ff9900',
}

export const MAP_KIND_GLYPH: Record<MapMarkerKind | 'mixed', string> = {
  professional: 'P',
  company: 'C',
  manufacturer: 'M',
  agent: 'A',
  project: 'J',
  job: 'V',
  marketplace: 'S',
  mixed: '+',
}

const CACHE_KEY = 'dimarket_map_markers_v8'
const CACHE_TTL_MS = 90_000

const PROFILE_MAP_SELECT = `
  id, full_name, bio, location, service_latitude, service_longitude,
  rating, is_verified, verification_level, profile_photo, avatar_url, user_role,
  work_subcategory_slugs, availability_status,
  professional_categories(category:categories(name, slug))
`

const BUSINESS_PROFILE_ROLES = ['professional', 'company', 'manufacturer', 'commercial_agent'] as const
const PEOPLE_FETCH_CAP = 4000
const PAGE_SIZE = 1000

function markerKindForRole(
  role: string | null,
): 'professional' | 'company' | 'manufacturer' | 'agent' | null {
  if (role === 'professional') return 'professional'
  if (role === 'company') return 'company'
  if (role === 'manufacturer') return 'manufacturer'
  if (role === 'commercial_agent') return 'agent'
  return null
}

/**
 * All public business profiles that can be placed on the map.
 * Coords first, then city-text rows, paginated — not a rating-capped slice.
 */
async function fetchAllBusinessProfiles(
  maxRows = PEOPLE_FETCH_CAP,
): Promise<{ data: ProfileRow[]; error: { message: string } | null }> {
  const run = async (withSoftDelete: boolean) => {
    const pages: ProfileRow[] = []
    const load = async (kind: 'coords' | 'text'): Promise<{ error: { message: string } | null }> => {
      for (let from = 0; from < maxRows; from += PAGE_SIZE) {
        const to = Math.min(from + PAGE_SIZE - 1, maxRows - 1)
        let query = supabase
          .from('profiles')
          .select(PROFILE_MAP_SELECT)
          .eq('is_professional', true)
          .in('user_role', [...BUSINESS_PROFILE_ROLES])
          .order('rating', { ascending: false })
          .range(from, to)
        if (kind === 'coords') {
          query = query.not('service_latitude', 'is', null).not('service_longitude', 'is', null)
        } else {
          query = query.is('service_latitude', null).not('location', 'is', null)
        }
        if (withSoftDelete) {
          query = (query as typeof query).is('deleted_at', null).is('hidden_at', null)
        }
        const { data, error } = await query
        if (error) return { error: { message: error.message } }
        const rows = (data as unknown as ProfileRow[]) ?? []
        pages.push(...rows)
        if (rows.length < PAGE_SIZE) break
      }
      return { error: null }
    }

    const coords = await load('coords')
    if (coords.error) return { data: [] as ProfileRow[], error: coords.error }
    const text = await load('text')
    if (text.error) return { data: [] as ProfileRow[], error: text.error }
    return { data: pages, error: null }
  }

  let result = await run(true)
  if (result.error && /deleted_at|hidden_at|42703/i.test(result.error.message)) {
    result = await run(false)
  }
  if (result.error) return { data: [], error: result.error }

  const { filterPublicProfiles } = await import('./publicProfileVisibility')
  const seen = new Set<string>()
  const merged: ProfileRow[] = []
  for (const row of filterPublicProfiles(result.data)) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    merged.push(row)
    if (merged.length >= maxRows) break
  }
  return { data: merged, error: null }
}

function resolveListingCoords(l: ListingRow): { lat: number; lng: number } | null {
  if (
    l.latitude != null &&
    l.longitude != null &&
    Number.isFinite(l.latitude) &&
    Number.isFinite(l.longitude)
  ) {
    return { lat: Number(l.latitude), lng: Number(l.longitude) }
  }
  const text = [l.city_name, l.location, l.country_name].filter(Boolean).join(', ')
  const inferred = inferCoordsFromLocationText(text)
  if (!inferred) return null
  // Tiny jitter so many listings in the same city do not stack perfectly
  const hash = Array.from(l.id).reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const jitter = ((hash % 17) - 8) * 0.004
  return { lat: inferred.lat + jitter, lng: inferred.lon + jitter * 0.7 }
}

function resolveProfileCoords(p: ProfileRow): { lat: number; lng: number } | null {
  if (
    p.service_latitude != null &&
    p.service_longitude != null &&
    Number.isFinite(p.service_latitude) &&
    Number.isFinite(p.service_longitude)
  ) {
    return { lat: Number(p.service_latitude), lng: Number(p.service_longitude) }
  }
  const inferred = inferCoordsFromLocationText(p.location)
  if (!inferred) return null
  // Jitter inferred city pins so many pros in one city do not stack
  const hash = Array.from(p.id).reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const jitter = ((hash % 17) - 8) * 0.004
  return { lat: inferred.lat + jitter, lng: inferred.lon + jitter * 0.7 }
}

type ProfileRow = {
  id: string
  full_name: string | null
  bio: string | null
  location: string | null
  service_latitude: number | null
  service_longitude: number | null
  /** Optional — column may be missing until migration is applied. */
  service_radius_km?: number | null
  rating: number | null
  is_verified: boolean | null
  verification_level: string | null
  profile_photo: string | null
  avatar_url: string | null
  user_role: string | null
  work_subcategory_slugs: string[] | null
  availability_status: string | null
  professional_categories?: {
    category?: { name?: string | null; slug?: string | null } | null
  }[]
}

type ListingRow = {
  id: string
  title: string
  description: string | null
  city_name: string | null
  location: string | null
  country_name: string | null
  latitude: number | null
  longitude: number | null
  status: string | null
  budget_min: number | null
  budget_max: number | null
  price: number | null
  currency: string | null
  listing_type: string | null
  category?: { name?: string | null; slug?: string | null } | null
}

function truncate(text: string, max = 120): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function profileVerified(p: ProfileRow): boolean {
  if (p.is_verified) return true
  return Boolean(p.verification_level && p.verification_level !== 'none')
}

function categoryLabel(p: ProfileRow): string {
  const fromJoin = (p.professional_categories ?? [])
    .map((c) => c.category?.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ')
  if (fromJoin) return fromJoin
  const works = p.work_subcategory_slugs ?? []
  if (works.length) return works[0].replace(/-/g, ' ')
  if (p.user_role === 'company') return 'Company'
  if (p.user_role === 'manufacturer') return 'Manufacturer'
  if (p.user_role === 'commercial_agent') return 'Commercial agent'
  return 'Professional'
}

function budgetLabel(l: ListingRow): string {
  if (l.budget_min == null && l.budget_max == null) {
    if (l.price != null) {
      const cur = l.currency === 'EUR' || !l.currency ? '€' : `${l.currency} `
      return `${cur}${Math.round(l.price).toLocaleString()}`
    }
    return ''
  }
  if (l.budget_min != null && l.budget_max != null) {
    return `€${l.budget_min} – €${l.budget_max}`
  }
  if (l.budget_min != null) return `€${l.budget_min}+`
  return `up to €${l.budget_max}`
}

function isJobListing(l: ListingRow): boolean {
  const slug = (l.category?.slug || '').toLowerCase()
  if (slug === 'vacancies' || slug.startsWith('vacancies-') || slug.includes('job')) return true
  if (l.listing_type === 'service_offer' && /vacanc|job|hire|hiring/i.test(`${l.title} ${l.description}`))
    return true
  return false
}

function isMarketplaceListing(l: ListingRow): boolean {
  if (l.listing_type === 'item_sale' || l.listing_type === 'item_wanted') return true
  const slug = (l.category?.slug || '').toLowerCase()
  return slug === 'sell-rent' || slug.startsWith('sell-rent') || slug === 'furniture'
}

function toProfileMarker(
  p: ProfileRow,
  kind: 'professional' | 'company' | 'manufacturer' | 'agent',
): MarketplaceMapMarker | null {
  const coords = resolveProfileCoords(p)
  if (!coords) return null
  const { lat, lng } = coords
  const parts = formatLocationParts(p.location)
  const availability = p.availability_status || ''
  const fallbackTitle =
    kind === 'company'
      ? 'Company'
      : kind === 'manufacturer'
        ? 'Manufacturer'
        : kind === 'agent'
          ? 'Commercial agent'
          : 'Professional'
  const path = `/professional/${p.id}`
  return {
    id: `${kind}-${p.id}`,
    kind,
    title: p.full_name || fallbackTitle,
    subtitle: categoryLabel(p),
    description: truncate(p.bio || ''),
    city: parts.city,
    country: parts.country,
    rating: p.rating,
    verified: profileVerified(p),
    photoUrl: resolveDirectoryAvatarUrl(p.id, p.profile_photo, p.avatar_url),
    category: categoryLabel(p),
    budgetLabel: '',
    status: availability,
    availability,
    online: availability === 'available' || availability === 'online',
    lat,
    lng,
    path,
    location: p.location,
    service_latitude: lat,
    service_longitude: lng,
    service_radius_km: p.service_radius_km ?? null,
    work_subcategory_slugs: p.work_subcategory_slugs,
    user_role: p.user_role,
    listingType: null,
    distanceKm: null,
  }
}

type ManufacturerMapRow = {
  id: string
  slug: string
  company_name: string
  description: string | null
  logo_url: string | null
  country: string | null
  headquarters: string | null
  categories: string[] | null
  verification_status: string | null
  profile:
    | {
        id: string
        service_latitude: number | null
        service_longitude: number | null
        location: string | null
        rating: number | null
      }
    | null
}

function toManufacturerMarker(row: ManufacturerMapRow): MarketplaceMapMarker | null {
  let lat = row.profile?.service_latitude
  let lng = row.profile?.service_longitude
  const loc = row.profile?.location || row.headquarters || row.country
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    const inferred = inferCoordsFromLocationText(loc)
    if (!inferred) return null
    lat = inferred.lat
    lng = inferred.lon
  }
  const parts = formatLocationParts(loc)
  return {
    id: `manufacturer-${row.id}`,
    kind: 'manufacturer',
    title: row.company_name,
    subtitle: (row.categories || []).slice(0, 2).join(' · ') || 'Manufacturer',
    description: truncate(row.description || ''),
    city: parts.city,
    country: parts.country || row.country || '',
    rating: row.profile?.rating ?? null,
    verified: row.verification_status === 'verified',
    photoUrl: row.logo_url,
    category: (row.categories || [])[0] || 'manufacturers',
    budgetLabel: '',
    status: 'published',
    availability: 'available',
    online: true,
    lat: Number(lat),
    lng: Number(lng),
    path: `/commercial-agents/manufacturers/${row.slug}`,
    location: loc,
    service_latitude: Number(lat),
    service_longitude: Number(lng),
    service_radius_km: null,
    work_subcategory_slugs: row.categories,
    user_role: 'manufacturer',
    listingType: null,
    distanceKm: null,
  }
}

type AgentMapRow = {
  id: string
  slug: string
  full_name: string
  description: string | null
  profile_photo_url: string | null
  country: string | null
  city: string | null
  categories: string[] | null
  verification_status: string | null
  profile: {
    id: string
    service_latitude: number | null
    service_longitude: number | null
    location: string | null
    rating: number | null
  } | null
}

function toAgentMarker(row: AgentMapRow): MarketplaceMapMarker | null {
  let lat = row.profile?.service_latitude
  let lng = row.profile?.service_longitude
  const loc = row.profile?.location || [row.city, row.country].filter(Boolean).join(', ')
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    const inferred = inferCoordsFromLocationText(loc)
    if (!inferred) return null
    lat = inferred.lat
    lng = inferred.lon
  }
  const parts = formatLocationParts(loc)
  return {
    id: `agent-${row.id}`,
    kind: 'agent',
    title: row.full_name,
    subtitle: (row.categories || []).slice(0, 2).join(' · ') || 'Commercial agent',
    description: truncate(row.description || ''),
    city: row.city || parts.city,
    country: row.country || parts.country,
    rating: row.profile?.rating ?? null,
    verified: row.verification_status === 'verified',
    photoUrl: row.profile_photo_url,
    category: (row.categories || [])[0] || 'agents',
    budgetLabel: '',
    status: 'published',
    availability: 'available',
    online: true,
    lat: Number(lat),
    lng: Number(lng),
    path: `/commercial-agents/representatives/${row.slug}`,
    location: loc,
    service_latitude: Number(lat),
    service_longitude: Number(lng),
    service_radius_km: null,
    work_subcategory_slugs: row.categories,
    user_role: 'commercial_agent',
    listingType: null,
    distanceKm: null,
  }
}

function toListingMarker(
  l: ListingRow,
  kind: 'project' | 'marketplace' | 'job',
): MarketplaceMapMarker | null {
  const coords = resolveListingCoords(l)
  if (!coords) return null
  const { lat, lng } = coords
  const parts = formatLocationParts(l.location || l.city_name)
  const path = `/listing/${l.id}`
  return {
    id: `${kind}-${l.id}`,
    kind,
    title: l.title,
    subtitle:
      kind === 'job'
        ? l.category?.name || 'Job'
        : kind === 'marketplace'
          ? l.category?.name || 'Marketplace'
          : l.category?.name || 'Project',
    description: truncate(l.description || ''),
    city: l.city_name || parts.city,
    country: l.country_name || parts.country,
    rating: null,
    verified: false,
    photoUrl: null,
    category: l.category?.name || '',
    budgetLabel: budgetLabel(l),
    status: l.status || 'active',
    availability: '',
    online: false,
    lat,
    lng,
    path,
    location: [l.city_name, l.location, l.country_name].filter(Boolean).join(', '),
    service_latitude: lat,
    service_longitude: lng,
    service_radius_km: null,
    work_subcategory_slugs: l.category?.slug ? [l.category.slug] : null,
    user_role: null,
    listingType: l.listing_type,
    distanceKm: null,
  }
}

function readCache(): MarketplaceMapMarker[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; markers: MarketplaceMapMarker[] }
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null
    return parsed.markers
  } catch {
    return null
  }
}

function writeCache(markers: MarketplaceMapMarker[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), markers }))
  } catch {
    /* ignore quota */
  }
}

/**
 * Fetch live markers from DB. New records with coords appear automatically.
 * `limit` only caps listing queries (projects / marketplace / jobs).
 * Registered public businesses are loaded up to PEOPLE_FETCH_CAP.
 */
export async function fetchMarketplaceMapMarkers(
  limit = 400,
  opts?: { bypassCache?: boolean },
): Promise<MarketplaceMapMarker[]> {
  if (!opts?.bypassCache) {
    const cached = readCache()
    if (cached?.length) return cached
  }

  const slice = Math.max(40, Math.ceil(limit / 3))
  const listingSelect = `
    id, title, description, city_name, location, country_name,
    latitude, longitude, status, budget_min, budget_max, price, currency, listing_type,
    category:categories(name, slug)
  `

  const [peopleRes, manufacturersRes, agentsRes, projectsRes, marketRes, moreListingsRes] =
    await Promise.all([
    fetchAllBusinessProfiles(PEOPLE_FETCH_CAP),
    supabase
      .from('manufacturer_profiles')
      .select(
        `
        id, slug, company_name, description, logo_url, country, headquarters,
        categories, verification_status,
        profile:profiles!manufacturer_profiles_profile_id_fkey(
          id, service_latitude, service_longitude, location, rating
        )
      `,
      )
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(PEOPLE_FETCH_CAP),
    supabase
      .from('agent_profiles')
      .select(
        `
        id, slug, full_name, description, profile_photo_url, country, city,
        categories, verification_status,
        profile:profiles!agent_profiles_profile_id_fkey(
          id, service_latitude, service_longitude, location, rating
        )
      `,
      )
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(PEOPLE_FETCH_CAP),
    excludeSuppressedFromQuery(
      supabase
        .from('listings')
        .select(listingSelect)
        .eq('listing_type', 'service_request')
        .eq('status', 'active')
        .or('latitude.not.is.null,location.not.is.null,city_name.not.is.null')
        .order('created_at', { ascending: false })
        .limit(slice),
    ),
    excludeSuppressedFromQuery(
      supabase
        .from('listings')
        .select(listingSelect)
        .in('listing_type', ['item_sale', 'item_wanted'])
        .eq('status', 'active')
        .or('latitude.not.is.null,location.not.is.null,city_name.not.is.null')
        .order('created_at', { ascending: false })
        .limit(slice),
    ),
    // Broader active listings to catch vacancies / sell-rent categorized rows
    excludeSuppressedFromQuery(
      supabase
        .from('listings')
        .select(listingSelect)
        .eq('status', 'active')
        .or('latitude.not.is.null,location.not.is.null,city_name.not.is.null')
        .order('created_at', { ascending: false })
        .limit(slice),
    ),
  ])

  const markers: MarketplaceMapMarker[] = []
  const seen = new Set<string>()

  if (peopleRes.error) {
    console.warn('[marketplaceMap] profiles query failed:', peopleRes.error.message)
  }
  if (manufacturersRes.error) {
    console.warn('[marketplaceMap] manufacturers query failed:', manufacturersRes.error.message)
  }
  if (agentsRes.error) {
    console.warn('[marketplaceMap] agents query failed:', agentsRes.error.message)
  }

  const push = (m: MarketplaceMapMarker | null) => {
    if (!m || seen.has(m.id)) return
    seen.add(m.id)
    markers.push(m)
  }

  for (const row of (manufacturersRes.data as ManufacturerMapRow[] | null) ?? []) {
    if (isLikelyQaOrTestName(row.company_name)) continue
    push(toManufacturerMarker(row))
  }
  for (const row of (agentsRes.data as AgentMapRow[] | null) ?? []) {
    if (isLikelyQaOrTestName(row.full_name)) continue
    push(toAgentMarker(row))
  }
  const manufacturerProfileIds = new Set(
    ((manufacturersRes.data as ManufacturerMapRow[] | null) ?? [])
      .map((r) => r.profile?.id)
      .filter(Boolean) as string[],
  )
  const agentProfileIds = new Set(
    ((agentsRes.data as AgentMapRow[] | null) ?? [])
      .map((r) => r.profile?.id)
      .filter(Boolean) as string[],
  )
  for (const p of peopleRes.data) {
    const kind = markerKindForRole(p.user_role)
    if (!kind) continue
    if (kind === 'manufacturer' && manufacturerProfileIds.has(p.id)) continue
    if (kind === 'agent' && agentProfileIds.has(p.id)) continue
    push(toProfileMarker({ ...p, service_radius_km: p.service_radius_km ?? null }, kind))
  }
  for (const l of filterSuppressedListings((projectsRes.data as ListingRow[] | null) ?? [])) {
    push(toListingMarker(l, 'project'))
  }
  for (const l of filterSuppressedListings((marketRes.data as ListingRow[] | null) ?? [])) {
    push(toListingMarker(l, 'marketplace'))
  }
  for (const l of filterSuppressedListings((moreListingsRes.data as ListingRow[] | null) ?? [])) {
    if (isJobListing(l)) push(toListingMarker(l, 'job'))
    else if (isMarketplaceListing(l)) push(toListingMarker(l, 'marketplace'))
    else if (l.listing_type === 'service_request') push(toListingMarker(l, 'project'))
  }

  writeCache(markers)
  return markers
}

export function attachDistances(
  markers: MarketplaceMapMarker[],
  origin: { lat: number; lon: number } | null,
): MarketplaceMapMarker[] {
  if (!origin) {
    return markers.map((m) => ({ ...m, distanceKm: null }))
  }
  return markers.map((m) => ({
    ...m,
    distanceKm: haversineKm(origin, { lat: m.lat, lon: m.lng }),
  }))
}

export function filterMapMarkers(
  markers: MarketplaceMapMarker[],
  geo: GeoSearchState,
  filters: MapExploreFilters,
  bounds?: { south: number; west: number; north: number; east: number } | null,
): MarketplaceMapMarker[] {
  const resolved = filters.serviceQuery.trim()
    ? resolveServiceQuery(filters.serviceQuery)
    : filters.subcategorySlug
      ? resolveServiceQuery(filters.subcategorySlug)
      : []
  const q = filters.serviceQuery.trim().toLowerCase()

  return markers.filter((m) => {
    if (filters.kinds !== 'all' && !filters.kinds.has(m.kind)) return false

    if (bounds) {
      if (
        m.lat < bounds.south ||
        m.lat > bounds.north ||
        m.lng < bounds.west ||
        m.lng > bounds.east
      ) {
        return false
      }
    }

    const isListingKind = m.kind === 'project' || m.kind === 'marketplace' || m.kind === 'job'

    if (isListingKind) {
      if (filters.verifiedOnly) return false
      if (filters.minRating > 0) return false
      if (filters.availableOnly) return false
      const geoHit = matchProfileGeo(
        {
          location: m.location,
          service_latitude: m.lat,
          service_longitude: m.lng,
          service_radius_km: null,
        },
        geo,
      )
      if (!geoHit.matches) return false
      if (q) {
        const hay = `${m.title} ${m.category} ${m.description} ${m.subtitle}`.toLowerCase()
        if (!hay.includes(q) && !resolved.some((r) => hay.includes(r.subcategory.slug))) {
          return false
        }
      }
      return true
    }

    const geoHit = matchProfileGeo(
      {
        location: m.location,
        service_latitude: m.service_latitude,
        service_longitude: m.service_longitude,
        // Directory map shows where they are registered, not whether they travel to you.
        service_radius_km: null,
      },
      geo,
    )
    if (!geoHit.matches) return false

    if (filters.verifiedOnly && !m.verified) return false
    if (filters.minRating > 0 && (m.rating ?? 0) < filters.minRating) return false
    if (
      filters.availableOnly &&
      m.availability &&
      m.availability !== 'available' &&
      m.availability !== 'online'
    ) {
      return false
    }

    if (resolved.length) {
      const ok = resolved.some((r) =>
        matchesServiceProfile(
          {
            work_subcategory_slugs: m.work_subcategory_slugs,
            bio: m.description,
            full_name: m.title,
          },
          r.matcher,
        ),
      )
      if (!ok && q) {
        const hay = `${m.title} ${m.category} ${m.description}`.toLowerCase()
        if (!hay.includes(q)) return false
      } else if (!ok) {
        return false
      }
    } else if (filters.categorySlug) {
      const hay = `${m.category} ${(m.work_subcategory_slugs ?? []).join(' ')}`.toLowerCase()
      if (
        !hay.includes(filters.categorySlug.toLowerCase().replace(/-/g, ' ')) &&
        !hay.includes(filters.categorySlug.toLowerCase())
      ) {
        if (m.category) return false
      }
    } else if (q) {
      const hay = `${m.title} ${m.category} ${m.description} ${m.subtitle}`.toLowerCase()
      if (!hay.includes(q)) return false
    }

    return true
  })
}

export function nextWiderRadius(current: GeoSearchState['radius']): GeoSearchState['radius'] {
  const order: GeoSearchState['radius'][] = [
    '5',
    '10',
    '25',
    '50',
    '100',
    '200',
    'province',
    'region',
    'country',
  ]
  const idx = order.indexOf(current)
  if (idx < 0 || idx >= order.length - 1) return 'country'
  return order[idx + 1]
}

export function mapFocusFromGeo(geo: GeoSearchState): {
  center: [number, number]
  zoom: number
} | null {
  if (geo.originLat != null && geo.originLng != null) {
    const km = radiusModeToKm(geo.radius)
    let zoom = 10
    if (km == null) zoom = 7
    else if (km <= 10) zoom = 12
    else if (km <= 25) zoom = 11
    else if (km <= 50) zoom = 10
    else if (km <= 100) zoom = 9
    else zoom = 8
    return { center: [geo.originLat, geo.originLng], zoom }
  }
  if (geo.country && !geo.city) {
    const key = geo.country.toLowerCase()
    for (const [slug, center] of Object.entries(COUNTRY_MAP_CENTERS)) {
      if (key.includes(slug)) return { center, zoom: 6 }
    }
  }
  return null
}

/** Map popup/sidebar distance — same formatter as directory, empty when unknown. */
export function formatMapDistance(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return ''
  return formatDistanceKm(km)
}
