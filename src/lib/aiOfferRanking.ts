/**
 * AI Offer Ranking — sort binding quotes for a listing.
 * Complements match_scores (pros) with quote-level ranking (offers).
 */
import { supabase } from './supabase'

export type RankedOffer = {
  quoteId: string
  applicationId: string
  professionalId: string
  professionalName: string
  photo: string | null
  total: number
  currency: string
  status: string
  rating: number
  reviews: number
  completedJobs: number
  verification: string | null
  matchScore: number | null
  rankScore: number
  reasons: string[]
  notes: string | null
  createdAt: string
}

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Rank sent quotes: price fit to budget + rating + jobs + match score. */
export async function rankQuotesForListing(listingId: string): Promise<RankedOffer[]> {
  const { data: listing } = await supabase
    .from('listings')
    .select('budget_min, budget_max')
    .eq('id', listingId)
    .maybeSingle()

  const budgetMin = num((listing as { budget_min?: number } | null)?.budget_min)
  const budgetMax = num((listing as { budget_max?: number } | null)?.budget_max)
  const midBudget =
    budgetMin > 0 && budgetMax > 0
      ? (budgetMin + budgetMax) / 2
      : budgetMax || budgetMin || 0

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(
      'id, application_id, professional_id, total, currency, status, notes, created_at, professional:profiles(id, full_name, profile_photo, avatar_url, rating, total_reviews, completed_jobs, verification_level, is_verified)',
    )
    .eq('listing_id', listingId)
    .in('status', ['sent', 'accepted'])
    .order('created_at', { ascending: false })

  if (error || !quotes?.length) return []

  const { data: matches } = await supabase
    .from('match_scores')
    .select('contractor_id, score')
    .eq('listing_id', listingId)

  const matchByPro = new Map<string, number>()
  for (const m of (matches as Array<{ contractor_id: string; score: number }> | null) ?? []) {
    matchByPro.set(m.contractor_id, Number(m.score) || 0)
  }

  const ranked: RankedOffer[] = (quotes as Array<Record<string, unknown>>).map((q) => {
    const pro = q.professional as {
      id?: string
      full_name?: string | null
      profile_photo?: string | null
      avatar_url?: string | null
      rating?: number | null
      total_reviews?: number | null
      completed_jobs?: number | null
      verification_level?: string | null
      is_verified?: boolean | null
    } | null
    const total = num(q.total)
    const rating = num(pro?.rating)
    const reviews = num(pro?.total_reviews)
    const jobs = num(pro?.completed_jobs)
    const matchScore = matchByPro.get(String(q.professional_id)) ?? null
    const reasons: string[] = []

    let score = 40
    if (midBudget > 0 && total > 0) {
      const ratio = total / midBudget
      if (ratio >= 0.85 && ratio <= 1.15) {
        score += 28
        reasons.push('price_fit')
      } else if (ratio < 0.85) {
        score += 18
        reasons.push('below_budget')
      } else if (ratio <= 1.35) {
        score += 12
        reasons.push('near_budget')
      } else {
        score += 4
        reasons.push('above_budget')
      }
    } else {
      score += 10
    }

    if (rating >= 4.5) {
      score += 14
      reasons.push('high_rating')
    } else if (rating >= 4) {
      score += 10
    } else if (rating >= 3.5) {
      score += 5
    }

    if (jobs >= 20) {
      score += 10
      reasons.push('experienced')
    } else if (jobs >= 5) {
      score += 6
    }

    if (matchScore != null) {
      score += Math.min(15, matchScore / 8)
      if (matchScore >= 80) reasons.push('strong_match')
    }

    if (pro?.verification_level && pro.verification_level !== 'none') {
      score += 6
      reasons.push('verified')
    } else if (pro?.is_verified) {
      score += 3
      reasons.push('verified')
    }

    if (q.status === 'accepted') {
      score += 5
      reasons.push('accepted')
    }

    return {
      quoteId: String(q.id),
      applicationId: String(q.application_id),
      professionalId: String(q.professional_id),
      professionalName: pro?.full_name || 'Professional',
      photo: pro?.profile_photo || pro?.avatar_url || null,
      total,
      currency: String(q.currency || 'EUR'),
      status: String(q.status),
      rating,
      reviews,
      completedJobs: jobs,
      verification: pro?.verification_level || (pro?.is_verified ? 'verified' : null),
      matchScore,
      rankScore: Math.round(Math.min(100, score)),
      reasons,
      notes: (q.notes as string) || null,
      createdAt: String(q.created_at),
    }
  })

  ranked.sort((a, b) => b.rankScore - a.rankScore || a.total - b.total)
  return ranked
}
