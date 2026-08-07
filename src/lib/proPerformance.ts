/**
 * Pro performance learning — anonymized success signals for AI Matcher.
 * Never stores private client project details.
 */
import { supabase } from './supabase'

export type ProPerformanceProfile = {
  professional_id: string
  jobs_completed: number
  avg_quote_total: number | null
  avg_duration_days: number | null
  on_time_rate: number | null
  satisfaction_rate: number | null
  return_rate: number | null
  recommend_rate: number | null
  specialty_slugs: string[]
  last_computed_at: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchProPerformance(
  professionalId: string,
): Promise<ProPerformanceProfile | null> {
  const { data, error } = await db
    .from('pro_performance_profiles')
    .select('*')
    .eq('professional_id', professionalId)
    .maybeSingle()
  if (error || !data) return null
  return data as ProPerformanceProfile
}

export async function fetchProPerformanceMap(
  ids: string[],
): Promise<Map<string, ProPerformanceProfile>> {
  const map = new Map<string, ProPerformanceProfile>()
  if (!ids.length) return map
  const { data } = await db
    .from('pro_performance_profiles')
    .select('*')
    .in('professional_id', ids)
  for (const row of (data as ProPerformanceProfile[] | null) ?? []) {
    map.set(row.professional_id, row)
  }
  return map
}

/**
 * Recompute performance from closed hired listings + reviews + quotes.
 * Safe to call after project completion.
 */
export async function recomputeProPerformance(
  professionalId: string,
): Promise<ProPerformanceProfile | null> {
  const { data: hired } = await db
    .from('listings')
    .select('id, pipeline_stage, pipeline_completed_at, created_at, subcategory_slugs')
    .eq('hired_professional_id', professionalId)
    .limit(80)

  const jobs = (hired as Array<Record<string, unknown>> | null) ?? []
  const completed = jobs.filter(
    (j) => j.pipeline_stage === 'completed' || j.pipeline_completed_at,
  )

  const listingIds = jobs.map((j) => String(j.id))
  let avgQuote: number | null = null
  if (listingIds.length) {
    const { data: quotes } = await supabase
      .from('quotes')
      .select('total, status')
      .eq('professional_id', professionalId)
      .in('listing_id', listingIds)
      .in('status', ['accepted', 'sent'])
    const totals = ((quotes as Array<{ total?: number }> | null) ?? [])
      .map((q) => Number(q.total) || 0)
      .filter((n) => n > 0)
    if (totals.length) avgQuote = totals.reduce((a, b) => a + b, 0) / totals.length
  }

  let avgDays: number | null = null
  const durations: number[] = []
  for (const j of completed) {
    const start = j.created_at ? new Date(String(j.created_at)).getTime() : 0
    const end = j.pipeline_completed_at
      ? new Date(String(j.pipeline_completed_at)).getTime()
      : 0
    if (start && end && end > start) {
      durations.push((end - start) / (1000 * 60 * 60 * 24))
    }
  }
  if (durations.length) avgDays = durations.reduce((a, b) => a + b, 0) / durations.length

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, would_recommend, speed, reliability')
    .eq('professional_id', professionalId)
    .limit(200)

  const rev = (reviews as Array<Record<string, unknown>> | null) ?? []
  const satisfaction =
    rev.length > 0
      ? rev.filter((r) => Number(r.rating) >= 4).length / rev.length
      : null
  const recommend =
    rev.length > 0
      ? rev.filter((r) => r.would_recommend === true).length / rev.length
      : null

  // Return rate proxy: low reliability/speed reviews
  const returnRate =
    rev.length > 0
      ? rev.filter((r) => Number(r.reliability) > 0 && Number(r.reliability) <= 2).length /
        rev.length
      : null

  const specialty = new Set<string>()
  for (const j of jobs) {
    const slugs = (j.subcategory_slugs as string[] | null) || []
    for (const s of slugs) specialty.add(s)
  }

  const onTime =
    rev.length > 0
      ? rev.filter((r) => Number(r.speed) >= 4).length / rev.length
      : completed.length
        ? 0.8
        : null

  const payload = {
    professional_id: professionalId,
    jobs_completed: Math.max(completed.length, 0),
    avg_quote_total: avgQuote != null ? Math.round(avgQuote * 100) / 100 : null,
    avg_duration_days: avgDays != null ? Math.round(avgDays * 10) / 10 : null,
    on_time_rate: onTime != null ? Math.round(onTime * 1000) / 1000 : null,
    satisfaction_rate: satisfaction != null ? Math.round(satisfaction * 1000) / 1000 : null,
    return_rate: returnRate != null ? Math.round(returnRate * 1000) / 1000 : null,
    recommend_rate: recommend != null ? Math.round(recommend * 1000) / 1000 : null,
    specialty_slugs: [...specialty].slice(0, 20),
    last_computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Prefer SECURITY DEFINER RPC so customer complete/review can persist learning
  const { error: rpcErr } = await supabase.rpc('upsert_pro_performance_profile', {
    p_professional_id: professionalId,
    p_jobs_completed: payload.jobs_completed,
    p_avg_quote_total: payload.avg_quote_total,
    p_avg_duration_days: payload.avg_duration_days,
    p_on_time_rate: payload.on_time_rate,
    p_satisfaction_rate: payload.satisfaction_rate,
    p_return_rate: payload.return_rate,
    p_recommend_rate: payload.recommend_rate,
    p_specialty_slugs: payload.specialty_slugs,
  })

  if (rpcErr) {
    const { error } = await db
      .from('pro_performance_profiles')
      .upsert(payload, { onConflict: 'professional_id' })
    if (error) {
      console.warn('recomputeProPerformance:', rpcErr.message || error.message)
      return null
    }
  }

  // Soft bump completed_jobs on profile when learning has more evidence
  if (payload.jobs_completed > 0) {
    await supabase
      .from('profiles')
      .update({ completed_jobs: payload.jobs_completed } as never)
      .eq('id', professionalId)
  }

  return (await fetchProPerformance(professionalId)) || (payload as ProPerformanceProfile)
}

/** Match boost 0–8 from performance likelihood of success. */
export function performanceMatchBoost(
  perf: ProPerformanceProfile | null | undefined,
  subcategorySlugs?: string[],
): { points: number; reason?: string } {
  if (!perf || perf.jobs_completed < 1) return { points: 0 }
  let points = 0
  let reason: string | undefined
  if ((perf.satisfaction_rate ?? 0) >= 0.85) {
    points += 3
    reason = 'high_satisfaction'
  } else if ((perf.satisfaction_rate ?? 0) >= 0.7) {
    points += 1.5
  }
  if ((perf.on_time_rate ?? 0) >= 0.8) points += 2
  if ((perf.recommend_rate ?? 0) >= 0.8) points += 1.5
  if ((perf.return_rate ?? 1) <= 0.1) points += 1
  if (subcategorySlugs?.length && perf.specialty_slugs?.length) {
    const hit = subcategorySlugs.some((s) => perf.specialty_slugs.includes(s))
    if (hit) {
      points += 2
      reason = reason || 'specialty_fit'
    }
  }
  return { points: Math.min(8, points), reason }
}
