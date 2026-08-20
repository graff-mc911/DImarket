import { CALCULATOR_BUDGET_MULTIPLIERS } from './catalog'
import type {
  CalculatorBudgetLevel,
  CalculatorCatalog,
  CalculatorEstimate,
  CalculatorSelectedItem,
  CalculatorStateInput,
} from './types'

function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function quantityFor(unit: 'm2' | 'unit', area: number): number {
  if (unit === 'm2') return Math.max(0, area)
  return 1
}

function multiplierFor(
  level: CalculatorBudgetLevel,
  feature: { lowMultiplier: number; mediumMultiplier: number; highMultiplier: number },
): number {
  if (level === 'low') return feature.lowMultiplier || CALCULATOR_BUDGET_MULTIPLIERS.low
  if (level === 'high') return feature.highMultiplier || CALCULATOR_BUDGET_MULTIPLIERS.high
  return feature.mediumMultiplier || CALCULATOR_BUDGET_MULTIPLIERS.medium
}

/** Local estimate from catalog. No network. Prices are Dimarket placeholders. */
export function calculateProjectEstimate(
  input: CalculatorStateInput,
  catalog: CalculatorCatalog,
): CalculatorEstimate {
  const area = Number.isFinite(input.area) ? Math.max(0, input.area) : 0
  const selectedItems: CalculatorSelectedItem[] = []
  const missingPriceFeatureIds: string[] = []
  let laborTotal = 0
  let materialsTotal = 0

  const seen = new Set<string>()
  for (const id of input.selectedFeatureIds) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    const feature = catalog.features.find(
      (item) => item.id === id && item.active && item.projectTypeId === input.projectType,
    )
    if (!feature) continue
    const qty = quantityFor(feature.unit, area)
    const mul = multiplierFor(input.budgetLevel, feature)
    const laborOk = feature.laborPrice != null && Number.isFinite(feature.laborPrice)
    const materialOk = feature.materialPrice != null && Number.isFinite(feature.materialPrice)
    if (!laborOk || !materialOk) {
      missingPriceFeatureIds.push(feature.id)
      selectedItems.push({
        featureId: feature.id,
        nameKey: feature.nameKey,
        quantity: qty,
        unit: feature.unit,
        laborTotal: 0,
        materialsTotal: 0,
        lineTotal: 0,
        missingPrice: true,
      })
      continue
    }
    const labor = roundMoney(qty * feature.laborPrice! * mul)
    const materials = input.includeMaterials
      ? roundMoney(qty * feature.materialPrice! * mul)
      : 0
    laborTotal += labor
    materialsTotal += materials
    selectedItems.push({
      featureId: feature.id,
      nameKey: feature.nameKey,
      quantity: qty,
      unit: feature.unit,
      laborTotal: labor,
      materialsTotal: materials,
      lineTotal: roundMoney(labor + materials),
      missingPrice: false,
    })
  }

  return {
    laborTotal: roundMoney(laborTotal),
    materialsTotal: roundMoney(materialsTotal),
    projectTotal: roundMoney(laborTotal + materialsTotal),
    selectedItems,
    missingPriceFeatureIds,
  }
}

export function formatCalculatorEuro(n: number): string {
  const safe = Number.isFinite(n) ? n : 0
  const body = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
  return `€ ${body.replace(/\./g, ' ').replace(',', ',')}`
}

export function budgetLevelFromTier(tier: 'economy' | 'standard' | 'premium'): CalculatorBudgetLevel {
  if (tier === 'economy') return 'low'
  if (tier === 'premium') return 'high'
  return 'medium'
}

export function tierFromBudgetLevel(level: CalculatorBudgetLevel): 'economy' | 'standard' | 'premium' {
  if (level === 'low') return 'economy'
  if (level === 'high') return 'premium'
  return 'standard'
}
