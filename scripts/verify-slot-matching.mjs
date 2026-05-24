/**
 * Перевірка: кампанія з одним гранульованим слотом не потрапляє в сусідні.
 * Запуск: node scripts/verify-slot-matching.mjs
 */

function isGranularSlotId(id) {
  return id.includes('_side_') || id.includes('_center') || id.includes('_mob_')
}

function getPl(c) {
  const a = (c.placements || []).filter(Boolean)
  return a.length ? a : [c.placement]
}

function campaignUsesGranular(c) {
  return getPl(c).some(isGranularSlotId)
}

function campaignMatchesSlot(campaign, slot) {
  const placements = getPl(campaign)
  if (placements.includes(slot)) return true
  if (campaignUsesGranular(campaign)) return false
  return placements.includes('sidebar') && slot.includes('_side_')
}

const campaign = { placement: 'home', placements: ['home_side_r1'] }

const cases = [
  ['home_side_r1', true],
  ['home_side_r2', false],
  ['home_side_l1', false],
  ['listings_side_r1', false],
  ['home_mob_inline_1', false],
  ['home_center', false],
]

let failed = 0
for (const [slot, expected] of cases) {
  const got = campaignMatchesSlot(campaign, slot)
  if (got !== expected) {
    console.error('FAIL', slot, 'expected', expected, 'got', got)
    failed++
  }
}

if (failed > 0) {
  process.exit(1)
}
console.log('OK: granular slot matching is strict (' + cases.length + ' cases)')
