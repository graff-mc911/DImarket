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
  'spain|badalona': { lat: 41.4502, lon: 2.2474 },
  'spain|viladecans': { lat: 41.314, lon: 2.0143 },
  'spain|algeciras': { lat: 36.1408, lon: -5.4565 },
  'spain|motril': { lat: 36.745, lon: -3.5206 },
  'spain|don benito': { lat: 38.956, lon: -5.8616 },
  'spain|seseña': { lat: 40.1047, lon: -3.6978 },
  'spain|sesena': { lat: 40.1047, lon: -3.6978 },
  'spain|alakante': { lat: 38.3452, lon: -0.481 },
  'spain|arroyomolinos': { lat: 40.2694, lon: -3.9194 },
  'spain|esplugues de llobregat': { lat: 41.3773, lon: 2.0889 },
  'spain|hospitalet de llobregat': { lat: 41.3598, lon: 2.1003 },
  "spain|l'hospitalet de llobregat": { lat: 41.3598, lon: 2.1003 },
  'spain|peligros': { lat: 37.231, lon: -3.6294 },
  'spain|ciudad real': { lat: 38.9848, lon: -3.9274 },
  'spain|sant boi de llobregat': { lat: 41.3436, lon: 2.0436 },
  'spain|san fernando de henares': { lat: 40.4253, lon: -3.5325 },
  'spain|san martín de valdeiglesias': { lat: 40.3619, lon: -4.3981 },
  'spain|san martin de valdeiglesias': { lat: 40.3619, lon: -4.3981 },
  'germany|darmstadt': { lat: 49.8728, lon: 8.6512 },
  'germany|frankfurt': { lat: 50.1109, lon: 8.6821 },
  'germany|hamburg': { lat: 53.5511, lon: 9.9937 },
  'germany|munich': { lat: 48.1351, lon: 11.582 },
  'germany|münchen': { lat: 48.1351, lon: 11.582 },
  'germany|berlin': { lat: 52.52, lon: 13.405 },
  'germany|cologne': { lat: 50.9375, lon: 6.9603 },
  'germany|köln': { lat: 50.9375, lon: 6.9603 },
  'germany|stuttgart': { lat: 48.7758, lon: 9.1829 },
  'germany|leipzig': { lat: 51.3397, lon: 12.3731 },
  'france|paris': { lat: 48.8566, lon: 2.3522 },
  'france|lyon': { lat: 45.764, lon: 4.8357 },
  'france|marseille': { lat: 43.2965, lon: 5.3698 },
  'poland|warsaw': { lat: 52.2297, lon: 21.0122 },
  'poland|warszawa': { lat: 52.2297, lon: 21.0122 },
  'poland|krakow': { lat: 50.0647, lon: 19.945 },
  'poland|kraków': { lat: 50.0647, lon: 19.945 },
  'ukraine|kyiv': { lat: 50.4501, lon: 30.5234 },
  'ukraine|київ': { lat: 50.4501, lon: 30.5234 },
  'ukraine|киев': { lat: 50.4501, lon: 30.5234 },
  'ukraine|kiev': { lat: 50.4501, lon: 30.5234 },
  'ukraine|lviv': { lat: 49.8397, lon: 24.0297 },
  'ukraine|львів': { lat: 49.8397, lon: 24.0297 },
  'ukraine|львов': { lat: 49.8397, lon: 24.0297 },
  'ukraine|odesa': { lat: 46.4825, lon: 30.7233 },
  'ukraine|odessa': { lat: 46.4825, lon: 30.7233 },
  'ukraine|одеса': { lat: 46.4825, lon: 30.7233 },
  'ukraine|одесса': { lat: 46.4825, lon: 30.7233 },
  'ukraine|kharkiv': { lat: 49.9935, lon: 36.2304 },
  'ukraine|харків': { lat: 49.9935, lon: 36.2304 },
  'ukraine|харьков': { lat: 49.9935, lon: 36.2304 },
  'ukraine|dnipro': { lat: 48.4647, lon: 35.0462 },
  'ukraine|дніпро': { lat: 48.4647, lon: 35.0462 },
  'ukraine|днепр': { lat: 48.4647, lon: 35.0462 },
  'italy|rome': { lat: 41.9028, lon: 12.4964 },
  'italy|roma': { lat: 41.9028, lon: 12.4964 },
  'italy|milan': { lat: 45.4642, lon: 9.19 },
  'italy|milano': { lat: 45.4642, lon: 9.19 },
  'austria|vienna': { lat: 48.2082, lon: 16.3738 },
  'austria|wien': { lat: 48.2082, lon: 16.3738 },
  'netherlands|amsterdam': { lat: 52.3676, lon: 4.9041 },
  'netherlands|eindhoven': { lat: 51.4416, lon: 5.4697 },
  'finland|helsinki': { lat: 60.1699, lon: 24.9384 },
  'portugal|lisbon': { lat: 38.7223, lon: -9.1393 },
  'portugal|lisboa': { lat: 38.7223, lon: -9.1393 },
  'czech republic|prague': { lat: 50.0755, lon: 14.4378 },
  'czechia|prague': { lat: 50.0755, lon: 14.4378 },
  'czech republic|praha': { lat: 50.0755, lon: 14.4378 },
  'slovakia|bratislava': { lat: 48.1486, lon: 17.1077 },
  'slovakia|košice': { lat: 48.7164, lon: 21.2611 },
  'slovakia|kosice': { lat: 48.7164, lon: 21.2611 },
  'slovakia|nitra': { lat: 48.3061, lon: 18.0764 },
  'slovakia|trnava': { lat: 48.3774, lon: 17.5883 },
  'slovakia|banská bystrica': { lat: 48.7363, lon: 19.1462 },
  'slovakia|banska bystrica': { lat: 48.7363, lon: 19.1462 },
  'romania|bucharest': { lat: 44.4268, lon: 26.1025 },
  'romania|bucurești': { lat: 44.4268, lon: 26.1025 },
  'romania|bucuresti': { lat: 44.4268, lon: 26.1025 },
  'romania|cluj-napoca': { lat: 46.7712, lon: 23.6236 },
  'romania|cluj': { lat: 46.7712, lon: 23.6236 },
  'romania|timișoara': { lat: 45.7489, lon: 21.2087 },
  'romania|timisoara': { lat: 45.7489, lon: 21.2087 },
  'romania|iași': { lat: 47.1585, lon: 27.6014 },
  'romania|iasi': { lat: 47.1585, lon: 27.6014 },
  'romania|constanța': { lat: 44.1598, lon: 28.6348 },
  'romania|constanta': { lat: 44.1598, lon: 28.6348 },
}

/** City-only lookup when country is unknown (e.g. listing.location = "Berlin"). */
const CITY_ONLY_CENTERS: Record<string, GeoPoint> = {
  berlin: { lat: 52.52, lon: 13.405 },
  munich: { lat: 48.1351, lon: 11.582 },
  münchen: { lat: 48.1351, lon: 11.582 },
  frankfurt: { lat: 50.1109, lon: 8.6821 },
  hamburg: { lat: 53.5511, lon: 9.9937 },
  darmstadt: { lat: 49.8728, lon: 8.6512 },
  cologne: { lat: 50.9375, lon: 6.9603 },
  köln: { lat: 50.9375, lon: 6.9603 },
  madrid: { lat: 40.4168, lon: -3.7038 },
  barcelona: { lat: 41.3874, lon: 2.1686 },
  valencia: { lat: 39.4699, lon: -0.3763 },
  alicante: { lat: 38.3452, lon: -0.481 },
  alakante: { lat: 38.3452, lon: -0.481 },
  getafe: { lat: 40.3057, lon: -3.7328 },
  pinto: { lat: 40.2412, lon: -3.699 },
  torrent: { lat: 39.437, lon: -0.4656 },
  torrevieja: { lat: 37.9787, lon: -0.6822 },
  palma: { lat: 39.5696, lon: 2.6502 },
  murcia: { lat: 37.9922, lon: -1.1307 },
  granada: { lat: 37.1773, lon: -3.5986 },
  bilbao: { lat: 43.263, lon: -2.935 },
  badalona: { lat: 41.4502, lon: 2.2474 },
  viladecans: { lat: 41.314, lon: 2.0143 },
  algeciras: { lat: 36.1408, lon: -5.4565 },
  motril: { lat: 36.745, lon: -3.5206 },
  'don benito': { lat: 38.956, lon: -5.8616 },
  'seseña': { lat: 40.1047, lon: -3.6978 },
  sesena: { lat: 40.1047, lon: -3.6978 },
  arroyomolinos: { lat: 40.2694, lon: -3.9194 },
  'esplugues de llobregat': { lat: 41.3773, lon: 2.0889 },
  'hospitalet de llobregat': { lat: 41.3598, lon: 2.1003 },
  "l'hospitalet de llobregat": { lat: 41.3598, lon: 2.1003 },
  peligros: { lat: 37.231, lon: -3.6294 },
  'ciudad real': { lat: 38.9848, lon: -3.9274 },
  'sant boi de llobregat': { lat: 41.3436, lon: 2.0436 },
  'san fernando de henares': { lat: 40.4253, lon: -3.5325 },
  'san martín de valdeiglesias': { lat: 40.3619, lon: -4.3981 },
  'san martin de valdeiglesias': { lat: 40.3619, lon: -4.3981 },
  zaragoza: { lat: 41.6488, lon: -0.8891 },
  malaga: { lat: 36.7213, lon: -4.4214 },
  málaga: { lat: 36.7213, lon: -4.4214 },
  sevilla: { lat: 37.3891, lon: -5.9845 },
  seville: { lat: 37.3891, lon: -5.9845 },
  paris: { lat: 48.8566, lon: 2.3522 },
  lyon: { lat: 45.764, lon: 4.8357 },
  warsaw: { lat: 52.2297, lon: 21.0122 },
  warszawa: { lat: 52.2297, lon: 21.0122 },
  kyiv: { lat: 50.4501, lon: 30.5234 },
  київ: { lat: 50.4501, lon: 30.5234 },
  киев: { lat: 50.4501, lon: 30.5234 },
  kiev: { lat: 50.4501, lon: 30.5234 },
  rome: { lat: 41.9028, lon: 12.4964 },
  roma: { lat: 41.9028, lon: 12.4964 },
  milan: { lat: 45.4642, lon: 9.19 },
  milano: { lat: 45.4642, lon: 9.19 },
  vienna: { lat: 48.2082, lon: 16.3738 },
  wien: { lat: 48.2082, lon: 16.3738 },
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  prague: { lat: 50.0755, lon: 14.4378 },
  praha: { lat: 50.0755, lon: 14.4378 },
  lisbon: { lat: 38.7223, lon: -9.1393 },
  lisboa: { lat: 38.7223, lon: -9.1393 },
  eindhoven: { lat: 51.4416, lon: 5.4697 },
  bratislava: { lat: 48.1486, lon: 17.1077 },
  'košice': { lat: 48.7164, lon: 21.2611 },
  kosice: { lat: 48.7164, lon: 21.2611 },
  nitra: { lat: 48.3061, lon: 18.0764 },
  trnava: { lat: 48.3774, lon: 17.5883 },
  'banská bystrica': { lat: 48.7363, lon: 19.1462 },
  'banska bystrica': { lat: 48.7363, lon: 19.1462 },
  bucharest: { lat: 44.4268, lon: 26.1025 },
  bucuresti: { lat: 44.4268, lon: 26.1025 },
  'cluj-napoca': { lat: 46.7712, lon: 23.6236 },
  cluj: { lat: 46.7712, lon: 23.6236 },
  'timișoara': { lat: 45.7489, lon: 21.2087 },
  timisoara: { lat: 45.7489, lon: 21.2087 },
  'iași': { lat: 47.1585, lon: 27.6014 },
  iasi: { lat: 47.1585, lon: 27.6014 },
  'constanța': { lat: 44.1598, lon: 28.6348 },
  constanta: { lat: 44.1598, lon: 28.6348 },
  lviv: { lat: 49.8397, lon: 24.0297 },
  львів: { lat: 49.8397, lon: 24.0297 },
  львов: { lat: 49.8397, lon: 24.0297 },
  odessa: { lat: 46.4825, lon: 30.7233 },
  odesa: { lat: 46.4825, lon: 30.7233 },
  одеса: { lat: 46.4825, lon: 30.7233 },
  одесса: { lat: 46.4825, lon: 30.7233 },
  kharkiv: { lat: 49.9935, lon: 36.2304 },
  харків: { lat: 49.9935, lon: 36.2304 },
  харьков: { lat: 49.9935, lon: 36.2304 },
  dnipro: { lat: 48.4647, lon: 35.0462 },
  дніпро: { lat: 48.4647, lon: 35.0462 },
  днепр: { lat: 48.4647, lon: 35.0462 },
  днепропетровск: { lat: 48.4647, lon: 35.0462 },
  krakow: { lat: 50.0647, lon: 19.945 },
  kraków: { lat: 50.0647, lon: 19.945 },
  краків: { lat: 50.0647, lon: 19.945 },
  wroclaw: { lat: 51.1079, lon: 17.0385 },
  wrocław: { lat: 51.1079, lon: 17.0385 },
  gdansk: { lat: 54.352, lon: 18.6466 },
  gdańsk: { lat: 54.352, lon: 18.6466 },
  london: { lat: 51.5074, lon: -0.1278 },
  лондон: { lat: 51.5074, lon: -0.1278 },
  stockholm: { lat: 59.3293, lon: 18.0686 },
  brussels: { lat: 50.8503, lon: 4.3517 },
  bruxelles: { lat: 50.8503, lon: 4.3517 },
  zurich: { lat: 47.3769, lon: 8.5417 },
  zürich: { lat: 47.3769, lon: 8.5417 },
  copenhagen: { lat: 55.6761, lon: 12.5683 },
  københavn: { lat: 55.6761, lon: 12.5683 },
  oslo: { lat: 59.9139, lon: 10.7522 },
  helsinki: { lat: 60.1699, lon: 24.9384 },
  dublin: { lat: 53.3498, lon: -6.2603 },
  budapest: { lat: 47.4979, lon: 19.0402 },
  sofia: { lat: 42.6977, lon: 23.3219 },
  belgrade: { lat: 44.7866, lon: 20.4489 },
  zagreb: { lat: 45.815, lon: 15.9819 },
  athens: { lat: 37.9838, lon: 23.7275 },
  istanbul: { lat: 41.0082, lon: 28.9784 },
  tallinn: { lat: 59.437, lon: 24.7536 },
  riga: { lat: 56.9496, lon: 24.1052 },
  vilnius: { lat: 54.6872, lon: 25.2797 },
  берлін: { lat: 52.52, lon: 13.405 },
  варшава: { lat: 52.2297, lon: 21.0122 },
  париж: { lat: 48.8566, lon: 2.3522 },
  мюнхен: { lat: 48.1351, lon: 11.582 },
  відень: { lat: 48.2082, lon: 16.3738 },
  прага: { lat: 50.0755, lon: 14.4378 },
}

/** Last-resort pin when only a country is known (directory map, not a precise address). */
const COUNTRY_INFER_CENTERS: Record<string, GeoPoint> = {
  spain: { lat: 40.4, lon: -3.7 },
  іспанія: { lat: 40.4, lon: -3.7 },
  germany: { lat: 51.1, lon: 10.4 },
  deutschland: { lat: 51.1, lon: 10.4 },
  німеччина: { lat: 51.1, lon: 10.4 },
  france: { lat: 46.6, lon: 2.2 },
  франція: { lat: 46.6, lon: 2.2 },
  italy: { lat: 42.5, lon: 12.5 },
  italia: { lat: 42.5, lon: 12.5 },
  poland: { lat: 52.1, lon: 19.4 },
  польща: { lat: 52.1, lon: 19.4 },
  portugal: { lat: 39.4, lon: -8.2 },
  ukraine: { lat: 48.4, lon: 31.2 },
  україна: { lat: 48.4, lon: 31.2 },
  netherlands: { lat: 52.1, lon: 5.3 },
  belgium: { lat: 50.5, lon: 4.5 },
  austria: { lat: 47.6, lon: 14.1 },
  switzerland: { lat: 46.8, lon: 8.2 },
  liechtenstein: { lat: 47.166, lon: 9.509 },
  denmark: { lat: 56.0, lon: 10.0 },
  finland: { lat: 64.0, lon: 26.0 },
  ireland: { lat: 53.4, lon: -8.0 },
  sweden: { lat: 62.0, lon: 15.0 },
  china: { lat: 35.0, lon: 103.0 },
  'united states': { lat: 39.8, lon: -98.5 },
  usa: { lat: 39.8, lon: -98.5 },
}

const cityCenterCache = new Map<string, GeoPoint | null>()

function cityKey(country: string, city: string): string {
  return `${country.trim().toLowerCase()}|${city.trim().toLowerCase()}`
}

export function knownCityCenter(country: string, city: string): GeoPoint | null {
  if (!city) return null
  if (country) {
    const hit = CITY_CENTERS[cityKey(country, city)]
    if (hit) return hit
  }
  return CITY_ONLY_CENTERS[city.trim().toLowerCase()] ?? null
}

/**
 * Resolve approximate coordinates from free-form location text
 * (e.g. "Berlin", "Warsaw, Poland", "Kyiv / Ukraine").
 */
export function inferCoordsFromLocationText(
  location: string | null | undefined,
): GeoPoint | null {
  if (!location?.trim()) return null
  const raw = location.trim()
  const lower = raw.toLowerCase()

  if (CITY_ONLY_CENTERS[lower]) return CITY_ONLY_CENTERS[lower]

  const parts = raw.split(/[,/|–—-]+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const fromPair =
      knownCityCenter(parts[1], parts[0]) ?? knownCityCenter(parts[0], parts[1])
    if (fromPair) return fromPair
    const fromCountry = knownCityCenter(parts[parts.length - 1], parts[0])
    if (fromCountry) return fromCountry
  }

  const cities = Object.keys(CITY_ONLY_CENTERS).sort((a, b) => b.length - a.length)
  for (const city of cities) {
    if (lower.includes(city)) return CITY_ONLY_CENTERS[city]
  }

  for (const [key, coords] of Object.entries(CITY_CENTERS)) {
    const cityPart = key.split('|')[1]
    if (cityPart && lower.includes(cityPart)) return coords
  }

  const countries = Object.entries(COUNTRY_INFER_CENTERS).sort((a, b) => b[0].length - a[0].length)
  for (const [name, coords] of countries) {
    if (lower.includes(name)) return coords
  }

  return null
}

export async function resolveCityCenter(
  country: string,
  city: string,
): Promise<GeoPoint | null> {
  const key = cityKey(country, city)
  if (!city) return null
  const known = CITY_CENTERS[key] ?? (city ? CITY_ONLY_CENTERS[city.trim().toLowerCase()] : null)
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
