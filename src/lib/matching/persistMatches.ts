import { supabase } from '../supabase'
import { rankProfessionals, type MatchingCriteria } from '../bots/matching/rank'
import type { RankedMatch } from '../bots/types'
import {
  filterNotifyCandidates,
  notifyJobMatchProfessionals,
} from './notifyMatches'

export interface MatchingRunResult {
  ranked: RankedMatch[]
  notifiedCount: number
  notifiedIds: string[]
}

export async function runMatchingForListing(
  listingId: string,
  criteria: MatchingCriteria,
): Promise<MatchingRunResult> {
  const ranked = await rankProfessionals(criteria, 15)

  if (ranked.length) {
    const rows = ranked.map((m, i) => ({
      listing_id: listingId,
      contractor_id: m.profileId,
      score: m.score,
      reasons: m.reasons,
      rank_position: i + 1,
    }))

    const { error } = await supabase.from('match_scores').upsert(rows, {
      onConflict: 'listing_id,contractor_id',
    })
    if (error) console.error('match_scores upsert:', error)

    const { error: matchErr } = await supabase.from('ai_matches').insert({
      listing_id: listingId,
      criteria,
      matches: ranked,
    })
    if (matchErr && matchErr.code !== '42P01') console.error('ai_matches:', matchErr)
  }

  const notifyIds = filterNotifyCandidates(ranked, criteria)
  let notifiedCount = 0
  if (notifyIds.length) {
    notifiedCount = await notifyJobMatchProfessionals(listingId, notifyIds)
    void invokeMatchChannelNotify(listingId, notifyIds)
  }

  return { ranked, notifiedCount, notifiedIds: notifyIds }
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

export async function fetchMatchScoresForListing(listingId: string, limit = 12) {
  const { data, error } = await supabase
    .from('match_scores')
    .select('*, contractor:profiles(id, full_name, location, rating, total_reviews, is_verified)')
    .eq('listing_id', listingId)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') return []
    console.error('fetchMatchScoresForListing:', error)
    return []
  }
  return data ?? []
}

export function listingCityFromLocation(location: string | null | undefined): string | undefined {
  return location?.split(',')[0]?.trim() || undefined
}
