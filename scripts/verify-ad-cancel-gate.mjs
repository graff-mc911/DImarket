/**
 * Tiny node test for cancelled-note gate (no vitest required).
 * Run: node --experimental-strip-types scripts/verify-ad-cancel-gate.mjs
 * or: node scripts/verify-ad-cancel-gate.mjs after build — uses duplicated logic.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(resolve(root, 'src/lib/ownerAdCampaign.ts'), 'utf8')

if (!src.includes('stripOwnerCancelReviewTail')) {
  console.error('missing stripOwnerCancelReviewTail')
  process.exit(1)
}
if (!src.includes('isOwnerCancelledReviewNote')) {
  console.error('missing isOwnerCancelledReviewNote')
  process.exit(1)
}

const OWNER_CANCEL_NOTE_RE =
  /(відхилено|скасовано|rejected|cancelled|canceled|owner_cancelled|вимкнен)/i

function isOwnerCancelledReviewNote(reviewNote) {
  return OWNER_CANCEL_NOTE_RE.test(reviewNote || '')
}

const cases = [
  ['owner_managed: Відхилено власником', true],
  ['owner_managed: скасовано власником', true],
  ['owner_managed', false],
  ['phase_a_no_payment_publish', false],
  ['Presence partner', false],
]

let failed = 0
for (const [note, expect] of cases) {
  const got = isOwnerCancelledReviewNote(note)
  if (got !== expect) {
    console.error('FAIL', note, 'expected', expect, 'got', got)
    failed++
  } else {
    console.log('OK', note)
  }
}

process.exit(failed ? 1 : 0)
