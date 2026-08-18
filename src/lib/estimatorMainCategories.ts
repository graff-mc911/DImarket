import { MARKETPLACE_MAIN_COVER_SLUGS } from './categoryCoverImages'
import type { EstimatorProjectTypeId } from './costEstimatorTypes'
import {
  fetchMainMarketplaceCategories,
  type MarketplaceCategory,
} from './marketplaceCategories'

export type EstimatorMainCategory = Pick<
  MarketplaceCategory,
  'id' | 'slug' | 'name' | 'icon_key' | 'name_i18n' | 'is_main'
>

const SLUG_TO_TYPE: Record<string, EstimatorProjectTypeId> = {
  demolition: 'renovation',
  earthworks: 'landscaping',
  foundation: 'new_construction',
  concrete: 'new_construction',
  masonry: 'facade',
  roofing: 'roof',
  facade: 'facade',
  plastering: 'drywall',
  painting: 'painting',
  wallpaper: 'painting',
  drywall: 'drywall',
  tiling: 'tiling',
  flooring: 'flooring',
  carpentry: 'kitchen',
  windows: 'windows',
  plumbing: 'plumbing',
  electro: 'electrical',
  hvac: 'hvac',
  insulation: 'drywall',
  welding: 'other',
  metal: 'other',
  glass: 'windows',
  landscaping: 'landscaping',
  pools: 'pool',
  solar: 'solar',
  'smart-home': 'electrical',
  'design-engineering': 'other',
  bathroom: 'bathroom',
  kitchen: 'kitchen',
  renovation: 'renovation',
  house_renovation: 'house_renovation',
  new_construction: 'new_construction',
}

export function estimatorTypeFromCatalogId(id: string | null | undefined): EstimatorProjectTypeId {
  if (!id) return 'other'
  return SLUG_TO_TYPE[id] || (id as EstimatorProjectTypeId) || 'other'
}

function fallbackMains(): EstimatorMainCategory[] {
  return MARKETPLACE_MAIN_COVER_SLUGS.map((slug) => ({
    id: slug,
    slug,
    name: slug,
    icon_key: slug,
    name_i18n: {},
    is_main: true,
  }))
}

export async function loadEstimatorMainCategories(): Promise<EstimatorMainCategory[]> {
  try {
    const rows = await fetchMainMarketplaceCategories()
    if (rows.length) {
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        icon_key: row.icon_key,
        name_i18n: row.name_i18n,
        is_main: true,
      }))
    }
  } catch {
    /* use static fallback */
  }
  return fallbackMains()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function matchMainCategory(
  query: string,
  mains: EstimatorMainCategory[],
  labelOf: (cat: EstimatorMainCategory) => string,
): EstimatorMainCategory | null {
  const q = normalize(query)
  if (!q) return null
  let best: { cat: EstimatorMainCategory; score: number } | null = null
  for (const cat of mains) {
    const label = normalize(labelOf(cat))
    const slug = normalize(cat.slug)
    const name = normalize(cat.name || '')
    let score = 0
    if (label === q || slug === q || name === q) score = 4
    else if (label.startsWith(q) || slug.startsWith(q) || name.startsWith(q)) score = 3
    else if (label.includes(q) || slug.includes(q) || name.includes(q)) score = 2
    if (score > (best?.score ?? 0)) best = { cat, score }
  }
  return best?.cat ?? null
}
