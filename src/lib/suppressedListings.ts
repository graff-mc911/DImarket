/**
 * Listings that must not appear in public feeds (agent/test junk).
 * Prefer DB soft-delete via scripts/delete-cursor-cloud-test-listing.sql when credentials exist.
 */
export const SUPPRESSED_LISTING_IDS = [
  '5bd4ed77-5926-4def-846d-e8396079fefa', // Cursor Cloud test — kitchen renovation help
] as const

const SUPPRESSED_ID_SET = new Set<string>(SUPPRESSED_LISTING_IDS)

type ListingLike = {
  id?: string | null
  title?: string | null
  description?: string | null
}

export function isSuppressedListing(row: ListingLike | null | undefined): boolean {
  if (!row) return false
  if (row.id && SUPPRESSED_ID_SET.has(row.id)) return true
  const title = (row.title || '').toLowerCase()
  if (title.includes('cursor cloud test')) return true
  const description = (row.description || '').toLowerCase()
  if (description.includes('test listing created by cursor cloud')) return true
  return false
}

export function filterSuppressedListings<T extends ListingLike>(rows: T[] | null | undefined): T[] {
  if (!rows?.length) return []
  return rows.filter((row) => !isSuppressedListing(row))
}

/** PostgREST chainable query helper for listings selects. */
export function excludeSuppressedFromQuery<
  Q extends {
    not: (column: string, operator: string, value: string) => Q
  },
>(query: Q): Q {
  let next = query
  for (const id of SUPPRESSED_LISTING_IDS) {
    next = next.not('id', 'eq', id)
  }
  return next.not('title', 'ilike', '%Cursor Cloud test%')
}
