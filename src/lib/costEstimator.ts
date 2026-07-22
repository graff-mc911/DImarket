/**
 * AI Cost Estimator — labor, materials, duration + Low / Average / Premium tiers.
 * Uses local heuristic (always) and optionally ai-router when available.
 */
import { invokeAiBot } from './bots/client'
import type { QuoteEstimate } from './bots/types'
import { PROJECT_TRADES } from './projectWizard'

export type CostEstimatorInput = {
  description: string
  areaSqm: number
  tradeId?: string | null
  city?: string
  country?: string
  photoCount?: number
  currency?: string
}

export type CostEstimateResult = {
  labor: number
  materials: number
  equipment: number
  durationDaysMin: number
  durationDaysMax: number
  lowPrice: number
  averagePrice: number
  premiumPrice: number
  currency: string
  confidence: number
  explanation: string
  tradeLabel: string
  factors: string[]
  source: 'ai' | 'local'
}

/** EUR per m² baselines by trade (labor+materials blended mid) */
const TRADE_RATES: Record<
  string,
  { perSqm: number; laborShare: number; daysPer10Sqm: number; label: string }
> = {
  painter: { perSqm: 28, laborShare: 0.65, daysPer10Sqm: 1.2, label: 'Painting' },
  drywall: { perSqm: 55, laborShare: 0.55, daysPer10Sqm: 1.8, label: 'Drywall' },
  electrician: { perSqm: 45, laborShare: 0.7, daysPer10Sqm: 1.5, label: 'Electrical' },
  plumber: { perSqm: 50, laborShare: 0.6, daysPer10Sqm: 1.6, label: 'Plumbing' },
  roofing: { perSqm: 95, laborShare: 0.5, daysPer10Sqm: 2.2, label: 'Roofing' },
  flooring: { perSqm: 48, laborShare: 0.45, daysPer10Sqm: 1.4, label: 'Flooring' },
  windows: { perSqm: 180, laborShare: 0.35, daysPer10Sqm: 0.8, label: 'Windows' },
  doors: { perSqm: 160, laborShare: 0.4, daysPer10Sqm: 0.6, label: 'Doors' },
  facade: { perSqm: 85, laborShare: 0.5, daysPer10Sqm: 2.5, label: 'Facade' },
  kitchen: { perSqm: 320, laborShare: 0.4, daysPer10Sqm: 3.5, label: 'Kitchen' },
  bathroom: { perSqm: 280, laborShare: 0.45, daysPer10Sqm: 3.2, label: 'Bathroom' },
  general: { perSqm: 70, laborShare: 0.55, daysPer10Sqm: 2.0, label: 'General Contractor' },
}

const CITY_MUL: Record<string, number> = {
  berlin: 1.22,
  munich: 1.28,
  münchen: 1.28,
  frankfurt: 1.24,
  hamburg: 1.2,
  darmstadt: 1.16,
  warsaw: 1.08,
  warszawa: 1.08,
  kyiv: 0.72,
  київ: 0.72,
  madrid: 1.12,
  barcelona: 1.15,
  valencia: 1.05,
  alicante: 1.02,
  vienna: 1.2,
  wien: 1.2,
  amsterdam: 1.25,
  paris: 1.3,
}

function roundEuro(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5
  if (n < 1000) return Math.round(n / 10) * 10
  return Math.round(n / 50) * 50
}

function detectTradeFromDescription(desc: string): string {
  const d = desc.toLowerCase()
  const rules: Array<[RegExp, string]> = [
    [/paint|маляр|фарб|streichen|malowanie/i, 'painter'],
    [/drywall|гіпс|gips|gipskarton|plasterboard/i, 'drywall'],
    [/electr|електр|elektro|wiring/i, 'electrician'],
    [/plumb|сантех|wasser|hydraul/i, 'plumber'],
    [/roof|дах|dach|pokrycie/i, 'roofing'],
    [/floor|підлог|boden|podłoga|laminat|tile|плитк/i, 'flooring'],
    [/window|вікн|fenster|okno/i, 'windows'],
    [/door|двер|tür|drzwi/i, 'doors'],
    [/facade|фасад|fassade|elewac/i, 'facade'],
    [/kitchen|кухн|küche|kuchnia/i, 'kitchen'],
    [/bath|ванн|bad |łazien/i, 'bathroom'],
  ]
  for (const [re, id] of rules) {
    if (re.test(d)) return id
  }
  return 'general'
}

function cityMultiplier(city?: string): number {
  const key = (city || '').toLowerCase()
  for (const [k, m] of Object.entries(CITY_MUL)) {
    if (key.includes(k)) return m
  }
  return 1
}

function complexityFromDescription(desc: string): { mul: number; factors: string[] } {
  const factors: string[] = []
  let mul = 1
  const d = desc.toLowerCase()
  if (desc.trim().length > 180) {
    mul *= 1.08
    factors.push('Detailed scope')
  }
  if (/urgent|asap|терміново|sofort|pilne/i.test(d)) {
    mul *= 1.18
    factors.push('Urgent timeline')
  }
  if (/renovation|ремонт|sanierung|remont|full remodel/i.test(d)) {
    mul *= 1.15
    factors.push('Full renovation')
  }
  if (/premium|luxury|high.?end|premium|преміум/i.test(d)) {
    mul *= 1.22
    factors.push('Premium finish')
  }
  if (/moisture|mold|плесен|wasserschaden|damage/i.test(d)) {
    mul *= 1.12
    factors.push('Remediation work')
  }
  if (/height|scaffolding|висота|gerüst/i.test(d)) {
    mul *= 1.1
    factors.push('Access / height')
  }
  return { mul, factors }
}

export function estimateCostLocally(input: CostEstimatorInput): CostEstimateResult {
  const area = Math.max(1, Number(input.areaSqm) || 1)
  const tradeId =
    input.tradeId && TRADE_RATES[input.tradeId]
      ? input.tradeId
      : detectTradeFromDescription(input.description)
  const rate = TRADE_RATES[tradeId] || TRADE_RATES.general
  const tradeMeta = PROJECT_TRADES.find((t) => t.id === tradeId)
  const tradeLabel = tradeMeta?.labelEn || rate.label

  const cityMul = cityMultiplier(input.city)
  const { mul: complexity, factors } = complexityFromDescription(input.description || '')
  const photos = Math.max(0, input.photoCount || 0)
  if (photos >= 3) factors.push(`${photos} photos reviewed`)

  const photoMul = photos >= 6 ? 1.05 : photos >= 3 ? 1.02 : 1
  const base = rate.perSqm * area * cityMul * complexity * photoMul

  const labor = roundEuro(base * rate.laborShare)
  const materials = roundEuro(base * (1 - rate.laborShare) * 0.85)
  const equipment = roundEuro(base * (1 - rate.laborShare) * 0.15)

  const averagePrice = roundEuro(labor + materials + equipment)
  const lowPrice = roundEuro(averagePrice * 0.78)
  const premiumPrice = roundEuro(averagePrice * 1.32)

  const daysRaw = (area / 10) * rate.daysPer10Sqm * Math.sqrt(complexity)
  const durationDaysMin = Math.max(1, Math.round(daysRaw * 0.75))
  const durationDaysMax = Math.max(durationDaysMin + 1, Math.round(daysRaw * 1.35))

  let confidence = 58
  if ((input.description || '').trim().length >= 40) confidence += 12
  if (area >= 5) confidence += 8
  if (photos >= 2) confidence += 8
  if (input.tradeId) confidence += 6
  if (input.city) confidence += 4
  confidence = Math.min(92, confidence)

  const explanation = `Estimated ${tradeLabel.toLowerCase()} for ~${area} m²${
    input.city ? ` in ${input.city}` : ''
  }. Labor ≈ €${labor.toLocaleString()}, materials ≈ €${materials.toLocaleString()}. Timeline ${durationDaysMin}–${durationDaysMax} days.`

  return {
    labor,
    materials,
    equipment,
    durationDaysMin,
    durationDaysMax,
    lowPrice,
    averagePrice,
    premiumPrice,
    currency: input.currency || 'EUR',
    confidence,
    explanation,
    tradeLabel,
    factors: factors.slice(0, 5),
    source: 'local',
  }
}

/** Map classic min/max AI quote into tiered cost cards */
export function tiersFromMinMax(
  minPrice: number,
  maxPrice: number,
  base: CostEstimateResult,
): CostEstimateResult {
  const low = roundEuro(minPrice)
  const premium = roundEuro(maxPrice)
  const average = roundEuro((low + premium) / 2)
  return {
    ...base,
    lowPrice: low,
    averagePrice: average,
    premiumPrice: premium,
    labor: roundEuro(average * 0.55),
    materials: roundEuro(average * 0.35),
    equipment: roundEuro(average * 0.1),
    confidence: Math.max(base.confidence, 70),
    source: 'ai',
    explanation: base.explanation,
  }
}

/**
 * Run estimator: local first, enrich via ai-router when possible.
 */
export async function runCostEstimate(
  input: CostEstimatorInput,
): Promise<CostEstimateResult> {
  const local = estimateCostLocally(input)

  if (!input.description.trim() || input.areaSqm <= 0) {
    return local
  }

  try {
    const trade = PROJECT_TRADES.find((t) => t.id === input.tradeId)
    const res = await invokeAiBot<QuoteEstimate>({
      bot: 'quote',
      action: 'estimate',
      payload: {
        categorySlug: trade?.subcategorySlug?.split('-')[0] || input.tradeId || 'construction',
        city: input.city || '',
        country: input.country || '',
        quantity: Math.max(1, input.areaSqm),
        unit: 'm2',
        description: `${input.description}\nArea: ${input.areaSqm} m². Photos: ${input.photoCount || 0}. Trade: ${local.tradeLabel}. Prefer JSON with labor materials duration low average premium if possible.`,
        currency: input.currency || 'EUR',
        areaSqm: input.areaSqm,
        photoCount: input.photoCount || 0,
      },
    })

    if (res.ok && res.data && typeof res.data.minPrice === 'number') {
      const ai = res.data
      // Scale AI range with our area-aware local mid if AI ignored area
      let min = ai.minPrice
      let max = ai.maxPrice
      if (max < local.lowPrice * 0.4 || min > local.premiumPrice * 2.5) {
        // AI out of band — blend
        min = roundEuro((min + local.lowPrice) / 2)
        max = roundEuro((max + local.premiumPrice) / 2)
      }
      const blended = tiersFromMinMax(min, max, {
        ...local,
        explanation: ai.explanation || local.explanation,
        confidence: Math.max(local.confidence, ai.confidence || 70),
      })
      return blended
    }
  } catch {
    /* keep local */
  }

  return local
}

export function formatEuro(n: number): string {
  return `€${Math.round(n).toLocaleString()}`
}
