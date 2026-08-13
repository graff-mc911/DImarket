/** Spain-first official portal config — do not hardcode URLs in React components. */

export type CountrySourcesConfig = {
  countryCode: string
  countryName: string
  officialGazetteUrl: string
  governmentPortalUrl: string
  taxPortalUrl: string
  businessPortalUrl: string
  regionalPortalUrl: string
  municipalPortalUrl: string
  licensingPortalUrl: string
  euPortalUrl: string
  sourcePriority: string[]
  notes: string
}

export const SPAIN_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'ES',
  countryName: 'Spain',
  officialGazetteUrl: 'https://www.boe.es/',
  governmentPortalUrl: 'https://administracion.gob.es/',
  taxPortalUrl: 'https://sede.agenciatributaria.gob.es/',
  businessPortalUrl: 'https://europa.eu/youreurope/business/',
  regionalPortalUrl: 'https://www.gva.es/',
  municipalPortalUrl: 'https://www.alicante.es/',
  licensingPortalUrl: 'https://sede.administracionespublicas.gob.es/',
  euPortalUrl: 'https://europa.eu/youreurope/',
  sourcePriority: [
    'official_gazette',
    'national_government',
    'ministry',
    'regional_government',
    'municipal',
    'official_registry',
    'eu_official',
  ],
  notes:
    'Spain-first MVP. Prefer BOE and official government portals. Consolidated BOE texts ease access but are not themselves legally binding.',
}

export const COUNTRY_SOURCES_BY_CODE: Record<string, CountrySourcesConfig> = {
  ES: SPAIN_COUNTRY_SOURCES,
}

export function getCountrySources(countryCode: string): CountrySourcesConfig | null {
  return COUNTRY_SOURCES_BY_CODE[countryCode.toUpperCase()] ?? null
}
