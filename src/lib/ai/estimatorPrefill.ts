/** Shared AI chat → Cost Estimator handoff (sessionStorage). */

export const ESTIMATOR_AI_PREFILL_KEY = 'dimarket_estimator_ai_prefill'

export type EstimatorAiPrefill = {
  description?: string
  projectTypeId?: string
  source?: string
  listingId?: string
}

export function estimatorProjectTypeFromText(text: string): string {
  const q = text.toLowerCase()
  if (/(будинк|дому|хат|house)/i.test(q)) return 'house_renovation'
  if (/(квартир|apartment|flat)/i.test(q)) return 'renovation'
  if (/(ванн|bathroom)/i.test(q)) return 'bathroom'
  if (/(кухн|kitchen)/i.test(q)) return 'kitchen'
  if (/(дах|roof)/i.test(q)) return 'roof'
  if (/(фасад|facade)/i.test(q)) return 'facade'
  if (/(електр|electrical)/i.test(q)) return 'electrical'
  if (/(сантех|plumb)/i.test(q)) return 'plumbing'
  return 'house_renovation'
}

export function saveEstimatorAiPrefill(payload: EstimatorAiPrefill): void {
  try {
    const description = payload.description?.trim()
    const projectTypeId =
      payload.projectTypeId ||
      (description ? estimatorProjectTypeFromText(description) : undefined)
    sessionStorage.setItem(
      ESTIMATOR_AI_PREFILL_KEY,
      JSON.stringify({
        ...payload,
        description,
        projectTypeId,
        source: payload.source || 'sales_chat',
      }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export function readEstimatorAiPrefill(): EstimatorAiPrefill | null {
  try {
    const raw = sessionStorage.getItem(ESTIMATOR_AI_PREFILL_KEY)
    if (!raw) return null
    sessionStorage.removeItem(ESTIMATOR_AI_PREFILL_KEY)
    return JSON.parse(raw) as EstimatorAiPrefill
  } catch {
    return null
  }
}
