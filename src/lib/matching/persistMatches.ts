import { supabase } from '../supabase'
import {
  rankProfessionals,
  TOP_MATCH_LIMIT,
  type MatchingCriteria,
} from './aiMatchService'
import type { RankedMatch } from '../bots/types'
import {
  filterNotifyCandidates,
  notifyJobMatchProfessionals,
} from './notifyMatches'
import { computeMatchFacets } from './matchFacets'

export interface MatchingRunResult {
  ranked: RankedMatch[]
  facets: ReturnType<typeof computeMatchFacets>
  notifiedCount: number
  notifiedIds: string[]
}

/**
 * Run AI Match for a listing: rank Top 10, persist scores, notify pros.
 * Reusable after wizard publish, Create Ad, or AI job draft.
 */
export async function runMatchingForListing(
  listingId: string,
  criteria: MatchingCriteria,
  options?: { limit?: number },
): Promise<MatchingRunResult> {
  const limit = options?.limit ?? TOP_MATCH_LIMIT
  const ranked = await rankProfessionals(criteria, limit)
  const facets = computeMatchFacets(ranked)

  if (ranked.length) {
    const rows = ranked.map((m, i) => ({
      listing_id: listingId,
      contractor_id: m.profileId,
      score: m.score,
      reasons: m.reasons,
      rank_position: i + 1,
      explanation: m.explanation ?? null,
      breakdown: m.breakdown ?? {},
      distance_km: m.distanceKm ?? null,
      value_score: m.valueScore ?? null,
      response_score: m.responseScore ?? null,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('match_scores').upsert(rows as never, {
      onConflict: 'listing_id,contractor_id',
    })
    if (error) {
      // Fallback without new columns if migration not applied yet
      console.error('match_scores upsert:', error)
      const legacy = ranked.map((m, i) => ({
        listing_id: listingId,
        contractor_id: m.profileId,
        score: m.score,
        reasons: m.reasons,
        rank_position: i + 1,
      }))
      const retry = await supabase.from('match_scores').upsert(legacy as never, {
        onConflict: 'listing_id,contractor_id',
      })
      if (retry.error) console.error('match_scores upsert legacy:', retry.error)
    }

    const { error: matchErr } = await supabase.from('ai_matches').insert({
      listing_id: listingId,
      criteria: { ...criteria, facets },
      matches: ranked,
    } as never)
    if (matchErr && matchErr.code !== '42P01') console.error('ai_matches:', matchErr)
  }

  const notifyIds = filterNotifyCandidates(ranked, criteria)
  let notifiedCount = 0
  if (notifyIds.length) {
    notifiedCount = await notifyJobMatchProfessionals(listingId, notifyIds)
    void invokeMatchChannelNotify(listingId, notifyIds)
  }

  return { ranked, facets, notifiedCount, notifiedIds: notifyIds }
}

async function invokeMatchChannelNotify(
  listingId: string,
  profileIds: string[],
): Promise<void> {
  try {
    await supabase.functions.invoke('match-notify-channels', {
      body: { listing_id: listingId, profile_ids: profileIds },
    })
  } catch (err) {
    console.warn('match-notify-channels:', err)
  }
}

export async function fetchMatchScoresForListing(listingId: string, limit = TOP_MATCH_LIMIT) {
  const { data, error } = await supabase
    .from('match_scores')
    .select(
      '*, contractor:profiles(id, full_name, location, rating, total_reviews, is_verified, is_premium, verification_level, profile_photo, avatar_url, completed_jobs, availability_status, languages, portfolio_images, response_rate)',
    )
    .eq('listing_id', listingId)
    .order('rank_position', { ascending: true })
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') return []
    const retry = await supabase
      .from('match_scores')
      .select(
        '*, contractor:profiles(id, full_name, location, rating, total_reviews, is_verified, verification_level, profile_photo, avatar_url)',
      )
      .eq('listing_id', listingId)
      .order('score', { ascending: false })
      .limit(limit)
    if (retry.error) {
      console.error('fetchMatchScoresForListing:', error)
      return []
    }
    return retry.data ?? []
  }
  return data ?? []
}

export function listingCityFromLocation(location: string | null | undefined): string | undefined {
  return location?.split(',')[0]?.trim() || undefined
}
