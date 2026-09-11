/**
 * Quote-flow area input acceptance checks.
 * Run: npx --yes tsx scripts/verify-estimator-area.ts
 */
import assert from 'node:assert/strict'
import {
  EMPTY_BZ_QUOTE,
  parseAreaSqmInput,
  screensForQuoteType,
  validateQuoteScreen,
} from '../src/lib/buildzoomQuoteFlow.ts'

assert.equal(parseAreaSqmInput('75'), 75)
assert.equal(parseAreaSqmInput('75,5'), 75.5)
assert.equal(parseAreaSqmInput('0'), null)
assert.equal(parseAreaSqmInput(''), null)
assert.equal(parseAreaSqmInput(-3), null)

const remodel = screensForQuoteType('renovation')
assert.ok(remodel.includes('area'), 'remodel has area screen')
assert.ok(remodel.indexOf('area') < remodel.indexOf('budget'), 'area before budget')

const home = screensForQuoteType('house_renovation')
assert.ok(home.includes('area'))
assert.ok(home.indexOf('area') < home.indexOf('budget'))

const neu = screensForQuoteType('new_construction')
assert.ok(neu.includes('area'))
assert.ok(neu.indexOf('area') < neu.indexOf('budget'))

assert.equal(
  validateQuoteScreen('area', { ...EMPTY_BZ_QUOTE, areaSqm: null }),
  'costEstimator.quote.errors.area',
)
assert.equal(validateQuoteScreen('area', { ...EMPTY_BZ_QUOTE, areaSqm: 80 }), null)
assert.equal(
  validateQuoteScreen('area', { ...EMPTY_BZ_QUOTE, areaSqm: 60_000 }),
  'costEstimator.quote.errors.areaTooLarge',
)

console.log('estimator area quote-flow ok')
