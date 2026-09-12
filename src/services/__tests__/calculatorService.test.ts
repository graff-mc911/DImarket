/**
 * Unit tests for the purchase cost calculator engine.
 * Run: npx tsx --test src/services/__tests__/calculatorService.test.ts
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateCarCost,
  calculateRealEstateCost,
  spainCarRegistrationTaxRate,
} from '../calculatorService.ts'

describe('calculateRealEstateCost — Spain', () => {
  it('resale at €200,000 → taxes/fees ≈ €22,000, total ≈ €222,000', () => {
    const result = calculateRealEstateCost({
      countryCode: 'ES',
      basePrice: 200_000,
      condition: 'resale',
    })

    // Spec formula: ITP 9% + notary 1200 + registry 500 + legal 2000 = 21,700
    assert.equal(result.basePrice, 200_000)
    assert.equal(result.totalTaxesAndFees, 21_700)
    assert.equal(result.finalTotalPrice, 221_700)

    // Acceptance band from product brief (~€22k / ~€222k)
    assert.ok(Math.abs(result.totalTaxesAndFees - 22_000) <= 500)
    assert.ok(Math.abs(result.finalTotalPrice - 222_000) <= 500)

    const itp = result.items.find((i) => i.id === 'es-re-resale-itp')
    assert.equal(itp?.amount, 18_000)
    assert.equal(itp?.ratePercent, 9)
  })

  it('resale notary is €900 when basePrice ≤ €100,000', () => {
    const result = calculateRealEstateCost({
      countryCode: 'es',
      basePrice: 100_000,
      condition: 'resale',
    })
    const notary = result.items.find((i) => i.id === 'es-re-resale-notary')
    assert.equal(notary?.amount, 900)
    // 9000 + 900 + 500 + 2000 = 12_400
    assert.equal(result.totalTaxesAndFees, 12_400)
  })

  it('resale respects customLegalFee', () => {
    const result = calculateRealEstateCost({
      countryCode: 'ES',
      basePrice: 200_000,
      condition: 'resale',
      customLegalFee: 2500,
    })
    assert.equal(result.totalTaxesAndFees, 22_200)
  })

  it('new build at €200,000 → taxes €22,800 + fees €4,000, total €226,800', () => {
    const result = calculateRealEstateCost({
      countryCode: 'ES',
      basePrice: 200_000,
      condition: 'new_build',
    })

    const iva = result.items.find((i) => i.id === 'es-re-new-iva')
    const ajd = result.items.find((i) => i.id === 'es-re-new-ajd')
    const combined = result.items.find((i) => i.id === 'es-re-new-notary-registry-legal')

    assert.equal(iva?.amount, 20_000)
    assert.equal(ajd?.amount, 2_800)
    assert.equal(combined?.amount, 4_000)

    const totalTaxes = (iva?.amount ?? 0) + (ajd?.amount ?? 0)
    assert.equal(totalTaxes, 22_800)
    assert.equal(combined?.amount, 4_000)
    assert.equal(result.totalTaxesAndFees, 26_800)
    assert.equal(result.finalTotalPrice, 226_800)
    assert.ok(result.finalTotalPrice >= 226_800 && result.finalTotalPrice <= 227_000)
  })
})

describe('calculateRealEstateCost — other countries (config fallback)', () => {
  it('Germany resale uses Grunderwerbsteuer 6% + notary/registry 2%', () => {
    const result = calculateRealEstateCost({
      countryCode: 'DE',
      basePrice: 200_000,
      condition: 'resale',
    })
    assert.equal(result.totalTaxesAndFees, 16_000)
    assert.equal(result.finalTotalPrice, 216_000)
  })

  it('Poland resale uses PCC 2% + notary ~1% + registry 200 PLN', () => {
    const result = calculateRealEstateCost({
      countryCode: 'PL',
      basePrice: 500_000,
      condition: 'resale',
    })
    // 10_000 + 5_000 + 200 = 15_200
    assert.equal(result.totalTaxesAndFees, 15_200)
  })

  it('throws for unsupported country', () => {
    assert.throws(
      () =>
        calculateRealEstateCost({
          countryCode: 'FR',
          basePrice: 100_000,
          condition: 'resale',
        }),
      /No real-estate calculator rules/,
    )
  })
})

describe('calculateCarCost — Spain used', () => {
  it('applies ITP 8%, DGT €55.70, Gestoria €100', () => {
    const result = calculateCarCost({
      countryCode: 'ES',
      basePrice: 10_000,
      condition: 'used',
    })
    assert.equal(result.items.find((i) => i.id === 'es-car-used-itp')?.amount, 800)
    assert.equal(result.items.find((i) => i.id === 'es-car-used-dgt-transfer')?.amount, 55.7)
    assert.equal(result.items.find((i) => i.id === 'es-car-used-gestoria')?.amount, 100)
    assert.equal(result.totalTaxesAndFees, 955.7)
    assert.equal(result.finalTotalPrice, 10_955.7)
  })

  it('respects customGestoriaFee', () => {
    const result = calculateCarCost({
      countryCode: 'ES',
      basePrice: 10_000,
      condition: 'used',
      customGestoriaFee: 150,
    })
    assert.equal(result.totalTaxesAndFees, 1005.7)
  })
})

describe('calculateCarCost — Spain new', () => {
  it('CO₂ brackets drive IEDMT rate', () => {
    assert.equal(spainCarRegistrationTaxRate(100), 0)
    assert.equal(spainCarRegistrationTaxRate(120), 0)
    assert.equal(spainCarRegistrationTaxRate(121), 4.75)
    assert.equal(spainCarRegistrationTaxRate(159), 4.75)
    assert.equal(spainCarRegistrationTaxRate(160), 9.75)
    assert.equal(spainCarRegistrationTaxRate(199), 9.75)
    assert.equal(spainCarRegistrationTaxRate(200), 14.75)
  })

  it('new car ≤120 g/km → 0% tax + DGT €99.77 + plates €120', () => {
    const result = calculateCarCost({
      countryCode: 'ES',
      basePrice: 30_000,
      condition: 'new',
      co2Emissions: 110,
    })
    assert.equal(result.items.find((i) => i.id === 'es-car-new-iedmt')?.amount, 0)
    assert.equal(result.items.find((i) => i.id === 'es-car-new-dgt-registration')?.amount, 99.77)
    assert.equal(result.items.find((i) => i.id === 'es-car-new-plates-docs')?.amount, 120)
    assert.equal(result.totalTaxesAndFees, 219.77)
    assert.equal(result.finalTotalPrice, 30_219.77)
  })

  it('new car 150 g/km → 4.75% IEDMT', () => {
    const result = calculateCarCost({
      countryCode: 'ES',
      basePrice: 30_000,
      condition: 'new',
      co2Emissions: 150,
    })
    assert.equal(result.items.find((i) => i.id === 'es-car-new-iedmt')?.amount, 1_425)
    assert.equal(result.totalTaxesAndFees, 1_644.77)
  })

  it('new car 180 g/km → 9.75% IEDMT', () => {
    const result = calculateCarCost({
      countryCode: 'ES',
      basePrice: 20_000,
      condition: 'new',
      co2Emissions: 180,
    })
    assert.equal(result.items.find((i) => i.id === 'es-car-new-iedmt')?.ratePercent, 9.75)
    assert.equal(result.items.find((i) => i.id === 'es-car-new-iedmt')?.amount, 1_950)
  })

  it('new car ≥200 g/km → 14.75% IEDMT', () => {
    const result = calculateCarCost({
      countryCode: 'ES',
      basePrice: 40_000,
      condition: 'new',
      co2Emissions: 220,
    })
    assert.equal(result.items.find((i) => i.id === 'es-car-new-iedmt')?.amount, 5_900)
    assert.equal(result.totalTaxesAndFees, 6_119.77)
  })
})

describe('calculateCarCost — other countries (config fallback)', () => {
  it('Germany used is a flat €40 transfer fee', () => {
    const result = calculateCarCost({
      countryCode: 'DE',
      basePrice: 15_000,
      condition: 'used',
    })
    assert.equal(result.totalTaxesAndFees, 40)
    assert.equal(result.finalTotalPrice, 15_040)
  })
})
