import { supabase } from '../../supabase'
import type { RankedMatch } from '../types'
import type { VerificationLevel } from '../../types'

export type MatchingCriteria = {
  categorySlug?: string
  subcategorySlugs?: string[]
  city?: string
  country?: string
  radiusKm?: number
  minRating?: number
  language?: string
  maxBudget?: number
  preferredLanguages?: string[]
}

type ProfileRow = {
  id: string
  full_name: string | null
  location: string | null
  rating: number | null
  total_reviews: number | null
  response_rate: number | null
  preferred_language: string | null
  trust_score: number | null
  is_verified: boolean | null
  is_premium: boolean | null
  verification_level?: VerificationLevel | null
  portfolio_images?: string[] | null
  work_subcategory_slugs?: string[] | null
  professional_categories?: { category_id: string; category?: { slug: string } | null }[]
}

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

function locationScore(profileLoc: string | null, city: string, country?: string): number {
  if (!profileLoc) return 0
  const loc = profileLoc.toLowerCase()
  if (city && loc.includes(city.toLowerCase())) return 18
  if (country && loc.includes(country.toLowerCase())) return 8
  return 0
}

function verificationBonus(level: VerificationLevel | null | undefined, isVerified: boolean | null): number {
  if (level === 'gold') return 12
  if (level === 'silver') return 8
  if (level === 'bronze') return 4
  if (isVerified) return 5
  return 0
}

/**
 * Weighted score normalized to 0–100 (Match Score %).
 * Factors: distance/location, specialization, languages, reviews, portfolio,
 * response time, completed jobs (reviews proxy), verification level.
 */
function scoreProfile(p: ProfileRow, criteria: MatchingCriteria): RankedMatch {
  const reasons: string[] = []
  let raw = 0

  const rating = p.rating ?? 0
  const reviews = p.total_reviews ?? 0
  raw += Math.min(18, rating * 3.6)
  raw += Math.min(10, Math.log10(reviews + 1) * 6)
  if (rating >= 4) reasons.push('high_rating')
  if (reviews >= 5) reasons.push('experienced')

  const response = p.response_rate ?? 0
  raw += Math.min(12, response * 0.12)
  if (response >= 70) reasons.push('fast_response')

  if (criteria.city) {
    const ls = locationScore(p.location, criteria.city, criteria.country)
    raw += ls
    if (ls > 0) reasons.push('near_location')
  }

  if (criteria.categorySlug && p.professional_categories?.length) {
    const hasCat = p.professional_categories.some(
      (pc) => pc.category?.slug === criteria.categorySlug,
    )
    if (hasCat) {
      raw += 14
      reasons.push('category_match')
    }
  }

  const subOverlap = subcategoryOverlap(criteria.subcategorySlugs, p.work_subcategory_slugs)
  if (subOverlap.exact) {
    raw += 16
    reasons.push('subcategory_match')
  } else if (subOverlap.group) {
    raw += 10
    reasons.push('trade_group_match')
  }

  const langs = [
    criteria.language,
    ...(criteria.preferredLanguages ?? []),
  ].filter(Boolean) as string[]
  if (langs.length && p.preferred_language && langs.includes(p.preferred_language)) {
    raw += 6
    reasons.push('language_match')
  }

  const portfolioCount = p.portfolio_images?.length ?? 0
  if (portfolioCount > 0) {
    raw += Math.min(8, portfolioCount * 1.5)
    reasons.push('portfolio')
  }

  const vBonus = verificationBonus(p.verification_level, p.is_verified)
  raw += vBonus
  if (vBonus >= 8) reasons.push('verified_tier')
  else if (vBonus > 0) reasons.push('verified')

  if (p.is_premium) {
    raw += 3
    reasons.push('premium')
  }

  const trust = p.trust_score ?? 50
  raw += Math.max(-5, Math.min(5, (trust - 50) * 0.1))

  const score = Math.max(0, Math.min(100, Math.round(raw)))

  return {
    profileId: p.id,
    fullName: p.full_name || 'Professional',
    location: p.location,
    rating,
    totalReviews: reviews,
    responseRate: p.response_rate,
    score,
    reasons,
  }
}

/** Ранжування майстрів/компаній за критеріями заявки */
export async function rankProfessionals(
  criteria: MatchingCriteria,
  limit = 12,
): Promise<RankedMatch[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id, full_name, location, rating, total_reviews, response_rate,
      preferred_language, trust_score, is_verified, is_premium,
      verification_level, portfolio_images, work_subcategory_slugs,
      professional_categories(category_id, category:categories(slug))
    `,
    )
    .eq('is_professional', true)
    .order('rating', { ascending: false })
    .limit(80)

  if (error || !data) {
    // Fallback without verification_level column
    const fallback = await supabase
      .from('profiles')
      .select(
        `
        id, full_name, location, rating, total_reviews, response_rate,
        preferred_language, trust_score, is_verified, is_premium,
        portfolio_images, work_subcategory_slugs,
        professional_categories(category_id, category:categories(slug))
      `,
      )
      .eq('is_professional', true)
      .order('rating', { ascending: false })
      .limit(80)

    if (fallback.error || !fallback.data) return []
    const ranked = (fallback.data as ProfileRow[])
      .map((p) => scoreProfile(p, criteria))
      .sort((a, b) => b.score - a.score)
    return criteria.minRating
      ? ranked.filter((m) => m.rating >= criteria.minRating!).slice(0, limit)
      : ranked.slice(0, limit)
  }

  const ranked = (data as ProfileRow[])
    .map((p) => scoreProfile(p, criteria))
    .sort((a, b) => b.score - a.score)

  if (criteria.minRating) {
    return ranked.filter((m) => m.rating >= criteria.minRating!).slice(0, limit)
  }

  return ranked.slice(0, limit)
}
