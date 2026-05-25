import type { QuoteEstimate } from '../types'

/** Базові діапазони цін (EUR) за категорією — оновлюються через AI на edge */
const BASE_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  construction: { min: 500, max: 15000, unit: 'project' },
  electrical: { min: 80, max: 350, unit: 'hour' },
  handyman: { min: 40, max: 120, unit: 'hour' },
  cleaning: { min: 60, max: 200, unit: 'visit' },
  tools: { min: 20, max: 500, unit: 'item' },
  furniture: { min: 100, max: 3000, unit: 'project' },
  default: { min: 100, max: 2000, unit: 'project' },
}

const CITY_MULTIPLIER: Record<string, number> = {
  kyiv: 1.15,
  київ: 1.15,
  warsaw: 1.1,
  warszawa: 1.1,
  berlin: 1.2,
  münchen: 1.25,
}

export type QuoteInput = {
  categorySlug?: string
  city?: string
  country?: string
  quantity?: number
  unit?: string
  description?: string
  currency?: string
}

export function estimateQuoteLocally(input: QuoteInput): QuoteEstimate {
  const slug = input.categorySlug || 'default'
  const base = BASE_RANGES[slug] ?? BASE_RANGES.default
  const qty = Math.max(1, input.quantity ?? 1)

  let cityMul = 1
  const cityKey = (input.city || '').toLowerCase()
  for (const [k, m] of Object.entries(CITY_MULTIPLIER)) {
    if (cityKey.includes(k)) {
      cityMul = m
      break
    }
  }

  const desc = (input.description || '').toLowerCase()
  let complexity = 1
  if (desc.length > 200) complexity = 1.25
  if (/терміново|urgent|renovation|повний/i.test(desc)) complexity = 1.35

  const minPrice = Math.round(base.min * qty * cityMul * complexity)
  const maxPrice = Math.round(base.max * qty * cityMul * complexity)
  const confidence = desc.length > 40 ? 72 : 55

  const explanation =
    input.country === 'Ukraine' || input.country === 'Україна'
      ? `Орієнтовний діапазон для «${slug}» у ${input.city || 'регіоні'} (${qty} ${input.unit || base.unit}).`
      : `Estimated range for ${slug} in ${input.city || 'area'} (${qty} ${input.unit || base.unit}).`

  return {
    minPrice,
    maxPrice,
    currency: input.currency || 'EUR',
    explanation,
    confidence,
  }
}
