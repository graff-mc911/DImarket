import { supabase } from './supabase'

export type AdGeoCountry = {
  name: string
  regions: Array<{ name: string; cities: string[] }>
}

type GeoRow = {
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

  return Object.entries(grouped).map(([name, regions]) => ({
    name,
    regions: Object.entries(regions).map(([regionName, cities]) => ({
      name: regionName,
      cities,
    })),
  }))
}

export function fallbackAdGeoCatalog(): AdGeoCountry[] {
  return groupGeoRows(FALLBACK_GEO_ROWS)
}

export function allCitiesFromCatalog(catalog: AdGeoCountry[]): string[] {
  return catalog.flatMap((country) => country.regions.flatMap((region) => region.cities))
}

async function loadGeoTable(table: 'geo_catalog' | 'active_geo'): Promise<AdGeoCountry[]> {
  const { data, error } = await supabase
    .from(table)
    .select('country, region, city')
    .order('country')

  if (error || !data?.length) return []
  return groupGeoRows(data as GeoRow[])
}

/** Каталог для форми реклами: geo_catalog → active_geo → локальний fallback */
export async function fetchAdGeoCatalog(): Promise<AdGeoCountry[]> {
  try {
    const fromCatalog = await loadGeoTable('geo_catalog')
    if (fromCatalog.length > 0) return fromCatalog

    const fromActive = await loadGeoTable('active_geo')
    if (fromActive.length > 0) return fromActive
  } catch (err) {
    console.error('Помилка завантаження geo_catalog:', err)
  }

  return fallbackAdGeoCatalog()
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
