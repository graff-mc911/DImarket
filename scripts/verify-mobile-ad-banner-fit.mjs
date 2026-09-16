/**
 * Smoke checks for mobile/leaderboard fluid banner helpers.
 * Run: node scripts/verify-mobile-ad-banner-fit.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const display = readFileSync('src/components/AdMediaDisplay.tsx', 'utf8')
const style = readFileSync('src/lib/adMediaStyle.ts', 'utf8')
const css = readFileSync('src/index.css', 'utf8')
const overlay = readFileSync('src/components/AdOverlayCard.tsx', 'utf8')
const slotDisplay = readFileSync('src/lib/adSlotDisplay.ts', 'utf8')

assert.match(style, /export function isFluidBannerLayout/)
assert.match(style, /export function frameIsCustomized/)
assert.match(display, /ad-slot-fluid-media/)
assert.match(display, /fillBox/)
assert.match(display, /AD_BANNER_LAYOUT_META/)
assert.match(css, /\.ad-slot-fluid-media/)
assert.match(css, /ad-slot-mobile-inline__media/)
assert.doesNotMatch(css, /ad-mobile-inline-image-h, 4\.25rem/)
assert.match(overlay, /ad-slot-mobile-inline__media ad-slot-fluid-media/)
assert.match(slotDisplay, /mobile-inline[\s\S]*height: 'auto'/)

console.log('verify-mobile-ad-banner-fit: OK')
