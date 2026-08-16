/**
 * Stable OSM doc_key for Documents & Procedures fillable blanks.
 * Pattern: docs-{countryLower}-{slug}
 */
export function documentsOsmDocKey(countryCode: string, slug: string): string {
  return `docs-${countryCode.toLowerCase()}-${slug}`
}

export function documentsOsmSourceKey(countryCode: string, slug: string): string {
  return `docs-src-${countryCode.toLowerCase()}-${slug}`
}
