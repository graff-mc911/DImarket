#!/usr/bin/env node
/**
 * Asserts Dimarket quote screen lists match BuildZoom
 * projectFormScreenService.setScreensByVersion (kt / Zs / vJ).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(root, '../src/lib/buildzoomQuoteFlow.ts'), 'utf8')

function extractList(name) {
  const re = new RegExp(`${name}:\\s*\\[([\\s\\S]*?)\\]`, 'm')
  const m = src.match(re)
  if (!m) throw new Error(`Missing ${name} screen list`)
  return [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1])
}

const remodel = extractList('remodel')
const homeAddition = extractList('home_addition')
const newConstruction = extractList('new_construction')

const expected = {
  remodel: [
    'title',
    'urgency',
    'property',
    'email',
    'phone',
    'name',
    'bids',
    'location',
    'relationship',
    'budget',
    'description',
    'password',
  ],
  home_addition: [
    'title',
    'urgency',
    'property',
    'email',
    'phone',
    'name',
    'bids',
    'location',
    'design',
    'budget',
    'description',
    'password',
  ],
  new_construction: [
    'title',
    'urgency',
    'land',
    'email',
    'phone',
    'name',
    'bids',
    'location',
    'design',
    'budget',
    'description',
    'password',
  ],
}

function assertEqual(label, actual, want) {
  const a = actual.join(',')
  const b = want.join(',')
  if (a !== b) {
    throw new Error(`${label} mismatch\n  got:  ${a}\n  want: ${b}`)
  }
}

assertEqual('remodel/kt', remodel, expected.remodel)
assertEqual('home_addition/Zs', homeAddition, expected.home_addition)
assertEqual('new_construction/vJ', newConstruction, expected.new_construction)

if (remodel.includes('land')) throw new Error('remodel must not include land')
if (newConstruction.includes('property')) throw new Error('new construction must not include property-type')
if (newConstruction.includes('relationship')) {
  throw new Error('new construction must use design-status, not property-relationship')
}
if (homeAddition.includes('relationship')) {
  throw new Error('home addition must use design-status, not property-relationship')
}
if (remodel.includes('design')) {
  throw new Error('remodel must use property-relationship, not design-status')
}

const afterUrgency = {
  remodel: remodel[remodel.indexOf('urgency') + 1],
  home_addition: homeAddition[homeAddition.indexOf('urgency') + 1],
  new_construction: newConstruction[newConstruction.indexOf('urgency') + 1],
}
if (afterUrgency.remodel !== 'property') throw new Error('remodel after urgency must be property')
if (afterUrgency.home_addition !== 'property') throw new Error('addition after urgency must be property')
if (afterUrgency.new_construction !== 'land') throw new Error('new construction after urgency must be land')

const bidsIndex = remodel.indexOf('bids')
if (bidsIndex !== remodel.indexOf('name') + 1) {
  throw new Error('bids must come after name, not after urgency')
}

console.log('BuildZoom quote screen lists match kt / Zs / vJ')
console.log('  remodel', remodel.join(' → '))
console.log('  addition', homeAddition.join(' → '))
console.log('  new home', newConstruction.join(' → '))
