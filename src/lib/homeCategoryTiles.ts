import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Droplets,
  Flame,
  Grid3x3,
  Hammer,
  Home,
  Layers,
  Package,
  Paintbrush,
  Ruler,
  Sparkles,
  Sun,
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
  SITE_CATEGORY_CONFIG,
  type SiteCategorySlug,
} from './siteCategories'

export interface HomeCategoryTile {
  id: string
  label: string
  path: string
  icon?: LucideIcon
  emoji?: string
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

/** Пріоритетні категорії — показуються першими на головній. */
const PRIORITY_TILE_IDS = [
  'construction:electro',
  'construction:plumbing',
  'construction:painting',
  'construction:tiling',
  'cleaning:cleaning',
  'site:renovation',
]

/** Додаткові розділи сайту (окрім груп робіт з каталогу). */
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

const SITE_EXTRA_EMOJI: Record<string, string> = {
  renovation: '🔨',
}

function tileIcon(groupSlug: string): LucideIcon {
  return WORK_GROUP_ICONS[groupSlug] ?? Wrench
}

function sortTiles(tiles: HomeCategoryTile[]): HomeCategoryTile[] {
  const priorityIndex = new Map(PRIORITY_TILE_IDS.map((id, index) => [id, index]))
  return [...tiles].sort((a, b) => {
    const aPriority = priorityIndex.get(a.id)
    const bPriority = priorityIndex.get(b.id)
    if (aPriority != null && bPriority != null) return aPriority - bPriority
    if (aPriority != null) return -1
    if (bPriority != null) return 1
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  })
}

/** Усі категорії для головної та меню шапки. */
export function buildHomeCategoryTiles(
  locale: string,
  t: (key: TranslationKey) => string,
): HomeCategoryTile[] {
  const tiles: HomeCategoryTile[] = []
  const seen = new Set<string>()

  const add = (tile: HomeCategoryTile) => {
    if (seen.has(tile.id)) return
    seen.add(tile.id)
    tiles.push(tile)
  }

  for (const cat of SERVICE_CATEGORY_CATALOG) {
    for (const group of cat.groups ?? []) {
      add({
        id: `${cat.slug}:${group.slug}`,
        label: labelFor(group.label, locale),
        path: listingsPathForWorkGroup(group.slug, cat.slug),
        icon: tileIcon(group.slug),
      })
    }
  }

  for (const slug of EXTRA_SITE_SLUGS) {
    const cfg = SITE_CATEGORY_CONFIG[slug as SiteCategorySlug]
    add({
      id: `site:${slug}`,
      label: categoryLabel(slug, t),
      path: categoryPagePath(slug),
      emoji: SITE_EXTRA_EMOJI[slug] ?? cfg?.icon,
      icon: slug === 'construction' ? Building2 : slug === 'handyman' ? Wrench : undefined,
    })
  }

  return sortTiles(tiles)
}

/** @deprecated використовуйте buildHomeCategoryTiles */
export const HOME_CATEGORY_TILES = buildHomeCategoryTiles('en', (key) => key)
