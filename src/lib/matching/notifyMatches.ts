import { supabase } from '../supabase'

export async function notifyJobMatchProfessionals(
  listingId: string,
  profileIds: string[],
): Promise<number> {
  if (!profileIds.length) return 0

  const { data, error } = await supabase.rpc(
    'notify_job_match_professionals' as never,
    {
      p_listing_id: listingId,
      p_profile_ids: profileIds,
    } as never,
  )

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
      const geoHit = match.reasons.some((r) =>
        ['near_location', 'distance_close', 'within_radius', 'same_country'].includes(r),
      )
      const tradeHit = match.reasons.some((r) =>
        ['subcategory_match', 'trade_group_match', 'category_match'].includes(r),
      )

      if (!geoHit && !tradeHit) return false
      if (hasGeo && !geoHit) return false
      if (hasTrade && !tradeHit) return false
      return match.score >= 70
    })
    .map((m) => m.profileId)
}
