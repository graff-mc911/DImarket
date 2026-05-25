import type { TranslationKey } from './i18n'
import type { Category } from './types'

/** Усі категорії сайту (меню, головна, фільтри). */
export const SITE_CATEGORY_SLUGS = [
  'cleaning',
  'construction',
  'electrical',
  'tools',
  'handyman',
  'furniture',
  'vacancies',
  'sell-rent',
] as const

export type SiteCategorySlug = (typeof SITE_CATEGORY_SLUGS)[number]

type SiteCategoryConfig = {
  icon: string
  /** Окремий маршрут замість /listings?category= */
  path?: string
  pageTitleKey?: TranslationKey
  pageDescriptionKey?: TranslationKey
}

export const SITE_CATEGORY_CONFIG: Record<SiteCategorySlug, SiteCategoryConfig> = {
  cleaning: { icon: '🧹' },
  construction: { icon: '🏗️' },
  electrical: { icon: '🚗' },
  tools: { icon: '🚚' },
  handyman: { icon: '🛠️' },
  furniture: { icon: '🪑' },
  vacancies: {
    icon: '💼',
    path: '/vacancies',
    pageTitleKey: 'category.page.vacancies.title',
    pageDescriptionKey: 'category.page.vacancies.description',
  },
  'sell-rent': {
    icon: '🏷️',
    path: '/sell-rent',
    pageTitleKey: 'category.page.sellRent.title',
    pageDescriptionKey: 'category.page.sellRent.description',
  },
}

/** @deprecated використовуйте SITE_CATEGORY_SLUGS */
export const HEADER_CATEGORY_SLUGS = SITE_CATEGORY_SLUGS

export type HeaderCategorySlug = SiteCategorySlug

export function categoryPagePath(slug: SiteCategorySlug | string): string {
  const cfg = SITE_CATEGORY_CONFIG[slug as SiteCategorySlug]
  if (cfg?.path) return cfg.path
  return `/listings?category=${encodeURIComponent(slug)}`
}

export function headerCategoryLabel(
  slug: SiteCategorySlug,
  t: (key: TranslationKey) => string,
): string {
  return categoryLabel(slug, t)
}

export function categoryLabel(
  slug: SiteCategorySlug | string,
  t: (key: TranslationKey) => string,
): string {
  const key = `category.name.${slug}` as TranslationKey
  const label = t(key)
  return label !== key ? label : slug
}

export function categoryDescription(
  slug: SiteCategorySlug | string,
  t: (key: TranslationKey) => string,
): string {
  const key = `category.${slug}Desc` as TranslationKey
  const label = t(key)
  return label !== key ? label : ''
}

export function buildDisplayCategories(
  fromDb: Category[],
  t: (key: TranslationKey) => string,
): Category[] {
  return SITE_CATEGORY_SLUGS.map((slug) => {
    const existing = fromDb.find((c) => c.slug === slug)
    if (existing) return existing

    const cfg = SITE_CATEGORY_CONFIG[slug]
    return {
      id: `local-${slug}`,
      name: categoryLabel(slug, t),
      slug,
      parent_id: null,
      icon: cfg.icon,
      description: categoryDescription(slug, t),
      created_at: new Date(0).toISOString(),
    }
  })
}

/** @deprecated */
export const listingsCategoryPath = categoryPagePath
