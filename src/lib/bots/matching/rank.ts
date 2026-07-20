/**
 * @deprecated Import from `src/lib/matching/aiMatchService` (or `src/lib/matching`).
 * Kept as a thin re-export for existing bots / callers.
 */
export {
  rankProfessionals,
  scoreMatchCandidate,
  calibrateMatchPercent,
  criteriaFromListing,
  TOP_MATCH_LIMIT,
  MATCH_WEIGHTS,
  type MatchingCriteria,
  type MatchCandidate,
} from '../../matching/aiMatchService'
