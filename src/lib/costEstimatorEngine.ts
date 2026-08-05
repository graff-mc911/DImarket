/**
 * Full AI Cost Estimator engine — reference regional ranges + local heuristics + optional AI blend.
 * Results are always marked as reference estimates (ориєнтовна оцінка).
 */
import { invokeAiBot } from './bots/client'
import type { QuoteEstimate } from './bots/types'
import { formatEuro } from './costEstimator'
import {
  ESTIMATOR_PROJECT_TYPES,
  getProjectType,
  type AiInsight,
  type CostBreakdownLine,
  type EstimatorProjectTypeId,
  type EstimatorState,
  type FullCostEstimate,
  type MaterialLine,
  type PricingTierId,
  type SpecialistNeed,
  type TimelinePhase,
  type WorkStage,
} from './costEstimatorTypes'

export type { FullCostEstimate, PricingTierId }

const COUNTRY_MUL: Record<string, number> = {
  germany: 1.22,
  deutschland: 1.22,
  de: 1.22,
  austria: 1.2,
  österreich: 1.2,
  at: 1.2,
  switzerland: 1.45,
  schweiz: 1.45,
  ch: 1.45,
  netherlands: 1.25,
  nl: 1.25,
  france: 1.28,
  fr: 1.28,
  belgium: 1.2,
  be: 1.2,
  spain: 1.05,
  españa: 1.05,
  es: 1.05,
  portugal: 0.95,
  pt: 0.95,
  italy: 1.1,
  italia: 1.1,
  it: 1.1,
  poland: 0.78,
  polska: 0.78,
  pl: 0.78,
  ukraine: 0.55,
  україна: 0.55,
  ua: 0.55,
  czech: 0.85,
  'czech republic': 0.85,
  cz: 0.85,
  romania: 0.7,
  ro: 0.7,
  hungary: 0.75,
  hu: 0.75,
}

const CITY_MUL: Record<string, number> = {
  berlin: 1.22,
  munich: 1.28,
  münchen: 1.28,
  frankfurt: 1.24,
  hamburg: 1.2,
  darmstadt: 1.16,
  cologne: 1.18,
  köln: 1.18,
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
  zurich: 1.5,
  zürich: 1.5,
  milan: 1.18,
  milano: 1.18,
  rome: 1.1,
  roma: 1.1,
  lisbon: 1.0,
  lisboa: 1.0,
  prague: 0.95,
  praha: 0.95,
}

function roundEuro(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5
  if (n < 1000) return Math.round(n / 10) * 10
  return Math.round(n / 50) * 50
}

function countryMul(country?: string): number {
  const key = (country || '').toLowerCase().trim()
  for (const [k, m] of Object.entries(COUNTRY_MUL)) {
    if (key === k || key.includes(k)) return m
  }
  return 1
}

function cityMul(city?: string): number {
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
    mul *= 1.12
    factors.push('Full renovation')
  }
  if (/premium|luxury|high.?end|преміум/i.test(d)) {
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
  if (/permit|дозвіл|genehmigung|licen/i.test(d)) {
    factors.push('Permits likely required')
  }
  return { mul, factors }
}

const SPECIALIST_TEMPLATES: Record<string, Array<Omit<SpecialistNeed, 'id' | 'laborHours'>>> = {
  bathroom: [
    { tradeId: 'general', label: 'Demolition', subcategorySlug: 'demolition-partitions' },
    { tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-bathroom' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'flooring', label: 'Tiler', subcategorySlug: 'tiling-bathroom' },
    { tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' },
    { tradeId: 'doors', label: 'Carpenter', subcategorySlug: 'carpentry-doors' },
  ],
  kitchen: [
    { tradeId: 'general', label: 'Demolition', subcategorySlug: 'demolition-partitions' },
    { tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-pipes' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'kitchen', label: 'Cabinet installer', subcategorySlug: 'carpentry-furniture' },
    { tradeId: 'flooring', label: 'Tiler / flooring', subcategorySlug: 'tiling-kitchen' },
    { tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' },
  ],
  renovation: [
    { tradeId: 'general', label: 'General contractor', subcategorySlug: 'design-engineering-general' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-pipes' },
    { tradeId: 'drywall', label: 'Drywall', subcategorySlug: 'drywall-install' },
    { tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' },
    { tradeId: 'flooring', label: 'Flooring', subcategorySlug: 'flooring-laminate' },
  ],
  new_construction: [
    { tradeId: 'general', label: 'General contractor', subcategorySlug: 'design-engineering-general' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-pipes' },
    { tradeId: 'facade', label: 'Facade', subcategorySlug: 'facade-cladding' },
    { tradeId: 'roofing', label: 'Roofer', subcategorySlug: 'roofing-install' },
  ],
  electrical: [{ tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' }],
  plumbing: [{ tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-pipes' }],
  painting: [{ tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' }],
  flooring: [{ tradeId: 'flooring', label: 'Flooring specialist', subcategorySlug: 'flooring-laminate' }],
  tiling: [{ tradeId: 'flooring', label: 'Tiler', subcategorySlug: 'tiling-bathroom' }],
  drywall: [{ tradeId: 'drywall', label: 'Drywall installer', subcategorySlug: 'drywall-install' }],
  roof: [{ tradeId: 'roofing', label: 'Roofer', subcategorySlug: 'roofing-install' }],
  facade: [{ tradeId: 'facade', label: 'Facade specialist', subcategorySlug: 'facade-cladding' }],
  windows: [{ tradeId: 'windows', label: 'Window installer', subcategorySlug: 'windows-install' }],
  doors: [{ tradeId: 'doors', label: 'Door carpenter', subcategorySlug: 'carpentry-doors' }],
  hvac: [{ tradeId: 'general', label: 'HVAC technician', subcategorySlug: 'hvac-install' }],
  solar: [
    { tradeId: 'electrician', label: 'Solar electrician', subcategorySlug: 'electro-solar' },
    { tradeId: 'roofing', label: 'Roofer', subcategorySlug: 'roofing-install' },
  ],
  pool: [
    { tradeId: 'general', label: 'Pool contractor', subcategorySlug: 'pool-install' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-pipes' },
  ],
  landscaping: [{ tradeId: 'general', label: 'Landscaper', subcategorySlug: 'garden-landscaping' }],
  living_room: [
    { tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' },
    { tradeId: 'flooring', label: 'Flooring', subcategorySlug: 'flooring-laminate' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
  ],
  bedroom: [
    { tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' },
    { tradeId: 'flooring', label: 'Flooring', subcategorySlug: 'flooring-laminate' },
  ],
  office: [
    { tradeId: 'drywall', label: 'Drywall', subcategorySlug: 'drywall-install' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'painter', label: 'Painter', subcategorySlug: 'painting-interior' },
  ],
  commercial: [
    { tradeId: 'general', label: 'General contractor', subcategorySlug: 'design-engineering-general' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
    { tradeId: 'plumber', label: 'Plumber', subcategorySlug: 'plumbing-pipes' },
  ],
  warehouse: [
    { tradeId: 'general', label: 'General contractor', subcategorySlug: 'design-engineering-general' },
    { tradeId: 'electrician', label: 'Electrician', subcategorySlug: 'electro-wiring' },
  ],
  other: [{ tradeId: 'general', label: 'General contractor', subcategorySlug: 'design-engineering-general' }],
}

const MATERIAL_TEMPLATES: Record<
  string,
  Array<Omit<MaterialLine, 'id' | 'quantity' | 'unitPriceEconomy' | 'unitPriceStandard' | 'unitPricePremium'>>
> = {
  bathroom: [
    { name: 'Ceramic wall tiles', unit: 'm²', category: 'Finishes', searchQuery: 'tiles bathroom' },
    { name: 'Floor tiles', unit: 'm²', category: 'Finishes', searchQuery: 'floor tiles' },
    { name: 'Waterproofing membrane', unit: 'm²', category: 'Waterproofing', searchQuery: 'waterproofing' },
    { name: 'Sanitary ware set', unit: 'set', category: 'Plumbing', searchQuery: 'bathroom sanitary' },
    { name: 'Mixer taps', unit: 'pcs', category: 'Plumbing', searchQuery: 'faucet mixer' },
    { name: 'Cement adhesive + grout', unit: 'bags', category: 'Consumables', searchQuery: 'tile adhesive' },
    { name: 'LED bathroom lights', unit: 'pcs', category: 'Electrical', searchQuery: 'bathroom light' },
  ],
  kitchen: [
    { name: 'Kitchen cabinets', unit: 'lm', category: 'Carpentry', searchQuery: 'kitchen cabinets' },
    { name: 'Countertop', unit: 'm', category: 'Surfaces', searchQuery: 'countertop' },
    { name: 'Sink + faucet', unit: 'set', category: 'Plumbing', searchQuery: 'kitchen sink' },
    { name: 'Backsplash tiles', unit: 'm²', category: 'Finishes', searchQuery: 'kitchen tiles' },
    { name: 'Electrical outlets', unit: 'pcs', category: 'Electrical', searchQuery: 'outlet' },
  ],
  painting: [
    { name: 'Interior paint', unit: 'L', category: 'Paint', searchQuery: 'interior paint' },
    { name: 'Primer', unit: 'L', category: 'Paint', searchQuery: 'primer' },
    { name: 'Masking + consumables', unit: 'set', category: 'Consumables', searchQuery: 'painting supplies' },
  ],
  flooring: [
    { name: 'Flooring material', unit: 'm²', category: 'Flooring', searchQuery: 'laminate flooring' },
    { name: 'Underlayment', unit: 'm²', category: 'Flooring', searchQuery: 'underlay' },
    { name: 'Skirting boards', unit: 'm', category: 'Trim', searchQuery: 'skirting' },
  ],
  electrical: [
    { name: 'Cable / wiring', unit: 'm', category: 'Electrical', searchQuery: 'electrical cable' },
    { name: 'Switches & sockets', unit: 'pcs', category: 'Electrical', searchQuery: 'switch socket' },
    { name: 'Distribution board parts', unit: 'set', category: 'Electrical', searchQuery: 'breaker panel' },
  ],
  plumbing: [
    { name: 'Pipes & fittings', unit: 'm', category: 'Plumbing', searchQuery: 'plumbing pipes' },
    { name: 'Valves', unit: 'pcs', category: 'Plumbing', searchQuery: 'valve' },
    { name: 'Sealants', unit: 'pcs', category: 'Consumables', searchQuery: 'silicone sealant' },
  ],
  drywall: [
    { name: 'Gypsum boards', unit: 'm²', category: 'Drywall', searchQuery: 'drywall board' },
    { name: 'Metal profiles', unit: 'm', category: 'Drywall', searchQuery: 'drywall profile' },
    { name: 'Joint compound', unit: 'bags', category: 'Consumables', searchQuery: 'joint compound' },
  ],
  roof: [
    { name: 'Roof covering', unit: 'm²', category: 'Roofing', searchQuery: 'roof tiles' },
    { name: 'Underlay membrane', unit: 'm²', category: 'Roofing', searchQuery: 'roof membrane' },
    { name: 'Flashings', unit: 'm', category: 'Roofing', searchQuery: 'roof flashing' },
  ],
  default: [
    { name: 'General construction materials', unit: 'lot', category: 'General', searchQuery: 'building materials' },
    { name: 'Fasteners & consumables', unit: 'set', category: 'Consumables', searchQuery: 'screws fasteners' },
    { name: 'Protective covers', unit: 'roll', category: 'Safety', searchQuery: 'dust sheet' },
  ],
}

function materialQty(unit: string, area: number, rooms: number): number {
  if (unit === 'm²') return Math.max(1, Math.round(area * 1.1))
  if (unit === 'm' || unit === 'lm') return Math.max(1, Math.round(Math.sqrt(area) * 4))
  if (unit === 'L') return Math.max(2, Math.round(area * 0.35))
  if (unit === 'bags') return Math.max(2, Math.round(area / 8))
  if (unit === 'pcs') return Math.max(2, rooms * 2 || Math.round(area / 6))
  if (unit === 'set') return Math.max(1, rooms || 1)
  return 1
}

function buildSpecialists(typeId: EstimatorProjectTypeId, area: number): SpecialistNeed[] {
  const templates = SPECIALIST_TEMPLATES[typeId] || SPECIALIST_TEMPLATES.other
  const hoursBase = Math.max(4, area * 1.2)
  return templates.map((t, i) => ({
    id: `sp-${typeId}-${i}`,
    ...t,
    laborHours: Math.round((hoursBase / templates.length) * 10) / 10,
  }))
}

function buildMaterials(
  typeId: EstimatorProjectTypeId,
  area: number,
  rooms: number,
  geoMul: number,
): MaterialLine[] {
  const templates = MATERIAL_TEMPLATES[typeId] || MATERIAL_TEMPLATES.default
  const unitBase =
    (ESTIMATOR_PROJECT_TYPES.find((t) => t.id === typeId)?.perSqm || 70) * 0.12 * geoMul
  return templates.map((t, i) => {
    const qty = materialQty(t.unit, area, rooms)
    const std = roundEuro(unitBase * (0.6 + i * 0.08))
    return {
      id: `mat-${typeId}-${i}`,
      ...t,
      quantity: qty,
      unitPriceEconomy: roundEuro(std * 0.75),
      unitPriceStandard: std,
      unitPricePremium: roundEuro(std * 1.4),
    }
  })
}

function buildWorkStages(specialists: SpecialistNeed[]): WorkStage[] {
  return specialists.map((s, i) => ({
    id: `ws-${s.id}`,
    label: s.label,
    tradeId: s.tradeId,
    laborHours: s.laborHours,
    order: i + 1,
  }))
}

function buildTimeline(daysMin: number, daysMax: number): TimelinePhase[] {
  const prep = Math.max(1, Math.round(daysMin * 0.15))
  const build = Math.max(1, Math.round(daysMin * 0.55))
  const finish = Math.max(1, daysMin - prep - build)
  return [
    {
      id: 'prep',
      label: 'Preparation',
      daysMin: prep,
      daysMax: Math.max(prep, Math.round(daysMax * 0.15)),
    },
    {
      id: 'build',
      label: 'Construction',
      daysMin: build,
      daysMax: Math.max(build, Math.round(daysMax * 0.55)),
    },
    {
      id: 'finish',
      label: 'Finishing',
      daysMin: finish,
      daysMax: Math.max(finish, Math.round(daysMax * 0.3)),
    },
  ]
}

function buildInsights(
  typeId: EstimatorProjectTypeId,
  desc: string,
  photoCount: number,
  area: number,
): AiInsight[] {
  const insights: AiInsight[] = [
    {
      id: 'seq',
      kind: 'sequence',
      text: 'Recommended sequence: protect surfaces → demolition → rough MEP → finishes → final fixtures → cleanup.',
    },
    {
      id: 'save',
      kind: 'saving',
      text: 'Economy tier often saves 15–25% by choosing mid-range materials and off-peak scheduling.',
    },
    {
      id: 'up',
      kind: 'upgrade',
      text: 'Premium tier typically upgrades fixtures, finishes and warranty — useful for wet rooms and kitchens.',
    },
    {
      id: 'risk',
      kind: 'risk',
      text: 'Hidden moisture, outdated wiring, or uneven substrates can increase cost by 10–20%.',
    },
    {
      id: 'mistake',
      kind: 'mistake',
      text: 'Common mistake: skipping waterproofing or underestimating waste disposal and furniture protection.',
    },
  ]
  if (photoCount < 2) {
    insights.push({
      id: 'miss-photo',
      kind: 'missing',
      text: 'Add more photos of the space (corners, ceilings, existing MEP) to improve estimate confidence.',
    })
  }
  if (area < 5 && typeId !== 'doors' && typeId !== 'windows') {
    insights.push({
      id: 'miss-area',
      kind: 'missing',
      text: 'Area looks small — double-check measurements or room count.',
    })
  }
  if (!/budget|€|eur|\$/i.test(desc)) {
    insights.push({
      id: 'miss-budget',
      kind: 'missing',
      text: 'No budget hint in the description — share a target range when requesting quotes.',
    })
  }
  return insights.slice(0, 7)
}

function sumTier(
  labor: number,
  materials: number,
  equipment: number,
  transport: number,
  waste: number,
  permits: number,
  contingencyPct: number,
  taxPct: number,
): FullCostEstimate['totals'] {
  const mk = (mul: number) => {
    const L = roundEuro(labor * mul)
    const M = roundEuro(materials * mul)
    const E = roundEuro(equipment * mul)
    const T = roundEuro(transport * mul)
    const W = roundEuro(waste * mul)
    const P = roundEuro(permits * mul)
    const sub = L + M + E + T + W + P
    const contingency = roundEuro(sub * contingencyPct)
    const after = sub + contingency
    const taxes = roundEuro(after * taxPct)
    return {
      labor: L,
      materials: M,
      equipment: E,
      transport: T,
      waste: W,
      permits: P,
      contingency,
      taxes,
      grandTotal: after + taxes,
    }
  }
  return {
    economy: mk(0.78),
    standard: mk(1),
    premium: mk(1.32),
  }
}

export function buildFullCostEstimateLocal(state: EstimatorState): FullCostEstimate {
  const type = getProjectType(state.projectTypeId)
  const area =
    state.measurements.areaSqm > 0
      ? state.measurements.areaSqm
      : state.measurements.lengthM && state.measurements.widthM
        ? state.measurements.lengthM * state.measurements.widthM
        : 20
  const rooms = state.measurements.rooms || 1
  const floors = state.measurements.floors || 1
  const geo = countryMul(state.location.country) * cityMul(state.location.city)
  const { mul: complexity, factors } = complexityFromDescription(state.description)
  const photos = state.files.filter((f) => f.kind === 'photo').length
  if (photos >= 3) factors.push(`${photos} photos reviewed`)
  if (state.files.some((f) => f.kind === 'pdf' || f.kind === 'cad')) factors.push('Plans uploaded')
  if (floors > 1) factors.push(`${floors} floors`)

  const photoMul = photos >= 6 ? 1.05 : photos >= 3 ? 1.02 : 1
  const base = type.perSqm * area * geo * complexity * photoMul * (1 + (floors - 1) * 0.08)

  const laborMid = roundEuro(base * type.laborShare)
  const materialsMid = roundEuro(base * (1 - type.laborShare) * 0.82)
  const equipmentMid = roundEuro(base * (1 - type.laborShare) * 0.1)
  const transportMid = roundEuro(base * 0.035)
  const wasteMid = roundEuro(base * 0.04)
  const permitsMid = /permit|дозвіл|genehmigung|commercial|warehouse|new_construction/i.test(
    `${state.description} ${type.id}`,
  )
    ? roundEuro(base * 0.04)
    : 0

  const totals = sumTier(
    laborMid,
    materialsMid,
    equipmentMid,
    transportMid,
    wasteMid,
    permitsMid,
    0.08,
    0,
  )

  const specialists = buildSpecialists(type.id, area)
  const materials = buildMaterials(type.id, area, rooms, geo)
  const workStages = buildWorkStages(specialists)

  const daysRaw =
    (area / 10) * type.daysPer10Sqm * Math.sqrt(complexity) * (1 + (floors - 1) * 0.15)
  const totalDaysMin = Math.max(1, Math.round(daysRaw * 0.75))
  const totalDaysMax = Math.max(totalDaysMin + 1, Math.round(daysRaw * 1.35))
  const timeline = buildTimeline(totalDaysMin, totalDaysMax)
  const completion = new Date()
  completion.setDate(completion.getDate() + totalDaysMax)

  const breakdown: CostBreakdownLine[] = (
    [
      ['labor', 'Labor', laborMid],
      ['materials', 'Materials', materialsMid],
      ['equipment', 'Equipment rental', equipmentMid],
      ['transport', 'Transportation / delivery', transportMid],
      ['waste', 'Waste disposal', wasteMid],
      ['permits', 'Permits (optional)', permitsMid],
      ['contingency', 'Contingency (8%)', totals.standard.contingency],
    ] as const
  ).map(([category, label, std], i) => ({
    id: `bd-${i}`,
    category,
    label,
    amountEconomy: roundEuro(std * 0.78),
    amountStandard: std,
    amountPremium: roundEuro(std * 1.32),
  }))

  let confidence = 55
  if (state.description.trim().length >= 40) confidence += 12
  if (area >= 5) confidence += 8
  if (photos >= 2) confidence += 8
  if (state.projectTypeId) confidence += 6
  if (state.location.city) confidence += 5
  if (state.location.country) confidence += 3
  if (state.measurements.heightM) confidence += 2
  confidence = Math.min(90, confidence)

  const cityLabel = state.location.city || state.location.locationLabel || 'your area'
  const explanation = `Reference estimate for ${type.labelEn.toLowerCase()} (~${area} m²) in ${cityLabel}. Labor ≈ ${formatEuro(laborMid)}, materials ≈ ${formatEuro(materialsMid)}. Timeline ${totalDaysMin}–${totalDaysMax} days. Not a binding quote.`

  return {
    projectTypeId: type.id,
    tradeLabel: type.labelEn,
    currency: 'EUR',
    isReferenceEstimate: true,
    disclaimer:
      'Орієнтовна оцінка / Reference estimate — based on regional cost ranges, not live contractor quotes. Request real offers from professionals for binding prices.',
    confidence,
    source: 'local',
    explanation,
    factors: factors.slice(0, 6),
    workStages,
    specialists,
    materials,
    breakdown,
    timeline,
    totalDaysMin,
    totalDaysMax,
    estimatedCompletionIso: completion.toISOString(),
    totals,
    insights: buildInsights(type.id, state.description, photos, area),
    laborHoursTotal: specialists.reduce((s, x) => s + x.laborHours, 0),
  }
}

export async function runFullCostEstimate(
  state: EstimatorState,
  onProgress?: (pct: number, label: string) => void,
): Promise<FullCostEstimate> {
  onProgress?.(10, 'Analysing project type…')
  await sleep(100)
  onProgress?.(30, 'Estimating labour & materials…')
  const local = buildFullCostEstimateLocal(state)
  onProgress?.(50, 'Building work breakdown…')
  await sleep(60)

  onProgress?.(65, 'Consulting AI cost model…')
  try {
    const type = getProjectType(state.projectTypeId)
    const res = await invokeAiBot<QuoteEstimate>({
      bot: 'quote',
      action: 'estimate',
      payload: {
        categorySlug: type.subcategorySlug.split('-')[0] || type.tradeId,
        city: state.location.city || '',
        country: state.location.country || '',
        quantity: Math.max(1, state.measurements.areaSqm),
        unit: 'm2',
        description: [
          state.description,
          `Project type: ${type.labelEn}`,
          `Area: ${state.measurements.areaSqm} m²`,
          `Rooms: ${state.measurements.rooms ?? '—'}`,
          `Floors: ${state.measurements.floors ?? '—'}`,
          `Photos: ${state.files.filter((f) => f.kind === 'photo').length}`,
        ].join('\n'),
        currency: 'EUR',
        areaSqm: state.measurements.areaSqm,
        photoCount: state.files.length,
      },
    })

    onProgress?.(88, 'Blending reference ranges…')
    if (res.ok && res.data && typeof res.data.minPrice === 'number') {
      const stdLocal = local.totals.standard.grandTotal
      let low = roundEuro(res.data.minPrice)
      let premium = roundEuro(res.data.maxPrice)
      if (premium < stdLocal * 0.4 || low > stdLocal * 2.5) {
        low = roundEuro((low + local.totals.economy.grandTotal) / 2)
        premium = roundEuro((premium + local.totals.premium.grandTotal) / 2)
      }
      const average = roundEuro((low + premium) / 2)
      const scale = average / Math.max(1, stdLocal)
      const scaled = sumTier(
        roundEuro(local.totals.standard.labor * scale),
        roundEuro(local.totals.standard.materials * scale),
        roundEuro(local.totals.standard.equipment * scale),
        roundEuro(local.totals.standard.transport * scale),
        roundEuro(local.totals.standard.waste * scale),
        roundEuro(local.totals.standard.permits * scale),
        0.08,
        0,
      )
      scaled.economy.grandTotal = low
      scaled.standard.grandTotal = average
      scaled.premium.grandTotal = premium

      onProgress?.(100, 'Done')
      return {
        ...local,
        totals: scaled,
        source: 'blended',
        confidence: Math.max(local.confidence, res.data.confidence || 70),
        explanation: res.data.explanation || local.explanation,
      }
    }
  } catch {
    /* keep local */
  }

  onProgress?.(100, 'Done')
  return local
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function tierLabel(id: PricingTierId): string {
  if (id === 'economy') return 'Economy'
  if (id === 'premium') return 'Premium'
  return 'Standard'
}
