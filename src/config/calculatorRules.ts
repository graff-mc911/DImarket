/**
 * Purchase cost calculator — country rule presets (ES, DE, PL).
 * To support another EU country: add an entry matching `CountryCalculatorConfig`
 * and register it in `CALCULATOR_RULES`.
 *
 * Amounts are in the country's `currency` field. Rates are percent of base price
 * unless a rule uses `tiered_percent` / fixed amounts.
 */

import type { CalculatorRulesMap, CountryCalculatorConfig } from '../types/calculator'

/** Spain — Torrevieja / Valencian Community baseline for real estate. */
export const SPAIN_CALCULATOR_CONFIG: CountryCalculatorConfig = {
  countryCode: 'ES',
  countryName: 'Spain',
  currency: 'EUR',
  notes:
    'Real-estate baseline: Torrevieja / Valencian Community. Car used ITP uses Valencian regional rate.',
  realEstate: {
    regionBaseline: 'Torrevieja / Valencian Community',
    resale: [
      {
        id: 'es-re-resale-itp',
        name: 'ITP (Transfer Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: {
          kind: 'percent_of_base',
          ratePercent: 9,
          alternateRatePercent: 10,
        },
        notes: 'Baseline 9%; some Valencian / regional cases apply 10%.',
      },
      {
        id: 'es-re-resale-notary',
        name: 'Notary',
        type: 'legal',
        isMandatory: true,
        calculation: {
          kind: 'fixed_range',
          min: 1000,
          max: 1500,
          defaultAmount: 1250,
        },
      },
      {
        id: 'es-re-resale-registry',
        name: 'Property Registry',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 500 },
      },
      {
        id: 'es-re-resale-legal-gestoria',
        name: 'Legal / Gestoria',
        type: 'legal',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 2000 },
      },
    ],
    new_build: [
      {
        id: 'es-re-new-iva',
        name: 'IVA (VAT)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 10 },
      },
      {
        id: 'es-re-new-ajd',
        name: 'AJD (Stamp Duty)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 1.4 },
      },
      {
        id: 'es-re-new-notary-registry-legal',
        name: 'Notary + Registry + Legal',
        type: 'legal',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 4000 },
        notes: 'Combined market estimate for notary, registry and legal ~€4,000.',
      },
    ],
  },
  cars: {
    used: [
      {
        id: 'es-car-used-itp',
        name: 'ITP (Transfer Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 8 },
        notes: 'Valencian Community regional rate for private-sale used cars.',
      },
      {
        id: 'es-car-used-dgt-transfer',
        name: 'DGT Transfer Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 55.7 },
      },
      {
        id: 'es-car-used-gestoria',
        name: 'Gestoria / Admin Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 100 },
      },
    ],
    new: [
      {
        id: 'es-car-new-iva',
        name: 'IVA (VAT)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 21 },
        oftenIncludedInBasePrice: true,
        notes: 'May be included in dealer quote or itemized separately.',
      },
      {
        id: 'es-car-new-dgt-registration',
        name: 'DGT Registration Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 99.77 },
      },
      {
        id: 'es-car-new-iedmt',
        name: 'IEDMT (CO₂ Registration Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: {
          kind: 'tiered_percent',
          inputKey: 'co2Gkm',
          tiers: [
            { max: 120, ratePercent: 0 },
            { min: 121, max: 159, ratePercent: 4.75 },
            { min: 160, max: 199, ratePercent: 9.75 },
            { min: 200, ratePercent: 14.75 },
          ],
        },
        notes: 'Scale by CO₂ g/km: ≤120 → 0%; 121–159 → 4.75%; 160–199 → 9.75%; ≥200 → 14.75%.',
      },
    ],
  },
}

/** Germany — national averages suitable for turnkey estimates. */
export const GERMANY_CALCULATOR_CONFIG: CountryCalculatorConfig = {
  countryCode: 'DE',
  countryName: 'Germany',
  currency: 'EUR',
  realEstate: {
    notes: 'Legal/Admin support is optional and not priced in this baseline; add a rule when a fixed fee is known.',
    resale: [
      {
        id: 'de-re-resale-grunderwerbsteuer',
        name: 'Grunderwerbsteuer (Transfer Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 6 },
        notes: 'Average across Länder (~3.5%–6.5%); 6% used as planning baseline.',
      },
      {
        id: 'de-re-resale-notary-registry',
        name: 'Notary + Land Registry',
        type: 'legal',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 2 },
      },
    ],
    new_build: [
      {
        id: 'de-re-new-grunderwerbsteuer',
        name: 'Grunderwerbsteuer (Transfer Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 6 },
        notes: 'Same transfer-tax baseline as resale for planning estimates.',
      },
      {
        id: 'de-re-new-notary-registry',
        name: 'Notary + Land Registry',
        type: 'legal',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 2 },
      },
    ],
  },
  cars: {
    used: [
      {
        id: 'de-car-used-transfer',
        name: 'Vehicle Transfer Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 40 },
      },
    ],
    new: [
      {
        id: 'de-car-new-vat',
        name: 'VAT (MwSt)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 19 },
        oftenIncludedInBasePrice: true,
      },
      {
        id: 'de-car-new-registration',
        name: 'Registration Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 50 },
      },
    ],
  },
}

/** Poland — residential new-build VAT assumes up to 150 m². */
export const POLAND_CALCULATOR_CONFIG: CountryCalculatorConfig = {
  countryCode: 'PL',
  countryName: 'Poland',
  currency: 'PLN',
  notes: 'New-build residential VAT 8% assumes dwelling up to 150 m².',
  realEstate: {
    resale: [
      {
        id: 'pl-re-resale-pcc',
        name: 'PCC (Civil Law Transaction Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 2 },
      },
      {
        id: 'pl-re-resale-notary',
        name: 'Notary',
        type: 'legal',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 1 },
        notes: 'Approximate notary share ~1% of transaction value.',
      },
      {
        id: 'pl-re-resale-registry',
        name: 'Land Registry Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 200 },
      },
    ],
    new_build: [
      {
        id: 'pl-re-new-vat',
        name: 'VAT (residential ≤150 m²)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 8 },
        oftenIncludedInBasePrice: true,
        notes: 'Preferential 8% VAT for residential units up to 150 m².',
      },
      {
        id: 'pl-re-new-notary',
        name: 'Notary',
        type: 'legal',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 1 },
      },
      {
        id: 'pl-re-new-registry',
        name: 'Land Registry Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 200 },
      },
    ],
  },
  cars: {
    notes: 'New-car turnkey rules not in baseline preset; extend `new` when market data is confirmed.',
    used: [
      {
        id: 'pl-car-used-pcc',
        name: 'PCC (Civil Law Transaction Tax)',
        type: 'tax',
        isMandatory: true,
        calculation: { kind: 'percent_of_base', ratePercent: 2 },
      },
      {
        id: 'pl-car-used-registration',
        name: 'Registration Fee',
        type: 'fee',
        isMandatory: true,
        calculation: { kind: 'fixed', amount: 160 },
      },
    ],
    new: [],
  },
}

/**
 * Registry of all purchase-cost country configs.
 * Extend by adding another `CountryCalculatorConfig` and a key here.
 */
export const CALCULATOR_RULES: CalculatorRulesMap = {
  ES: SPAIN_CALCULATOR_CONFIG,
  DE: GERMANY_CALCULATOR_CONFIG,
  PL: POLAND_CALCULATOR_CONFIG,
}

export const CALCULATOR_COUNTRY_CODES = Object.keys(CALCULATOR_RULES) as Array<
  keyof typeof CALCULATOR_RULES
>

export function getCalculatorCountryConfig(
  countryCode: string,
): CountryCalculatorConfig | undefined {
  return CALCULATOR_RULES[countryCode.toUpperCase()]
}

export function listCalculatorCountries(): CountryCalculatorConfig[] {
  return Object.values(CALCULATOR_RULES)
}
