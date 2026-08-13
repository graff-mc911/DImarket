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

export const ITALY_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'IT',
  countryName: 'Italy',
  officialGazetteUrl: 'https://www.normattiva.it/',
  governmentPortalUrl: 'https://www.gov.it/',
  taxPortalUrl: 'https://www.agenziaentrate.gov.it/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Italy — Normattiva and gov.it as official monitor entry points.',
}

export const PORTUGAL_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'PT',
  countryName: 'Portugal',
  officialGazetteUrl: 'https://dre.pt/',
  governmentPortalUrl: 'https://www.portugal.gov.pt/',
  taxPortalUrl: 'https://www.portaldasfinancas.gov.pt/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Portugal — DRE and portugal.gov.pt as official entry points.',
}

export const ROMANIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'RO',
  countryName: 'Romania',
  officialGazetteUrl: 'https://legislatie.just.ro/',
  governmentPortalUrl: 'https://gov.ro/',
  taxPortalUrl: 'https://www.anaf.ro/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Romania — legislatie.just.ro and gov.ro as official entry points.',
}

export const NETHERLANDS_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'NL',
  countryName: 'Netherlands',
  officialGazetteUrl: 'https://wetten.overheid.nl/',
  governmentPortalUrl: 'https://www.rijksoverheid.nl/',
  taxPortalUrl: 'https://www.belastingdienst.nl/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Netherlands — wetten.overheid.nl and rijksoverheid.nl as official entry points.',
}

export const CZECHIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'CZ',
  countryName: 'Czechia',
  officialGazetteUrl: 'https://www.e-sbirka.cz/',
  governmentPortalUrl: 'https://www.gov.cz/',
  taxPortalUrl: 'https://www.mfcr.cz/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Czechia — e-Sbírka and gov.cz as official monitor entry points.',
}

export const HUNGARY_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'HU',
  countryName: 'Hungary',
  officialGazetteUrl: 'https://njt.hu/',
  governmentPortalUrl: 'https://www.kormany.hu/',
  taxPortalUrl: 'https://nav.gov.hu/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Hungary — NJT and kormany.hu as official monitor entry points.',
}

export const BULGARIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'BG',
  countryName: 'Bulgaria',
  officialGazetteUrl: 'https://www.lex.bg/',
  governmentPortalUrl: 'https://www.gov.bg/',
  taxPortalUrl: 'https://nra.bg/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Bulgaria — lex.bg and gov.bg as official entry points.',
}

export const COUNTRY_SOURCES_BY_CODE: Record<string, CountrySourcesConfig> = {
  ES: SPAIN_COUNTRY_SOURCES,
  DE: GERMANY_COUNTRY_SOURCES,
  FR: FRANCE_COUNTRY_SOURCES,
  PL: POLAND_COUNTRY_SOURCES,
  IT: ITALY_COUNTRY_SOURCES,
  PT: PORTUGAL_COUNTRY_SOURCES,
  RO: ROMANIA_COUNTRY_SOURCES,
  NL: NETHERLANDS_COUNTRY_SOURCES,
  CZ: CZECHIA_COUNTRY_SOURCES,
  HU: HUNGARY_COUNTRY_SOURCES,
  BG: BULGARIA_COUNTRY_SOURCES,
}

export function getCountrySources(countryCode: string): CountrySourcesConfig | null {
  return COUNTRY_SOURCES_BY_CODE[countryCode.toUpperCase()] ?? null
}

export function listCountrySources(): CountrySourcesConfig[] {
  return Object.values(COUNTRY_SOURCES_BY_CODE)
}
