/**
 * Scope of Work + tender payload from a FullCostEstimate.
 * Reuses create-project / matching — no separate tender system.
 */
import type { EstimatorState, FullCostEstimate, PricingTierId } from './costEstimatorTypes'
import { formatEuro } from './costEstimator'

export type EstimatorTenderPrefill = {
  tradeId: string
  subcategorySlug: string
  description: string
  country: string
  city: string
  postalCode: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
  budgetMin: number
  budgetMax: number
  selectedProfessionalIds: string[]
  estimateId: string | null
  tenderMode: boolean
  scopeOfWork: string
}

export function buildScopeOfWork(
  estimate: FullCostEstimate,
  state: EstimatorState,
  tier: PricingTierId = 'standard',
): string {
  const totals = estimate.totals[tier]
  const lines: string[] = [
    '=== SCOPE OF WORK (AI Cost Estimator) ===',
    `Project: ${estimate.tradeLabel}`,
    `Area: ${state.measurements.areaSqm} m²`,
    state.location.locationLabel
      ? `Location: ${state.location.locationLabel}`
      : [state.location.city, state.location.country].filter(Boolean).join(', '),
    '',
    '--- Client brief ---',
    state.description.trim() || '(no description)',
    '',
    '--- Work breakdown ---',
    ...estimate.workStages
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s, i) => `${i + 1}. ${s.label} (~${s.laborHours} h)`),
    '',
    '--- Required trades ---',
    ...estimate.specialists.map((s) => `• ${s.label} (~${s.laborHours} h)`),
    '',
    '--- Materials (BOM, reference) ---',
    ...estimate.materials.map(
      (m) =>
        `• ${m.name}: ${m.quantity} ${m.unit} (${m.category})`,
    ),
    '',
    '--- Timeline (reference) ---',
    ...estimate.timeline.map((p) => `• ${p.label}: ${p.daysMin}–${p.daysMax} days`),
    `Total duration: ${estimate.totalDaysMin}–${estimate.totalDaysMax} days`,
    `Target completion: ${new Date(estimate.estimatedCompletionIso).toLocaleDateString()}`,
    '',
    '--- Reference budget ---',
    `Economy: ${formatEuro(estimate.totals.economy.grandTotal)}`,
    `Standard: ${formatEuro(estimate.totals.standard.grandTotal)}`,
    `Premium: ${formatEuro(estimate.totals.premium.grandTotal)}`,
    `Selected tier (${tier}): ${formatEuro(totals.grandTotal)}`,
    `Labour ${formatEuro(totals.labor)} · Materials ${formatEuro(totals.materials)} · Equipment ${formatEuro(totals.equipment)}`,
    '',
    'This Scope of Work was generated from a DImarket reference estimate.',
    'Prices are estimated ranges — not binding quotes. Pros should submit their own offers.',
  ]
  return lines.filter((l) => l != null).join('\n')
}

export function buildTenderPrefill(opts: {
  estimate: FullCostEstimate
  state: EstimatorState
  tier: PricingTierId
  selectedProfessionalIds: string[]
  estimateId: string | null
  tradeId: string
  subcategorySlug: string
}): EstimatorTenderPrefill {
  const sow = buildScopeOfWork(opts.estimate, opts.state, opts.tier)
  return {
    tradeId: opts.tradeId,
    subcategorySlug: opts.subcategorySlug,
    description: sow,
    country: opts.state.location.country,
    city: opts.state.location.city,
    postalCode: opts.state.location.postalCode,
    locationLabel: opts.state.location.locationLabel,
    latitude: opts.state.location.latitude,
    longitude: opts.state.location.longitude,
    budgetMin: opts.estimate.totals.economy.grandTotal,
    budgetMax: opts.estimate.totals.premium.grandTotal,
    selectedProfessionalIds: opts.selectedProfessionalIds,
    estimateId: opts.estimateId,
    tenderMode: true,
    scopeOfWork: sow,
  }
}

/** Map tender prefill + contact into ProjectWizardState for one-click publish. */
export function wizardStateFromTenderPrefill(
  prefill: EstimatorTenderPrefill,
  contact: { name?: string; phone?: string; email?: string; language?: string },
): import('./projectWizard').ProjectWizardState {
  const invited =
    prefill.selectedProfessionalIds.length > 0
      ? `\n\n--- Invited professionals (from Cost Estimator) ---\n${prefill.selectedProfessionalIds
          .map((id) => `• profile:${id}`)
          .join('\n')}`
      : ''
  return {
    step: 7,
    tradeId: prefill.tradeId,
    subcategorySlug: prefill.subcategorySlug,
    description: `${prefill.scopeOfWork || prefill.description}${invited}`.trim(),
    files: [],
    country: prefill.country || '',
    city: prefill.city || '',
    postalCode: prefill.postalCode || '',
    locationLabel: prefill.locationLabel || '',
    latitude: prefill.latitude,
    longitude: prefill.longitude,
    budgetMin: Math.max(0, Math.round(prefill.budgetMin || 0)),
    budgetMax: Math.max(0, Math.round(prefill.budgetMax || 0)),
    deadlineType: 'flexible',
    deadlineAt: '',
    urgency: 'normal',
    contactName: (contact.name || '').trim(),
    contactPhone: (contact.phone || '').trim(),
    contactEmail: (contact.email || '').trim(),
    preferredLanguage: contact.language || 'en',
  }
}

export const ESTIMATOR_PREFILL_KEY = 'dimarket_estimator_project_prefill'
