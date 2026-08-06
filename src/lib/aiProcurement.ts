/**
 * AI Procurement — BOM → marketplace supplier compare → client approve.
 * Reuses cost estimate materials + sell-rent listings (no parallel shop system).
 */
import { supabase } from './supabase'
import type { MaterialLine } from './costEstimatorTypes'
import { haversineKm } from './projectFeed'

export type SupplierOption = {
  listingId: string
  title: string
  price: number | null
  currency: string
  city: string | null
  distanceKm: number | null
  score: number
  reasons: string[]
}

export type ProcurementLine = {
  materialId: string
  name: string
  category: string
  quantity: number
  unit: string
  estimatedUnitCost: number
  suppliers: SupplierOption[]
  bestListingId: string | null
}

export type ProcurementPlan = {
  lines: ProcurementLine[]
  totalEstimated: number
  supplierCount: number
  currency: string
}

function scoreSupplier(
  price: number | null,
  refUnit: number,
  distanceKm: number | null,
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 40
  if (price != null && refUnit > 0) {
    const ratio = price / refUnit
    if (ratio <= 0.9) {
      score += 30
      reasons.push('below_estimate')
    } else if (ratio <= 1.15) {
      score += 22
      reasons.push('price_fit')
    } else if (ratio <= 1.4) {
      score += 10
      reasons.push('above_estimate')
    } else {
      score += 2
    }
  } else {
    score += 8
    reasons.push('price_tbd')
  }
  if (distanceKm != null) {
    if (distanceKm <= 15) {
      score += 20
      reasons.push('nearby')
    } else if (distanceKm <= 40) {
      score += 12
    } else if (distanceKm <= 100) {
      score += 6
    }
  } else {
    score += 5
  }
  return { score: Math.min(100, score), reasons }
}

/** Build procurement plan from estimate BOM + live marketplace search. */
export async function buildProcurementPlan(opts: {
  materials: MaterialLine[]
  city?: string
  lat?: number | null
  lng?: number | null
}): Promise<ProcurementPlan> {
  const origin =
    opts.lat != null && opts.lng != null ? { lat: opts.lat, lon: opts.lng } : null
  const lines: ProcurementLine[] = []
  let supplierCount = 0

  for (const m of opts.materials.slice(0, 12)) {
    const like = `%${m.searchQuery.replace(/[%_]/g, '').slice(0, 40)}%`
    const { data } = await supabase
      .from('listings')
      .select(
        'id, title, price, currency, city_name, location, latitude, longitude, listing_type',
      )
      .eq('status', 'active')
      .neq('listing_type', 'service_request')
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(6)

    const suppliers: SupplierOption[] = []
    for (const row of (data as Array<Record<string, unknown>> | null) ?? []) {
      let distanceKm: number | null = null
      const la = row.latitude != null ? Number(row.latitude) : null
      const lo = row.longitude != null ? Number(row.longitude) : null
      if (origin && la != null && lo != null && Number.isFinite(la) && Number.isFinite(lo)) {
        distanceKm = haversineKm(origin, { lat: la, lon: lo })
      }
      const price = row.price != null ? Number(row.price) : null
      const scored = scoreSupplier(price, m.unitPriceStandard, distanceKm)
      suppliers.push({
        listingId: String(row.id),
        title: String(row.title || 'Offer'),
        price,
        currency: String(row.currency || 'EUR'),
        city: (row.city_name as string) || (row.location as string) || null,
        distanceKm,
        score: scored.score,
        reasons: scored.reasons,
      })
    }
    suppliers.sort((a, b) => b.score - a.score || (a.price ?? 9e9) - (b.price ?? 9e9))
    supplierCount += suppliers.length
    lines.push({
      materialId: m.id,
      name: m.name,
      category: m.category,
      quantity: m.quantity,
      unit: m.unit,
      estimatedUnitCost: m.unitPriceStandard,
      suppliers: suppliers.slice(0, 4),
      bestListingId: suppliers[0]?.listingId ?? null,
    })
  }

  const totalEstimated = lines.reduce(
    (s, l) => s + l.estimatedUnitCost * l.quantity,
    0,
  )

  return {
    lines,
    totalEstimated: Math.round(totalEstimated * 100) / 100,
    supplierCount,
    currency: 'EUR',
  }
}

export async function approveProcurementItem(opts: {
  listingId: string | null
  estimateId: string | null
  materialName: string
  category: string
  quantity: number
  unit: string
  chosenListingId: string
  chosenPrice: number | null
  deliveryEstimate?: string
}): Promise<{ id: string } | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('project_procurement_items')
    .insert({
      listing_id: opts.listingId,
      cost_estimate_id: opts.estimateId,
      material_name: opts.materialName,
      category: opts.category,
      quantity: opts.quantity,
      unit: opts.unit,
      chosen_listing_id: opts.chosenListingId,
      chosen_price: opts.chosenPrice,
      delivery_estimate: opts.deliveryEstimate || null,
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !data) return { error: error?.message || 'approve_failed' }
  return { id: String(data.id) }
}
