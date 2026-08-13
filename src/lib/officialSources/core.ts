/**
 * Official Source Monitor — pure logic (hash, freshness, effective versions).
 * No network. Safe for unit tests and shared with edge/frontend.
 */

export type VerificationStatus =
  | 'verified'
  | 'changed'
  | 'needs_review'
  | 'outdated'
  | 'unavailable'
  | 'needs_research'

export type FreshnessTone = 'ok' | 'warn' | 'bad' | 'unknown'

export type SourceType =
  | 'eu_official'
  | 'national_government'
  | 'official_gazette'
  | 'ministry'
  | 'regional_government'
  | 'municipal'
  | 'official_registry'
  | 'licensing_portal'
  | 'secondary_verified'

export type DocumentVersionLike = {
  id: string
  status: string
  effective_from: string | null
  effective_until: string | null
  published_at?: string | null
  version_number: string
}

/** Collapse whitespace for stable hashing of HTML/text snapshots. */
export function normalizeSourceContent(raw: string): string {
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

/** Fast non-crypto fingerprint for tests / fallback (not security-critical). */
export function fingerprintHash(normalized: string): string {
  let h = 2166136261
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `fnv1a_${(h >>> 0).toString(16).padStart(8, '0')}`
}

export async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(text)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  return fingerprintHash(text)
}

export async function hashNormalizedContent(raw: string): Promise<string> {
  const normalized = normalizeSourceContent(raw)
  const hex = await sha256Hex(normalized)
  return hex.startsWith('fnv1a_') ? hex : `sha256_${hex}`
}

export function excerptNormalized(raw: string, max = 400): string {
  const n = normalizeSourceContent(raw)
  return n.length <= max ? n : `${n.slice(0, max)}…`
}

export function hashesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a === b
}

export function detectChangeType(opts: {
  oldHash: string | null
  newHash: string | null
  httpStatus: number | null
  fetchOk: boolean
}): 'content' | 'unavailable' | 'restored' | 'http_status' {
  if (!opts.fetchOk || (opts.httpStatus !== null && opts.httpStatus >= 400)) {
    return 'unavailable'
  }
  if (opts.oldHash && opts.newHash && opts.oldHash !== opts.newHash) {
    return 'content'
  }
  if (!opts.oldHash && opts.newHash) {
    return 'restored'
  }
  return 'http_status'
}

export function severityForChange(
  changeType: string,
  sourceType: SourceType | string,
): 'low' | 'medium' | 'high' | 'critical' {
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

export function nextVerificationAt(
  from: Date,
  intervalHours: number,
): Date {
  const hours = Math.max(1, Math.min(168, intervalHours || 24))
  return new Date(from.getTime() + hours * 60 * 60 * 1000)
}

export function isVerificationOverdue(
  nextVerificationAtIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!nextVerificationAtIso) return true
  const next = new Date(nextVerificationAtIso).getTime()
  if (Number.isNaN(next)) return true
  return now.getTime() > next
}

/**
 * Resolve which published version is CURRENT at `now`.
 * Prefers effective_from/until window; falls back to published without until.
 */
export function resolveCurrentVersion<T extends DocumentVersionLike>(
  versions: T[],
  now: Date = new Date(),
): T | null {
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

export function findFutureVersion<T extends DocumentVersionLike>(
  versions: T[],
  now: Date = new Date(),
): T | null {
  const t = now.getTime()
  const future = versions
    .filter((v) => v.status === 'published' || v.status === 'approved')
    .filter((v) => {
      if (!v.effective_from) return false
      const from = new Date(v.effective_from).getTime()
      return !Number.isNaN(from) && from > t
    })
    .sort(
      (a, b) =>
        new Date(a.effective_from!).getTime() - new Date(b.effective_from!).getTime(),
    )
  return future[0] ?? null
}

export function freshnessFromStatuses(opts: {
  verificationStatus: VerificationStatus | string
  nextVerificationAt?: string | null
  lastVerifiedAt?: string | null
  now?: Date
}): { tone: FreshnessTone; labelKey: string } {
  const now = opts.now ?? new Date()
  const status = opts.verificationStatus

  if (status === 'unavailable') {
    return { tone: 'bad', labelKey: 'osm.freshness.unavailable' }
  }
  if (status === 'outdated' || status === 'changed') {
    return { tone: 'bad', labelKey: 'osm.freshness.outdated' }
  }
  if (status === 'needs_review' || status === 'needs_research') {
    return { tone: 'warn', labelKey: 'osm.freshness.needsReview' }
  }
  if (isVerificationOverdue(opts.nextVerificationAt ?? null, now)) {
    return { tone: 'warn', labelKey: 'osm.freshness.checkDue' }
  }
  if (status === 'verified') {
    return { tone: 'ok', labelKey: 'osm.freshness.current' }
  }
  return { tone: 'unknown', labelKey: 'osm.freshness.unknown' }
}

export function trustLabelKey(trustTier: string): string {
  const map: Record<string, string> = {
    eu_official: 'osm.trust.eu',
    official_gazette: 'osm.trust.gazette',
    national_government: 'osm.trust.national',
    ministry: 'osm.trust.ministry',
    regional_government: 'osm.trust.regional',
    municipal: 'osm.trust.municipal',
    official_registry: 'osm.trust.registry',
    secondary_verified: 'osm.trust.secondary',
  }
  return map[trustTier] ?? 'osm.trust.national'
}

/** Simple line diff for admin: added / removed (not a full Myers diff). */
export function simpleLineDiff(
  oldText: string,
  newText: string,
): { added: string[]; removed: string[]; unchanged: number } {
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
  const added: string[] = []
  const removed: string[] = []
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

export const SPAIN_SOURCE_PRIORITY: SourceType[] = [
  'official_gazette',
  'national_government',
  'ministry',
  'regional_government',
  'municipal',
  'official_registry',
  'eu_official',
]

export function compareSourcePriority(
  a: SourceType | string,
  b: SourceType | string,
  priority: readonly string[] = SPAIN_SOURCE_PRIORITY,
): number {
  const ia = priority.indexOf(a)
  const ib = priority.indexOf(b)
  const sa = ia === -1 ? 999 : ia
  const sb = ib === -1 ? 999 : ib
  return sa - sb
}

/** IDs of published versions that should become superseded when publishing another. */
export function publishedVersionIdsToSupersede<T extends DocumentVersionLike>(
  versions: T[],
  publishingId: string,
): string[] {
  return versions.filter((v) => v.status === 'published' && v.id !== publishingId).map((v) => v.id)
}

/** Whether rollback target is eligible (was published or approved before). */
export function canRollbackToVersion(version: DocumentVersionLike | null | undefined): boolean {
  if (!version) return false
  return version.status === 'published' || version.status === 'superseded' || version.status === 'approved'
}
