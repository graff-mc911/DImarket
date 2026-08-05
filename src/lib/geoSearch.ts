/**
 * Geographic search matching for directory results.
 * Radius modes + haversine distance + admin fallback + pro service_radius_km.
 */

import { parseRegistrationLocation } from './registrationGeoData'
import { haversineKm, formatDistanceKm, type GeoPoint } from './projectFeed'
import type { GeoHierarchySelection } from './geoHierarchy'
import { searchLocations } from './geocoding'

export { formatDistanceKm }

export type GeoRadiusMode =
  | '5'
  | '10'
  | '25'
  | '50'
  | '100'
  | '200'
  | 'province'
  | 'region'
  | 'country'

export const GEO_RADIUS_OPTIONS: Array<{ id: GeoRadiusMode; km: number | null }> = [
  { id: '5', km: 5 },
  { id: '10', km: 10 },
  { id: '25', km: 25 },
  { id: '50', km: 50 },
  { id: '100', km: 100 },
  { id: '200', km: 200 },
  { id: 'province', km: null },
  { id: 'region', km: null },
  { id: 'country', km: null },
]

export type GeoSearchState = GeoHierarchySelection & {
  radius: GeoRadiusMode
  /** Search origin coordinates (city center or GPS) */
  originLat: number | null
  originLng: number | null
  /** True when origin came from GPS */
  fromGps: boolean
}

export const EMPTY_GEO_SEARCH: GeoSearchState = {
  country: '',
  region: '',
  province: '',
  city: '',
  radius: '25',
  originLat: null,
  originLng: null,
  fromGps: false,
}

/** Approximate city centers for fast radius search without waiting on Nominatim. */
const CITY_CENTERS: Record<string, GeoPoint> = {
  'spain|alicante': { lat: 38.3452, lon: -0.481 },
  'spain|torrevieja': { lat: 37.9787, lon: -0.6822 },
  'spain|valencia': { lat: 39.4699, lon: -0.3763 },
  'spain|torrent': { lat: 39.437, lon: -0.4656 },
  'spain|madrid': { lat: 40.4168, lon: -3.7038 },
  'spain|barcelona': { lat: 41.3874, lon: 2.1686 },
  'spain|sevilla': { lat: 37.3891, lon: -5.9845 },
  'spain|seville': { lat: 37.3891, lon: -5.9845 },
  'spain|malaga': { lat: 36.7213, lon: -4.4214 },
  'spain|málaga': { lat: 36.7213, lon: -4.4214 },
  'spain|granada': { lat: 37.1773, lon: -3.5986 },
  'spain|bilbao': { lat: 43.263, lon: -2.935 },
  'spain|zaragoza': { lat: 41.6488, lon: -0.8891 },
  'spain|murcia': { lat: 37.9922, lon: -1.1307 },
  'spain|palma': { lat: 39.5696, lon: 2.6502 },
  'spain|getafe': { lat: 40.3057, lon: -3.7328 },
  'spain|pinto': { lat: 40.2412, lon: -3.699 },
  'germany|darmstadt': { lat: 49.8728, lon: 8.6512 },
  'germany|frankfurt': { lat: 50.1109, lon: 8.6821 },
  'germany|frankfurt am main': { lat: 50.1109, lon: 8.6821 },
  'germany|hamburg': { lat: 53.5511, lon: 9.9937 },
  'germany|munich': { lat: 48.1351, lon: 11.582 },
  'germany|münchen': { lat: 48.1351, lon: 11.582 },
  'germany|berlin': { lat: 52.52, lon: 13.405 },
  'germany|cologne': { lat: 50.9375, lon: 6.9603 },
  'germany|köln': { lat: 50.9375, lon: 6.9603 },
  'germany|stuttgart': { lat: 48.7758, lon: 9.1829 },
  'germany|düsseldorf': { lat: 51.2277, lon: 6.7735 },
  'germany|dusseldorf': { lat: 51.2277, lon: 6.7735 },
  'germany|leipzig': { lat: 51.3397, lon: 12.3731 },
  'germany|dresden': { lat: 51.0504, lon: 13.7373 },
  'germany|hannover': { lat: 52.3759, lon: 9.732 },
  'germany|hanover': { lat: 52.3759, lon: 9.732 },
  'germany|nuremberg': { lat: 49.4521, lon: 11.0767 },
  'germany|nürnberg': { lat: 49.4521, lon: 11.0767 },
  'germany|bremen': { lat: 53.0793, lon: 8.8017 },
  'germany|dortmund': { lat: 51.5136, lon: 7.4653 },
  'germany|essen': { lat: 51.4556, lon: 7.0116 },
  'poland|warsaw': { lat: 52.2297, lon: 21.0122 },
  'poland|warszawa': { lat: 52.2297, lon: 21.0122 },
  'poland|kraków': { lat: 50.0647, lon: 19.945 },
  'poland|krakow': { lat: 50.0647, lon: 19.945 },
  'poland|wrocław': { lat: 51.1079, lon: 17.0385 },
  'poland|wroclaw': { lat: 51.1079, lon: 17.0385 },
  'poland|gdańsk': { lat: 54.352, lon: 18.6466 },
  'poland|gdansk': { lat: 54.352, lon: 18.6466 },
  'poland|poznań': { lat: 52.4064, lon: 16.9252 },
  'poland|poznan': { lat: 52.4064, lon: 16.9252 },
  'poland|łódź': { lat: 51.7592, lon: 19.456 },
  'poland|lodz': { lat: 51.7592, lon: 19.456 },
  'poland|katowice': { lat: 50.2649, lon: 19.0238 },
  'poland|lublin': { lat: 51.2465, lon: 22.5684 },
  'poland|szczecin': { lat: 53.4285, lon: 14.5528 },
  'ukraine|kyiv': { lat: 50.4501, lon: 30.5234 },
  'ukraine|kiev': { lat: 50.4501, lon: 30.5234 },
  'ukraine|lviv': { lat: 49.8397, lon: 24.0297 },
  'ukraine|odesa': { lat: 46.4825, lon: 30.7233 },
  'ukraine|odessa': { lat: 46.4825, lon: 30.7233 },
  'ukraine|kharkiv': { lat: 49.9935, lon: 36.2304 },
  'ukraine|dnipro': { lat: 48.4647, lon: 35.0462 },
  'ukraine|zaporizhzhia': { lat: 47.8388, lon: 35.1396 },
  'ukraine|vinnytsia': { lat: 49.2331, lon: 28.4682 },
  'france|paris': { lat: 48.8566, lon: 2.3522 },
  'france|lyon': { lat: 45.764, lon: 4.8357 },
  'france|marseille': { lat: 43.2965, lon: 5.3698 },
}

const cityCenterCache = new Map<string, GeoPoint | null>()

function cityKey(country: string, city: string): string {
  return `${country.trim().toLowerCase()}|${city.trim().toLowerCase()}`
}

export function knownCityCenter(country: string, city: string): GeoPoint | null {
  if (!country || !city) return null
  return CITY_CENTERS[cityKey(country, city)] ?? null
}

export async function resolveCityCenter(
  country: string,
  city: string,
): Promise<GeoPoint | null> {
  const key = cityKey(country, city)
  if (!city) return null
  const known = CITY_CENTERS[key]
  if (known) return known
  if (cityCenterCache.has(key)) return cityCenterCache.get(key) ?? null

  try {
    const q = [city, country].filter(Boolean).join(', ')
    const hits = await searchLocations(q)
    const hit = hits.find((h) => h.lat != null && h.lon != null)
    const point = hit?.lat != null && hit?.lon != null ? { lat: hit.lat, lon: hit.lon } : null
    cityCenterCache.set(key, point)
    return point
  } catch {
    cityCenterCache.set(key, null)
    return null
  }
}

export function radiusModeToKm(mode: GeoRadiusMode): number | null {
  const hit = GEO_RADIUS_OPTIONS.find((o) => o.id === mode)
  return hit?.km ?? null
}

export type LocatableProfile = {
  location?: string | null
  service_latitude?: number | null
  service_longitude?: number | null
  service_radius_km?: number | null
}

export type GeoMatchResult = {
  matches: boolean
  distanceKm: number | null
}

function includesLoose(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

function adminMatch(location: string | null | undefined, geo: GeoSearchState): boolean {
  if (!geo.country && !geo.region && !geo.province && !geo.city) return true
  const loc = location ?? ''
  const parsed = parseRegistrationLocation(loc)

  if (geo.country) {
    const countryOk =
      includesLoose(loc, geo.country) ||
      (parsed?.country ? includesLoose(parsed.country, geo.country) : false)
    if (!countryOk) return false
  }

  if (geo.radius === 'country') return Boolean(geo.country)

  if (geo.region) {
    const regionOk =
      includesLoose(loc, geo.region) ||
      (parsed?.region ? includesLoose(parsed.region, geo.region) : false) ||
      // Province/city often stored without region name
      (geo.province ? includesLoose(loc, geo.province) : false) ||
      (geo.city ? includesLoose(loc, geo.city) : false)
    if (!regionOk && geo.radius === 'region') return false
    if (!regionOk && !geo.province && !geo.city) return false
  }

  if (geo.radius === 'region') return true

  if (geo.province) {
    const provinceOk = includesLoose(loc, geo.province)
    if (geo.radius === 'province' && !provinceOk && !(geo.city && includesLoose(loc, geo.city))) {
      return false
    }
  }

  if (geo.radius === 'province') return true

  if (geo.city) {
    return includesLoose(loc, geo.city) || (parsed?.city ? includesLoose(parsed.city, geo.city) : false)
  }

  return true
}

/**
 * Match a profile against the geo search selection.
 * - km radius: prefer haversine; fall back to admin match if no coords
 * - admin radius (province/region/country): string hierarchy match
 * - If profile has service_radius_km and we have distance, require distance ≤ service radius
 */
export function matchProfileGeo(profile: LocatableProfile, geo: GeoSearchState): GeoMatchResult {
  const inactive =
    !geo.country && !geo.region && !geo.province && !geo.city && geo.originLat == null
  if (inactive) return { matches: true, distanceKm: null }

  const km = radiusModeToKm(geo.radius)
  const origin: GeoPoint | null =
    geo.originLat != null && geo.originLng != null
      ? { lat: geo.originLat, lon: geo.originLng }
      : null

  const hasCoords =
    profile.service_latitude != null &&
    profile.service_longitude != null &&
    Number.isFinite(profile.service_latitude) &&
    Number.isFinite(profile.service_longitude)

  let distanceKm: number | null = null
  if (origin && hasCoords) {
    distanceKm = haversineKm(origin, {
      lat: profile.service_latitude as number,
      lon: profile.service_longitude as number,
    })
  }

  // Pro travel radius: if set and we know distance, they must cover the search origin
  if (
    distanceKm != null &&
    profile.service_radius_km != null &&
    profile.service_radius_km > 0 &&
    distanceKm > profile.service_radius_km
  ) {
    return { matches: false, distanceKm }
  }

  if (km != null) {
    if (distanceKm != null) {
      return { matches: distanceKm <= km, distanceKm }
    }
    // No coordinates → administrative fallback (city/province/region/country)
    return { matches: adminMatch(profile.location, geo), distanceKm: null }
  }

  // Administrative radius modes
  return { matches: adminMatch(profile.location, { ...geo, radius: geo.radius }), distanceKm }
}

export function sortByDistanceAsc<T extends { distanceKm?: number | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY
    return da - db
  })
}

export function geoSearchToQuery(geo: GeoSearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (geo.country) params.set('country', geo.country)
  if (geo.region) params.set('region', geo.region)
  if (geo.province) params.set('province', geo.province)
  if (geo.city) params.set('city', geo.city)
  if (geo.radius && geo.radius !== '25') params.set('radius', geo.radius)
  if (geo.originLat != null) params.set('lat', String(geo.originLat))
  if (geo.originLng != null) params.set('lng', String(geo.originLng))
  if (geo.fromGps) params.set('gps', '1')
  return params
}

export function geoSearchFromQuery(params: URLSearchParams): Partial<GeoSearchState> {
  const radius = params.get('radius') as GeoRadiusMode | null
  const lat = params.get('lat')
  const lng = params.get('lng')
  return {
    country: params.get('country') ?? '',
    region: params.get('region') ?? '',
    province: params.get('province') ?? '',
    city: params.get('city') ?? params.get('location') ?? '',
    radius: radius && GEO_RADIUS_OPTIONS.some((o) => o.id === radius) ? radius : '25',
    originLat: lat ? Number(lat) : null,
    originLng: lng ? Number(lng) : null,
    fromGps: params.get('gps') === '1',
  }
}

export function formatLocationParts(location: string | null | undefined): {
  city: string
  region: string
  country: string
} {
  const parsed = parseRegistrationLocation(location ?? '')
  if (parsed) return parsed
  const raw = (location ?? '').trim()
  return { city: raw, region: '', country: '' }
}

/** Build SEO path segment: spain/alicante/electricians */
export function geoSeoPath(parts: {
  country: string
  provinceOrCity: string
  city?: string
  tradeSlug: string
}): string {
  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const country = slug(parts.country)
  const area = slug(parts.provinceOrCity)
  const trade = slug(parts.tradeSlug).replace(/s$/, '') + 's'
  if (parts.city && slug(parts.city) !== area) {
    return `/${country}/${area}/${slug(parts.city)}/${trade}`
  }
  return `/${country}/${area}/${trade}`
}

const COUNTRY_SLUGS: Record<string, string> = {
  spain: 'Spain',
  germany: 'Germany',
  france: 'France',
  italy: 'Italy',
  poland: 'Poland',
  portugal: 'Portugal',
  ukraine: 'Ukraine',
  austria: 'Austria',
  netherlands: 'Netherlands',
  belgium: 'Belgium',
  'united-kingdom': 'United Kingdom',
  uk: 'United Kingdom',
}

/** Parse /spain/alicante/electricians or /spain/alicante/alicante/plumbers */
export function parseGeoServicePath(parts: string[]): {
  country: string
  province: string
  city: string
  tradeSlug: string
} | null {
  if (parts.length !== 3 && parts.length !== 4) return null
  const country = COUNTRY_SLUGS[parts[0].toLowerCase()]
  if (!country) return null

  const tradeRaw = parts[parts.length - 1].toLowerCase()
  const tradeSlug = tradeRaw.replace(/s$/, '') // electricians → electrician
  // Keep plural aliases: electricians, plumbers, painters, lawyers
  const normalizedTrade =
    tradeSlug === 'electriciane' ? 'electrician' : tradeSlug === 'lawyer' ? 'lawyer' : tradeSlug

  if (parts.length === 3) {
    const area = parts[1]
    const areaName = area
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    return {
      country,
      province: areaName,
      city: areaName,
      tradeSlug: normalizedTrade,
    }
  }

  const province = parts[1]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const city = parts[2]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return { country, province, city, tradeSlug: normalizedTrade }
}
