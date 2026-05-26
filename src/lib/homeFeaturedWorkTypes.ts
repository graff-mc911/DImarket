import type { TranslationKey } from './i18n'
import { groupLabel, listingsPathForWorkGroup } from './categoryCatalog'

/** Групи видів робіт — картки в «Популярні категорії» на головній. */
export const HOME_FEATURED_WORK_GROUPS = [
  {
    groupSlug: 'hvac',
    icon: '🌡️',
    titleKey: 'home.featuredWork.hvacTitle' as TranslationKey,
    descriptionKey: 'home.featuredWork.hvacDesc' as TranslationKey,
  },
  {
    groupSlug: 'windows',
    icon: '🪟',
    titleKey: 'home.featuredWork.windowsTitle' as TranslationKey,
    descriptionKey: 'home.featuredWork.windowsDesc' as TranslationKey,
  },
  {
    groupSlug: 'design-engineering',
    icon: '📐',
    titleKey: 'home.featuredWork.designTitle' as TranslationKey,
    descriptionKey: 'home.featuredWork.designDesc' as TranslationKey,
  },
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
] as const

export type HomeFeaturedWorkGroupSlug =
  (typeof HOME_FEATURED_WORK_GROUPS)[number]['groupSlug']

export function homeFeaturedWorkPath(groupSlug: HomeFeaturedWorkGroupSlug): string {
  return listingsPathForWorkGroup(groupSlug)
}

export function homeFeaturedWorkTitle(
  feat: (typeof HOME_FEATURED_WORK_GROUPS)[number],
  t: (key: TranslationKey) => string,
  locale: string,
): string {
  if ('titleKey' in feat && feat.titleKey) {
    return t(feat.titleKey)
  }
  return groupLabel('construction', feat.groupSlug, locale)
}
