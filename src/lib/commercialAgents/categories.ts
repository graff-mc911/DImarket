/**
 * Categories & countries for Commercial Agents matching.
 * Reuses DImarket serviceCategories — no parallel B2B taxonomy.
 */

import { serviceCategories, type ServiceCategory } from '../../config/categories'
import { serviyaLabel } from '../../config/categoriesI18n'

/** Parent + subcategory slugs from the existing DImarket catalog. */
export function dimarketMatchCategorySlugs(): string[] {
  const slugs: string[] = []
  for (const cat of serviceCategories) {
    // Skip the CA tile itself if present — it is a module entry, not a match facet
    if (cat.slug === 'commercial-agents') continue
    slugs.push(cat.slug)
    for (const sub of cat.subcategories) slugs.push(sub.slug)
  }
  return slugs
}

export type MatchCategoryOption = {
  slug: string
  label: string
  parentSlug: string
  isParent: boolean
}

/** Flat options for filters / forms (parents first, then subs). */
export function dimarketMatchCategoryOptions(languageCode = 'en'): MatchCategoryOption[] {
  const out: MatchCategoryOption[] = []
  for (const cat of serviceCategories) {
    if (cat.slug === 'commercial-agents') continue
    out.push({
      slug: cat.slug,
      label: serviyaLabel(cat.slug, languageCode, cat.title[languageCode] ?? cat.title.en),
      parentSlug: cat.slug,
      isParent: true,
    })
    for (const sub of cat.subcategories) {
      out.push({
        slug: sub.slug,
        label: serviyaLabel(sub.slug, languageCode, sub.title[languageCode] ?? sub.title.en),
        parentSlug: cat.slug,
        isParent: false,
      })
    }
  }
  return out
}

/** Parent-level categories only (compact chips / selects). */
export function dimarketParentCategoryOptions(languageCode = 'en'): MatchCategoryOption[] {
  return dimarketMatchCategoryOptions(languageCode).filter((o) => o.isParent)
}

export function labelForMatchCategory(slug: string, languageCode = 'en'): string {
  for (const cat of serviceCategories) {
    if (cat.slug === slug) {
      return serviyaLabel(slug, languageCode, cat.title[languageCode] ?? cat.title.en)
    }
    for (const sub of cat.subcategories) {
      if (sub.slug === slug) {
        return serviyaLabel(slug, languageCode, sub.title[languageCode] ?? sub.title.en)
      }
    }
  }
  return slug
}

/** @deprecated Use dimarketParentCategoryOptions — kept as slug list for API filters. */
export const COMMERCIAL_CATEGORY_SLUGS: readonly string[] = dimarketMatchCategorySlugs()

export function commercialCategoryLabelKey(slug: string): string {
  // Legacy i18n path; prefer labelForMatchCategory in UI.
  return `commercialAgents.cat.${slug}`
}

export const COMMERCIAL_FOCUS_COUNTRIES = [
  'Spain',
  'Germany',
  'France',
  'Italy',
  'Portugal',
  'Netherlands',
  'Belgium',
  'Austria',
  'Czech Republic',
  'Poland',
  'Sweden',
  'Denmark',
  'Norway',
  'Finland',
  'United Kingdom',
  'Ireland',
  'Other Europe',
] as const

export type { ServiceCategory }
