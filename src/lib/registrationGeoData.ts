/** Країни для реєстрації та реклами. Регіони й міста — geo_catalog + GeoNames sync + реєстрації. */

import { COUNTRY_NAME_TO_ISO2, IP_COUNTRY_MAP } from './countryIso2'

export { IP_COUNTRY_MAP }

/** Усі країни з випадаючого списку */
export const REGISTRATION_COUNTRIES: string[] = Object.keys(COUNTRY_NAME_TO_ISO2).sort((a, b) =>
  a.localeCompare(b, 'uk'),
)

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
