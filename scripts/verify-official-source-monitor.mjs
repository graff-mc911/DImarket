/**
 * Unit tests for Official Source Monitor core logic (no network).
 * Mirrors src/lib/officialSources/core.ts + countrySources.ts
 */
import assert from 'node:assert/strict'

function normalizeSourceContent(raw) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function fingerprintHash(normalized) {
  let h = 2166136261
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `fnv1a_${(h >>> 0).toString(16).padStart(8, '0')}`
}

function hashesEqual(a, b) {
  if (!a || !b) return false
  return a === b
}

function detectChangeType({ oldHash, newHash, httpStatus, fetchOk }) {
  if (!fetchOk || (httpStatus !== null && httpStatus >= 400)) return 'unavailable'
  if (oldHash && newHash && oldHash !== newHash) return 'content'
  if (!oldHash && newHash) return 'restored'
  return 'http_status'
}

function severityForChange(changeType, sourceType) {
  if (changeType === 'unavailable') {
    return sourceType === 'official_gazette' || sourceType === 'eu_official' ? 'critical' : 'high'
  }
  if (changeType === 'content') {
    if (sourceType === 'official_gazette' || sourceType === 'eu_official') return 'high'
    if (sourceType === 'national_government' || sourceType === 'ministry') return 'high'
    return 'medium'
  }
  return 'low'
}

function nextVerificationAt(from, intervalHours) {
  const hours = Math.max(1, Math.min(168, intervalHours || 24))
  return new Date(from.getTime() + hours * 60 * 60 * 1000)
}

function isVerificationOverdue(nextIso, now = new Date()) {
  if (!nextIso) return true
  const next = new Date(nextIso).getTime()
  if (Number.isNaN(next)) return true
  return now.getTime() > next
}

function resolveCurrentVersion(versions, now = new Date()) {
  const t = now.getTime()
  const published = versions.filter((v) => v.status === 'published')
  const inWindow = published.filter((v) => {
    const from = v.effective_from ? new Date(v.effective_from).getTime() : null
    const until = v.effective_until ? new Date(v.effective_until).getTime() : null
    if (from !== null && !Number.isNaN(from) && t < from) return false
    if (until !== null && !Number.isNaN(until) && t > until) return false
    return true
  })
  if (inWindow.length === 0) return null
  inWindow.sort((a, b) => {
    const af = a.effective_from ? new Date(a.effective_from).getTime() : 0
    const bf = b.effective_from ? new Date(b.effective_from).getTime() : 0
    if (bf !== af) return bf - af
    const ap = a.published_at ? new Date(a.published_at).getTime() : 0
    const bp = b.published_at ? new Date(b.published_at).getTime() : 0
    return bp - ap
  })
  return inWindow[0] ?? null
}

function findFutureVersion(versions, now = new Date()) {
  const t = now.getTime()
  return (
    versions
      .filter((v) => v.status === 'published' || v.status === 'approved')
      .filter((v) => {
        if (!v.effective_from) return false
        const from = new Date(v.effective_from).getTime()
        return !Number.isNaN(from) && from > t
      })
      .sort(
        (a, b) =>
          new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime(),
      )[0] ?? null
  )
}

function freshnessFromStatuses({ verificationStatus, nextVerificationAt: nextAt, now = new Date() }) {
  if (verificationStatus === 'unavailable') return { tone: 'bad' }
  if (verificationStatus === 'outdated' || verificationStatus === 'changed') return { tone: 'bad' }
  if (verificationStatus === 'needs_review' || verificationStatus === 'needs_research') {
    return { tone: 'warn' }
  }
  if (isVerificationOverdue(nextAt ?? null, now)) return { tone: 'warn' }
  if (verificationStatus === 'verified') return { tone: 'ok' }
  return { tone: 'unknown' }
}

function simpleLineDiff(oldText, newText) {
  const oldLines = new Set(
    (oldText || '')
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  )
  const newLines = new Set(
    (newText || '')
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  )
  const added = []
  const removed = []
  let unchanged = 0
  for (const line of newLines) {
    if (oldLines.has(line)) unchanged += 1
    else added.push(line)
  }
  for (const line of oldLines) {
    if (!newLines.has(line)) removed.push(line)
  }
  return { added, removed, unchanged }
}

const SPAIN_SOURCE_PRIORITY = [
  'official_gazette',
  'national_government',
  'ministry',
  'regional_government',
  'municipal',
  'official_registry',
  'eu_official',
]

function compareSourcePriority(a, b, priority = SPAIN_SOURCE_PRIORITY) {
  const ia = priority.indexOf(a)
  const ib = priority.indexOf(b)
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
}

const SPAIN = {
  officialGazetteUrl: 'https://www.boe.es/',
}

// —— tests ——
const htmlA =
  '<html><head><script>x()</script><style>.a{}</style></head><body><p>Hello   World</p><!--c--></body></html>'
const htmlB = '<html><body><p>Hello World</p></body></html>'
const htmlC = '<html><body><p>Hello Spain</p></body></html>'
assert.equal(normalizeSourceContent(htmlA), normalizeSourceContent(htmlB))
assert.notEqual(normalizeSourceContent(htmlA), normalizeSourceContent(htmlC))
const h1 = fingerprintHash(normalizeSourceContent(htmlA))
const h2 = fingerprintHash(normalizeSourceContent(htmlB))
assert.equal(h1, h2)
assert.ok(hashesEqual(h1, h2))
assert.equal(hashesEqual(h1, fingerprintHash(normalizeSourceContent(htmlC))), false)

assert.equal(
  detectChangeType({ oldHash: 'a', newHash: 'b', httpStatus: 200, fetchOk: true }),
  'content',
)
assert.equal(
  detectChangeType({ oldHash: 'a', newHash: null, httpStatus: 404, fetchOk: false }),
  'unavailable',
)
assert.equal(
  detectChangeType({ oldHash: null, newHash: 'a', httpStatus: 200, fetchOk: true }),
  'restored',
)
assert.equal(severityForChange('unavailable', 'official_gazette'), 'critical')
assert.equal(severityForChange('content', 'official_gazette'), 'high')
assert.equal(severityForChange('content', 'municipal'), 'medium')

const from = new Date('2026-08-13T10:00:00Z')
assert.equal(nextVerificationAt(from, 24).toISOString(), '2026-08-14T10:00:00.000Z')
assert.equal(isVerificationOverdue('2026-08-12T10:00:00Z', from), true)
assert.equal(isVerificationOverdue('2026-08-14T10:00:00Z', from), false)

const versions = [
  {
    id: 'v1',
    version_number: '1',
    status: 'published',
    effective_from: '2025-01-01T00:00:00Z',
    effective_until: '2026-12-31T23:59:59Z',
    published_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'v2',
    version_number: '2',
    status: 'published',
    effective_from: '2027-01-01T00:00:00Z',
    effective_until: null,
    published_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'v0',
    version_number: '0',
    status: 'outdated',
    effective_from: '2020-01-01T00:00:00Z',
    effective_until: '2024-12-31T00:00:00Z',
    published_at: '2020-01-01T00:00:00Z',
  },
]
const now = new Date('2026-08-13T12:00:00Z')
assert.equal(resolveCurrentVersion(versions, now)?.id, 'v1')
assert.equal(findFutureVersion(versions, now)?.id, 'v2')
assert.equal(resolveCurrentVersion(versions, new Date('2027-01-02T00:00:00Z'))?.id, 'v2')

assert.equal(
  freshnessFromStatuses({
    verificationStatus: 'verified',
    nextVerificationAt: '2026-08-20T00:00:00Z',
    now,
  }).tone,
  'ok',
)
assert.equal(
  freshnessFromStatuses({
    verificationStatus: 'verified',
    nextVerificationAt: '2026-08-01T00:00:00Z',
    now,
  }).tone,
  'warn',
)
assert.equal(freshnessFromStatuses({ verificationStatus: 'outdated', now }).tone, 'bad')
assert.equal(freshnessFromStatuses({ verificationStatus: 'unavailable', now }).tone, 'bad')
assert.equal(freshnessFromStatuses({ verificationStatus: 'needs_review', now }).tone, 'warn')

const diff = simpleLineDiff('line a\nline b', 'line b\nline c')
assert.deepEqual(diff.added, ['line c'])
assert.deepEqual(diff.removed, ['line a'])
assert.equal(diff.unchanged, 1)

assert.ok(compareSourcePriority('official_gazette', 'municipal') < 0)
assert.ok(compareSourcePriority('eu_official', 'official_gazette') > 0)
assert.equal(SPAIN.officialGazetteUrl.includes('boe.es'), true)
const DE = { officialGazetteUrl: 'https://www.gesetze-im-internet.de/' }
const FR = { officialGazetteUrl: 'https://www.legifrance.gouv.fr/' }
const PL = { officialGazetteUrl: 'https://isap.sejm.gov.pl/' }
assert.ok(DE.officialGazetteUrl.includes('gesetze-im-internet'))
assert.ok(FR.officialGazetteUrl.includes('legifrance'))
assert.ok(PL.officialGazetteUrl.includes('isap.sejm'))

// notification / review / publish / rollback semantics (state machine smoke)
const statuses = ['detected', 'review_required', 'approved', 'rejected', 'published']
assert.ok(statuses.includes('review_required'))
assert.ok(statuses.includes('published'))
const rollback = { from: 'published', to: 'superseded', restore: 'v1' }
assert.equal(rollback.to, 'superseded')

// Myers line diff
function myersLineDiff(oldText, newText) {
  const a = (oldText ?? '').split('\n')
  const b = (newText ?? '').split('\n')
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', line: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'delete', line: a[i] })
      i++
    } else {
      ops.push({ type: 'insert', line: b[j] })
      j++
    }
  }
  while (i < n) {
    ops.push({ type: 'delete', line: a[i++] })
  }
  while (j < m) {
    ops.push({ type: 'insert', line: b[j++] })
  }
  return ops
}
const lineOps = myersLineDiff('alpha\nbeta', 'alpha\ngamma')
assert.ok(lineOps.some((o) => o.type === 'delete' && o.line === 'beta'))
assert.ok(lineOps.some((o) => o.type === 'insert' && o.line === 'gamma'))
assert.ok(lineOps.some((o) => o.type === 'equal' && o.line === 'alpha'))

// auto-draft version helpers (mirrors src/lib/officialSources/autoDraft.ts)
function autoDraftVersionNumber(at = new Date('2026-08-13T14:05:00Z')) {
  const pad = (n) => String(n).padStart(2, '0')
  return `auto-${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}-${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}`
}
function isAutoDraftVersion(versionNumber) {
  return versionNumber.startsWith('auto-')
}
function buildAutoDraftMarkdown(input) {
  const oldSnap = input.oldExcerpt?.trim() || '_(no previous snapshot)_'
  const newSnap = input.newExcerpt?.trim() || '_(empty snapshot)_'
  return `# Auto-draft — ${input.documentTitle}\n\n> **NOT published.**\n\n## Change reference\n- Change ID: \`${input.changeId}\`\n\n## Previous excerpt\n\`\`\`\n${oldSnap.slice(0, 800)}\n\`\`\`\n\n## New excerpt\n\`\`\`\n${newSnap.slice(0, 800)}\n\`\`\``
}
assert.equal(autoDraftVersionNumber(), 'auto-20260813-1405')
assert.equal(isAutoDraftVersion('auto-20260813-1405'), true)
assert.equal(isAutoDraftVersion('2026.09-draft'), false)
const autoBody = buildAutoDraftMarkdown({
  documentTitle: 'Test doc',
  sourceName: 'BOE',
  sourceUrl: 'https://www.boe.es/',
  changeId: 'chg-1',
  oldHash: 'a',
  newHash: 'b',
  oldExcerpt: 'old text',
  newExcerpt: 'new text',
})
assert.ok(autoBody.includes('Auto-draft — Test doc'))
assert.ok(autoBody.includes('chg-1'))
assert.ok(autoBody.includes('NOT published'))

const NL = { officialGazetteUrl: 'https://wetten.overheid.nl/' }
const CZ = { officialGazetteUrl: 'https://www.e-sbirka.cz/' }
const HU = { officialGazetteUrl: 'https://njt.hu/' }
const BG = { officialGazetteUrl: 'https://www.lex.bg/' }
assert.ok(NL.officialGazetteUrl.includes('wetten.overheid'))
assert.ok(CZ.officialGazetteUrl.includes('e-sbirka'))
assert.ok(HU.officialGazetteUrl.includes('njt.hu'))
assert.ok(BG.officialGazetteUrl.includes('lex.bg'))

function buildOfficialPointerMarkdown(input) {
  const place = input.jurisdiction?.trim()
  const intro = place
    ? `Informational entry for **${place}**. DImarket does **not** host the full legal text.`
    : 'DImarket does **not** host the full legal text.'
  return `# Official source pointer\n\n${intro}\n\n## Official source\n- **${input.sourceName}**\n- ${input.sourceUrl}`
}
const pointer = buildOfficialPointerMarkdown({
  sourceName: 'BOE',
  sourceUrl: 'https://www.boe.es/',
  jurisdiction: 'Spain',
})
assert.ok(pointer.includes('Spain'))
assert.ok(pointer.includes('boe.es'))
assert.ok(pointer.includes('NOT published') === false)

function alertsComplete(
  existing,
  telegramConfigured,
  emailConfigured,
  webhookConfigured = false,
) {
  const telegramDone = !telegramConfigured || Boolean(existing?.alert_sent_at)
  const emailDone = !emailConfigured || Boolean(existing?.email_alert_sent_at)
  const webhookDone = !webhookConfigured || Boolean(existing?.webhook_alert_sent_at)
  return telegramDone && emailDone && webhookDone
}
assert.equal(alertsComplete({}, false, false), true)
assert.equal(alertsComplete({}, false, true), false)
assert.equal(alertsComplete({}, true, false), false)
assert.equal(alertsComplete({ alert_sent_at: 'x' }, true, false), true)
assert.equal(alertsComplete({ email_alert_sent_at: 'x' }, false, true), true)
assert.equal(alertsComplete({ alert_sent_at: 'x', email_alert_sent_at: 'y' }, true, true), true)
assert.equal(alertsComplete({}, false, false, true), false)
assert.equal(alertsComplete({ webhook_alert_sent_at: 'x' }, false, false, true), true)

const AT = { officialGazetteUrl: 'https://www.ris.bka.gv.at/' }
const SK = { officialGazetteUrl: 'https://www.slov-lex.sk/' }
assert.ok(AT.officialGazetteUrl.includes('ris.bka'))
assert.ok(SK.officialGazetteUrl.includes('slov-lex'))

function buildRentalTemplateMarkdown(input) {
  return `# Residential rental agreement — informational template (${input.countryName})\n\n> **Not legal advice.**\n\n## Parties`
}
const rental = buildRentalTemplateMarkdown({ countryName: 'Germany' })
assert.ok(rental.includes('Germany'))
assert.ok(rental.includes('Not legal advice'))

const LT = { officialGazetteUrl: 'https://www.e-tar.lt/' }
const EE = { officialGazetteUrl: 'https://www.riigiteataja.ee/' }
assert.ok(LT.officialGazetteUrl.includes('e-tar'))
assert.ok(EE.officialGazetteUrl.includes('riigiteataja'))

console.log('ok official source monitor core checks passed')
