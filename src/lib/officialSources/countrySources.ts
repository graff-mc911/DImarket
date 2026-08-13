/** Spain-first + EU expansion official portal config — no hardcode in React. */

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

const EU_BUSINESS = 'https://europa.eu/youreurope/business/'
const EU_PORTAL = 'https://europa.eu/youreurope/'

export const SPAIN_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'ES',
  countryName: 'Spain',
  officialGazetteUrl: 'https://www.boe.es/',
  governmentPortalUrl: 'https://administracion.gob.es/',
  taxPortalUrl: 'https://sede.agenciatributaria.gob.es/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: 'https://www.gva.es/',
  municipalPortalUrl: 'https://www.alicante.es/',
  licensingPortalUrl: 'https://sede.administracionespublicas.gob.es/',
  euPortalUrl: EU_PORTAL,
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

export const GERMANY_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'DE',
  countryName: 'Germany',
  officialGazetteUrl: 'https://www.gesetze-im-internet.de/',
  governmentPortalUrl: 'https://www.bund.de/',
  taxPortalUrl: 'https://www.elster.de/eportal/start',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Germany — Gesetze im Internet and Bund.de as official monitor entry points.',
}

export const FRANCE_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'FR',
  countryName: 'France',
  officialGazetteUrl: 'https://www.legifrance.gouv.fr/',
  governmentPortalUrl: 'https://www.service-public.fr/',
  taxPortalUrl: 'https://www.impots.gouv.fr/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'France — Légifrance and Service-Public as primary official portals.',
}

export const POLAND_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'PL',
  countryName: 'Poland',
  officialGazetteUrl: 'https://isap.sejm.gov.pl/',
  governmentPortalUrl: 'https://www.gov.pl/',
  taxPortalUrl: 'https://www.podatki.gov.pl/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Poland — ISAP Sejm and gov.pl as official entry points.',
}

export const COUNTRY_SOURCES_BY_CODE: Record<string, CountrySourcesConfig> = {
  ES: SPAIN_COUNTRY_SOURCES,
  DE: GERMANY_COUNTRY_SOURCES,
  FR: FRANCE_COUNTRY_SOURCES,
  PL: POLAND_COUNTRY_SOURCES,
}

export function getCountrySources(countryCode: string): CountrySourcesConfig | null {
  return COUNTRY_SOURCES_BY_CODE[countryCode.toUpperCase()] ?? null
}

export function listCountrySources(): CountrySourcesConfig[] {
  return Object.values(COUNTRY_SOURCES_BY_CODE)
}
