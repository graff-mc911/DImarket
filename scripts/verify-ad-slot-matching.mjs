/**
 * Перевірка: гранульовані кампанії показуються лише на куплених слотах.
 * Запуск: node scripts/verify-ad-slot-matching.mjs
 */
import assert from 'node:assert/strict'

const granularCampaign = (id, slots) => ({
  id,
  title: `Campaign ${id}`,
  placement: 'sidebar',
  placements: slots,
  status: 'active',
  price_paid: 10,
})

const legacyCampaign = (id, placement) => ({
  id,
  title: `Legacy ${id}`,
  placement,
  placements: [placement],
  status: 'active',
  price_paid: 5,
})

// Inline minimal copies of the logic under test (mirrors adCampaigns.ts)
function getCampaignPlacements(campaign) {
  const fromArray = (campaign.placements || []).filter(Boolean)
  if (fromArray.length > 0) return fromArray
  return [campaign.placement]
}

function isGranularSlotId(id) {
  return /_(side_[lr][1-4]|center|mob_)/.test(id)
}

function campaignUsesGranularPlacements(campaign) {
  return getCampaignPlacements(campaign).some(isGranularSlotId)
}

function sideSlotId(page, side, index) {
  const letter = side === 'left' ? 'l' : 'r'
  return `${page}_side_${letter}${index}`
}

function fillSideStack(all, side, count, pageKey) {
  const out = Array.from({ length: count }, () => null)
  for (let i = 0; i < count; i++) {
    const slotId = sideSlotId(pageKey, side, i + 1)
    const exactOwner = all.find((c) => getCampaignPlacements(c).includes(slotId))
    if (exactOwner) {
      out[i] = exactOwner
    }
  }
  return out
}

function pickSideStacksForPage(all, count, page = 'home') {
  const pageKey = page
  return {
    right: fillSideStack(all, 'right', count, pageKey),
    left: fillSideStack(all, 'left', count, pageKey),
  }
}

// --- tests ---

const cHomeR1 = granularCampaign('home-r1', ['home_side_r1'])
const cListingsR1 = granularCampaign('list-r1', ['listings_side_r1'])
const cProfL1 = granularCampaign('prof-l1', ['professionals_side_l1'])

const homeStacks = pickSideStacksForPage([cHomeR1, cListingsR1, cProfL1], 4, 'home')
assert.equal(homeStacks.right[0]?.id, 'home-r1', 'home_side_r1 only on home R1')
assert.equal(homeStacks.right[1], null, 'home R2 empty')
assert.equal(homeStacks.right[2], null, 'home R3 empty')
assert.equal(homeStacks.right[3], null, 'home R4 empty')
assert.deepEqual(
  homeStacks.left.map((c) => c?.id ?? null),
  [null, null, null, null],
  'left column empty when only right slot bought',
)

const listingsStacks = pickSideStacksForPage([cHomeR1, cListingsR1], 4, 'listings')
assert.equal(listingsStacks.right[0]?.id, 'list-r1', 'listings campaign only on listings page')
assert.equal(listingsStacks.right[1], null, 'no hash fill on listings R2')

const multi = pickSideStacksForPage(
  [granularCampaign('a', ['home_side_r1']), granularCampaign('b', ['home_side_r3'])],
  4,
  'home',
)
assert.equal(multi.right[0]?.id, 'a')
assert.equal(multi.right[1], null)
assert.equal(multi.right[2]?.id, 'b')
assert.equal(multi.right[3], null)

assert.ok(!campaignUsesGranularPlacements(legacyCampaign('leg', 'sidebar')))
assert.ok(campaignUsesGranularPlacements(cHomeR1))

console.log('verify-ad-slot-matching: OK')
