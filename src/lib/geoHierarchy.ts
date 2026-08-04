/**
 * Geographic hierarchy for directory search.
 * Country → Region → Province (optional overlay) → City
 * Lazy-loads geo_catalog with reference seed fallback; caches in memory.
 */

import {
  catalogCitiesForRegion,
  catalogCountries,
  catalogRegionsForCountry,
  fetchAdGeoCatalog,
  type AdGeoCountry,
} from './adGeoCatalog'
import { canonicalCountryName, canonicalRegionName } from './geoAliases'

export type GeoHierarchySelection = {
  country: string
  region: string
  province: string
  city: string
}

/** Province → cities under a country/region when seed is only region→cities. */
const PROVINCE_OVERLAY: Record<string, Record<string, Record<string, string[]>>> = {
  Spain: {
    Valencia: {
      Alicante: [
        'Alicante',
        'Torrevieja',
        'Elche',
        'Benidorm',
        'Alcoy',
        'Denia',
        'Orihuela',
        'Elda',
      ],
      Valencia: ['Valencia', 'Torrent', 'Gandia', 'Sagunto', 'Paterna', 'Burjassot'],
      Castellon: ['Castellon', 'Castellón de la Plana', 'Vila-real', 'Benicassim'],
    },
    Catalonia: {
      Barcelona: ['Barcelona', 'Hospitalet', "L'Hospitalet de Llobregat", 'Badalona', 'Sabadell', 'Terrassa', 'Viladecans', 'Esplugues de Llobregat'],
      Girona: ['Girona', 'Figueres'],
      Tarragona: ['Tarragona', 'Reus'],
      Lleida: ['Lleida'],
    },
    Madrid: {
      Madrid: ['Madrid', 'Getafe', 'Alcalá de Henares', 'Móstoles', 'Leganés', 'Fuenlabrada', 'Alcorcón', 'Pinto', 'Arroyomolinos', 'San Fernando de Henares'],
    },
    Andalusia: {
      Seville: ['Seville', 'Sevilla'],
      Malaga: ['Malaga', 'Málaga', 'Marbella', 'Motril'],
      Granada: ['Granada', 'Peligros'],
      Cordoba: ['Cordoba', 'Córdoba'],
      Cadiz: ['Cadiz', 'Cádiz'],
    },
    'Basque Country': {
      Biscay: ['Bilbao'],
      Gipuzkoa: ['San Sebastian', 'San Sebastián', 'Donostia'],
    },
    Murcia: {
      Murcia: ['Murcia', 'Cartagena'],
    },
    Aragon: {
      Zaragoza: ['Zaragoza'],
    },
    'Balearic Islands': {
      'Balearic Islands': ['Palma', 'Ibiza'],
    },
    'Canary Islands': {
      'Las Palmas': ['Las Palmas', 'Las Palmas de Gran Canaria'],
      'Santa Cruz de Tenerife': ['Santa Cruz de Tenerife'],
    },
  },
  Germany: {
    Hessen: {
      Darmstadt: ['Darmstadt'],
      Frankfurt: ['Frankfurt', 'Frankfurt am Main'],
    },
    Berlin: {
      Berlin: ['Berlin'],
    },
    Hamburg: {
      Hamburg: ['Hamburg'],
    },
    Bavaria: {
      Munich: ['Munich', 'München'],
      Nuremberg: ['Nuremberg', 'Nürnberg', 'Fürth'],
    },
    'North Rhine-Westphalia': {
      Cologne: ['Cologne', 'Köln'],
      Düsseldorf: ['Düsseldorf', 'Dusseldorf'],
      Dortmund: ['Dortmund'],
      Essen: ['Essen'],
    },
    'Baden-Württemberg': {
      Stuttgart: ['Stuttgart'],
    },
    Saxony: {
      Leipzig: ['Leipzig'],
      Dresden: ['Dresden'],
    },
    'Lower Saxony': {
      Hannover: ['Hannover', 'Hanover'],
    },
    Bremen: {
      Bremen: ['Bremen'],
    },
  },
  France: {
    'Île-de-France': {
      Paris: ['Paris', 'Versailles'],
    },
    Provence: {
      'Bouches-du-Rhône': ['Marseille'],
      'Alpes-Maritimes': ['Nice'],
    },
  },
}

let catalogCache: AdGeoCountry[] | null = null
let catalogPromise: Promise<AdGeoCountry[]> | null = null

export async function loadGeoCatalog(force = false): Promise<AdGeoCountry[]> {
  if (!force && catalogCache) return catalogCache
  if (!force && catalogPromise) return catalogPromise
  catalogPromise = fetchAdGeoCatalog()
    .then((data) => {
      catalogCache = data
      return data
    })
    .catch(() => {
      catalogCache = catalogCache ?? []
      return catalogCache
    })
  return catalogPromise
}

export function listCountries(catalog: AdGeoCountry[]): string[] {
  return catalogCountries(catalog)
}

export function listRegions(catalog: AdGeoCountry[], country: string): string[] {
  if (!country) return []
  return catalogRegionsForCountry(catalog, country).map((r) => r.name)
}

export function listProvinces(
  catalog: AdGeoCountry[],
  country: string,
  region: string,
): string[] {
  if (!country || !region) return []
  const cName = canonicalCountryName(country)
  const rName = canonicalRegionName(cName, region)
  const overlay = PROVINCE_OVERLAY[cName]?.[rName] ?? PROVINCE_OVERLAY[country]?.[region]
  if (overlay) return Object.keys(overlay).sort((a, b) => a.localeCompare(b))

  // No province overlay: treat each city as its own "province" group label (flat).
  // Return empty → UI skips province and shows cities for region.
  void catalog
  return []
}

export function listCities(
  catalog: AdGeoCountry[],
  country: string,
  region: string,
  province: string,
): string[] {
  if (!country || !region) return []
  const cName = canonicalCountryName(country)
  const rName = canonicalRegionName(cName, region)
  const overlay = PROVINCE_OVERLAY[cName]?.[rName] ?? PROVINCE_OVERLAY[country]?.[region]
  if (overlay && province) {
    const fromOverlay = overlay[province]
    if (fromOverlay?.length) return [...fromOverlay].sort((a, b) => a.localeCompare(b))
  }
  return catalogCitiesForRegion(catalog, country, region)
}

export function hasProvinceLevel(country: string, region: string): boolean {
  const cName = canonicalCountryName(country)
  const rName = canonicalRegionName(cName, region)
  return Boolean(PROVINCE_OVERLAY[cName]?.[rName] ?? PROVINCE_OVERLAY[country]?.[region])
}

export const EMPTY_GEO_SELECTION: GeoHierarchySelection = {
  country: '',
  region: '',
  province: '',
  city: '',
}
