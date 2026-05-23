import type { TranslationKey } from './i18n'

/** Категорії у випадаючому меню шапки (порядок відображення). */
export const HEADER_CATEGORY_SLUGS = [
  'cleaning',
  'construction',
  'electrical',
  'tools',
  'handyman',
  'materials',
  'vacancies',
  'sell-rent',
] as const

export type HeaderCategorySlug = (typeof HEADER_CATEGORY_SLUGS)[number]

export function listingsCategoryPath(slug: string): string {
  return `/listings?category=${encodeURIComponent(slug)}`
}

export function headerCategoryLabel(
  slug: HeaderCategorySlug,
  t: (key: TranslationKey) => string,
): string {
  const key = `category.name.${slug}` as TranslationKey
  const label = t(key)
  return label !== key ? label : slug
}
