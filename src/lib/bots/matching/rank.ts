import { supabase } from '../../supabase'
import type { RankedMatch } from '../types'

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

  const listingGroups = new Set(
    listingSlugs.map((s) => s.split('-')[0]).filter(Boolean),
  )
  const group = profileSlugs.some((s) => listingGroups.has(s.split('-')[0]))
  return { exact: false, group }
}

function locationScore(profileLoc: string | null, city: string, country?: string): number {
  if (!profileLoc) return 0
  const loc = profileLoc.toLowerCase()
  if (city && loc.includes(city.toLowerCase())) return 25
  if (country && loc.includes(country.toLowerCase())) return 12
  return 0
}

function scoreProfile(p: ProfileRow, criteria: MatchingCriteria): RankedMatch {
  const reasons: string[] = []
  let score = 0

  const rating = p.rating ?? 0
  const reviews = p.total_reviews ?? 0
  score += Math.min(30, rating * 6)
  score += Math.min(15, Math.log10(reviews + 1) * 10)
  if (rating >= 4) reasons.push('high_rating')
  if (reviews >= 5) reasons.push('experienced')

  const response = p.response_rate ?? 0
  score += Math.min(15, response * 0.15)
  if (response >= 70) reasons.push('fast_response')

  if (criteria.city) {
    const ls = locationScore(p.location, criteria.city, criteria.country)
    score += ls
    if (ls > 0) reasons.push('near_location')
  }

  if (criteria.categorySlug && p.professional_categories?.length) {
    const hasCat = p.professional_categories.some(
      (pc) => pc.category?.slug === criteria.categorySlug,
    )
    if (hasCat) {
      score += 20
      reasons.push('category_match')
    }
  }

  const subOverlap = subcategoryOverlap(
    criteria.subcategorySlugs,
    p.work_subcategory_slugs,
  )
  if (subOverlap.exact) {
    score += 25
    reasons.push('subcategory_match')
  } else if (subOverlap.group) {
    score += 15
    reasons.push('trade_group_match')
  }

  if (criteria.language && p.preferred_language === criteria.language) {
    score += 8
    reasons.push('language_match')
  }

  if (p.is_verified) {
    score += 5
    reasons.push('verified')
  }
  if (p.is_premium) {
    score += 3
    reasons.push('premium')
  }

  const trust = p.trust_score ?? 50
  score += (trust - 50) * 0.1

  return {
    profileId: p.id,
    fullName: p.full_name || 'Professional',
    location: p.location,
    rating,
    totalReviews: reviews,
    responseRate: p.response_rate,
    score: Math.round(score * 10) / 10,
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
      work_subcategory_slugs,
      professional_categories(category_id, category:categories(slug))
    `,
    )
    .eq('is_professional', true)
    .order('rating', { ascending: false })
    .limit(80)

  if (error || !data) return []

  const ranked = (data as ProfileRow[])
    .map((p) => scoreProfile(p, criteria))
    .sort((a, b) => b.score - a.score)

  if (criteria.minRating) {
    return ranked.filter((m) => m.rating >= criteria.minRating!).slice(0, limit)
  }

  return ranked.slice(0, limit)
}
