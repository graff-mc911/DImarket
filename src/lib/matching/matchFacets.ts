import type { RankedMatch } from '../bots/types'

export type MatchFacetKey =
  | 'top'
  | 'best_value'
  | 'fastest_response'
  | 'highest_rating'
  | 'closest'

export type MatchFacets = {
  bestValueId: string | null
  fastestResponseId: string | null
  highestRatingId: string | null
  closestId: string | null
}

/** Derive highlight facets from a Top-N ranked list. */
export function computeMatchFacets(ranked: RankedMatch[]): MatchFacets {
  if (!ranked.length) {
    return {
      bestValueId: null,
      fastestResponseId: null,
      highestRatingId: null,
      closestId: null,
    }
  }

  let bestValue = ranked[0]
  let fastest = ranked[0]
  let highest = ranked[0]
  let closest: RankedMatch | null = null

  for (const m of ranked) {
    const valueA = m.valueScore ?? m.score
    const valueB = bestValue.valueScore ?? bestValue.score
    if (valueA > valueB) bestValue = m

    const respA = m.responseScore ?? m.responseRate ?? 0
    const respB = fastest.responseScore ?? fastest.responseRate ?? 0
    if (respA > respB) fastest = m

    if (
      m.rating > highest.rating ||
      (m.rating === highest.rating && m.totalReviews > highest.totalReviews)
    ) {
      highest = m
    }

    if (m.distanceKm != null) {
      if (closest == null || m.distanceKm < (closest.distanceKm ?? Infinity)) {
        closest = m
      }
    }
  }

  return {
    bestValueId: bestValue.profileId,
    fastestResponseId: fastest.profileId,
    highestRatingId: highest.profileId,
    closestId: closest?.profileId ?? null,
  }
}

export function facetLabelsForMatch(
  profileId: string,
  facets: MatchFacets,
): MatchFacetKey[] {
  const tags: MatchFacetKey[] = []
  if (facets.bestValueId === profileId) tags.push('best_value')
  if (facets.fastestResponseId === profileId) tags.push('fastest_response')
  if (facets.highestRatingId === profileId) tags.push('highest_rating')
  if (facets.closestId === profileId) tags.push('closest')
  return tags
}

export function sortMatchesByFacet(
  ranked: RankedMatch[],
  facet: MatchFacetKey,
): RankedMatch[] {
  const copy = [...ranked]
  switch (facet) {
    case 'best_value':
      return copy.sort(
        (a, b) => (b.valueScore ?? b.score) - (a.valueScore ?? a.score),
      )
    case 'fastest_response':
      return copy.sort(
        (a, b) =>
          (b.responseScore ?? b.responseRate ?? 0) -
          (a.responseScore ?? a.responseRate ?? 0),
      )
    case 'highest_rating':
      return copy.sort(
        (a, b) => b.rating - a.rating || b.totalReviews - a.totalReviews,
      )
    case 'closest':
      return copy.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return b.score - a.score
        if (a.distanceKm == null) return 1
        if (b.distanceKm == null) return -1
        return a.distanceKm - b.distanceKm
      })
    case 'top':
    default:
      return copy.sort((a, b) => b.score - a.score)
  }
}
