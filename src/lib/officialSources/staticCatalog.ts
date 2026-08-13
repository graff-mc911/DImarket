/**
 * Public static catalog for Official Documents category.
 * Used when Supabase OSM tables are empty / not yet migrated —
 * everyone still sees real official source pointers (no invented legal text).
 */

export type StaticOfficialDoc = {
  doc_key: string
  title: string
  titleUk: string
  country_code: string
  jurisdiction: string
  doc_kind: 'informational' | 'government_procedure'
  source_name: string
  source_url: string
  trust_tier: string
}

export const STATIC_OFFICIAL_DOCUMENTS: StaticOfficialDoc[] = [
  {
    doc_key: 'es-boe-legislation-entry',
    title: 'Spanish official legislation — BOE entry point',
    titleUk: 'Іспанське законодавство — вхід BOE',
    country_code: 'ES',
    jurisdiction: 'Spain',
    doc_kind: 'informational',
    source_name: 'BOE',
    source_url: 'https://www.boe.es/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'de-legislation-entry',
    title: 'German official legislation — Gesetze im Internet',
    titleUk: 'Німецьке законодавство — Gesetze im Internet',
    country_code: 'DE',
    jurisdiction: 'Germany',
    doc_kind: 'informational',
    source_name: 'Gesetze im Internet',
    source_url: 'https://www.gesetze-im-internet.de/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'fr-legislation-entry',
    title: 'French official legislation — Légifrance',
    titleUk: 'Французьке законодавство — Légifrance',
    country_code: 'FR',
    jurisdiction: 'France',
    doc_kind: 'informational',
    source_name: 'Légifrance',
    source_url: 'https://www.legifrance.gouv.fr/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'pl-legislation-entry',
    title: 'Polish official legislation — ISAP',
    titleUk: 'Польське законодавство — ISAP',
    country_code: 'PL',
    jurisdiction: 'Poland',
    doc_kind: 'informational',
    source_name: 'ISAP Sejm',
    source_url: 'https://isap.sejm.gov.pl/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'it-legislation-entry',
    title: 'Italian official legislation — Normattiva',
    titleUk: 'Італійське законодавство — Normattiva',
    country_code: 'IT',
    jurisdiction: 'Italy',
    doc_kind: 'informational',
    source_name: 'Normattiva',
    source_url: 'https://www.normattiva.it/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'pt-legislation-entry',
    title: 'Portuguese official legislation — DRE',
    titleUk: 'Португальське законодавство — DRE',
    country_code: 'PT',
    jurisdiction: 'Portugal',
    doc_kind: 'informational',
    source_name: 'DRE',
    source_url: 'https://dre.pt/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'uk-legislation-entry',
    title: 'UK official legislation — legislation.gov.uk',
    titleUk: 'Законодавство UK — legislation.gov.uk',
    country_code: 'UK',
    jurisdiction: 'United Kingdom',
    doc_kind: 'informational',
    source_name: 'legislation.gov.uk',
    source_url: 'https://www.legislation.gov.uk/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'nl-legislation-entry',
    title: 'Netherlands official legislation — Overheid',
    titleUk: 'Законодавство Нідерландів — Overheid',
    country_code: 'NL',
    jurisdiction: 'Netherlands',
    doc_kind: 'informational',
    source_name: 'wetten.overheid.nl',
    source_url: 'https://wetten.overheid.nl/',
    trust_tier: 'official_gazette',
  },
  {
    doc_key: 'eu-youreurope-business',
    title: 'Your Europe Business — EU official portal',
    titleUk: 'Your Europe Business — офіційний портал ЄС',
    country_code: 'EU',
    jurisdiction: 'European Union',
    doc_kind: 'government_procedure',
    source_name: 'Your Europe',
    source_url: 'https://europa.eu/youreurope/business/',
    trust_tier: 'eu_official',
  },
  {
    doc_key: 'es-rental-official-hub',
    title: 'Spain — residential rental official information hub',
    titleUk: 'Іспанія — офіційний хаб інформації про оренду',
    country_code: 'ES',
    jurisdiction: 'Spain',
    doc_kind: 'informational',
    source_name: 'BOE',
    source_url: 'https://www.boe.es/',
    trust_tier: 'official_gazette',
  },
]

export function getStaticOfficialDocument(docKey: string): StaticOfficialDoc | null {
  return STATIC_OFFICIAL_DOCUMENTS.find((d) => d.doc_key === docKey) ?? null
}
