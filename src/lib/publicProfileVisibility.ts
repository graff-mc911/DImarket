/** Public listing rules for profiles (homepage, catalog, map, search). */

export type PublicProfileGate = {
  id?: string
  full_name?: string | null
  is_professional?: boolean | null
  user_role?: string | null
  deleted_at?: string | null
  hidden_at?: string | null
  email?: string | null
}

/** QA / agent / e2e junk that must never appear as "Top Masters". */
export function isLikelyQaOrTestProfile(profile: PublicProfileGate): boolean {
  const name = (profile.full_name || '').trim()
  const email = (profile.email || '').trim().toLowerCase()

  if (email.includes('dimarket-audit') || email.includes('dimarket-test') || email.includes('@dimarket-audit.')) {
    return true
  }
  if (/@(example\.com|test\.invalid|mailinator\.com)$/i.test(email)) return true

  if (!name) return false
  // Exact placeholder names left by smoke/register tests
  if (/^(test|tester|demo|demo user|test user)$/i.test(name)) return true
  if (/^qa([\s_\-.]|$)/i.test(name)) return true
  if (/^side-ads-e2e-/i.test(name)) return true
  if (/^investor\s+(ad|demo)/i.test(name)) return true
  if (/\bqa[\s_\-]*(smoke|chat|master|e2e|admin|client|company|mfr|mfg|pv|advertiser|final|stranger|audit|self)\b/i.test(name)) {
    return true
  }
  return false
}

/** CA manufacturer / agent directory rows share the same QA naming patterns. */
export function isLikelyQaOrTestName(name: string | null | undefined): boolean {
  return isLikelyQaOrTestProfile({ full_name: name })
}

/** Soft-deleted or owner-hidden profiles are not publicly listable. */
export function isProfileSoftRemoved(profile: PublicProfileGate): boolean {
  return Boolean(profile.deleted_at) || Boolean(profile.hidden_at)
}

/**
 * Can this profile appear in public directories / Top Masters / map?
 * Does not decide ranking — only eligibility.
 */
export function isProfilePubliclyListable(profile: PublicProfileGate): boolean {
  if (isProfileSoftRemoved(profile)) return false
  if (isLikelyQaOrTestProfile(profile)) return false
  if (profile.is_professional !== true) return false
  return true
}

export function filterPublicProfiles<T extends PublicProfileGate>(rows: T[]): T[] {
  return rows.filter(isProfilePubliclyListable)
}

/** Apply PostgREST filters when columns exist; safe no-op if caller omits. */
export function applyPublicProfileFilters<T extends { is: Function; not?: Function }>(query: T): T {
  // Prefer IS NULL for soft-delete / hide columns.
  // If migration not applied yet, callers should catch and retry without these.
  return (query as unknown as { is: (c: string, v: null) => T }).is('deleted_at', null).is('hidden_at', null)
}

export function sortProfilesForPublicDiscovery<
  T extends {
    ranking_priority?: number | null
    is_featured?: boolean | null
    rating?: number | null
    total_reviews?: number | null
    created_at?: string
  },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ap = Number(a.ranking_priority ?? 0)
    const bp = Number(b.ranking_priority ?? 0)
    if (bp !== ap) return bp - ap
    const af = a.is_featured ? 1 : 0
    const bf = b.is_featured ? 1 : 0
    if (bf !== af) return bf - af
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff
    const reviewsDiff = (b.total_reviews ?? 0) - (a.total_reviews ?? 0)
    if (reviewsDiff !== 0) return reviewsDiff
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })
}
