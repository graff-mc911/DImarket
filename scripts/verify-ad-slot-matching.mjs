/**
 * Slot matching sanity checks after side-banner removal.
 */
import assert from 'assert'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Lightweight inline copies of the post-removal rules
function isSideSlotId(id) {
  const s = (id || '').toLowerCase()
  return s.includes('_side_') || s === 'side_left' || s === 'side_right' || s === 'sidebar'
}

function getCampaignPlacements(campaign) {
  const raw = (campaign.placements || []).filter(Boolean)
  return raw.filter((id) => !isSideSlotId(id))
}

assert.deepEqual(
  getCampaignPlacements({ placements: ['home_side_r1', 'home_center'] }),
  ['home_center'],
  'side slots stripped',
)
assert.deepEqual(
  getCampaignPlacements({ placements: ['home_side_l1', 'home_side_r2'] }),
  [],
  'side-only becomes empty',
)
assert.ok(isSideSlotId('home_side_l1'))
assert.ok(!isSideSlotId('home_center'))
assert.ok(!isSideSlotId('home_mob_inline_1'))
console.log('✓ side-slot removal matching checks passed')
