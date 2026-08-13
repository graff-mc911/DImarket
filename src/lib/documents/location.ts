/**
 * Map DImarket AppContext geo → Documents jurisdiction filters.
 * Reuses global location — does NOT invent a parallel location system.
 */

import type { GeoSearchState } from '../geoSearch'
import { countrySlugFromGeo } from '../globalLocation'

/** ISO-ish country codes used in document catalog */
const SLUG_TO_CODE: Record<string, string> = {
  spain: 'ES',
  germany: 'DE',
  france: 'FR',
  poland: 'PL',
  portugal: 'PT',
  italy: 'IT',
  romania: 'RO',
  netherlands: 'NL',
  czechia: 'CZ',
  'czech-republic': 'CZ',
  hungary: 'HU',
  bulgaria: 'BG',
  slovakia: 'SK',
  austria: 'AT',
  belgium: 'BE',
  ireland: 'IE',
  'united-kingdom': 'UK',
  switzerland: 'CH',
  norway: 'NO',
}

const CODE_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_CODE).map(([slug, code]) => [code, slug]),
)

export type DocumentsJurisdiction = {
  countryCode: string | null
  countrySlug: string | null
  region: string | null
  province: string | null
  city: string | null
  labelParts: string[]
}

export function countryCodeFromSlug(slug: string): string | null {
  const key = slug.trim().toLowerCase()
  return SLUG_TO_CODE[key] ?? null
}

export function countrySlugFromCode(code: string): string | null {
  return CODE_TO_SLUG[code.toUpperCase()] ?? null
}

export function jurisdictionFromLocation(location: GeoSearchState): DocumentsJurisdiction {
  const slug = countrySlugFromGeo(location)
  const countrySlug = slug && slug !== 'all-europe' ? slug : null
  const countryCode = countrySlug ? countryCodeFromSlug(countrySlug) : null
  const labelParts = [location.city, location.province, location.region, location.country].filter(
    Boolean,
  ) as string[]
  return {
    countryCode,
    countrySlug,
    region: location.region || null,
    province: location.province || null,
    city: location.city || null,
    labelParts,
  }
}

/**
 * Rank documents for current location.
 * Prefer city → province → region → country → EU/generic.
 * Never treat a DE template as valid for ES.
 */
export function scoreDocumentForJurisdiction(
  doc: {
    countryCode: string
    region: string | null
    province: string | null
    city: string | null
  },
  j: DocumentsJurisdiction,
): number {
  if (!j.countryCode) return 10
  if (doc.countryCode !== j.countryCode && doc.countryCode !== 'EU') return -1
  let score = doc.countryCode === j.countryCode ? 50 : 5
  if (j.region && doc.region && equalsLoose(doc.region, j.region)) score += 20
  if (j.province && doc.province && equalsLoose(doc.province, j.province)) score += 15
  if (j.city && doc.city && equalsLoose(doc.city, j.city)) score += 25
  if (!doc.city && !doc.province && !doc.region) score += 5
  return score
}

function equalsLoose(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
