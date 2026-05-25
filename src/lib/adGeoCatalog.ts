import { supabase } from './supabase'
import {
  parseRegistrationLocation,
  REGISTRATION_COUNTRIES,
} from './registrationGeoData'

export type AdGeoCountry = {
  name: string
  regions: Array<{ name: string; cities: string[] }>
}

export type GeoRow = {
  country: string
  region?: string | null
  city: string
}

/** Мінімальний seed, поки в БД ще немає реєстрацій */
const FALLBACK_GEO_ROWS: GeoRow[] = [
  { country: 'Ukraine', region: 'Київська', city: 'Київ' },
  { country: 'Ukraine', region: 'Львівська', city: 'Львів' },
  { country: 'Poland', region: 'Mazowieckie', city: 'Warsaw' },
  { country: 'Germany', region: 'Hessen', city: 'Frankfurt' },
]

export function groupGeoRows(rows: GeoRow[]): AdGeoCountry[] {
  const grouped: Record<string, Record<string, string[]>> = {}

  for (const row of rows) {
    if (!row.country?.trim() || !row.city?.trim()) continue
    const country = row.country.trim()
    const region = row.region?.trim() || 'Інші'
    const city = row.city.trim()
    if (!grouped[country]) grouped[country] = {}
    if (!grouped[country][region]) grouped[country][region] = []
    if (!grouped[country][region].includes(city)) {
      grouped[country][region].push(city)
    }
  }

  return Object.entries(grouped)
    .map(([name, regions]) => ({
      name,
      regions: Object.entries(regions)
        .map(([regionName, cities]) => ({
          name: regionName,
          cities: [...cities].sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function fallbackAdGeoCatalog(): AdGeoCountry[] {
  return groupGeoRows(FALLBACK_GEO_ROWS)
}

export function allCitiesFromCatalog(catalog: AdGeoCountry[]): string[] {
  return catalog.flatMap((country) => country.regions.flatMap((region) => region.cities))
}

function dedupeGeoRows(rows: GeoRow[]): GeoRow[] {
  const seen = new Set<string>()
  const out: GeoRow[] = []
  for (const row of rows) {
    if (!row.country?.trim() || !row.city?.trim()) continue
    const key = `${row.country.trim()}|${row.region?.trim() || 'Інші'}|${row.city.trim()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      country: row.country.trim(),
      region: row.region?.trim() || 'Інші',
      city: row.city.trim(),
    })
  }
  return out
}

export function mergeGeoCatalogs(...catalogs: AdGeoCountry[]): AdGeoCountry[] {
  return groupGeoRows(
    catalogs.flatMap((catalog) =>
      catalog.flatMap((country) =>
        country.regions.flatMap((region) =>
          region.cities.map((city) => ({
            country: country.name,
            region: region.name,
            city,
          })),
        ),
      ),
    ),
  )
}

/** Усі країни для вибору: фіксований список + країни з БД */
export function allKnownCountries(catalog: AdGeoCountry[]): string[] {
  return [...new Set([...REGISTRATION_COUNTRIES, ...catalog.map((c) => c.name)])].sort((a, b) =>
    a.localeCompare(b, 'uk'),
  )
}

/** Каталог з порожніми регіонами для країн без реєстрацій */
export function catalogWithAllCountries(catalog: AdGeoCountry[]): AdGeoCountry[] {
  const byName = new Map(catalog.map((c) => [c.name, c]))
  for (const name of REGISTRATION_COUNTRIES) {
    if (!byName.has(name)) {
      byName.set(name, { name, regions: [] })
    }
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'uk'))
}

async function loadGeoRowsFromTable(
  table: 'geo_catalog' | 'active_geo',
  country?: string,
): Promise<GeoRow[]> {
  let query = supabase.from(table).select('country, region, city').order('country')
  if (country) {
    query = query.eq('country', country)
  }
  const { data, error } = await query
  if (error || !data?.length) return []
  return dedupeGeoRows(data as GeoRow[])
}

async function loadAllGeoRows(): Promise<GeoRow[]> {
  return dedupeGeoRows([
    ...(await loadGeoRowsFromTable('geo_catalog')),
    ...(await loadGeoRowsFromTable('active_geo')),
  ])
}

/** Повний каталог для реклами — лише з БД (+ мінімальний seed) */
export async function fetchAdGeoCatalog(): Promise<AdGeoCountry[]> {
  try {
    const dbRows = await loadAllGeoRows()
    const fromDb = dbRows.length > 0 ? groupGeoRows(dbRows) : fallbackAdGeoCatalog()
    return catalogWithAllCountries(fromDb)
  } catch (err) {
    console.error('Помилка завантаження geo_catalog:', err)
    return catalogWithAllCountries(fallbackAdGeoCatalog())
  }
}

/** Регіони/міста однієї країни (реєстрація, форми) */
export async function fetchGeoCatalogForCountry(country: string): Promise<AdGeoCountry | null> {
  if (!country.trim()) return null
  try {
    const rows = dedupeGeoRows([
      ...(await loadGeoRowsFromTable('geo_catalog', country)),
      ...(await loadGeoRowsFromTable('active_geo', country)),
    ])
    if (rows.length === 0) {
      return { name: country, regions: [] }
    }
    const grouped = groupGeoRows(rows)
    return grouped.find((c) => c.name === country) ?? grouped[0] ?? { name: country, regions: [] }
  } catch (err) {
    console.warn('fetchGeoCatalogForCountry:', err)
    return { name: country, regions: [] }
  }
}

/** Додає країну/регіон/місто в geo_catalog */
export async function upsertGeoCatalogEntry(
  country: string,
  region: string,
  city: string,
): Promise<void> {
  const c = country?.trim()
  const r = (region?.trim() || 'Інші')
  const cityName = city?.trim()
  if (!c || !cityName) return

  try {
    const { error } = await supabase.rpc('register_geo_location', {
      p_country: c,
      p_region: r,
      p_city: cityName,
    })
    if (error) {
      const { error: insertError } = await supabase.from('geo_catalog').insert({
        country: c,
        region: r,
        city: cityName,
      })
      if (insertError && insertError.code !== '23505') {
        console.warn('[geo_catalog] upsert:', insertError.message)
      }
    }
  } catch (err) {
    console.warn('[geo_catalog] upsert failed:', err)
  }
}

/** Додає локацію з рядка "місто, регіон, країна" */
export async function upsertGeoCatalogFromLocation(location: string | null | undefined): Promise<void> {
  const parsed = location ? parseRegistrationLocation(location) : null
  if (!parsed) return
  await upsertGeoCatalogEntry(parsed.country, parsed.region, parsed.city)
}

export type GeoMode = 'global' | 'countries' | 'regions' | 'cities'

export function resolveTargetCities(
  geoMode: GeoMode,
  catalog: AdGeoCountry[],
  selectedCountries: string[],
  selectedRegions: string[],
  selectedCities: string[],
): string[] {
  if (geoMode === 'global') return []
  if (geoMode === 'countries') {
    return catalog
      .filter((country) => selectedCountries.includes(country.name))
      .flatMap((country) => country.regions.flatMap((region) => region.cities))
  }
  if (geoMode === 'regions') {
    return catalog
      .filter((country) => selectedCountries.includes(country.name))
      .flatMap((country) => country.regions)
      .filter((region) => selectedRegions.includes(region.name))
      .flatMap((region) => region.cities)
  }
  return selectedCities
}

export function billingCityUnits(
  geoMode: GeoMode,
  catalog: AdGeoCountry[],
  targetCities: string[],
): number {
  if (geoMode === 'global') return Math.max(1, allCitiesFromCatalog(catalog).length)
  return Math.max(targetCities.length, 0)
}

export function isGeoSelectionValid(
  geoMode: GeoMode,
  selectedCountries: string[],
  selectedRegions: string[],
  selectedCities: string[],
): boolean {
  if (geoMode === 'global') return true
  if (geoMode === 'countries') return selectedCountries.length > 0
  if (geoMode === 'regions') return selectedRegions.length > 0 && selectedCountries.length > 0
  return selectedCities.length > 0 && selectedCountries.length > 0
}

export function catalogCountries(catalog: AdGeoCountry[]): string[] {
  return allKnownCountries(catalog)
}

export function catalogRegionsForCountry(catalog: AdGeoCountry[], country: string) {
  return catalog.find((c) => c.name === country)?.regions ?? []
}

export function catalogCitiesForRegion(catalog: AdGeoCountry[], country: string, region: string): string[] {
  return catalogRegionsForCountry(catalog, country).find((r) => r.name === region)?.cities ?? []
}
