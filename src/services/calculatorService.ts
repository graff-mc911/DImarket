/**
 * Purchase cost calculator — pure calculation engine.
 * Spain uses explicit market formulas from the product spec; other countries
 * resolve line items from `config/calculatorRules.ts`.
 */

import { getCalculatorCountryConfig } from '../config/calculatorRules'
import type {
  CalculationResult,
  CarCondition,
  CostItem,
  CostRule,
  PropertyCondition,
} from '../types/calculator'

export type CalculateRealEstateCostParams = {
  countryCode: string
  basePrice: number
  condition: PropertyCondition
  customLegalFee?: number
}

export type CalculateCarCostParams = {
  countryCode: string
  basePrice: number
  condition: CarCondition
  co2Emissions?: number
  customGestoriaFee?: number
}

function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function normalizeBasePrice(basePrice: number): number {
  if (!Number.isFinite(basePrice) || basePrice < 0) return 0
  return roundMoney(basePrice)
}

function normalizeCountryCode(countryCode: string): string {
  return countryCode.trim().toUpperCase()
}

function buildResult(basePrice: number, items: CostItem[]): CalculationResult {
  const totalTaxesAndFees = roundMoney(items.reduce((sum, item) => sum + item.amount, 0))
  return {
    basePrice,
    items,
    totalTaxesAndFees,
    finalTotalPrice: roundMoney(basePrice + totalTaxesAndFees),
  }
}

function item(
  id: string,
  name: string,
  amount: number,
  type: CostItem['type'],
  isMandatory: boolean,
  ratePercent?: number,
): CostItem {
  const row: CostItem = {
    id,
    name,
    amount: roundMoney(amount),
    isMandatory,
    type,
  }
  if (ratePercent != null) row.ratePercent = ratePercent
  return row
}

/** Spanish IEDMT / registration tax rate from CO₂ g/km. */
export function spainCarRegistrationTaxRate(co2Emissions: number | undefined): number {
  if (co2Emissions == null || !Number.isFinite(co2Emissions)) return 0
  if (co2Emissions <= 120) return 0
  if (co2Emissions <= 159) return 4.75
  if (co2Emissions <= 199) return 9.75
  return 14.75
}

function calculateSpainRealEstate(
  basePrice: number,
  condition: PropertyCondition,
  customLegalFee?: number,
): CalculationResult {
  if (condition === 'resale') {
    const itpRate = 9
    const legalFee = customLegalFee != null && Number.isFinite(customLegalFee) ? customLegalFee : 2000
    const items: CostItem[] = [
      item('es-re-resale-itp', 'ITP (Transfer Tax)', basePrice * 0.09, 'tax', true, itpRate),
      item(
        'es-re-resale-notary',
        'Notary',
        basePrice > 100_000 ? 1200 : 900,
        'legal',
        true,
      ),
      item('es-re-resale-registry', 'Land Registry', 500, 'fee', true),
      item('es-re-resale-legal-gestoria', 'Legal / Gestoría', legalFee, 'legal', true),
    ]
    return buildResult(basePrice, items)
  }

  const items: CostItem[] = [
    item('es-re-new-iva', 'IVA (VAT)', basePrice * 0.1, 'tax', true, 10),
    item('es-re-new-ajd', 'AJD (Stamp Duty)', basePrice * 0.014, 'tax', true, 1.4),
    item(
      'es-re-new-notary-registry-legal',
      'Notary + Registry + Legal',
      customLegalFee != null && Number.isFinite(customLegalFee) ? customLegalFee : 4000,
      'legal',
      true,
    ),
  ]
  return buildResult(basePrice, items)
}

function calculateSpainCar(
  basePrice: number,
  condition: CarCondition,
  co2Emissions?: number,
  customGestoriaFee?: number,
): CalculationResult {
  if (condition === 'used') {
    const gestoria =
      customGestoriaFee != null && Number.isFinite(customGestoriaFee) ? customGestoriaFee : 100
    const items: CostItem[] = [
      item('es-car-used-itp', 'ITP (Transfer Tax)', basePrice * 0.08, 'tax', true, 8),
      item('es-car-used-dgt-transfer', 'DGT Transfer Fee', 55.7, 'fee', true),
      item('es-car-used-gestoria', 'Gestoria / Admin Fee', gestoria, 'fee', true),
    ]
    return buildResult(basePrice, items)
  }

  const rate = spainCarRegistrationTaxRate(co2Emissions)
  const items: CostItem[] = [
    item(
      'es-car-new-iedmt',
      'IEDMT (CO₂ Registration Tax)',
      basePrice * (rate / 100),
      'tax',
      true,
      rate,
    ),
    item('es-car-new-dgt-registration', 'DGT Registration Fee', 99.77, 'fee', true),
    item('es-car-new-plates-docs', 'Plates & Documentation', 120, 'fee', true),
  ]
  return buildResult(basePrice, items)
}

function resolveRuleAmount(
  rule: CostRule,
  basePrice: number,
  opts: { co2Emissions?: number; amountOverride?: number },
): { amount: number; ratePercent?: number } {
  if (opts.amountOverride != null && Number.isFinite(opts.amountOverride)) {
    const calc = rule.calculation
    const ratePercent = calc.kind === 'percent_of_base' ? calc.ratePercent : undefined
    return { amount: opts.amountOverride, ratePercent }
  }

  const calc = rule.calculation
  switch (calc.kind) {
    case 'percent_of_base':
      return {
        amount: basePrice * (calc.ratePercent / 100),
        ratePercent: calc.ratePercent,
      }
    case 'fixed':
      return { amount: calc.amount }
    case 'fixed_range':
      return { amount: calc.defaultAmount }
    case 'tiered_percent': {
      const co2 = opts.co2Emissions
      let ratePercent = 0
      if (co2 != null && Number.isFinite(co2)) {
        const tier = calc.tiers.find((t) => {
          const minOk = t.min == null || co2 >= t.min
          const maxOk = t.max == null || co2 <= t.max
          return minOk && maxOk
        })
        ratePercent = tier?.ratePercent ?? 0
      }
      return {
        amount: basePrice * (ratePercent / 100),
        ratePercent,
      }
    }
    default:
      return { amount: 0 }
  }
}

function calculateFromRules(
  basePrice: number,
  rules: CostRule[],
  opts: {
    co2Emissions?: number
    /** Override amounts by rule id (e.g. custom legal / gestoria). */
    amountOverrides?: Record<string, number>
    /** When set, only mandatory rules are applied unless id is overridden. */
    includeOptional?: boolean
  } = {},
): CalculationResult {
  const items: CostItem[] = []
  for (const rule of rules) {
    if (!rule.isMandatory && !opts.includeOptional && opts.amountOverrides?.[rule.id] == null) {
      continue
    }
    const resolved = resolveRuleAmount(rule, basePrice, {
      co2Emissions: opts.co2Emissions,
      amountOverride: opts.amountOverrides?.[rule.id],
    })
    items.push(
      item(rule.id, rule.name, resolved.amount, rule.type, rule.isMandatory, resolved.ratePercent),
    )
  }
  return buildResult(basePrice, items)
}

/**
 * Turnkey real-estate purchase cost.
 * Spain uses explicit Valencian/Torrevieja formulas; other countries use config rules.
 */
export function calculateRealEstateCost(params: CalculateRealEstateCostParams): CalculationResult {
  const basePrice = normalizeBasePrice(params.basePrice)
  const countryCode = normalizeCountryCode(params.countryCode)

  if (countryCode === 'ES') {
    return calculateSpainRealEstate(basePrice, params.condition, params.customLegalFee)
  }

  const config = getCalculatorCountryConfig(countryCode)
  const rules = config?.realEstate?.[params.condition]
  if (!rules) {
    throw new Error(
      `No real-estate calculator rules for country "${params.countryCode}" (${params.condition}).`,
    )
  }

  const amountOverrides: Record<string, number> = {}
  if (params.customLegalFee != null && Number.isFinite(params.customLegalFee)) {
    const legalRule = rules.find((r) => r.type === 'legal')
    if (legalRule) amountOverrides[legalRule.id] = params.customLegalFee
  }

  return calculateFromRules(basePrice, rules, { amountOverrides })
}

/**
 * Turnkey car purchase / transfer cost.
 * Spain used/new formulas are explicit; other countries use config rules.
 */
export function calculateCarCost(params: CalculateCarCostParams): CalculationResult {
  const basePrice = normalizeBasePrice(params.basePrice)
  const countryCode = normalizeCountryCode(params.countryCode)

  if (countryCode === 'ES') {
    return calculateSpainCar(
      basePrice,
      params.condition,
      params.co2Emissions,
      params.customGestoriaFee,
    )
  }

  const config = getCalculatorCountryConfig(countryCode)
  const rules = config?.cars?.[params.condition]
  if (!rules) {
    throw new Error(
      `No car calculator rules for country "${params.countryCode}" (${params.condition}).`,
    )
  }

  const amountOverrides: Record<string, number> = {}
  if (params.customGestoriaFee != null && Number.isFinite(params.customGestoriaFee)) {
    const gestoriaRule = rules.find(
      (r) =>
        r.id.includes('gestoria') ||
        r.name.toLowerCase().includes('gestoria') ||
        r.name.toLowerCase().includes('admin'),
    )
    if (gestoriaRule) amountOverrides[gestoriaRule.id] = params.customGestoriaFee
  }

  return calculateFromRules(basePrice, rules, {
    co2Emissions: params.co2Emissions,
    amountOverrides,
  })
}
