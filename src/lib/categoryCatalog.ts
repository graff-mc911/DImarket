/**
 * Каталог категорій і підкатегорій для оголошень і профілів майстрів.
 */

import { CONSTRUCTION_WORK_GROUPS } from './constructionWorkGroups'

export type LocalizedLabel = {
  uk: string
  ru?: string
  en?: string
}

export type SubcategoryDef = {
  slug: string
  label: LocalizedLabel
}

export type SubcategoryGroupDef = {
  slug: string
  label: LocalizedLabel
  subcategories: SubcategoryDef[]
}

export type CategoryWithSubcategoriesDef = {
  /** Slug головної категорії (як у таблиці categories). */
  slug: string
  label: LocalizedLabel
  /** Плоский список (згенерований з groups). */
  subcategories: SubcategoryDef[]
  /** Групи для UI (опційно). */
  groups?: SubcategoryGroupDef[]
}

function flattenGroups(groups: SubcategoryGroupDef[]): SubcategoryDef[] {
  return groups.flatMap((g) => g.subcategories)
}

export const SERVICE_CATEGORY_CATALOG: CategoryWithSubcategoriesDef[] = [
  {
    slug: 'construction',
    label: {
      uk: 'Будівництво',
      ru: 'Строительство',
      en: 'Construction',
    },
    groups: CONSTRUCTION_WORK_GROUPS,
    subcategories: flattenGroups(CONSTRUCTION_WORK_GROUPS),
  },
]

export type CategoryPickerMode = 'single' | 'multiple'

export type CategoryPickerValue = {
  categorySlug: string
  subcategorySlugs: string[]
}

export function emptyPickerValue(): CategoryPickerValue {
  return { categorySlug: '', subcategorySlugs: [] }
}

export function getCategoryDef(slug: string): CategoryWithSubcategoriesDef | undefined {
  return SERVICE_CATEGORY_CATALOG.find((c) => c.slug === slug)
}

export function getSubcategoryGroups(categorySlug: string): SubcategoryGroupDef[] {
  const cat = getCategoryDef(categorySlug)
  if (cat?.groups?.length) return cat.groups
  if (!cat?.subcategories.length) return []
  return [
    {
      slug: 'default',
      label: { uk: 'Послуги', ru: 'Услуги', en: 'Services' },
      subcategories: cat.subcategories,
    },
  ]
}

export function getSubcategoryDef(categorySlug: string, subSlug: string): SubcategoryDef | undefined {
  return getCategoryDef(categorySlug)?.subcategories.find((s) => s.slug === subSlug)
}

export function labelFor(entry: LocalizedLabel, locale: string): string {
  if (locale === 'ru' && entry.ru) return entry.ru
  if (locale === 'en' && entry.en) return entry.en
  return entry.uk
}

export function subcategoryLabel(categorySlug: string, subSlug: string, locale: string): string {
  const sub = getSubcategoryDef(categorySlug, subSlug)
  return sub ? labelFor(sub.label, locale) : subSlug
}

export function categoryLabel(slug: string, locale: string): string {
  const cat = getCategoryDef(slug)
  return cat ? labelFor(cat.label, locale) : slug
}

/** Категорії з хоча б однією підкатегорією (для випадаючих списків). */
export function categoriesWithSubcategories(): CategoryWithSubcategoriesDef[] {
  return SERVICE_CATEGORY_CATALOG.filter((c) => c.subcategories.length > 0)
}

export function formatSubcategoriesSummary(
  categorySlug: string,
  slugs: string[],
  locale: string,
  max = 3,
): string {
  if (!slugs.length) return ''
  const names = slugs.map((s) => subcategoryLabel(categorySlug, s, locale))
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} +${names.length - max}`
}
