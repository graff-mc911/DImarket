import type { LucideIcon } from 'lucide-react'
import {
  Armchair,
  Briefcase,
  Building2,
  Calculator,
  Droplets,
  Flame,
  Grid3x3,
  Hammer,
  Home,
  Layers,
  Package,
  Paintbrush,
  Ruler,
  Scale,
  Sparkles,
  Sun,
  Tag,
  Thermometer,
  Truck,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'
import type { TranslationKey } from './i18n'
import {
  labelFor,
  listingsPathForWorkGroup,
  SERVICE_CATEGORY_CATALOG,
} from './categoryCatalog'
import {
  categoryLabel,
  categoryPagePath,
  type SiteCategorySlug,
} from './siteCategories'

export interface HomeCategoryTile {
  id: string
  label: string
  path: string
  icon: LucideIcon
}

export interface HomeCategoryGroup {
  id: string
  titleKey: TranslationKey
  tiles: HomeCategoryTile[]
}

const WORK_GROUP_ICONS: Record<string, LucideIcon> = {
  demolition: Hammer,
  earthworks: Hammer,
  foundation: Building2,
  concrete: Building2,
  masonry: Hammer,
  roofing: Home,
  facade: Building2,
  plastering: Paintbrush,
  painting: Paintbrush,
  wallpaper: Layers,
  drywall: Layers,
  tiling: Grid3x3,
  flooring: Layers,
  carpentry: Hammer,
  windows: Home,
  plumbing: Droplets,
  electro: Zap,
  hvac: Wind,
  insulation: Thermometer,
  welding: Flame,
  metal: Wrench,
  glass: Home,
  landscaping: Home,
  pools: Waves,
  solar: Sun,
  'smart-home': Home,
  'design-engineering': Ruler,
  cleaning: Sparkles,
  logistics: Truck,
  'equipment-rental': Package,
}

const SITE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  renovation: Hammer,
  construction: Building2,
  handyman: Wrench,
  furniture: Armchair,
  'legal-notary': Scale,
  'accounting-finance': Calculator,
  vacancies: Briefcase,
  'sell-rent': Tag,
}

const EXTRA_SITE_SLUGS = [
  'renovation',
  'construction',
  'handyman',
  'furniture',
  'legal-notary',
  'accounting-finance',
  'vacancies',
  'sell-rent',
] as const

/** Логічні групи та фіксований порядок плиток на головній. */
const HOME_CATEGORY_GROUP_DEFS: {
  id: string
  titleKey: TranslationKey
  tileIds: string[]
}[] = [
  {
    id: 'popular',
    titleKey: 'home.categoryGroup.popular',
    tileIds: [
      'construction:electro',
      'construction:plumbing',
      'construction:painting',
      'construction:tiling',
      'cleaning:cleaning',
      'site:renovation',
    ],
  },
  {
    id: 'finishing',
    titleKey: 'home.categoryGroup.finishing',
    tileIds: [
      'construction:demolition',
      'construction:plastering',
      'construction:wallpaper',
      'construction:drywall',
      'construction:flooring',
      'construction:windows',
      'construction:carpentry',
    ],
  },
  {
    id: 'building',
    titleKey: 'home.categoryGroup.building',
    tileIds: [
      'site:construction',
      'construction:foundation',
      'construction:concrete',
      'construction:masonry',
      'construction:roofing',
      'construction:facade',
      'construction:earthworks',
    ],
  },
  {
    id: 'engineering',
    titleKey: 'home.categoryGroup.engineering',
    tileIds: [
      'construction:hvac',
      'construction:insulation',
      'construction:solar',
      'construction:smart-home',
    ],
  },
  {
    id: 'outdoor',
    titleKey: 'home.categoryGroup.outdoor',
    tileIds: ['construction:landscaping', 'construction:pools'],
  },
  {
    id: 'metal-glass',
    titleKey: 'home.categoryGroup.metalGlass',
    tileIds: ['construction:welding', 'construction:metal', 'construction:glass'],
  },
  {
    id: 'services',
    titleKey: 'home.categoryGroup.services',
    tileIds: [
      'tools:logistics',
      'site:handyman',
      'sell-rent:equipment-rental',
    ],
  },
  {
    id: 'other',
    titleKey: 'home.categoryGroup.other',
    tileIds: [
      'construction:design-engineering',
      'site:furniture',
      'site:legal-notary',
      'site:accounting-finance',
      'site:vacancies',
      'site:sell-rent',
    ],
  },
]

function tileIcon(groupSlug: string): LucideIcon {
  return WORK_GROUP_ICONS[groupSlug] ?? Wrench
}

function buildTileIndex(
  locale: string,
  t: (key: TranslationKey) => string,
): Map<string, HomeCategoryTile> {
  const index = new Map<string, HomeCategoryTile>()

  for (const cat of SERVICE_CATEGORY_CATALOG) {
    for (const group of cat.groups ?? []) {
      index.set(`${cat.slug}:${group.slug}`, {
        id: `${cat.slug}:${group.slug}`,
        label: labelFor(group.label, locale),
        path: listingsPathForWorkGroup(group.slug, cat.slug),
        icon: tileIcon(group.slug),
      })
    }
  }

  for (const slug of EXTRA_SITE_SLUGS) {
    index.set(`site:${slug}`, {
      id: `site:${slug}`,
      label: categoryLabel(slug, t),
      path: categoryPagePath(slug),
      icon: SITE_CATEGORY_ICONS[slug] ?? Wrench,
    })
  }

  return index
}

export function buildHomeCategoryGroups(
  locale: string,
  t: (key: TranslationKey) => string,
): HomeCategoryGroup[] {
  const index = buildTileIndex(locale, t)

  return HOME_CATEGORY_GROUP_DEFS.map((group) => ({
    id: group.id,
    titleKey: group.titleKey,
    tiles: group.tileIds
      .map((id) => index.get(id))
      .filter((tile): tile is HomeCategoryTile => tile != null),
  })).filter((group) => group.tiles.length > 0)
}

/** Плоский список у тому ж порядку, що й групи (меню шапки). */
export function buildHomeCategoryTiles(
  locale: string,
  t: (key: TranslationKey) => string,
): HomeCategoryTile[] {
  return buildHomeCategoryGroups(locale, t).flatMap((group) => group.tiles)
}
