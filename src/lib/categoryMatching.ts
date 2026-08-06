/**
 * Category / work-slug matching helpers — Single Source of Truth.
 *
 * Prefer these over ad-hoc `startsWith(`${slug}-`)` copies in pages.
 * Keyword / bio matching stays in serviceTaxonomy.matchesServiceProfile.
 */

/** Exact slug or `prefix-*` group match (DB work_subcategory_slugs). */
export function matchesWorkPrefix(
  workSlugs: string[] | null | undefined,
  prefix: string,
): boolean {
  if (!prefix) return true
  const works = workSlugs ?? []
  return works.some((w) => w === prefix || w.startsWith(`${prefix}-`))
}

/** Exact, prefix-group, or substring contain (legacy Professionals fallback). */
export function matchesWorkLoose(
  workSlugs: string[] | null | undefined,
  needle: string,
): boolean {
  if (!needle) return true
  const works = workSlugs ?? []
  return works.some(
    (w) => w === needle || w.startsWith(`${needle}-`) || w.includes(needle),
  )
}

/** First segment of a work slug (`hvac-ac` → `hvac`). */
export function workSlugGroup(slug: string): string {
  return slug.split('-')[0] || slug
}
