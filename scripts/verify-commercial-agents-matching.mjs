/**
 * Deterministic matching smoke for Commercial Agents (no network / no TS loader).
 */
import assert from 'node:assert/strict'

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}
function norm(s) {
  return (s ?? '').trim().toLowerCase()
}
function overlapScore(a, b) {
  const left = new Set((a ?? []).map(norm).filter(Boolean))
  const right = new Set((b ?? []).map(norm).filter(Boolean))
  if (left.size === 0 || right.size === 0) return 40
  let hits = 0
  for (const x of left) if (right.has(x)) hits += 1
  return clamp(Math.round((hits / Math.min(left.size, right.size)) * 100))
}
function countryScore(a, b, listB) {
  const ca = norm(a)
  if (!ca) return 35
  if (ca && norm(b) === ca) return 100
  if (listB?.some((c) => norm(c) === ca)) return 100
  return 20
}

const manufacturer = {
  country: 'Spain',
  categories: ['hvac', 'flooring'],
  countries_available: ['Spain', 'Portugal'],
  languages: ['ES', 'EN'],
  minimum_experience_years: 5,
}
const agent = {
  country: 'Spain',
  categories: ['hvac'],
  languages: ['ES', 'EN'],
  years_experience: 8,
  service_regions: ['Spain'],
}

const country = countryScore(agent.country, manufacturer.country, manufacturer.countries_available)
const category = overlapScore(agent.categories, manufacturer.categories)
const language = overlapScore(agent.languages, manufacturer.languages)
assert.equal(country, 100)
assert.ok(category >= 50)
assert.equal(language, 100)

const score = clamp(Math.round(country * 0.4 + category * 0.3 + language * 0.3))
assert.ok(score >= 70, `expected strong match, got ${score}`)

console.log('ok commercial agents matching smoke score', score)
console.log('All commercial agents matching checks passed.')
