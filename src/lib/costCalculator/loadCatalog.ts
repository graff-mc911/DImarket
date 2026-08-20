import { supabase } from '../supabase'
import { BUILTIN_CALCULATOR_CATALOG } from './catalog'
import type { CalculatorCatalog, CalculatorFeature, CalculatorProjectType, CalculatorProjectTypeId } from './types'

type TypeRow = {
  id: string
  slug: string
  active: boolean | null
  sort_order: number | null
}

type FeatureRow = {
  id: string
  project_type_id: string
  slug: string
  unit: string
  active: boolean | null
  sort_order: number | null
}

type PriceRow = {
  feature_id: string
  labor_price: number | string | null
  material_price: number | string | null
  low_multiplier: number | string | null
  medium_multiplier: number | string | null
  high_multiplier: number | string | null
  active: boolean | null
}

function num(value: number | string | null | undefined, fallback: number | null): number | null {
  if (value == null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Load catalog once. Falls back to the built-in Dimarket dataset if tables are empty or missing. */
export async function loadCalculatorCatalog(): Promise<CalculatorCatalog> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const typesRes = await db
      .from('calculator_project_types')
      .select('id, slug, active, sort_order')
      .eq('active', true)
      .order('sort_order')
    if (typesRes.error || !typesRes.data?.length) return BUILTIN_CALCULATOR_CATALOG

    const featuresRes = await db
      .from('calculator_features')
      .select('id, project_type_id, slug, unit, active, sort_order')
      .eq('active', true)
      .order('sort_order')
    if (featuresRes.error || !featuresRes.data?.length) return BUILTIN_CALCULATOR_CATALOG

    const pricesRes = await db
      .from('calculator_feature_prices')
      .select(
        'feature_id, labor_price, material_price, low_multiplier, medium_multiplier, high_multiplier, active',
      )
      .eq('active', true)

    const types = (typesRes.data as TypeRow[]).map((row): CalculatorProjectType => ({
      id: row.slug as CalculatorProjectTypeId,
      slug: row.slug as CalculatorProjectTypeId,
      nameKey: `costCalc.type.${row.slug}`,
      active: row.active !== false,
      sortOrder: row.sort_order ?? 0,
    }))
    const priceByFeature = new Map<string, PriceRow>()
    for (const row of (pricesRes.data || []) as PriceRow[]) {
      if (!priceByFeature.has(row.feature_id)) priceByFeature.set(row.feature_id, row)
    }
    const typeIdToSlug = new Map((typesRes.data as TypeRow[]).map((row) => [row.id, row.slug]))
    const features = (featuresRes.data as FeatureRow[])
      .map((row): CalculatorFeature | null => {
        const projectSlug = typeIdToSlug.get(row.project_type_id)
        if (!projectSlug) return null
        const price = priceByFeature.get(row.id)
        return {
          id: row.slug,
          projectTypeId: projectSlug as CalculatorProjectTypeId,
          nameKey: `costCalc.feature.${row.slug}`,
          unit: row.unit === 'unit' ? 'unit' : 'm2',
          laborPrice: price ? num(price.labor_price, null) : null,
          materialPrice: price ? num(price.material_price, null) : null,
          lowMultiplier: num(price?.low_multiplier, 0.85) ?? 0.85,
          mediumMultiplier: num(price?.medium_multiplier, 1) ?? 1,
          highMultiplier: num(price?.high_multiplier, 1.35) ?? 1.35,
          active: row.active !== false,
          sortOrder: row.sort_order ?? 0,
        }
      })
      .filter((item): item is CalculatorFeature => Boolean(item))
    if (!types.length || !features.length) return BUILTIN_CALCULATOR_CATALOG
    return { projectTypes: types, features }
  } catch (error) {
    console.error('calculator catalog load:', error)
    return BUILTIN_CALCULATOR_CATALOG
  }
}
