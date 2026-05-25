import { supabase } from './supabase'
import {
  parseRegistrationLocation,
  REGISTRATION_GEO_DATA,
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

/** Базовий каталог — збігається з seed у supabase/migrations */
const FALLBACK_GEO_ROWS: GeoRow[] = [
  { country: 'Україна', region: 'Київська', city: 'Київ' },
  { country: 'Україна', region: 'Львівська', city: 'Львів' },
  { country: 'Україна', region: 'Харківська', city: 'Харків' },
  { country: 'Україна', region: 'Одеська', city: 'Одеса' },
  { country: 'Україна', region: 'Дніпропетровська', city: 'Дніпро' },
  { country: 'Польща', region: 'Мазовецьке', city: 'Варшава' },
  { country: 'Польща', region: 'Малопольське', city: 'Краків' },
  { country: 'Польща', region: 'Нижньосілезьке', city: 'Вроцлав' },
  { country: 'Німеччина', region: 'Баварія', city: 'Мюнхен' },
  { country: 'Німеччина', region: 'Берлін', city: 'Берлін' },
  { country: 'Німеччина', region: 'Північний Рейн-Вестфалія', city: 'Кельн' },
  { country: 'Чехія', region: 'Прага', city: 'Прага' },
  { country: 'Словаччина', region: 'Братиславський', city: 'Братислава' },
  { country: 'Румунія', region: 'Бухарест', city: 'Бухарест' },
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

function registrationGeoToRows(): GeoRow[] {
  const rows: GeoRow[] = []
  for (const [country, regions] of Object.entries(REGISTRATION_GEO_DATA)) {
    for (const [region, cities] of Object.entries(regions)) {
      for (const city of cities) {
        rows.push({ country, region, city })
      }
    }
  }
  return rows
}

export function registrationGeoCatalog(): AdGeoCountry[] {
  return groupGeoRows(registrationGeoToRows())
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

async function loadGeoRowsFromTable(table: 'geo_catalog' | 'active_geo'): Promise<GeoRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select('country, region, city')
    .order('country')

  if (error || !data?.length) return []
  return dedupeGeoRows(data as GeoRow[])
}

/** Каталог для форми реклами: реєстраційне дерево + БД (профілі, оголошення) */
export async function fetchAdGeoCatalog(): Promise<AdGeoCountry[]> {
  const base = registrationGeoCatalog()

  try {
    const dbRows = dedupeGeoRows([
      ...(await loadGeoRowsFromTable('geo_catalog')),
      ...(await loadGeoRowsFromTable('active_geo')),
    ])
    if (dbRows.length === 0) return base

    const dbCatalog = groupGeoRows(dbRows)
    return mergeGeoCatalogs(base, dbCatalog)
  } catch (err) {
    console.error('Помилка завантаження geo_catalog:', err)
    return base
  }
}

/** Додає локацію з реєстрації в geo_catalog (через RPC, якщо є) */
export async function upsertGeoCatalogFromLocation(location: string | null | undefined): Promise<void> {
  const parsed = location ? parseRegistrationLocation(location) : null
  if (!parsed) return

  const { country, region, city } = parsed
  try {
    const { error } = await supabase.rpc('register_geo_location', {
      p_country: country,
      p_region: region,
      p_city: city,
    })
    if (error) {
      const { error: insertError } = await supabase.from('geo_catalog').insert({
        country,
        region,
        city,
      })
      if (insertError && insertError.code !== '23505') {
        console.warn('[geo_catalog] upsert:', insertError.message)
      }
    }
  } catch (err) {
    console.warn('[geo_catalog] upsert failed:', err)
  }
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

/** Допоміжники для каскаду країна → регіон → місто (як при реєстрації) */
export function catalogCountries(catalog: AdGeoCountry[]): string[] {
  return catalog.map((c) => c.name)
}

export function catalogRegionsForCountry(catalog: AdGeoCountry[], country: string) {
  return catalog.find((c) => c.name === country)?.regions ?? []
}

export function catalogCitiesForRegion(catalog: AdGeoCountry[], country: string, region: string): string[] {
  return catalogRegionsForCountry(catalog, country).find((r) => r.name === region)?.cities ?? []
}
