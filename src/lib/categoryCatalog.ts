/**
 * Каталог категорій і підкатегорій для оголошень і профілів майстрів.
 */

import { CONSTRUCTION_WORK_GROUPS } from './constructionWorkGroups'
import { TRANSPORT_WORK_GROUPS } from './transportWorkGroups'
import { CLEANING_WORK_GROUPS } from './cleaningWorkGroups'

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
  {
    slug: 'tools',
    label: {
      uk: 'Перевезення / логістика',
      ru: 'Перевозка / логистика',
      en: 'Transport / logistics',
    },
    groups: TRANSPORT_WORK_GROUPS,
    subcategories: flattenGroups(TRANSPORT_WORK_GROUPS),
  },
  {
    slug: 'cleaning',
    label: {
      uk: 'Прибирання / клінінг',
      ru: 'Уборка / клининг',
      en: 'Cleaning',
    },
    groups: CLEANING_WORK_GROUPS,
    subcategories: flattenGroups(CLEANING_WORK_GROUPS),
  },
]

/** Чи є у категорії підкатегорії для фільтра «вид робіт». */
export function categoryHasWorkSubcategories(categorySlug: string): boolean {
  return (getCategoryDef(categorySlug)?.subcategories.length ?? 0) > 0
}

/** Категорія (construction, tools, …) для slug підкатегорії. */
export function categorySlugForSubcategory(subSlug: string): string | undefined {
  for (const cat of SERVICE_CATEGORY_CATALOG) {
    if (cat.subcategories.some((s) => s.slug === subSlug)) return cat.slug
  }
  return undefined
}

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

/** Усі slug підкатегорій у групі (для фільтра listings ?work=). */
export function subcategorySlugsForGroup(
  categorySlug: string,
  groupSlug: string,
): string[] {
  const group = getSubcategoryGroups(categorySlug).find((g) => g.slug === groupSlug)
  return group?.subcategories.map((s) => s.slug) ?? []
}

export function groupLabel(categorySlug: string, groupSlug: string, locale: string): string {
  const group = getSubcategoryGroups(categorySlug).find((g) => g.slug === groupSlug)
  return group ? labelFor(group.label, locale) : groupSlug
}

export function listingsPathForWorkGroup(
  groupSlug: string,
  categorySlug = 'construction',
): string {
  const params = new URLSearchParams({
    category: categorySlug,
    work: groupSlug,
  })
  return `/listings?${params.toString()}`
}

export function formatSubcategoriesSummary(
  categorySlug: string,
  slugs: string[],
  locale: string,
  max = 3,
): string {
  if (!slugs.length) return ''
  const resolvedSlug =
    slugs.every((s) => getSubcategoryDef(categorySlug, s)) ?
      categorySlug
    : categorySlugForSubcategory(slugs[0]) ?? categorySlug
  const names = slugs.map((s) => subcategoryLabel(resolvedSlug, s, locale))
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} +${names.length - max}`
}

