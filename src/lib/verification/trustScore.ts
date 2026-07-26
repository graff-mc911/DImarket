import { supabase } from '../supabase'
import type { Profile } from '../types'
import type { TrustBadgeSource } from './trustBadges'

export type TrustScoreBreakdown = {
  score: number
  verification_points: number
  reviews_points: number
  projects_points: number
  response_points: number
  profile_points: number
  tenure_points: number
  factors: Record<string, number>
  recommendations: string[]
  computed_at?: string
}

/** Client-side estimate when RPC / table not yet migrated */
export function estimateTrustScore(input: {
  profile: Profile | null
  badges?: TrustBadgeSource | null
  docTypes?: string[]
}): TrustScoreBreakdown {
  const p = input.profile
  const docs = new Set(input.docTypes ?? [])
  let verification = 0
  if (p?.email_verified_at) verification += 5
  if (p?.phone_verified_at) verification += 5
  if (p?.identity_verified || docs.has('identity') || docs.has('passport') || docs.has('id_card'))
    verification += 10
  if (p?.address_verified || docs.has('proof_of_address')) verification += 5
  if (p?.license_verified || docs.has('trade_license') || docs.has('professional_license'))
    verification += 8
  if (p?.business_verified || docs.has('business_registration')) verification += 7
  if (p?.insurance_verified || docs.has('insurance')) verification += 5
  if (p?.vat_verified || docs.has('vat')) verification += 3
  if (p?.is_premium) verification += 2
  if (p?.trusted_professional || (p?.trust_level ?? 0) >= 6) verification += 5
  verification = Math.min(40, verification)

  const reviews = Math.min(
    20,
    Math.min(p?.total_reviews ?? 0, 20) * 0.6 + Math.max((p?.rating ?? 0) - 3, 0) * 4,
  )
  const projects = Math.min(15, (p?.completed_jobs ?? 0) * 1.5)
  const response = Math.min(10, ((p?.response_rate ?? 0) / 100) * 10)

  let profilePts = 0
  if (p?.bio && p.bio.trim().length > 40) profilePts += 3
  if (p?.phone && p.phone.trim().length > 5) profilePts += 2
  if (p?.profile_photo || p?.avatar_url) profilePts += 3
  if (p?.location && p.location.trim().length > 2) profilePts += 2
  profilePts = Math.min(10, profilePts)

  const created = p?.created_at ? new Date(p.created_at).getTime() : Date.now()
  const years = (Date.now() - created) / (365.25 * 24 * 3600 * 1000)
  const tenure = Math.min(5, years * 2.5)

  const score = Math.round(Math.min(100, verification + reviews + projects + response + profilePts + tenure) * 10) / 10

  const recommendations: string[] = []
  if (!p?.phone_verified_at) recommendations.push('Verify your phone number')
  if (!p?.identity_verified && !docs.has('identity') && !docs.has('passport'))
    recommendations.push('Upload and verify an identity document')
  if (!p?.license_verified && !docs.has('trade_license'))
    recommendations.push('Add a professional license')
  if (!p?.insurance_verified && !docs.has('insurance'))
    recommendations.push('Upload liability insurance')
  if (!p?.address_verified && !docs.has('proof_of_address'))
    recommendations.push('Verify your address with a utility bill')
  if (!p?.bio || p.bio.trim().length < 40) recommendations.push('Complete your profile bio')
  if ((p?.completed_jobs ?? 0) < 3) recommendations.push('Add more completed projects')
  if ((p?.total_reviews ?? 0) < 3) recommendations.push('Collect more client reviews')

  return {
    score,
    verification_points: Math.round(verification * 10) / 10,
    reviews_points: Math.round(reviews * 10) / 10,
    projects_points: Math.round(projects * 10) / 10,
    response_points: Math.round(response * 10) / 10,
    profile_points: profilePts,
    tenure_points: Math.round(tenure * 10) / 10,
    factors: {
      verification,
      reviews,
      projects,
      response,
      profile: profilePts,
      tenure,
    },
    recommendations,
  }
}

export async function fetchTrustScore(profileId: string): Promise<TrustScoreBreakdown | null> {
  const { data, error } = await supabase
    .from('trust_scores')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (!error && data) {
    const row = data as Record<string, unknown>
    const recs = row.recommendations
    return {
      score: Number(row.score ?? 0),
      verification_points: Number(row.verification_points ?? 0),
      reviews_points: Number(row.reviews_points ?? 0),
      projects_points: Number(row.projects_points ?? 0),
      response_points: Number(row.response_points ?? 0),
      profile_points: Number(row.profile_points ?? 0),
      tenure_points: Number(row.tenure_points ?? 0),
      factors: (row.factors as Record<string, number>) ?? {},
      recommendations: Array.isArray(recs) ? (recs as string[]) : [],
      computed_at: row.computed_at as string | undefined,
    }
  }
  return null
}

export async function recomputeTrustScore(profileId: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('recompute_trust_score' as never, {
    p_profile_id: profileId,
  } as never)
  if (error) {
    console.error('recompute_trust_score:', error)
    return null
  }
  return typeof data === 'number' ? data : Number(data)
}
