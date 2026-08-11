/**
 * Deterministic B2B match scoring (0–100).
 * Architecture leaves room for AI re-ranking later — do not call paid APIs here.
 *
 * TODO(Phase 2): optional AI enrichment via matchingService.enrichWithAi()
 */

import type {
  AgentProfile,
  ManufacturerProfile,
  MatchBreakdown,
  MatchResult,
  RepresentationOpportunity,
} from './types'
import { normalizeSpokenLanguageCode } from '../languageDisplay'

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function norm(s: string | null | undefined) {
  return (s ?? '').trim().toLowerCase()
}

/** Language overlap treats UK/uk/ua as the same Ukrainian tag (UA). */
function languageKey(s: string | null | undefined) {
  const spoken = normalizeSpokenLanguageCode(s)
  return spoken ? spoken.toLowerCase() : ''
}

function overlapScore(a: string[] | null | undefined, b: string[] | null | undefined): number {
  const left = new Set((a ?? []).map(norm).filter(Boolean))
  const right = new Set((b ?? []).map(norm).filter(Boolean))
  if (left.size === 0 || right.size === 0) return 40
  let hits = 0
  for (const x of left) if (right.has(x)) hits += 1
  const denom = Math.min(left.size, right.size)
  return clamp(Math.round((hits / denom) * 100))
}

function languageOverlapScore(a: string[] | null | undefined, b: string[] | null | undefined): number {
  const left = new Set((a ?? []).map(languageKey).filter(Boolean))
  const right = new Set((b ?? []).map(languageKey).filter(Boolean))
  if (left.size === 0 || right.size === 0) return 40
  let hits = 0
  for (const x of left) if (right.has(x)) hits += 1
  const denom = Math.min(left.size, right.size)
  return clamp(Math.round((hits / denom) * 100))
}

function countryScore(a: string | null | undefined, b: string | null | undefined, listB?: string[]): number {
  const ca = norm(a)
  if (!ca) return 35
  if (ca && norm(b) === ca) return 100
  if (listB?.some((c) => norm(c) === ca)) return 100
  if (listB?.some((c) => norm(c).includes(ca) || ca.includes(norm(c)))) return 70
  return 20
}

function experienceScore(years: number | null | undefined, requiredYears: number | null | undefined): number {
  if (requiredYears == null || requiredYears <= 0) return 70
  if (years == null) return 40
  if (years >= requiredYears) return 100
  if (years >= requiredYears * 0.7) return 75
  if (years >= requiredYears * 0.4) return 50
  return 25
}

function labelFor(score: number): MatchResult['label'] {
  if (score >= 85) return 'excellent'
  if (score >= 65) return 'good'
  return 'potential'
}

function weighted(breakdown: MatchBreakdown): number {
  const score =
    breakdown.country * 0.22 +
    breakdown.category * 0.18 +
    breakdown.industry * 0.14 +
    breakdown.language * 0.14 +
    breakdown.experience * 0.12 +
    breakdown.territory * 0.08 +
    breakdown.customerType * 0.07 +
    breakdown.representationType * 0.05
  return clamp(Math.round(score))
}

export function calculateAgentManufacturerMatch(
  agent: Pick<
    AgentProfile,
    | 'country'
    | 'categories'
    | 'industries'
    | 'languages'
    | 'years_experience'
    | 'service_regions'
    | 'client_types'
    | 'representation_type'
    | 'territory'
  >,
  manufacturer: Pick<
    ManufacturerProfile,
    | 'country'
    | 'categories'
    | 'target_markets'
    | 'countries_available'
    | 'languages'
    | 'minimum_experience_years'
    | 'exclusive_representation'
    | 'non_exclusive_representation'
  >,
): MatchResult {
  const breakdown: MatchBreakdown = {
    country: countryScore(agent.country, manufacturer.country, manufacturer.countries_available),
    category: overlapScore(agent.categories, manufacturer.categories),
    industry: overlapScore(agent.industries, manufacturer.target_markets),
    language: languageOverlapScore(agent.languages, manufacturer.languages),
    experience: experienceScore(agent.years_experience, manufacturer.minimum_experience_years),
    territory: overlapScore(agent.service_regions, manufacturer.countries_available),
    customerType: overlapScore(agent.client_types, manufacturer.target_markets),
    representationType: (() => {
      const rt = norm(agent.representation_type)
      if (!rt) return 55
      if (manufacturer.exclusive_representation && rt.includes('exclusive')) return 100
      if (manufacturer.non_exclusive_representation && (rt.includes('non') || rt.includes('multi'))) return 95
      return 60
    })(),
  }
  const score = weighted(breakdown)
  return { score, label: labelFor(score), breakdown }
}

export function calculateOpportunityAgentMatch(
  agent: Pick<
    AgentProfile,
    | 'country'
    | 'categories'
    | 'industries'
    | 'languages'
    | 'years_experience'
    | 'service_regions'
    | 'client_types'
    | 'representation_type'
  >,
  opportunity: Pick<
    RepresentationOpportunity,
    | 'category'
    | 'target_country'
    | 'target_regions'
    | 'target_customer_types'
    | 'required_languages'
    | 'exclusive'
    | 'required_experience'
  >,
): MatchResult {
  const requiredYears = (() => {
    const raw = opportunity.required_experience ?? ''
    const m = raw.match(/(\d+)/)
    return m ? Number(m[1]) : null
  })()

  const breakdown: MatchBreakdown = {
    country: countryScore(agent.country, opportunity.target_country, opportunity.target_regions),
    category: opportunity.category
      ? overlapScore(agent.categories, [opportunity.category])
      : overlapScore(agent.categories, []),
    industry: overlapScore(agent.industries, opportunity.target_customer_types),
    language: languageOverlapScore(agent.languages, opportunity.required_languages),
    experience: experienceScore(agent.years_experience, requiredYears),
    territory: overlapScore(agent.service_regions, [
      ...(opportunity.target_regions ?? []),
      ...(opportunity.target_country ? [opportunity.target_country] : []),
    ]),
    customerType: overlapScore(agent.client_types, opportunity.target_customer_types),
    representationType: (() => {
      const rt = norm(agent.representation_type)
      if (!opportunity.exclusive) return 70
      if (rt.includes('exclusive')) return 100
      return 45
    })(),
  }
  const score = weighted(breakdown)
  return { score, label: labelFor(score), breakdown }
}

export function getRecommendedAgents(
  manufacturer: ManufacturerProfile,
  agents: AgentProfile[],
  limit = 12,
): Array<{ agent: AgentProfile; match: MatchResult }> {
  return agents
    .filter((a) => a.is_published && a.available_for_new_brands)
    .map((agent) => ({ agent, match: calculateAgentManufacturerMatch(agent, manufacturer) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)
}

export function getRecommendedOpportunities(
  agent: AgentProfile,
  opportunities: RepresentationOpportunity[],
  limit = 12,
): Array<{ opportunity: RepresentationOpportunity; match: MatchResult }> {
  return opportunities
    .filter((o) => o.status === 'published')
    .map((opportunity) => ({
      opportunity,
      match: calculateOpportunityAgentMatch(agent, opportunity),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)
}

/**
 * TODO(Phase 2): Call edge function for AI re-rank / embeddings.
 * Keep signature stable so UI can switch without rewrite.
 */
export async function enrichWithAi(_input: {
  kind: 'agent-manufacturer' | 'opportunity-agent'
  base: MatchResult
}): Promise<MatchResult> {
  // No paid AI in Phase 1 — return deterministic score unchanged.
  return _input.base
}
