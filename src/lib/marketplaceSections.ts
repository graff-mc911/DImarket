/**
 * Marketplace (Buy & Sell) and Jobs section helpers.
 * Canonical public paths: /buy-sell, /jobs (aliases: /sell-rent, /vacancies).
 */

import { getCategoryDef, getSubcategoryDef, labelFor } from './categoryCatalog'

export const MARKETPLACE_CATEGORY_SLUG = 'sell-rent' as const
export const JOBS_CATEGORY_SLUG = 'vacancies' as const

export const MARKETPLACE_PATH = '/buy-sell'
export const JOBS_PATH = '/jobs'
export const MARKETPLACE_ALIAS_PATH = '/sell-rent'
export const JOBS_ALIAS_PATH = '/vacancies'

/** SEO-friendly subcategory aliases → catalog subcategory slug */
export const BUY_SELL_SEO_SLUGS: Record<string, string> = {
  tools: 'tools',
  'building-materials': 'building-materials',
  'construction-equipment': 'construction-equipment',
  houses: 'houses',
  'commercial-property': 'commercial-property',
  land: 'land',
  vehicles: 'vehicles',
  'commercial-vehicles': 'commercial-vehicles',
  machinery: 'machinery',
  'rental-equipment': 'rental-equipment',
  scaffolding: 'scaffolding',
  'leftover-materials': 'leftover-materials',
  'used-equipment': 'used-equipment',
  'free-items': 'free-items',
  'wanted-to-buy': 'wanted-to-buy',
}

export const JOBS_SEO_SLUGS: Record<string, string> = {
  electrician: 'electrician-jobs',
  plumber: 'plumber-jobs',
  'construction-jobs': 'construction-jobs',
  'office-jobs': 'office-jobs',
  'skilled-trades': 'skilled-trades',
  drivers: 'drivers',
  'factory-jobs': 'factory-jobs',
  'warehouse-jobs': 'warehouse-jobs',
  'cleaning-jobs': 'cleaning-jobs',
  'domestic-services': 'domestic-services',
  accounting: 'accounting-jobs',
  legal: 'legal-jobs',
  engineering: 'engineering-jobs',
  it: 'it-jobs',
  sales: 'sales-jobs',
  design: 'design-jobs',
  'remote-jobs': 'remote-jobs',
}

export type MarketplaceSectionKind = 'marketplace' | 'jobs'

export function resolveSectionPath(pathname: string): {
  kind: MarketplaceSectionKind
  categorySlug: typeof MARKETPLACE_CATEGORY_SLUG | typeof JOBS_CATEGORY_SLUG
  subcategorySlug: string | null
} | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null

  if (parts[0] === 'buy-sell' || parts[0] === 'sell-rent') {
    const seo = parts[1] ? BUY_SELL_SEO_SLUGS[parts[1]] ?? parts[1] : null
    return {
      kind: 'marketplace',
      categorySlug: MARKETPLACE_CATEGORY_SLUG,
      subcategorySlug: seo,
    }
  }
  if (parts[0] === 'jobs' || parts[0] === 'vacancies') {
    const seo = parts[1] ? JOBS_SEO_SLUGS[parts[1]] ?? parts[1] : null
    return {
      kind: 'jobs',
      categorySlug: JOBS_CATEGORY_SLUG,
      subcategorySlug: seo,
    }
  }
  return null
}

/** Geo landings: /spain/alicante/jobs or /spain/alicante/buy-sell */
export function parseGeoMarketplacePath(parts: string[]): {
  country: string
  city: string
  kind: MarketplaceSectionKind
  categorySlug: typeof MARKETPLACE_CATEGORY_SLUG | typeof JOBS_CATEGORY_SLUG
} | null {
  if (parts.length !== 3) return null
  const [country, city, section] = parts.map((p) => p.toLowerCase())
  if (section === 'jobs' || section === 'vacancies') {
    return {
      country,
      city,
      kind: 'jobs',
      categorySlug: JOBS_CATEGORY_SLUG,
    }
  }
  if (section === 'buy-sell' || section === 'sell-rent' || section === 'marketplace') {
    return {
      country,
      city,
      kind: 'marketplace',
      categorySlug: MARKETPLACE_CATEGORY_SLUG,
    }
  }
  return null
}

export function sectionCanonicalPath(
  kind: MarketplaceSectionKind,
  subcategorySlug?: string | null,
): string {
  const base = kind === 'marketplace' ? MARKETPLACE_PATH : JOBS_PATH
  if (!subcategorySlug) return base
  // Prefer SEO alias key when available
  const map = kind === 'marketplace' ? BUY_SELL_SEO_SLUGS : JOBS_SEO_SLUGS
  const seoKey =
    Object.entries(map).find(([, v]) => v === subcategorySlug)?.[0] ?? subcategorySlug
  return `${base}/${seoKey}`
}

export function sectionSubcategoryLabel(
  kind: MarketplaceSectionKind,
  subcategorySlug: string,
  locale: string,
): string {
  const cat = kind === 'marketplace' ? MARKETPLACE_CATEGORY_SLUG : JOBS_CATEGORY_SLUG
  const sub = getSubcategoryDef(cat, subcategorySlug)
  if (sub) return labelFor(sub.label, locale, sub.slug)
  return subcategorySlug.replace(/-/g, ' ')
}

export function sectionTitle(
  kind: MarketplaceSectionKind,
  locale: string,
): string {
  const cat = getCategoryDef(
    kind === 'marketplace' ? MARKETPLACE_CATEGORY_SLUG : JOBS_CATEGORY_SLUG,
  )
  if (cat) return labelFor(cat.label, locale, cat.slug)
  return kind === 'marketplace' ? 'Marketplace (Buy & Sell)' : 'Jobs'
}

export function isMarketplaceListingType(type: string): boolean {
  return type === 'item_sale' || type === 'item_wanted'
}

export function isJobListingType(type: string): boolean {
  return type === 'job_vacancy'
}
