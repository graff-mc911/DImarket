/**
 * Acceptance math for the Dimarket cost calculator (placeholder prices).
 * Run: node --experimental-strip-types --no-warnings scripts/verify-cost-calculator.ts
 */
import assert from 'node:assert/strict'
import { BUILTIN_CALCULATOR_CATALOG } from '../src/lib/costCalculator/catalog.ts'
import { calculateProjectEstimate } from '../src/lib/costCalculator/calculate.ts'
import { costCalculatorEn, costCalculatorUk } from '../src/lib/Translations/costCalculator.ts'

const ids = [
  'bath_tile_floor',
  'bath_tile_wall',
  'bath_new_shower',
  'bath_new_toilet',
  'bath_new_sink',
] as const

function run(
  area: number,
  budgetLevel: 'low' | 'medium' | 'high',
  includeMaterials: boolean,
  selectedFeatureIds: string[] = [...ids],
) {
  return calculateProjectEstimate(
    {
      projectType: 'bathroom_remodel',
      area,
      budgetLevel,
      includeMaterials,
      selectedFeatureIds,
    },
    BUILTIN_CALCULATOR_CATALOG,
  )
}

const standard = run(10, 'medium', true)
assert.ok(standard.projectTotal > 0, 'standard total > 0')
assert.equal(standard.selectedItems.length, 5)
assert.equal(standard.missingPriceFeatureIds.length, 0)

const economy = run(10, 'low', true)
assert.ok(economy.projectTotal < standard.projectTotal, 'economy < standard')

const premium = run(10, 'high', true)
assert.ok(premium.projectTotal > standard.projectTotal, 'premium > standard')

const laborOnly = run(10, 'high', false)
assert.ok(laborOnly.projectTotal < premium.projectTotal, 'materials off reduces total')

const larger = run(20, 'high', false)
assert.ok(larger.projectTotal > laborOnly.projectTotal, '20 m² increases area-based cost')

const removed = run(20, 'high', false, ids.slice(1))
assert.ok(removed.projectTotal < larger.projectTotal, 'removing a feature reduces total')

for (const type of BUILTIN_CALCULATOR_CATALOG.projectTypes) {
  assert.ok(type.nameKey in costCalculatorEn, `en missing ${type.nameKey}`)
  assert.ok(type.nameKey in costCalculatorUk, `uk missing ${type.nameKey}`)
}
for (const feature of BUILTIN_CALCULATOR_CATALOG.features) {
  assert.ok(feature.nameKey in costCalculatorEn, `en missing ${feature.nameKey}`)
  assert.ok(feature.nameKey in costCalculatorUk, `uk missing ${feature.nameKey}`)
}

console.log('cost calculator acceptance math ok', {
  standard: standard.projectTotal,
  economy: economy.projectTotal,
  premium: premium.projectTotal,
  laborOnly: laborOnly.projectTotal,
  larger: larger.projectTotal,
})
