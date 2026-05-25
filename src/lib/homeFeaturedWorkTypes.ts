import type { TranslationKey } from './i18n'
import { listingsPathForWorkGroup } from './categoryCatalog'

/** Групи видів робіт — кнопки на головній (герой + популярні категорії). */
export const HOME_FEATURED_WORK_GROUPS = [
  {
    groupSlug: 'pools',
    icon: '🏊',
    descriptionKey: 'home.featuredWork.poolsDesc' as TranslationKey,
  },
  {
    groupSlug: 'solar',
    icon: '☀️',
    descriptionKey: 'home.featuredWork.solarDesc' as TranslationKey,
  },
  {
    groupSlug: 'smart-home',
    icon: '🏡',
    descriptionKey: 'home.featuredWork.smartHomeDesc' as TranslationKey,
  },
  {
    groupSlug: 'design-engineering',
    icon: '📐',
    descriptionKey: 'home.featuredWork.designDesc' as TranslationKey,
  },
] as const

export type HomeFeaturedWorkGroupSlug =
  (typeof HOME_FEATURED_WORK_GROUPS)[number]['groupSlug']

export function homeFeaturedWorkPath(groupSlug: HomeFeaturedWorkGroupSlug): string {
  return listingsPathForWorkGroup(groupSlug)
}
