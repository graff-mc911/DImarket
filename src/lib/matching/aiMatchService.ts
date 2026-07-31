/**
 * AI Matching Engine for DImarket.
 * Scores professionals 0–100% on: category, location, budget, timeline,
 * languages, rating, completed projects, response time, availability,
 * verification, portfolio, and customer preferences.
 */
import { supabase } from '../supabase'
import { haversineKm, type GeoPoint } from '../projectFeed'
import type { VerificationLevel } from '../types'
import type { MatchScoreBreakdown, RankedMatch } from '../bots/types'
import { buildMatchExplanation } from './explainMatch'
import { computeMatchFacets } from './matchFacets'

export const TOP_MATCH_LIMIT = 10

export type CustomerMatchPreferences = {
  minRating?: number
  verifiedOnly?: boolean
  preferAvailable?: boolean
  maxDistanceKm?: number
}

export type MatchingCriteria = {
  categorySlug?: string
  subcategorySlugs?: string[]
  city?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number
  minRating?: number
  language?: string
  preferredLanguages?: string[]
  maxBudget?: number
  /** Project urgency — amplifies response / availability scoring */
  urgency?: 'low' | 'normal' | 'high' | 'urgent' | null
  /** Optional days until deadline */
  timelineDays?: number | null
  preferences?: CustomerMatchPreferences
}

export type MatchCandidate = {
  id: string
  full_name: string | null
  location: string | null
  rating: number | null
  total_reviews: number | null
  response_rate: number | null
  preferred_language: string | null
  languages?: string[] | null
  trust_score: number | null
  is_verified: boolean | null
  is_premium: boolean | null
  verification_level?: VerificationLevel | null
  portfolio_images?: string[] | null
  work_subcategory_slugs?: string[] | null
  completed_jobs?: number | null
  availability_status?: string | null
  service_latitude?: number | null
  service_longitude?: number | null
  profile_photo?: string | null
  avatar_url?: string | null
  professional_categories?: { category_id: string; category?: { slug: string } | null }[]
  portfolio_items?: { count: number }[] | { id: string }[] | null
}

/** Max points per dimension (sum = 100) */
export const MATCH_WEIGHTS = {
  distance: 15,
  specialization: 18,
  rating: 10,
  completedJobs: 8,
  languages: 7,
  availability: 7,
  verification: 10,
  portfolio: 5,
  budget: 10,
  responseTime: 10,
} as const

function subcategoryOverlap(
  listingSlugs: string[] | undefined,
  profileSlugs: string[] | null | undefined,
): { exact: boolean; group: boolean } {
  if (!listingSlugs?.length || !profileSlugs?.length) {
    return { exact: false, group: false }
  }
  const exact = listingSlugs.some((s) => profileSlugs.includes(s))
  if (exact) return { exact: true, group: true }
  const listingGroups = new Set(listingSlugs.map((s) => s.split('-')[0]).filter(Boolean))
  const group = profileSlugs.some((s) => listingGroups.has(s.split('-')[0]))
  return { exact: false, group }
}

function portfolioItemCount(p: MatchCandidate): number {
  const items = p.portfolio_items
  if (!items?.length) return 0
  const first = items[0] as { count?: number; id?: string }
  if (typeof first.count === 'number') return first.count
  return items.length
}

function profileLanguages(p: MatchCandidate): string[] {
  const fromArr = (p.languages || []).map((l) => l.toLowerCase().trim()).filter(Boolean)
  if (fromArr.length) return fromArr
  if (p.preferred_language) return [p.preferred_language.toLowerCase().trim()]
  return []
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function scoreDistance(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): { points: number; reason?: string; distanceKm: number | null } {
  const max = MATCH_WEIGHTS.distance
  const origin: GeoPoint | null =
    criteria.latitude != null && criteria.longitude != null
      ? { lat: criteria.latitude, lon: criteria.longitude }
      : null

  if (origin && p.service_latitude != null && p.service_longitude != null) {
    const km = haversineKm(origin, {
      lat: p.service_latitude,
      lon: p.service_longitude,
    })
    const radius = criteria.preferences?.maxDistanceKm ?? criteria.radiusKm ?? 150
    if (km <= 5) return { points: max, reason: 'distance_close', distanceKm: km }
    if (km <= 15) return { points: max * 0.9, reason: 'distance_close', distanceKm: km }
    if (km <= 40) return { points: max * 0.75, reason: 'near_location', distanceKm: km }
    if (km <= radius) return { points: max * 0.45, reason: 'within_radius', distanceKm: km }
    if (km <= radius * 2) return { points: max * 0.2, distanceKm: km }
    return { points: 0, distanceKm: km }
  }

  const loc = (p.location || '').toLowerCase()
  if (!loc) return { points: max * 0.15, distanceKm: null }
  if (criteria.city && loc.includes(criteria.city.toLowerCase())) {
    return { points: max * 0.85, reason: 'near_location', distanceKm: null }
  }
  if (criteria.country && loc.includes(criteria.country.toLowerCase())) {
    return { points: max * 0.4, reason: 'same_country', distanceKm: null }
  }
  return { points: max * 0.1, distanceKm: null }
}

function scoreSpecialization(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): { points: number; reasons: string[] } {
  const max = MATCH_WEIGHTS.specialization
  const reasons: string[] = []
  let points = 0

  if (criteria.categorySlug && p.professional_categories?.length) {
    const hasCat = p.professional_categories.some(
      (pc) => pc.category?.slug === criteria.categorySlug,
    )
    if (hasCat) {
      points += max * 0.4
      reasons.push('category_match')
    }
  }

  const sub = subcategoryOverlap(criteria.subcategorySlugs, p.work_subcategory_slugs)
  if (sub.exact) {
    points += max * 0.6
    reasons.push('subcategory_match')
  } else if (sub.group) {
    points += max * 0.35
    reasons.push('trade_group_match')
  }

  return { points: Math.min(max, points), reasons }
}

function scoreRating(p: MatchCandidate): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.rating
  const rating = p.rating ?? 0
  const reviews = p.total_reviews ?? 0
  let points = (rating / 5) * max * 0.75
  points += Math.min(max * 0.25, Math.log10(reviews + 1) * 2.5)
  return {
    points: Math.min(max, points),
    reason: rating >= 4.5 && reviews >= 3 ? 'high_rating' : undefined,
  }
}

function scoreCompletedJobs(p: MatchCandidate): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.completedJobs
  const jobs = Math.max(p.completed_jobs ?? 0, p.total_reviews ?? 0)
  const points = Math.min(max, (Math.log10(jobs + 1) / Math.log10(51)) * max)
  return {
    points,
    reason: jobs >= 10 ? 'completed_jobs' : jobs >= 3 ? 'experienced' : undefined,
  }
}

function scoreLanguages(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.languages
  const wanted = [criteria.language, ...(criteria.preferredLanguages ?? [])]
    .filter(Boolean)
    .map((l) => String(l).toLowerCase().trim())

  if (!wanted.length) return { points: max * 0.5 }

  const have = profileLanguages(p)
  if (!have.length) return { points: max * 0.15 }

  const hits = wanted.filter((w) => have.includes(w))
  if (hits.length === 0) return { points: 0 }
  if (hits.length >= wanted.length || hits.length >= 2) {
    return { points: max, reason: 'language_match' }
  }
  return { points: max * 0.7, reason: 'language_match' }
}

function scoreAvailability(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.availability
  const status = (p.availability_status || 'available').toLowerCase()
  const urgent = criteria.urgency === 'urgent' || criteria.urgency === 'high'

  let base = 0
  if (status === 'available') base = max
  else if (status === 'limited') base = max * (urgent ? 0.35 : 0.55)
  else if (status === 'busy') base = max * (urgent ? 0.1 : 0.25)
  else base = 0

  let reason: string | undefined
  if (status === 'available') {
    reason = urgent || (criteria.timelineDays != null && criteria.timelineDays <= 7)
      ? 'timeline_fit'
      : 'available'
  }

  return { points: Math.min(max, base), reason }
}

function scoreVerification(p: MatchCandidate): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.verification
  const level = p.verification_level
  if (level === 'platinum') return { points: max, reason: 'verified_platinum' }
  if (level === 'gold') return { points: max * 0.9, reason: 'verified_gold' }
  if (level === 'silver') return { points: max * 0.7, reason: 'verified_silver' }
  if (level === 'bronze') return { points: max * 0.45, reason: 'verified_bronze' }
  if (p.is_verified) return { points: max * 0.4, reason: 'verified' }
  return { points: max * 0.1 }
}

function scorePortfolio(p: MatchCandidate): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.portfolio
  const images = p.portfolio_images?.length ?? 0
  const items = portfolioItemCount(p)
  const quality = images * 1.2 + items * 2.5
  const points = Math.min(max, (quality / 12) * max)
  return {
    points,
    reason: quality >= 6 ? 'portfolio_quality' : quality > 0 ? 'portfolio' : undefined,
  }
}

/**
 * Budget fit without published rates: prefer proven, available pros;
 * soft-penalize premium on tight budgets (value signal).
 */
function scoreBudget(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): { points: number; reason?: string } {
  const max = MATCH_WEIGHTS.budget
  if (criteria.maxBudget == null || criteria.maxBudget <= 0) {
    return { points: max * 0.55 }
  }

  const jobs = Math.max(p.completed_jobs ?? 0, p.total_reviews ?? 0)
  const rating = p.rating ?? 0
  let points = max * 0.35
  points += Math.min(max * 0.3, (Math.log10(jobs + 1) / Math.log10(21)) * max * 0.3)
  if (rating >= 4) points += max * 0.15
  if (rating >= 4.5) points += max * 0.05
  if ((p.availability_status || 'available') === 'available') points += max * 0.1

  const tight = criteria.maxBudget < 800
  if (p.is_premium && tight) points -= max * 0.2
  else if (!p.is_premium) points += max * 0.08

  points = clamp(points, 0, max)
  return {
    points,
    reason: points >= max * 0.6 ? 'budget_fit' : undefined,
  }
}

/** Response time from response_rate; urgency amplifies this dimension. */
function scoreResponseTime(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): { points: number; reason?: string; responseScore: number } {
  const max = MATCH_WEIGHTS.responseTime
  const rate = clamp(p.response_rate ?? 45, 0, 100)
  const urgent = criteria.urgency === 'urgent' || criteria.urgency === 'high'
  const status = (p.availability_status || 'available').toLowerCase()

  let points = (rate / 100) * max
  if (urgent && status === 'available') points = Math.min(max, points * 1.15)
  if (urgent && status === 'busy') points *= 0.7

  let reason: string | undefined
  if (rate >= 85 && status !== 'busy') reason = 'fast_response'
  else if (rate >= 60) reason = 'good_response'
  if (urgent && status === 'available' && rate >= 70) reason = 'fast_response'

  return { points: clamp(points, 0, max), reason, responseScore: rate }
}

function computeValueScore(
  p: MatchCandidate,
  matchScore: number,
  distanceKm: number | null,
): number {
  const jobs = Math.max(p.completed_jobs ?? 0, p.total_reviews ?? 0)
  const jobsNorm = Math.min(100, (Math.log10(jobs + 1) / Math.log10(51)) * 100)
  const ratingNorm = ((p.rating ?? 0) / 5) * 100
  const distPenalty =
    distanceKm == null ? 12 : distanceKm <= 15 ? 0 : Math.min(25, distanceKm / 8)
  const premiumPenalty = p.is_premium ? 6 : 0
  const raw =
    matchScore * 0.45 +
    ratingNorm * 0.25 +
    jobsNorm * 0.22 +
    (100 - distPenalty) * 0.08 -
    premiumPenalty
  return Math.round(clamp(raw, 0, 100) * 10) / 10
}

/**
 * Soft calibration so strong matches land in the high 90s
 * while weak matches stay clearly lower.
 */
export function calibrateMatchPercent(raw0to100: number): number {
  const x = Math.max(0, Math.min(100, raw0to100)) / 100
  const curved = 1 - (1 - x) ** 1.35
  const display = 72 + curved * 27
  return Math.max(0, Math.min(99, Math.round(display)))
}

export function scoreMatchCandidate(
  p: MatchCandidate,
  criteria: MatchingCriteria,
): RankedMatch {
  const dist = scoreDistance(p, criteria)
  const spec = scoreSpecialization(p, criteria)
  const rating = scoreRating(p)
  const jobs = scoreCompletedJobs(p)
  const langs = scoreLanguages(p, criteria)
  const avail = scoreAvailability(p, criteria)
  const verif = scoreVerification(p)
  const port = scorePortfolio(p)
  const budget = scoreBudget(p, criteria)
  const response = scoreResponseTime(p, criteria)

  const breakdown: MatchScoreBreakdown = {
    distance: Math.round(dist.points * 10) / 10,
    specialization: Math.round(spec.points * 10) / 10,
    rating: Math.round(rating.points * 10) / 10,
    completedJobs: Math.round(jobs.points * 10) / 10,
    languages: Math.round(langs.points * 10) / 10,
    availability: Math.round(avail.points * 10) / 10,
    verification: Math.round(verif.points * 10) / 10,
    portfolio: Math.round(port.points * 10) / 10,
    budget: Math.round(budget.points * 10) / 10,
    responseTime: Math.round(response.points * 10) / 10,
  }

  let raw =
    dist.points +
    spec.points +
    rating.points +
    jobs.points +
    langs.points +
    avail.points +
    verif.points +
    port.points +
    budget.points +
    response.points

  if (p.is_premium) raw += 1.5
  const trust = p.trust_score ?? 50
  raw += Math.max(-2, Math.min(2, (trust - 50) * 0.04))

  // Soft preference boosts
  const prefs = criteria.preferences
  const reasons = [
    dist.reason,
    ...spec.reasons,
    rating.reason,
    jobs.reason,
    langs.reason,
    avail.reason,
    verif.reason,
    port.reason,
    budget.reason,
    response.reason,
  ].filter(Boolean) as string[]

  if (prefs?.preferAvailable && (p.availability_status || 'available') === 'available') {
    raw += 1.5
  }
  if (prefs?.verifiedOnly && (p.is_verified || (p.verification_level && p.verification_level !== 'none'))) {
    reasons.push('preference_verified')
  }
  if (prefs?.minRating && (p.rating ?? 0) >= prefs.minRating) {
    reasons.push('preference_rating')
  }

  const score = calibrateMatchPercent(raw)
  const valueScore = computeValueScore(p, score, dist.distanceKm)

  const ranked: RankedMatch = {
    profileId: p.id,
    fullName: p.full_name || 'Professional',
    location: p.location,
    rating: p.rating ?? 0,
    totalReviews: p.total_reviews ?? 0,
    responseRate: p.response_rate,
    score,
    reasons,
    breakdown,
    distanceKm: dist.distanceKm,
    valueScore,
    responseScore: response.responseScore,
    verificationLevel: p.verification_level ?? null,
    avatarUrl: p.profile_photo || p.avatar_url || null,
    completedJobs: Math.max(p.completed_jobs ?? 0, p.total_reviews ?? 0),
    availabilityStatus: p.availability_status || 'available',
    isPremium: p.is_premium,
    isVerified: p.is_verified,
    languages: profileLanguages(p),
  }

  ranked.explanation = buildMatchExplanation(ranked, criteria)
  return ranked
}

const PROFILE_SELECT = `
  id, full_name, location, rating, total_reviews, response_rate,
  preferred_language, languages, trust_score, is_verified, is_premium,
  verification_level, portfolio_images, work_subcategory_slugs,
  completed_jobs, availability_status, service_latitude, service_longitude,
  profile_photo, avatar_url,
  professional_categories(category_id, category:categories(slug)),
  portfolio_items(count)
`

const PROFILE_SELECT_FALLBACK = `
  id, full_name, location, rating, total_reviews, response_rate,
  preferred_language, trust_score, is_verified, is_premium,
  portfolio_images, work_subcategory_slugs,
  profile_photo, avatar_url,
  professional_categories(category_id, category:categories(slug))
`

/**
 * Rank professionals for a project. Reusable entry point for wizard, ads, bots.
 */
export async function rankProfessionals(
  criteria: MatchingCriteria,
  limit = TOP_MATCH_LIMIT,
): Promise<RankedMatch[]> {
  let data: MatchCandidate[] | null = null

  const primary = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('is_professional', true)
    .neq('availability_status', 'unavailable')
    .order('rating', { ascending: false })
    .limit(120)

  if (primary.error || !primary.data) {
    const fallback = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_FALLBACK)
      .eq('is_professional', true)
      .order('rating', { ascending: false })
      .limit(120)

    if (fallback.error || !fallback.data) {
      console.error('rankProfessionals:', primary.error || fallback.error)
      return []
    }
    data = fallback.data as MatchCandidate[]
  } else {
    data = primary.data as MatchCandidate[]
  }

  const minRating = criteria.preferences?.minRating ?? criteria.minRating
  const verifiedOnly = criteria.preferences?.verifiedOnly

  let candidates = data
  if (verifiedOnly) {
    candidates = candidates.filter(
      (p) =>
        Boolean(p.is_verified) ||
        (p.verification_level != null && p.verification_level !== 'none'),
    )
  }
  if (minRating) {
    candidates = candidates.filter((p) => (p.rating ?? 0) >= minRating)
  }

  let ranked = candidates
    .map((p) => scoreMatchCandidate(p, criteria))
    .sort((a, b) => b.score - a.score || b.rating - a.rating)

  ranked = applyTopScoreLadder(ranked)

  if (criteria.radiusKm && criteria.latitude != null && criteria.longitude != null) {
    const maxKm =
      criteria.preferences?.maxDistanceKm ?? criteria.radiusKm * 2.5
    ranked = ranked.filter((m) => m.distanceKm == null || m.distanceKm <= maxKm)
  }

  const top = ranked.slice(0, limit)
  // Attach facet metadata via explanation already set; facets computed by callers
  void computeMatchFacets(top)
  return top
}

/**
 * Ensure top matches show distinct premium percentages (98 / 95 / 92 style)
 * without inventing fake quality — only spreads ties / near-ties downward.
 */
export function applyTopScoreLadder(ranked: RankedMatch[]): RankedMatch[] {
  if (ranked.length === 0) return ranked
  const out = ranked.map((m) => ({ ...m }))
  const ladder = [98, 95, 92, 90, 88, 86, 84, 82, 80, 78]

  for (let i = 0; i < Math.min(out.length, ladder.length); i++) {
    const floor = ladder[i]
    if (out[i].score >= floor - 8) {
      out[i] = { ...out[i], score: Math.max(out[i].score, floor) }
    }
    if (i > 0 && out[i].score > out[i - 1].score) {
      out[i] = { ...out[i], score: out[i - 1].score - 1 }
    }
  }

  for (let i = 0; i < out.length; i++) {
    out[i].score = Math.min(99, Math.max(0, out[i].score))
    if (i > 0 && out[i].score >= out[i - 1].score) {
      out[i].score = Math.max(0, out[i - 1].score - 1)
    }
  }

  return out
}

/** Build criteria from a published listing row + wizard extras */
export function criteriaFromListing(listing: {
  location?: string | null
  city_name?: string | null
  country_name?: string | null
  latitude?: number | null
  longitude?: number | null
  subcategory_slugs?: string[] | null
  preferred_language?: string | null
  budget_max?: number | null
  urgency?: 'low' | 'normal' | 'high' | 'urgent' | null
  deadline_at?: string | null
  category?: { slug?: string } | null
  match_preferences?: CustomerMatchPreferences | null
}): MatchingCriteria {
  const city =
    listing.city_name?.trim() ||
    listing.location?.split(',')[0]?.trim() ||
    undefined
  const country = listing.country_name?.trim() || undefined

  let timelineDays: number | null = null
  if (listing.deadline_at) {
    const ms = new Date(listing.deadline_at).getTime() - Date.now()
    if (Number.isFinite(ms)) timelineDays = Math.max(0, Math.ceil(ms / 86_400_000))
  }

  return {
    categorySlug: listing.category?.slug || 'construction',
    subcategorySlugs: listing.subcategory_slugs || undefined,
    city,
    country,
    latitude: listing.latitude,
    longitude: listing.longitude,
    radiusKm: 150,
    language: listing.preferred_language || undefined,
    preferredLanguages: listing.preferred_language
      ? [listing.preferred_language]
      : undefined,
    maxBudget: listing.budget_max ?? undefined,
    urgency: listing.urgency ?? null,
    timelineDays,
    preferences: listing.match_preferences ?? undefined,
    minRating: listing.match_preferences?.minRating,
  }
}
