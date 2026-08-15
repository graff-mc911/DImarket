/**
 * Unit checks for public profile visibility / Top Masters eligibility.
 * node scripts/verify-public-profile-visibility.mjs
 */
import assert from 'assert'

function isLikelyQaOrTestProfile(profile) {
  const name = (profile.full_name || '').trim()
  const email = (profile.email || '').trim().toLowerCase()
  if (email.includes('dimarket-audit') || email.includes('dimarket-test') || email.includes('@dimarket-audit.')) {
    return true
  }
  if (/@(example\.com|test\.invalid|mailinator\.com)$/i.test(email)) return true
  if (!name) return false
  if (/^(test|tester|demo|demo user|test user)$/i.test(name)) return true
  if (/^qa([\s_\-.]|$)/i.test(name)) return true
  if (/^side-ads-e2e-/i.test(name)) return true
  if (/^investor\s+(ad|demo)/i.test(name)) return true
  if (/\bqa[\s_\-]*(smoke|chat|master|e2e|admin|client|company|mfr|mfg|pv|advertiser|final|stranger|audit|self)\b/i.test(name)) {
    return true
  }
  return false
}

function isProfilePubliclyListable(profile) {
  if (profile.deleted_at || profile.hidden_at) return false
  if (isLikelyQaOrTestProfile(profile)) return false
  if (profile.is_professional !== true) return false
  return true
}

function sortProfilesForPublicDiscovery(rows) {
  return [...rows].sort((a, b) => {
    const ap = Number(a.ranking_priority ?? 0)
    const bp = Number(b.ranking_priority ?? 0)
    if (bp !== ap) return bp - ap
    const af = a.is_featured ? 1 : 0
    const bf = b.is_featured ? 1 : 0
    if (bf !== af) return bf - af
    return (b.rating ?? 0) - (a.rating ?? 0)
  })
}

assert.equal(isProfilePubliclyListable({ full_name: 'QA Smoke professional', is_professional: true }), false)
assert.equal(isProfilePubliclyListable({ full_name: 'QA Chat Pro', is_professional: true }), false)
assert.equal(isProfilePubliclyListable({ full_name: 'Test', is_professional: true }), false)
assert.equal(isProfilePubliclyListable({ full_name: 'Investor Ad Test', is_professional: true }), false)
assert.equal(isProfilePubliclyListable({ full_name: 'Майстер-Львів', is_professional: true }), true)
assert.equal(
  isProfilePubliclyListable({ full_name: 'Real Pro', is_professional: true, hidden_at: '2026-01-01' }),
  false,
)
assert.equal(
  isProfilePubliclyListable({ full_name: 'Real Pro', is_professional: true, deleted_at: '2026-01-01' }),
  false,
)

const sorted = sortProfilesForPublicDiscovery([
  { full_name: 'a', ranking_priority: 0, rating: 5, is_featured: false },
  { full_name: 'b', ranking_priority: 10, rating: 0, is_featured: false },
  { full_name: 'c', ranking_priority: 0, rating: 4, is_featured: true },
])
assert.deepEqual(
  sorted.map((r) => r.full_name),
  ['b', 'c', 'a'],
)

console.log('✓ public profile visibility checks passed')
