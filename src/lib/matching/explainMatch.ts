import type { RankedMatch } from '../bots/types'
import type { MatchingCriteria } from './aiMatchService'

const REASON_SENTENCES: Record<string, (m: RankedMatch, c: MatchingCriteria) => string> = {
  distance_close: (m) =>
    m.distanceKm != null
      ? `Located close to your project (${Math.round(m.distanceKm)} km).`
      : 'Located close to your project.',
  near_location: (m) =>
    m.distanceKm != null
      ? `Serves your area (${Math.round(m.distanceKm)} km away).`
      : 'Serves your project area.',
  within_radius: (m) =>
    m.distanceKm != null
      ? `Within your search radius (${Math.round(m.distanceKm)} km).`
      : 'Within your search radius.',
  same_country: () => 'Based in the same country as your project.',
  subcategory_match: () => 'Exact trade specialization for this job.',
  trade_group_match: () => 'Related trade experience for this category.',
  category_match: () => 'Works in your project category.',
  high_rating: (m) =>
    `Strong rating (${m.rating.toFixed(1)}★ from ${m.totalReviews} reviews).`,
  experienced: (m) => `Solid track record (${m.completedJobs ?? 0} completed jobs).`,
  completed_jobs: (m) => `Proven delivery (${m.completedJobs ?? 0} completed projects).`,
  language_match: () => 'Speaks your preferred language.',
  available_now: () => 'Available now and responsive.',
  available: () => 'Currently available for new work.',
  verified_platinum: () => 'Platinum verified on DImarket.',
  verified_gold: () => 'Gold verified on DImarket.',
  verified_silver: () => 'Silver verified on DImarket.',
  verified_bronze: () => 'Bronze verified on DImarket.',
  verified: () => 'Identity verified on DImarket.',
  portfolio_quality: () => 'Strong portfolio of past work.',
  portfolio: () => 'Has portfolio examples you can review.',
  budget_fit: (_m, c) =>
    c.maxBudget
      ? `Good value fit for a budget up to ${Math.round(c.maxBudget)}.`
      : 'Balanced quality-to-value profile.',
  fast_response: (m) =>
    m.responseRate != null
      ? `Fast response rate (${Math.round(m.responseRate)}%).`
      : 'Known for fast responses.',
  good_response: (m) =>
    m.responseRate != null
      ? `Reliable response rate (${Math.round(m.responseRate)}%).`
      : 'Responds reliably to inquiries.',
  timeline_fit: () => 'Availability fits your timeline.',
  preference_verified: () => 'Matches your preference for verified professionals.',
  preference_rating: () => 'Meets your minimum rating preference.',
}

/**
 * Human-readable explanation of why this professional is recommended.
 */
export function buildMatchExplanation(
  match: RankedMatch,
  criteria: MatchingCriteria = {},
): string {
  const seen = new Set<string>()
  const sentences: string[] = []

  for (const reason of match.reasons) {
    if (seen.has(reason)) continue
    seen.add(reason)
    const fn = REASON_SENTENCES[reason]
    if (fn) sentences.push(fn(match, criteria))
    if (sentences.length >= 3) break
  }

  if (sentences.length === 0) {
    return `AI Match score ${Math.round(match.score)}% based on category, location, rating, and availability.`
  }

  return sentences.join(' ')
}

export const REASON_LABELS: Record<string, string> = {
  distance_close: 'Close by',
  near_location: 'Near you',
  within_radius: 'In area',
  same_country: 'Same country',
  subcategory_match: 'Exact trade',
  trade_group_match: 'Related trade',
  category_match: 'Category fit',
  high_rating: 'Top rated',
  experienced: 'Experienced',
  completed_jobs: 'Proven jobs',
  language_match: 'Language fit',
  available_now: 'Available now',
  available: 'Available',
  verified_platinum: 'Platinum verified',
  verified_gold: 'Gold verified',
  verified_silver: 'Silver verified',
  verified_bronze: 'Bronze verified',
  verified: 'Verified',
  portfolio_quality: 'Strong portfolio',
  portfolio: 'Has portfolio',
  budget_fit: 'Budget fit',
  fast_response: 'Fast response',
  good_response: 'Good response',
  timeline_fit: 'Timeline fit',
  preference_verified: 'Verified preference',
  preference_rating: 'Rating preference',
}
