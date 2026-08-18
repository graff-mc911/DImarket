/**
 * Persist cost estimates for logged-in users + localStorage draft fallback.
 */
import { supabase } from './supabase'
import type { EstimatorState, FullCostEstimate } from './costEstimatorTypes'

export type SavedCostEstimateRow = {
  id: string
  user_id: string
  title: string
  project_type: string
  location_label: string | null
  area_sqm: number | null
  currency: string
  total_economy: number | null
  total_standard: number | null
  total_premium: number | null
  confidence: number | null
  estimate_json: FullCostEstimate
  input_json: Record<string, unknown>
  listing_id: string | null
  archived?: boolean | null
  created_at: string
  updated_at: string
}

const LOCAL_KEY = 'dimarket_cost_estimates_v1'

// Table may not be in generated types until migration is applied
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

function serializableState(state: EstimatorState) {
  return {
    projectTypeId: state.projectTypeId,
    calculatorTypeId: state.calculatorTypeId,
    description: state.description,
    location: state.location,
    measurements: state.measurements,
    clarifications: state.clarifications || {},
    selectedFeatureIds: state.selectedFeatureIds || [],
    includeMaterials: state.includeMaterials !== false,
    budgetTier: state.budgetTier || 'standard',
    fileCount: state.files.length,
    photoCount: state.files.filter((f) => f.kind === 'photo').length,
  }
}

export async function saveCostEstimate(opts: {
  userId: string | null
  state: EstimatorState
  estimate: FullCostEstimate
  title?: string
}): Promise<{ id: string; remote: boolean }> {
  const title =
    opts.title ||
    `${opts.estimate.tradeLabel} — ${opts.state.location.city || 'Project'} (${opts.state.measurements.areaSqm} m²)`
  const payload = {
    title,
    project_type: opts.estimate.projectTypeId,
    location_label:
      opts.state.location.locationLabel ||
      [opts.state.location.city, opts.state.location.country].filter(Boolean).join(', '),
    area_sqm: opts.state.measurements.areaSqm,
    currency: opts.estimate.currency,
    total_economy: opts.estimate.totals.economy.grandTotal,
    total_standard: opts.estimate.totals.standard.grandTotal,
    total_premium: opts.estimate.totals.premium.grandTotal,
    confidence: opts.estimate.confidence,
    estimate_json: opts.estimate,
    input_json: serializableState(opts.state),
  }

  if (opts.userId) {
    const { data, error } = await db
      .from('cost_estimates')
      .insert({ user_id: opts.userId, ...payload })
      .select('id')
      .single()
    if (!error && data?.id) {
      return { id: String(data.id), remote: true }
    }
  }

  const id = crypto.randomUUID()
  const local = {
    id,
    user_id: opts.userId || 'local',
    ...payload,
    listing_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as SavedCostEstimateRow
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as SavedCostEstimateRow[]
    prev.unshift(local)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prev.slice(0, 30)))
  } catch {
    /* ignore */
  }
  return { id, remote: false }
}

export async function listCostEstimates(
  userId: string | null,
  opts?: { includeArchived?: boolean },
): Promise<SavedCostEstimateRow[]> {
  const local = (() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as SavedCostEstimateRow[]
    } catch {
      return []
    }
  })()

  const filterArchived = (rows: SavedCostEstimateRow[]) =>
    opts?.includeArchived ? rows : rows.filter((r) => !r.archived)

  if (!userId) return filterArchived(local)

  const { data, error } = await db
    .from('cost_estimates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(40)

  if (error || !data) return filterArchived(local)
  return filterArchived(data as SavedCostEstimateRow[])
}

export async function archiveCostEstimate(
  id: string,
  userId: string | null,
  archived = true,
): Promise<void> {
  if (userId) {
    await db
      .from('cost_estimates')
      .update({ archived, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
  }
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as SavedCostEstimateRow[]
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify(prev.map((x) => (x.id === id ? { ...x, archived } : x))),
    )
  } catch {
    /* ignore */
  }
}

export async function deleteCostEstimate(id: string, userId: string | null): Promise<void> {
  if (userId) {
    await db.from('cost_estimates').delete().eq('id', id).eq('user_id', userId)
  }
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as SavedCostEstimateRow[]
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prev.filter((x) => x.id !== id)))
  } catch {
    /* ignore */
  }
}

export async function getCostEstimateById(
  id: string,
  userId: string | null,
): Promise<SavedCostEstimateRow | null> {
  if (userId) {
    const { data, error } = await db
      .from('cost_estimates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (!error && data) return data as SavedCostEstimateRow
  }
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as SavedCostEstimateRow[]
    return prev.find((x) => x.id === id) ?? null
  } catch {
    return null
  }
}

export async function duplicateCostEstimate(
  id: string,
  userId: string | null,
): Promise<{ id: string } | null> {
  const row = await getCostEstimateById(id, userId)
  if (!row) return null
  const title = `${row.title} (copy)`
  if (userId) {
    const { data, error } = await db
      .from('cost_estimates')
      .insert({
        user_id: userId,
        title,
        project_type: row.project_type,
        location_label: row.location_label,
        area_sqm: row.area_sqm,
        currency: row.currency,
        total_economy: row.total_economy,
        total_standard: row.total_standard,
        total_premium: row.total_premium,
        confidence: row.confidence,
        estimate_json: row.estimate_json,
        input_json: row.input_json,
      })
      .select('id')
      .single()
    if (!error && data?.id) return { id: String(data.id) }
  }
  const newId = crypto.randomUUID()
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as SavedCostEstimateRow[]
    prev.unshift({
      ...row,
      id: newId,
      title,
      listing_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prev.slice(0, 30)))
  } catch {
    return null
  }
  return { id: newId }
}

export async function saveCostEstimateOutcome(opts: {
  userId: string
  estimateId: string | null
  projectType: string
  country: string
  region: string
  areaSqm: number
  estimatedStandard: number
  actualTotal: number
  currency: string
  consented: boolean
}): Promise<{ ok: boolean }> {
  if (!opts.consented || !opts.userId || !(opts.actualTotal > 0)) return { ok: false }
  const { error } = await db.from('cost_estimate_outcomes').insert({
    cost_estimate_id: opts.estimateId,
    user_id: opts.userId,
    project_type: opts.projectType,
    country: opts.country || null,
    region: opts.region || null,
    area_sqm: opts.areaSqm,
    estimated_standard: opts.estimatedStandard,
    actual_total: opts.actualTotal,
    currency: opts.currency || 'EUR',
    consented: true,
  })
  return { ok: !error }
}

export async function linkEstimateToListing(
  estimateId: string,
  listingId: string,
  userId: string,
): Promise<void> {
  await db
    .from('cost_estimates')
    .update({ listing_id: listingId, updated_at: new Date().toISOString() })
    .eq('id', estimateId)
    .eq('user_id', userId)
}
