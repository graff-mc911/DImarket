/** Країни для реєстрації та реклами. Регіони й міста — з geo_catalog (додаються при реєстрації). */

export const IP_COUNTRY_MAP: Record<string, string> = {
  UA: 'Ukraine',
  PL: 'Poland',
  DE: 'Germany',
  ES: 'Spain',
  FR: 'France',
  IT: 'Italy',
  CZ: 'Czech Republic',
  SK: 'Slovakia',
  HU: 'Hungary',
  RO: 'Romania',
  AT: 'Austria',
  GB: 'United Kingdom',
  NL: 'Netherlands',
  BE: 'Belgium',
  PT: 'Portugal',
  GR: 'Greece',
  BG: 'Bulgaria',
  HR: 'Croatia',
  RS: 'Serbia',
  CH: 'Switzerland',
  KZ: 'Kazakhstan',
  AE: 'UAE',
  US: 'USA',
  CA: 'Canada',
  MX: 'Mexico',
  BR: 'Brazil',
  AR: 'Argentina',
  CO: 'Colombia',
  CL: 'Chile',
  PE: 'Peru',
  VE: 'Venezuela',
  EC: 'Ecuador',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  PA: 'Panama',
  CR: 'Costa Rica',
  GT: 'Guatemala',
  CU: 'Cuba',
  DO: 'Dominican Republic',
  PR: 'Puerto Rico',
  TR: 'Turkey',
  IL: 'Israel',
  IN: 'India',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  AU: 'Australia',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  MA: 'Morocco',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
  LT: 'Lithuania',
  LV: 'Latvia',
  EE: 'Estonia',
  SI: 'Slovenia',
  MD: 'Moldova',
  GE: 'Georgia',
  AM: 'Armenia',
  AZ: 'Azerbaijan',
}

/** Усі країни з випадаючого списку (без заздалегідь прописаних областей/міст). */
export const REGISTRATION_COUNTRIES: string[] = [
  ...new Set(Object.values(IP_COUNTRY_MAP)),
].sort((a, b) => a.localeCompare(b, 'uk'))

export function sortedRegistrationCountries(): string[] {
  return REGISTRATION_COUNTRIES
}

export function parseRegistrationLocation(
  location: string,
): { city: string; region: string; country: string } | null {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const city = parts[0]
  const country = parts[parts.length - 1]
  const region = parts.length >= 3 ? parts.slice(1, -1).join(', ') : 'Інші'
  return { city, region, country }
}

export function isRegistrationCountry(name: string): boolean {
  return REGISTRATION_COUNTRIES.includes(name)
}
