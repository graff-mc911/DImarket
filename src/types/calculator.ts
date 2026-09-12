/**
 * Purchase cost calculator — types for turnkey Real Estate & Car costs across EU.
 * Extensible: add a country entry in `config/calculatorRules.ts` without schema changes.
 */

export type AssetType = 'real_estate' | 'car'

export type PropertyCondition = 'new_build' | 'resale'

export type CarCondition = 'new' | 'used'

export type CostItemType = 'tax' | 'fee' | 'legal'

/** ISO 4217 currency used when resolving fixed amounts in a country config. */
export type CalculatorCurrency = 'EUR' | 'PLN' | string

/** ISO 3166-1 alpha-2 country code (extend freely, e.g. 'FR', 'IT'). */
export type CalculatorCountryCode = 'ES' | 'DE' | 'PL' | (string & {})

export type CostItem = {
  id: string
  name: string
  amount: number
  ratePercent?: number
  isMandatory: boolean
  type: CostItemType
}

export type CalculationResult = {
  basePrice: number
  items: CostItem[]
  totalTaxesAndFees: number
  finalTotalPrice: number
}

/** How a single line item is derived from the base price / inputs. */
export type CostRuleCalculation =
  | {
      kind: 'percent_of_base'
      ratePercent: number
      /** Optional alternate regional rate (e.g. ES ITP 10% vs baseline 9%). */
      alternateRatePercent?: number
    }
  | {
      kind: 'fixed'
      amount: number
    }
  | {
      kind: 'fixed_range'
      min: number
      max: number
      /** Amount used when the consumer does not pick a value in the range. */
      defaultAmount: number
    }
  | {
      /** Tiered % of base, driven by a numeric input (e.g. CO₂ g/km for ES IEDMT). */
      kind: 'tiered_percent'
      inputKey: 'co2Gkm'
      tiers: Array<{
        /** Inclusive lower bound; omit for open start. */
        min?: number
        /** Inclusive upper bound; omit for open end. */
        max?: number
        ratePercent: number
      }>
    }

export type CostRule = {
  id: string
  name: string
  type: CostItemType
  isMandatory: boolean
  calculation: CostRuleCalculation
  /**
   * When true, the amount is typically already in the quoted base price
   * (e.g. ES new-car IVA). Engines may itemize or skip double-counting.
   */
  oftenIncludedInBasePrice?: boolean
  notes?: string
}

export type RealEstateRuleSet = {
  /** Market / regional baseline label (e.g. Torrevieja / Valencian Community). */
  regionBaseline?: string
  resale: CostRule[]
  new_build: CostRule[]
  notes?: string
}

export type CarRuleSet = {
  used: CostRule[]
  new: CostRule[]
  notes?: string
}

/** Full configuration for one country — add new EU countries by copying this shape. */
export type CountryCalculatorConfig = {
  countryCode: CalculatorCountryCode
  countryName: string
  currency: CalculatorCurrency
  realEstate?: RealEstateRuleSet
  cars?: CarRuleSet
  notes?: string
}

/** Map of country code → config. Source of truth lives in calculatorRules.ts. */
export type CalculatorRulesMap = Record<string, CountryCalculatorConfig>

/** Inputs required to evaluate rules into a CalculationResult. */
export type PurchaseCalculationInput = {
  countryCode: CalculatorCountryCode
  assetType: AssetType
  basePrice: number
  /** Required when assetType === 'real_estate'. */
  propertyCondition?: PropertyCondition
  /** Required when assetType === 'car'. */
  carCondition?: CarCondition
  /**
   * Prefer alternate regional rates when a rule defines `alternateRatePercent`
   * (e.g. Valencian ITP 10% instead of 9%).
   */
  useAlternateRegionalRate?: boolean
  /** CO₂ emissions (g/km) for tiered car registration taxes (e.g. ES IEDMT). */
  co2Gkm?: number
  /**
   * Override fixed_range defaults by rule id (e.g. notary amount within min–max).
   */
  amountOverrides?: Record<string, number>
  /**
   * When true, skip rules marked `oftenIncludedInBasePrice` so they are not
   * added again on top of an IVA-inclusive quote.
   */
  treatIncludedTaxesAsItemized?: boolean
}
