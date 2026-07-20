import { supabase } from '../supabase'

export async function notifyJobMatchProfessionals(
  listingId: string,
  profileIds: string[],
): Promise<number> {
  if (!profileIds.length) return 0

  const { data, error } = await supabase.rpc('notify_job_match_professionals', {
    p_listing_id: listingId,
    p_profile_ids: profileIds,
  })

  if (error) {
    console.error('notify_job_match_professionals:', error.message)
    return 0
  }

  return typeof data === 'number' ? data : 0
}

export function filterNotifyCandidates(
  ranked: { profileId: string; reasons: string[]; score: number }[],
  criteria: { city?: string; subcategorySlugs?: string[]; categorySlug?: string },
): string[] {
  const hasGeo = Boolean(criteria.city?.trim())
  const hasTrade =
    Boolean(criteria.subcategorySlugs?.length) || Boolean(criteria.categorySlug)

  return ranked
    .filter((match) => {
      const local =
        match.reasons.includes('near_location') ||
        match.reasons.includes('distance_close') ||
        match.reasons.includes('within_radius') ||
        match.reasons.includes('same_country') ||
        match.reasons.includes('subcategory_match') ||
        match.reasons.includes('trade_group_match') ||
        match.reasons.includes('category_match')

      if (!local) return false
      if (
        hasGeo &&
        !match.reasons.some((r) =>
          ['near_location', 'distance_close', 'within_radius', 'same_country'].includes(r),
        )
      ) {
        return false
      }
      if (
        hasTrade &&
        !match.reasons.some((r) =>
          ['subcategory_match', 'trade_group_match', 'category_match'].includes(r),
        )
      ) {
        return false
      }
      return match.score >= 70
    })
    .map((m) => m.profileId)
}
