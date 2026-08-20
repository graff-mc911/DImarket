import type {
  CalculatorCatalog,
  CalculatorFeature,
  CalculatorFeatureUnit,
  CalculatorProjectType,
  CalculatorProjectTypeId,
} from './types'

/** Placeholder budget multipliers — replace later with regional Dimarket data. */
export const CALCULATOR_BUDGET_MULTIPLIERS = {
  low: 0.85,
  medium: 1,
  high: 1.35,
} as const

const TYPES: CalculatorProjectType[] = [
  { id: 'bathroom_remodel', slug: 'bathroom_remodel', nameKey: 'costCalc.type.bathroom_remodel', active: true, sortOrder: 1 },
  { id: 'kitchen_remodel', slug: 'kitchen_remodel', nameKey: 'costCalc.type.kitchen_remodel', active: true, sortOrder: 2 },
  { id: 'whole_house', slug: 'whole_house', nameKey: 'costCalc.type.whole_house', active: true, sortOrder: 3 },
  { id: 'multi_room', slug: 'multi_room', nameKey: 'costCalc.type.multi_room', active: true, sortOrder: 4 },
  { id: 'addition', slug: 'addition', nameKey: 'costCalc.type.addition', active: true, sortOrder: 5 },
  { id: 'new_construction', slug: 'new_construction', nameKey: 'costCalc.type.new_construction', active: true, sortOrder: 6 },
  { id: 'roofing', slug: 'roofing', nameKey: 'costCalc.type.roofing', active: true, sortOrder: 7 },
  { id: 'painting', slug: 'painting', nameKey: 'costCalc.type.painting', active: true, sortOrder: 8 },
  { id: 'flooring', slug: 'flooring', nameKey: 'costCalc.type.flooring', active: true, sortOrder: 9 },
  { id: 'basement', slug: 'basement', nameKey: 'costCalc.type.basement', active: true, sortOrder: 10 },
  { id: 'terrace', slug: 'terrace', nameKey: 'costCalc.type.terrace', active: true, sortOrder: 11 },
  { id: 'other', slug: 'other', nameKey: 'costCalc.type.other', active: true, sortOrder: 12 },
]

function f(
  id: string,
  projectTypeId: CalculatorProjectTypeId,
  sortOrder: number,
  unit: CalculatorFeatureUnit,
  laborPrice: number,
  materialPrice: number,
): CalculatorFeature {
  return {
    id,
    projectTypeId,
    nameKey: `costCalc.feature.${id}`,
    unit,
    laborPrice,
    materialPrice,
    lowMultiplier: CALCULATOR_BUDGET_MULTIPLIERS.low,
    mediumMultiplier: CALCULATOR_BUDGET_MULTIPLIERS.medium,
    highMultiplier: CALCULATOR_BUDGET_MULTIPLIERS.high,
    active: true,
    sortOrder,
  }
}

/**
 * Independent Dimarket placeholder prices (EUR). Not BuildZoom data, not market quotes.
 * Admins can replace via calculator_feature_prices without rewriting the UI.
 */
const FEATURES: CalculatorFeature[] = [
  f('bath_demo_tile', 'bathroom_remodel', 1, 'm2', 18, 4),
  f('bath_demo_plumbing', 'bathroom_remodel', 2, 'unit', 90, 15),
  f('bath_demo_tub', 'bathroom_remodel', 3, 'unit', 110, 20),
  f('bath_demo_shower', 'bathroom_remodel', 4, 'unit', 95, 18),
  f('bath_tile_floor', 'bathroom_remodel', 5, 'm2', 35, 25),
  f('bath_tile_wall', 'bathroom_remodel', 6, 'm2', 38, 28),
  f('bath_waterproof', 'bathroom_remodel', 7, 'm2', 22, 12),
  f('bath_new_tub', 'bathroom_remodel', 8, 'unit', 160, 380),
  f('bath_new_shower', 'bathroom_remodel', 9, 'unit', 180, 450),
  f('bath_new_toilet', 'bathroom_remodel', 10, 'unit', 90, 180),
  f('bath_new_sink', 'bathroom_remodel', 11, 'unit', 80, 160),
  f('bath_new_vanity', 'bathroom_remodel', 12, 'unit', 120, 280),
  f('bath_taps', 'bathroom_remodel', 13, 'unit', 55, 95),
  f('bath_electrical', 'bathroom_remodel', 14, 'm2', 16, 8),
  f('bath_lighting', 'bathroom_remodel', 15, 'unit', 45, 70),
  f('bath_ventilation', 'bathroom_remodel', 16, 'unit', 70, 85),
  f('bath_paint', 'bathroom_remodel', 17, 'm2', 11, 5),

  f('kit_demo_kitchen', 'kitchen_remodel', 1, 'm2', 22, 6),
  f('kit_demo_floor', 'kitchen_remodel', 2, 'm2', 14, 4),
  f('kit_wall_prep', 'kitchen_remodel', 3, 'm2', 10, 4),
  f('kit_paint', 'kitchen_remodel', 4, 'm2', 11, 5),
  f('kit_flooring', 'kitchen_remodel', 5, 'm2', 22, 28),
  f('kit_splashback', 'kitchen_remodel', 6, 'm2', 32, 24),
  f('kit_cabinets', 'kitchen_remodel', 7, 'm2', 55, 120),
  f('kit_worktop', 'kitchen_remodel', 8, 'm2', 40, 85),
  f('kit_sink', 'kitchen_remodel', 9, 'unit', 70, 140),
  f('kit_tap', 'kitchen_remodel', 10, 'unit', 45, 75),
  f('kit_electrical', 'kitchen_remodel', 11, 'm2', 18, 9),
  f('kit_lighting', 'kitchen_remodel', 12, 'unit', 50, 80),
  f('kit_plumbing', 'kitchen_remodel', 13, 'unit', 120, 60),
  f('kit_appliances', 'kitchen_remodel', 14, 'unit', 90, 40),

  f('wh_demo', 'whole_house', 1, 'm2', 20, 6),
  f('wh_walls', 'whole_house', 2, 'm2', 18, 10),
  f('wh_ceiling', 'whole_house', 3, 'm2', 16, 8),
  f('wh_plaster', 'whole_house', 4, 'm2', 14, 7),
  f('wh_paint', 'whole_house', 5, 'm2', 11, 5),
  f('wh_drywall', 'whole_house', 6, 'm2', 18, 12),
  f('wh_floor', 'whole_house', 7, 'm2', 22, 28),
  f('wh_doors', 'whole_house', 8, 'unit', 70, 180),
  f('wh_windows', 'whole_house', 9, 'unit', 90, 280),
  f('wh_electrical', 'whole_house', 10, 'm2', 16, 8),
  f('wh_plumbing', 'whole_house', 11, 'm2', 18, 10),
  f('wh_heating', 'whole_house', 12, 'm2', 20, 14),
  f('wh_ventilation', 'whole_house', 13, 'm2', 12, 8),
  f('wh_kitchen', 'whole_house', 14, 'unit', 420, 1800),
  f('wh_bathrooms', 'whole_house', 15, 'unit', 380, 1400),
  f('wh_insulation', 'whole_house', 16, 'm2', 16, 14),

  f('mr_demo', 'multi_room', 1, 'm2', 18, 5),
  f('mr_plaster', 'multi_room', 2, 'm2', 14, 7),
  f('mr_drywall', 'multi_room', 3, 'm2', 18, 12),
  f('mr_paint', 'multi_room', 4, 'm2', 11, 5),
  f('mr_floor', 'multi_room', 5, 'm2', 22, 28),
  f('mr_ceiling', 'multi_room', 6, 'm2', 16, 8),
  f('mr_doors', 'multi_room', 7, 'unit', 70, 180),
  f('mr_windows', 'multi_room', 8, 'unit', 90, 280),
  f('mr_electrical', 'multi_room', 9, 'm2', 16, 8),
  f('mr_lighting', 'multi_room', 10, 'unit', 35, 45),
  f('mr_plumbing', 'multi_room', 11, 'm2', 16, 9),

  f('ad_foundation', 'addition', 1, 'm2', 55, 40),
  f('ad_load_walls', 'addition', 2, 'm2', 48, 32),
  f('ad_floorslab', 'addition', 3, 'm2', 42, 28),
  f('ad_roof', 'addition', 4, 'm2', 38, 45),
  f('ad_insulation', 'addition', 5, 'm2', 16, 14),
  f('ad_windows', 'addition', 6, 'unit', 90, 280),
  f('ad_doors', 'addition', 7, 'unit', 70, 180),
  f('ad_electrical', 'addition', 8, 'm2', 16, 8),
  f('ad_plumbing', 'addition', 9, 'm2', 18, 10),
  f('ad_heating', 'addition', 10, 'm2', 20, 14),
  f('ad_inner_walls', 'addition', 11, 'm2', 18, 10),
  f('ad_floor', 'addition', 12, 'm2', 22, 28),
  f('ad_paint', 'addition', 13, 'm2', 11, 5),

  f('nc_foundation', 'new_construction', 1, 'm2', 55, 40),
  f('nc_frame', 'new_construction', 2, 'm2', 48, 35),
  f('nc_load_walls', 'new_construction', 3, 'm2', 48, 32),
  f('nc_floorslab', 'new_construction', 4, 'm2', 42, 28),
  f('nc_roof', 'new_construction', 5, 'm2', 38, 45),
  f('nc_facade', 'new_construction', 6, 'm2', 32, 28),
  f('nc_insulation', 'new_construction', 7, 'm2', 16, 14),
  f('nc_windows', 'new_construction', 8, 'unit', 90, 280),
  f('nc_doors', 'new_construction', 9, 'unit', 70, 180),
  f('nc_electrical', 'new_construction', 10, 'm2', 16, 8),
  f('nc_plumbing', 'new_construction', 11, 'm2', 18, 10),
  f('nc_heating', 'new_construction', 12, 'm2', 20, 14),
  f('nc_ventilation', 'new_construction', 13, 'm2', 12, 8),
  f('nc_drywall', 'new_construction', 14, 'm2', 18, 12),
  f('nc_plaster', 'new_construction', 15, 'm2', 14, 7),
  f('nc_floor', 'new_construction', 16, 'm2', 22, 28),
  f('nc_paint', 'new_construction', 17, 'm2', 11, 5),

  f('rf_strip', 'roofing', 1, 'm2', 14, 3),
  f('rf_cover', 'roofing', 2, 'm2', 28, 42),
  f('rf_waterproof', 'roofing', 3, 'm2', 16, 12),
  f('rf_insulation', 'roofing', 4, 'm2', 18, 16),
  f('rf_gutters', 'roofing', 5, 'm2', 12, 14),
  f('rf_eaves', 'roofing', 6, 'm2', 10, 8),
  f('rf_snow', 'roofing', 7, 'unit', 40, 55),

  f('pt_prep', 'painting', 1, 'm2', 8, 2),
  f('pt_primer', 'painting', 2, 'm2', 5, 3),
  f('pt_walls', 'painting', 3, 'm2', 11, 5),
  f('pt_ceiling', 'painting', 4, 'm2', 10, 4),
  f('pt_doors', 'painting', 5, 'unit', 35, 12),
  f('pt_windows', 'painting', 6, 'unit', 30, 10),

  f('fl_remove', 'flooring', 1, 'm2', 12, 3),
  f('fl_prep', 'flooring', 2, 'm2', 14, 8),
  f('fl_laminate', 'flooring', 3, 'm2', 16, 22),
  f('fl_vinyl', 'flooring', 4, 'm2', 18, 24),
  f('fl_parquet', 'flooring', 5, 'm2', 28, 45),
  f('fl_tile', 'flooring', 6, 'm2', 32, 28),
  f('fl_skirting', 'flooring', 7, 'm2', 6, 5),

  f('bs_demo', 'basement', 1, 'm2', 18, 5),
  f('bs_waterproof', 'basement', 2, 'm2', 24, 16),
  f('bs_insulation', 'basement', 3, 'm2', 16, 14),
  f('bs_walls', 'basement', 4, 'm2', 18, 10),
  f('bs_ceiling', 'basement', 5, 'm2', 16, 8),
  f('bs_floor', 'basement', 6, 'm2', 22, 28),
  f('bs_electrical', 'basement', 7, 'm2', 16, 8),
  f('bs_lighting', 'basement', 8, 'unit', 40, 55),
  f('bs_ventilation', 'basement', 9, 'unit', 80, 120),
  f('bs_paint', 'basement', 10, 'm2', 11, 5),

  f('tr_demo', 'terrace', 1, 'm2', 14, 4),
  f('tr_base', 'terrace', 2, 'm2', 18, 12),
  f('tr_deck', 'terrace', 3, 'm2', 28, 35),
  f('tr_rail', 'terrace', 4, 'm2', 22, 30),
  f('tr_cover', 'terrace', 5, 'm2', 32, 40),
  f('tr_lighting', 'terrace', 6, 'unit', 40, 55),
  f('tr_paint', 'terrace', 7, 'm2', 10, 5),

  f('ot_demo', 'other', 1, 'm2', 16, 4),
  f('ot_prep', 'other', 2, 'm2', 10, 4),
  f('ot_install', 'other', 3, 'm2', 22, 12),
  f('ot_paint', 'other', 4, 'm2', 11, 5),
  f('ot_cleanup', 'other', 5, 'unit', 80, 25),
]

export const BUILTIN_CALCULATOR_CATALOG: CalculatorCatalog = {
  projectTypes: TYPES,
  features: FEATURES,
}

export function isCalculatorProjectTypeId(id: string | null | undefined): id is CalculatorProjectTypeId {
  return Boolean(id && TYPES.some((item) => item.id === id))
}

export function featuresForProjectType(
  catalog: CalculatorCatalog,
  projectTypeId: string | null | undefined,
): CalculatorFeature[] {
  if (!projectTypeId) return []
  return catalog.features
    .filter((item) => item.active && item.projectTypeId === projectTypeId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function featureById(catalog: CalculatorCatalog, id: string): CalculatorFeature | undefined {
  return catalog.features.find((item) => item.id === id)
}
