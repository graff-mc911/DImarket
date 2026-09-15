/**
 * Node smoke tests for ad draft persistence helpers (no DOM React).
 * Run: node --experimental-strip-types scripts/verify-ad-form-persist.mjs
 * (or via vite-node if available)
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const advertising = readFileSync('src/pages/Advertising.tsx', 'utf8')
const owner = readFileSync('src/components/OwnerAdManager.tsx', 'utf8')
const dash = readFileSync('src/pages/Dashboard.tsx', 'utf8')
const draftLib = readFileSync('src/lib/adCampaignDraft.ts', 'utf8')
const ownerLib = readFileSync('src/lib/ownerAdFormDraft.ts', 'utf8')

assert.match(advertising, /queueMicrotask/)
assert.match(advertising, /pagehide/)
assert.match(advertising, /persistDraftSnapshot/)
assert.match(draftLib, /selectedCountries\.length/)
assert.match(owner, /writeOwnerAdFormDraft/)
assert.match(owner, /owner-ad-form/)
assert.match(owner, /pagehide/)
assert.match(ownerLib, /dimarket_owner_ad_form_draft_v1/)
assert.match(dash, /user\?\.id/)
assert.match(dash, /soft: Boolean\(profile\)/)

console.log('verify-ad-form-persist: OK')
