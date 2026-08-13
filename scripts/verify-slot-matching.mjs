/**
 * Перевірка: кампанія з одним гранульованим слотом не потрапляє в сусідні.
 * Side slots never match after removal.
 * Запуск: node scripts/verify-slot-matching.mjs
 */

function isSideSlotId(id) {
  const s = String(id || '').toLowerCase()
  return s.includes('_side_') || s === 'sidebar' || s === 'side_left' || s === 'side_right'
}

function isGranularSlotId(id) {
  return id.includes('_center') || id.includes('_mob_')
}

function getPl(c) {
  const a = (c.placements || []).filter(Boolean).filter((id) => !isSideSlotId(id))
  return a.length ? a : []
}

function campaignUsesGranular(c) {
  return getPl(c).some(isGranularSlotId)
}

function campaignMatchesSlot(campaign, slot) {
  if (isSideSlotId(slot)) return false
  const placements = getPl(campaign)
  if (placements.includes(slot)) return true
  if (campaignUsesGranular(campaign)) return false
  return false
}

const campaign = { placement: 'home', placements: ['home_center'] }
const sideOnly = { placement: 'sidebar', placements: ['home_side_l1', 'sidebar'] }

const cases = [
  [campaign, 'home_center', true],
  [campaign, 'home_mob_inline_2', false],
  [campaign, 'listings_mob_inline_1', false],
  [campaign, 'home_mob_inline_1', false],
  [campaign, 'home_side_l1', false],
  [sideOnly, 'home_center', false],
  [sideOnly, 'home_side_l1', false],
  [sideOnly, 'home_mob_inline_1', false],
]

let failed = 0
for (const [c, slot, expected] of cases) {
  const got = campaignMatchesSlot(c, slot)
  if (got !== expected) {
    console.error('FAIL', slot, 'expected', expected, 'got', got)
    failed++
  }
}

if (failed > 0) {
  process.exit(1)
}
console.log('OK: granular slot matching is strict (' + cases.length + ' cases); side slots never match')
