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

export const AUSTRIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'AT',
  countryName: 'Austria',
  officialGazetteUrl: 'https://www.ris.bka.gv.at/',
  governmentPortalUrl: 'https://www.oesterreich.gv.at/',
  taxPortalUrl: 'https://www.bmf.gv.at/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Austria — RIS and oesterreich.gv.at as official entry points.',
}

export const SLOVAKIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'SK',
  countryName: 'Slovakia',
  officialGazetteUrl: 'https://www.slov-lex.sk/',
  governmentPortalUrl: 'https://www.gov.sk/',
  taxPortalUrl: 'https://www.financnasprava.sk/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Slovakia — Slov-Lex and gov.sk as official entry points.',
}

export const IRELAND_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'IE',
  countryName: 'Ireland',
  officialGazetteUrl: 'https://www.irishstatutebook.ie/',
  governmentPortalUrl: 'https://www.gov.ie/',
  taxPortalUrl: 'https://www.revenue.ie/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Ireland — Irish Statute Book and gov.ie as official entry points.',
}

export const SWEDEN_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'SE',
  countryName: 'Sweden',
  officialGazetteUrl: 'https://www.riksdagen.se/sv/dokument-lagar/',
  governmentPortalUrl: 'https://www.government.se/',
  taxPortalUrl: 'https://www.skatteverket.se/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Sweden — Riksdagen and government.se as official entry points.',
}

export const DENMARK_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'DK',
  countryName: 'Denmark',
  officialGazetteUrl: 'https://www.retsinformation.dk/',
  governmentPortalUrl: 'https://www.borger.dk/',
  taxPortalUrl: 'https://skat.dk/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Denmark — Retsinformation and borger.dk as official entry points.',
}

export const FINLAND_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'FI',
  countryName: 'Finland',
  officialGazetteUrl: 'https://www.finlex.fi/',
  governmentPortalUrl: 'https://www.suomi.fi/',
  taxPortalUrl: 'https://www.vero.fi/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Finland — Finlex and suomi.fi as official entry points.',
}

export const GREECE_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'GR',
  countryName: 'Greece',
  officialGazetteUrl: 'https://www.et.gr/',
  governmentPortalUrl: 'https://www.gov.gr/',
  taxPortalUrl: 'https://www.aade.gr/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Greece — ET and gov.gr as official entry points.',
}

export const BELGIUM_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'BE',
  countryName: 'Belgium',
  officialGazetteUrl: 'https://www.ejustice.just.fgov.be/',
  governmentPortalUrl: 'https://www.belgium.be/',
  taxPortalUrl: 'https://finance.belgium.be/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Belgium — ejustice and belgium.be as official entry points.',
}

export const LUXEMBOURG_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'LU',
  countryName: 'Luxembourg',
  officialGazetteUrl: 'https://legilux.public.lu/',
  governmentPortalUrl: 'https://guichet.public.lu/',
  taxPortalUrl: 'https://impotsdirects.public.lu/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Luxembourg — Legilux and guichet.public.lu as official entry points.',
}

export const LITHUANIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'LT',
  countryName: 'Lithuania',
  officialGazetteUrl: 'https://www.e-tar.lt/',
  governmentPortalUrl: 'https://www.lrv.lt/',
  taxPortalUrl: 'https://www.vmi.lt/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Lithuania — e-TAR and lrv.lt as official entry points.',
}

export const LATVIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'LV',
  countryName: 'Latvia',
  officialGazetteUrl: 'https://www.likumi.lv/',
  governmentPortalUrl: 'https://www.mk.gov.lv/',
  taxPortalUrl: 'https://www.vid.gov.lv/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Latvia — Likumi.lv and mk.gov.lv as official entry points.',
}

export const ESTONIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'EE',
  countryName: 'Estonia',
  officialGazetteUrl: 'https://www.riigiteataja.ee/',
  governmentPortalUrl: 'https://www.valitsus.ee/',
  taxPortalUrl: 'https://www.emta.ee/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Estonia — Riigi Teataja and valitsus.ee as official entry points.',
}

export const CROATIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'HR',
  countryName: 'Croatia',
  officialGazetteUrl: 'https://narodne-novine.nn.hr/',
  governmentPortalUrl: 'https://gov.hr/',
  taxPortalUrl: 'https://www.porezna-uprava.hr/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Croatia — Narodne novine and gov.hr as official entry points.',
}

export const SLOVENIA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'SI',
  countryName: 'Slovenia',
  officialGazetteUrl: 'https://www.pisrs.si/',
  governmentPortalUrl: 'https://www.gov.si/',
  taxPortalUrl: 'https://www.fu.gov.si/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Slovenia — PISRS and gov.si as official entry points.',
}

export const CYPRUS_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'CY',
  countryName: 'Cyprus',
  officialGazetteUrl: 'https://www.mof.gov.cy/mof/gpo/gpo.nsf/index_en/index_en',
  governmentPortalUrl: 'https://www.gov.cy/',
  taxPortalUrl: 'https://www.mof.gov.cy/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Cyprus — GPO and gov.cy as official entry points.',
}

export const MALTA_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'MT',
  countryName: 'Malta',
  officialGazetteUrl: 'https://legislation.mt/',
  governmentPortalUrl: 'https://www.gov.mt/',
  taxPortalUrl: 'https://cfr.gov.mt/',
  businessPortalUrl: EU_BUSINESS,
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Malta — legislation.mt and gov.mt as official entry points.',
}

export const SWITZERLAND_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'CH',
  countryName: 'Switzerland',
  officialGazetteUrl: 'https://www.fedlex.admin.ch/',
  governmentPortalUrl: 'https://www.admin.ch/',
  taxPortalUrl: 'https://www.estv.admin.ch/',
  businessPortalUrl: 'https://www.admin.ch/',
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Switzerland — Fedlex and admin.ch as official entry points.',
}

export const NORWAY_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'NO',
  countryName: 'Norway',
  officialGazetteUrl: 'https://lovdata.no/',
  governmentPortalUrl: 'https://www.regjeringen.no/',
  taxPortalUrl: 'https://www.skatteetaten.no/',
  businessPortalUrl: 'https://www.regjeringen.no/',
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'Norway — Lovdata and regjeringen.no as official entry points.',
}

export const UNITED_KINGDOM_COUNTRY_SOURCES: CountrySourcesConfig = {
  countryCode: 'UK',
  countryName: 'United Kingdom',
  officialGazetteUrl: 'https://www.legislation.gov.uk/',
  governmentPortalUrl: 'https://www.gov.uk/',
  taxPortalUrl: 'https://www.gov.uk/government/organisations/hm-revenue-customs',
  businessPortalUrl: 'https://www.gov.uk/browse/business',
  regionalPortalUrl: '',
  municipalPortalUrl: '',
  licensingPortalUrl: '',
  euPortalUrl: EU_PORTAL,
  sourcePriority: ['official_gazette', 'national_government', 'ministry', 'eu_official'],
  notes: 'United Kingdom — legislation.gov.uk and gov.uk as official entry points.',
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
  AT: AUSTRIA_COUNTRY_SOURCES,
  SK: SLOVAKIA_COUNTRY_SOURCES,
  IE: IRELAND_COUNTRY_SOURCES,
  SE: SWEDEN_COUNTRY_SOURCES,
  DK: DENMARK_COUNTRY_SOURCES,
  FI: FINLAND_COUNTRY_SOURCES,
  GR: GREECE_COUNTRY_SOURCES,
  BE: BELGIUM_COUNTRY_SOURCES,
  LU: LUXEMBOURG_COUNTRY_SOURCES,
  LT: LITHUANIA_COUNTRY_SOURCES,
  LV: LATVIA_COUNTRY_SOURCES,
  EE: ESTONIA_COUNTRY_SOURCES,
  HR: CROATIA_COUNTRY_SOURCES,
  SI: SLOVENIA_COUNTRY_SOURCES,
  CY: CYPRUS_COUNTRY_SOURCES,
  MT: MALTA_COUNTRY_SOURCES,
  CH: SWITZERLAND_COUNTRY_SOURCES,
  NO: NORWAY_COUNTRY_SOURCES,
  UK: UNITED_KINGDOM_COUNTRY_SOURCES,
}

export function getCountrySources(countryCode: string): CountrySourcesConfig | null {
  return COUNTRY_SOURCES_BY_CODE[countryCode.toUpperCase()] ?? null
}

export function listCountrySources(): CountrySourcesConfig[] {
  return Object.values(COUNTRY_SOURCES_BY_CODE)
}
