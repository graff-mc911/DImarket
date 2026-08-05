/**
 * Home category adapter — bridges Home marketing cards ↔ site/DB mains.
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
 * Home marketing slug → site / Supabase main slug.
 * Only list pairs that differ; identical slugs pass through unchanged.
 */
export const HOME_TO_SITE_SLUG: Readonly<Record<string, string>> = {
  'buy-sell': 'sell-rent',
  jobs: 'vacancies',
  'legal-services': 'legal-notary',
  'home-services': 'handyman',
  automotive: 'electrical',
  moving: 'tools',
}

/** Inverse for lookups from site → Home card slug (first wins if multiple). */
export const SITE_TO_HOME_SLUG: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(HOME_TO_SITE_SLUG).map(([home, site]) => [site, home]),
)

export function siteSlugForHomeCard(homeSlug: string): string {
  return HOME_TO_SITE_SLUG[homeSlug] ?? homeSlug
}

export function homeCardSlugForSite(siteSlug: string): string {
  return SITE_TO_HOME_SLUG[siteSlug] ?? siteSlug
}

/** Canonical listing / category path for a Home marketing card. */
export function homeCategoryPath(
  category: Pick<ServiceCategory, 'slug' | 'href'>,
  subcategory?: Pick<ServiceSubcategory, 'slug'> | null,
): string {
  if (category.slug === 'commercial-agents' || category.href === '/commercial-agents') {
    if (subcategory?.slug === 'commercial-agents-manufacturers') return '/commercial-agents/manufacturers'
    if (subcategory?.slug === 'commercial-agents-representatives') {
      return '/commercial-agents/representatives'
    }
    if (subcategory?.slug === 'commercial-agents-opportunities') {
      return '/commercial-agents/opportunities'
    }
    return '/commercial-agents'
  }
  if (category.slug === 'documents-procedures' || category.slug === 'official-documents' || category.href === '/documents' || category.href === '/category/official-documents' || category.href === '/legal-documents') {
    if (subcategory?.slug) return `/documents/${subcategory.slug}`
    return '/documents'
  }
  if (category.href) return category.href
  const slug = category.slug
  if (slug === 'buy-sell' || subcategory?.slug?.startsWith('buy-sell')) return '/sell-rent'
  if (slug === 'jobs' || subcategory?.slug?.startsWith('jobs-')) return '/vacancies'
  if (subcategory) return servicesPath(subcategory.slug)
  const site = siteSlugForHomeCard(slug)
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

/** Overlay DB counts onto a Home card when an alias/site match exists. */
export function dbOverlayForHome(
  homeSlug: string,
  bySite: Map<string, MarketplaceCategory>,
): HomeCategoryDbOverlay {
  const site = siteSlugForHomeCard(homeSlug)
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
