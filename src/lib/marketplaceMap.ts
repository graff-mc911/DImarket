/**
 * Marketplace map data: professionals, companies, projects with coordinates.
 * Loaded live from Supabase — never hardcoded for production markers.
 */

import { supabase } from './supabase'
import { formatLocationParts } from './geoSearch'
import { resolveDirectoryAvatarUrl } from './directoryAvatars'
import type { GeoSearchState } from './geoSearch'
import { matchProfileGeo } from './geoSearch'
import { matchesServiceProfile, resolveServiceQuery } from './serviceTaxonomy'
import { radiusModeToKm } from './geoSearch'
import {
  excludeSuppressedFromQuery,
  filterSuppressedListings,
} from './suppressedListings'

export type MapMarkerKind = 'professional' | 'company' | 'project'

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
  lat: number
  lng: number
  path: string
  /** Fields for geo / taxonomy matching */
  location: string | null
  service_latitude: number | null
  service_longitude: number | null
  service_radius_km: number | null
  work_subcategory_slugs: string[] | null
  user_role: string | null
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

type ProfileRow = {
  id: string
  full_name: string | null
  bio: string | null
  location: string | null
  service_latitude: number | null
  service_longitude: number | null
  service_radius_km: number | null
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
  return p.user_role === 'company' ? 'Company' : 'Professional'
}

function budgetLabel(l: ListingRow): string {
  if (l.budget_min == null && l.budget_max == null) return ''
  if (l.budget_min != null && l.budget_max != null) {
    return `€${l.budget_min} – €${l.budget_max}`
  }
  if (l.budget_min != null) return `€${l.budget_min}+`
  return `up to €${l.budget_max}`
}

function toProfileMarker(p: ProfileRow, kind: 'professional' | 'company'): MarketplaceMapMarker | null {
  const lat = p.service_latitude
  const lng = p.service_longitude
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const parts = formatLocationParts(p.location)
  return {
    id: `${kind}-${p.id}`,
    kind,
    title: p.full_name || (kind === 'company' ? 'Company' : 'Professional'),
    subtitle: categoryLabel(p),
    description: truncate(p.bio || ''),
    city: parts.city,
    country: parts.country,
    rating: p.rating,
    verified: profileVerified(p),
    photoUrl: resolveDirectoryAvatarUrl(p.id, p.profile_photo, p.avatar_url),
    category: categoryLabel(p),
    budgetLabel: '',
    status: p.availability_status || '',
    availability: p.availability_status || '',
    lat,
    lng,
    path: `/professional/${p.id}`,
    location: p.location,
    service_latitude: lat,
    service_longitude: lng,
    service_radius_km: p.service_radius_km,
    work_subcategory_slugs: p.work_subcategory_slugs,
    user_role: p.user_role,
  }
}

function toProjectMarker(l: ListingRow): MarketplaceMapMarker | null {
  const lat = l.latitude
  const lng = l.longitude
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const parts = formatLocationParts(l.location || l.city_name)
  return {
    id: `project-${l.id}`,
    kind: 'project',
    title: l.title,
    subtitle: l.category?.name || 'Project',
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
    lat,
    lng,
    path: `/listing/${l.id}`,
    location: [l.city_name, l.location, l.country_name].filter(Boolean).join(', '),
    service_latitude: lat,
    service_longitude: lng,
    service_radius_km: null,
    work_subcategory_slugs: l.category?.slug ? [l.category.slug] : null,
    user_role: null,
  }
}

/** Fetch live markers from DB. New records with coords appear automatically. */
export async function fetchMarketplaceMapMarkers(limit = 250): Promise<MarketplaceMapMarker[]> {
  const half = Math.ceil(limit / 2)
  const [prosRes, companiesRes, projectsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        `
        id, full_name, bio, location, service_latitude, service_longitude, service_radius_km,
        rating, is_verified, verification_level, profile_photo, avatar_url, user_role,
        work_subcategory_slugs, availability_status,
        professional_categories(category:categories(name, slug))
      `,
      )
      .eq('is_professional', true)
      .eq('user_role', 'professional')
      .not('service_latitude', 'is', null)
      .not('service_longitude', 'is', null)
      .order('rating', { ascending: false })
      .limit(half),
    supabase
      .from('profiles')
      .select(
        `
        id, full_name, bio, location, service_latitude, service_longitude, service_radius_km,
        rating, is_verified, verification_level, profile_photo, avatar_url, user_role,
        work_subcategory_slugs, availability_status,
        professional_categories(category:categories(name, slug))
      `,
      )
      .eq('is_professional', true)
      .eq('user_role', 'company')
      .not('service_latitude', 'is', null)
      .not('service_longitude', 'is', null)
      .order('rating', { ascending: false })
      .limit(Math.ceil(half / 2)),
    excludeSuppressedFromQuery(
      supabase
        .from('listings')
        .select(
          `
        id, title, description, city_name, location, country_name,
        latitude, longitude, status, budget_min, budget_max,
        category:categories(name, slug)
      `,
        )
        .eq('listing_type', 'service_request')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })
        .limit(half),
    ),
  ])

  const markers: MarketplaceMapMarker[] = []
  for (const p of (prosRes.data as ProfileRow[] | null) ?? []) {
    const m = toProfileMarker(p, 'professional')
    if (m) markers.push(m)
  }
  for (const p of (companiesRes.data as ProfileRow[] | null) ?? []) {
    const m = toProfileMarker(p, 'company')
    if (m) markers.push(m)
  }
  for (const l of filterSuppressedListings((projectsRes.data as ListingRow[] | null) ?? [])) {
    const m = toProjectMarker(l)
    if (m) markers.push(m)
  }
  return markers
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

    if (m.kind === 'project') {
      if (filters.verifiedOnly) return false
      if (filters.minRating > 0) return false
      if (filters.availableOnly) return false
      // geo match using same admin/radius logic via profile-shaped object
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
      if (resolved.length && filters.serviceQuery.trim()) {
        const hay = `${m.title} ${m.category} ${m.description}`.toLowerCase()
        const q = filters.serviceQuery.trim().toLowerCase()
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
        service_radius_km: m.service_radius_km,
      },
      geo,
    )
    if (!geoHit.matches) return false

    if (filters.verifiedOnly && !m.verified) return false
    if (filters.minRating > 0 && (m.rating ?? 0) < filters.minRating) return false
    if (
      filters.availableOnly &&
      m.availability &&
      m.availability !== 'available'
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
      if (!ok) return false
    } else if (filters.categorySlug) {
      const hay = `${m.category} ${(m.work_subcategory_slugs ?? []).join(' ')}`.toLowerCase()
      if (!hay.includes(filters.categorySlug.toLowerCase().replace(/-/g, ' ')) &&
          !hay.includes(filters.categorySlug.toLowerCase())) {
        // soft: keep if no category text — don't over-filter empty categories
        if (m.category) return false
      }
    }

    return true
  })
}

/** Suggest next wider radius mode for empty-state CTA. */
export function nextWiderRadius(current: GeoSearchState['radius']): GeoSearchState['radius'] {
  const order: GeoSearchState['radius'][] = ['5', '10', '25', '50', '100', '200', 'province', 'region', 'country']
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
    const centers: Record<string, [number, number]> = {
      germany: [51.1, 10.4],
      spain: [40.4, -3.7],
      france: [46.6, 2.2],
      italy: [42.5, 12.5],
      poland: [52.1, 19.4],
      portugal: [39.4, -8.2],
      ukraine: [48.4, 31.2],
    }
    const key = geo.country.toLowerCase()
    for (const [slug, center] of Object.entries(centers)) {
      if (key.includes(slug)) return { center, zoom: 6 }
    }
  }
  return null
}
