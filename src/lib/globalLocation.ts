/**
 * Single source of truth helpers for DImarket global search location.
 * Persists to localStorage; URL params mirror the same GeoSearchState.
 */

import type { SearchFilters } from './advancedSearch'
import { EMPTY_SEARCH_FILTERS } from './advancedSearch'
import {
  EMPTY_GEO_SEARCH,
  GEO_RADIUS_OPTIONS,
  geoSearchFromQuery,
  geoSearchToQuery,
  radiusModeToKm,
  type GeoRadiusMode,
  type GeoSearchState,
} from './geoSearch'

export const GLOBAL_LOCATION_STORAGE_KEY = 'dimarket_global_location'

const LOCATION_AWARE_PATH =
  /^\/(search|professionals|companies|listings|services|electrician|plumber|painter|tiler|carpenter|roofer|handyman|lawyer|accountant|architect|hvac|cleaning|moving|renovation)(\/|$)/i

const COUNTRY_SLUG_TO_NAME: Record<string, string> = {
  germany: 'Germany',
  spain: 'Spain',
  poland: 'Poland',
  france: 'France',
  italy: 'Italy',
  portugal: 'Portugal',
  ukraine: 'Ukraine',
  austria: 'Austria',
  netherlands: 'Netherlands',
  belgium: 'Belgium',
  'united-kingdom': 'United Kingdom',
  uk: 'United Kingdom',
}

const COUNTRY_NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_SLUG_TO_NAME).map(([slug, name]) => [name.toLowerCase(), slug]),
)

export function hasActiveLocation(geo: GeoSearchState): boolean {
  return Boolean(geo.country || geo.region || geo.province || geo.city || geo.fromGps)
}

/** Short label for Header / category card. */
export function formatGlobalLocationLabel(
  geo: GeoSearchState,
  emptyLabel = 'All Europe',
): string {
  if (!hasActiveLocation(geo)) return emptyLabel
  if (geo.city && geo.region) return `${geo.city}, ${geo.region}`
  if (geo.city && geo.country) return `${geo.city}, ${geo.country}`
  if (geo.city) return geo.city
  if (geo.province && geo.region) return `${geo.province}, ${geo.region}`
  if (geo.region && geo.country) return `${geo.region}, ${geo.country}`
  if (geo.region) return geo.region
  if (geo.country) return geo.country
  if (geo.fromGps) return emptyLabel
  return emptyLabel
}

/** Longer structured label: Germany · Hessen · Darmstadt · 25 km */
export function formatGlobalLocationStructured(
  geo: GeoSearchState,
  emptyLabel = 'All Europe',
): string {
  if (!hasActiveLocation(geo)) return emptyLabel
  const parts = [geo.country, geo.region, geo.province, geo.city].filter(Boolean)
  const unique = parts.filter((p, i) => parts.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i)
  const radius =
    geo.radius && radiusModeToKm(geo.radius) != null ? `${radiusModeToKm(geo.radius)} km` : ''
  return [...unique, radius].filter(Boolean).join(' · ') || emptyLabel
}

export function loadGlobalLocation(): GeoSearchState {
  try {
    const raw = localStorage.getItem(GLOBAL_LOCATION_STORAGE_KEY)
    if (!raw) return { ...EMPTY_GEO_SEARCH }
    const parsed = JSON.parse(raw) as Partial<GeoSearchState>
    const radius = parsed.radius
    return {
      ...EMPTY_GEO_SEARCH,
      ...parsed,
      radius:
        radius && GEO_RADIUS_OPTIONS.some((o) => o.id === radius)
          ? radius
          : EMPTY_GEO_SEARCH.radius,
    }
  } catch {
    return { ...EMPTY_GEO_SEARCH }
  }
}

export function saveGlobalLocation(geo: GeoSearchState): void {
  try {
    localStorage.setItem(GLOBAL_LOCATION_STORAGE_KEY, JSON.stringify(geo))
  } catch {
    /* ignore quota */
  }
}

export function countrySlugFromGeo(geo: GeoSearchState): string {
  if (!geo.country) return 'all-europe'
  return COUNTRY_NAME_TO_SLUG[geo.country.trim().toLowerCase()] || 'all-europe'
}

export function geoFromCountrySlug(slug: string, prev: GeoSearchState = EMPTY_GEO_SEARCH): GeoSearchState {
  if (!slug || slug === 'all-europe') {
    return { ...EMPTY_GEO_SEARCH, radius: prev.radius || '25' }
  }
  const country = COUNTRY_SLUG_TO_NAME[slug.toLowerCase()]
  if (!country) return { ...EMPTY_GEO_SEARCH, city: slug, radius: prev.radius || '25' }
  return {
    ...EMPTY_GEO_SEARCH,
    country,
    radius: prev.radius || '25',
  }
}

export function readLocationFromSearchParams(
  search: string | URLSearchParams,
): Partial<GeoSearchState> | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  const fromQuery = geoSearchFromQuery(params)
  if (fromQuery.country || fromQuery.city || fromQuery.region || fromQuery.fromGps) {
    return fromQuery
  }
  const legacy = params.get('location')
  if (legacy) {
    const country = COUNTRY_SLUG_TO_NAME[legacy.toLowerCase()]
    if (country) return { country }
    return { city: legacy }
  }
  // Advanced-search aliases
  const distance = params.get('distance')
  const city = params.get('city')
  const country = params.get('country')
  if (city || country || distance) {
    const km = distance ? Number(distance) : null
    const radius =
      (GEO_RADIUS_OPTIONS.find((o) => o.km === km)?.id as GeoRadiusMode | undefined) ?? '25'
    return {
      country: country || '',
      city: city || '',
      radius,
      originLat: params.get('lat') ? Number(params.get('lat')) : null,
      originLng: params.get('lng') ? Number(params.get('lng')) : null,
    }
  }
  return null
}

export function isLocationAwarePath(pathname: string = window.location.pathname): boolean {
  if (LOCATION_AWARE_PATH.test(pathname)) return true
  // SEO geo landings: /spain/alicante/electricians
  const parts = pathname.split('/').filter(Boolean)
  return parts.length >= 3 && Boolean(COUNTRY_SLUG_TO_NAME[parts[0].toLowerCase()])
}

/** Merge geo into URLSearchParams (replaces prior geo keys). */
export function mergeLocationIntoParams(
  geo: GeoSearchState,
  existing?: string | URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(
    typeof existing === 'string'
      ? existing
      : existing
        ? existing.toString()
        : typeof window !== 'undefined'
          ? window.location.search
          : '',
  )
  for (const key of [
    'country',
    'region',
    'province',
    'city',
    'radius',
    'lat',
    'lng',
    'gps',
    'location',
    'distance',
  ]) {
    params.delete(key)
  }
  if (!hasActiveLocation(geo)) return params

  const geoParams = geoSearchToQuery(geo)
  geoParams.forEach((value, key) => params.set(key, value))
  if (!params.has('radius')) params.set('radius', geo.radius || '25')
  // Keep advanced-search distance alias in sync
  const km = radiusModeToKm(geo.radius)
  if (km != null) params.set('distance', String(km))
  return params
}

export function syncLocationToCurrentUrl(geo: GeoSearchState): void {
  if (typeof window === 'undefined') return
  if (!isLocationAwarePath(window.location.pathname)) return
  const params = mergeLocationIntoParams(geo)
  const qs = params.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) {
    window.history.replaceState({}, '', next)
  }
}

export function appendLocationToPath(path: string, geo: GeoSearchState): string {
  const [pathname, search = ''] = path.split('?')
  const params = mergeLocationIntoParams(geo, search)
  // Drop advanced-search-only distance on service paths unless needed
  if (pathname.startsWith('/services') || pathname.match(/^\/[a-z-]+$/)) {
    // keep radius/country/city; distance alias is fine
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function geoToSearchFilters(
  geo: GeoSearchState,
  base: SearchFilters = EMPTY_SEARCH_FILTERS,
): SearchFilters {
  return {
    ...base,
    country: geo.country || '',
    city: geo.city || '',
    distanceKm: radiusModeToKm(geo.radius),
    lat: geo.originLat,
    lng: geo.originLng,
  }
}

export function searchFiltersToGeo(
  filters: SearchFilters,
  prev: GeoSearchState = EMPTY_GEO_SEARCH,
): GeoSearchState {
  const km = filters.distanceKm
  const radius =
    (GEO_RADIUS_OPTIONS.find((o) => o.km === km)?.id as GeoRadiusMode | undefined) ??
    prev.radius ??
    '25'
  return {
    ...prev,
    country: filters.country || prev.country,
    city: filters.city || '',
    radius,
    originLat: filters.lat,
    originLng: filters.lng,
    fromGps: false,
  }
}

export function initializeGlobalLocation(): GeoSearchState {
  if (typeof window === 'undefined') return { ...EMPTY_GEO_SEARCH }
  const fromUrl = readLocationFromSearchParams(window.location.search)
  if (fromUrl) {
    const merged = { ...EMPTY_GEO_SEARCH, ...fromUrl }
    saveGlobalLocation(merged)
    return merged
  }
  return loadGlobalLocation()
}
