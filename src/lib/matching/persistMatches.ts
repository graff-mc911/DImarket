import { supabase } from '../supabase'
import { rankProfessionals, type MatchingCriteria } from '../bots/matching/rank'

export async function runMatchingForListing(
  listingId: string,
  criteria: MatchingCriteria,
): Promise<void> {
  const ranked = await rankProfessionals(criteria, 15)
  if (!ranked.length) return

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

export async function fetchMatchScoresForListing(listingId: string) {
  const { data, error } = await supabase
    .from('match_scores')
    .select('*, contractor:profiles(id, full_name, location, rating, total_reviews, is_verified)')
    .eq('listing_id', listingId)
    .order('score', { ascending: false })
    .limit(12)

  if (error) {
    if (error.code === '42P01') return []
    console.error('fetchMatchScoresForListing:', error)
    return []
  }
  return data ?? []
}
