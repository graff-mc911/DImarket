/**
 * Home category adapter — bridges Serviya marketing cards ↔ site/DB mains.
 *
 * Home UI still paints `serviceCategories` (expandable sub-tree).
 * DB / site chrome use different top-level slugs for some concepts.
 * This module is the only place that maps between them.
 *
 * See docs/CATEGORIES_SOURCE_OF_TRUTH.md and docs/ARCHITECTURE_SSOT.md.
 */

import type { ServiceCategory, ServiceSubcategory } from '../config/categories'
import type { MarketplaceCategory } from './marketplaceCategories'
import { servicesPath } from './serviceTaxonomy'

/**
 * Serviya marketing slug → site / Supabase main slug.
 * Only list pairs that differ; identical slugs pass through unchanged.
 */
export const SERVIYA_TO_SITE_SLUG: Readonly<Record<string, string>> = {
  'buy-sell': 'sell-rent',
  jobs: 'vacancies',
  'legal-services': 'legal-notary',
  'home-services': 'handyman',
  automotive: 'electrical',
  moving: 'tools',
}

/** Inverse for lookups from site → Serviya (first wins if multiple). */
export const SITE_TO_SERVIYA_SLUG: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SERVIYA_TO_SITE_SLUG).map(([serviya, site]) => [site, serviya]),
)

export function siteSlugForServiya(serviyaSlug: string): string {
  return SERVIYA_TO_SITE_SLUG[serviyaSlug] ?? serviyaSlug
}

export function serviyaSlugForSite(siteSlug: string): string {
  return SITE_TO_SERVIYA_SLUG[siteSlug] ?? siteSlug
}

/** Canonical listing / category path for a Home (Serviya) card. */
export function homeCategoryPath(
  category: Pick<ServiceCategory, 'slug' | 'href'>,
  subcategory?: Pick<ServiceSubcategory, 'slug'> | null,
): string {
  if (category.href) return category.href
  const slug = category.slug
  if (slug === 'buy-sell' || subcategory?.slug?.startsWith('buy-sell')) return '/sell-rent'
  if (slug === 'jobs' || subcategory?.slug?.startsWith('jobs-')) return '/vacancies'
  if (subcategory) return servicesPath(subcategory.slug)
  const site = siteSlugForServiya(slug)
  if (site === 'sell-rent') return '/sell-rent'
  if (site === 'vacancies') return '/vacancies'
  return `/category/${encodeURIComponent(site)}`
}

export type HomeCategoryDbOverlay = {
  professionalsCount: number | null
  servicesCount: number | null
  dbSlug: string | null
}

/** Index DB mains by site slug for Home card enrichment. */
export function marketplaceBySiteSlug(
  rows: MarketplaceCategory[] | null | undefined,
): Map<string, MarketplaceCategory> {
  const map = new Map<string, MarketplaceCategory>()
  for (const row of rows ?? []) {
    if (row.slug) map.set(row.slug, row)
  }
  return map
}

/** Overlay DB counts onto a Serviya card when an alias/site match exists. */
export function dbOverlayForServiya(
  serviyaSlug: string,
  bySite: Map<string, MarketplaceCategory>,
): HomeCategoryDbOverlay {
  const site = siteSlugForServiya(serviyaSlug)
  const row = bySite.get(site)
  if (!row) {
    return { professionalsCount: null, servicesCount: null, dbSlug: null }
  }
  return {
    professionalsCount:
      typeof row.professionals_count === 'number' ? row.professionals_count : null,
    servicesCount: typeof row.services_count === 'number' ? row.services_count : null,
    dbSlug: row.slug,
  }
}
