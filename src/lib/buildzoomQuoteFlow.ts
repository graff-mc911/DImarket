/**
 * BuildZoom homepage Get-quotes form — screen map copied from
 * assets.buildzoom.com common-angular `projectFormScreenService.setScreensByVersion`
 * and the live templates on https://www.buildzoom.com/project/new
 *
 * SCREEN LISTS (source of truth — do not flatten or reorder)
 *
 * remodel (kt) — every type except new construction and home addition:
 *   title → urgency → property-type → email → phone → name
 *   → location → property-relationship → budget → description → password
 *
 * home addition (Zs) — projectTypeGroupId HOME_ADDITION:
 *   title → urgency → property-type → email → phone → name
 *   → location → design-status → budget → description → password
 *
 * new construction (vJ) — projectTypeGroupId NEW_CONSTRUCTION:
 *   title → urgency → land-ownership-status → email → phone → name
 *   → location → design-status → budget → description → password
 *
 * Logged-in (setUserScreen): drop email, name; drop phone if a number already exists.
 * After description, existing users skip password (description.continue isNew check).
 * competing-bids / expected-responses (3/4/5 bids) are not shown — rejected from the DImarket flow.
 */
import type { EstimatorProjectTypeId, PricingTierId } from './costEstimatorTypes'

/** BuildZoom homepage tiles — source: buildzoom.com need-help row. */
export const BZ_HOMEPAGE_CARDS: Array<{ id: EstimatorProjectTypeId; labelKey: string }> = [
  { id: 'bathroom', labelKey: 'costEstimator.featured.bathroom' },
  { id: 'kitchen', labelKey: 'costEstimator.featured.kitchen' },
  { id: 'renovation', labelKey: 'costEstimator.featured.multiRoom' },
  { id: 'house_renovation', labelKey: 'costEstimator.featured.addition' },
  { id: 'new_construction', labelKey: 'costEstimator.featured.newHome' },
  { id: 'roof', labelKey: 'costEstimator.featured.roofing' },
  { id: 'painting', labelKey: 'costEstimator.featured.painting' },
  { id: 'flooring', labelKey: 'costEstimator.featured.flooring' },
]

/** BuildZoom quote-modal popular projects — source: predefinedProjectTypes in BZ JS. */
export const BZ_POPULAR_PROJECTS: Array<{ id: EstimatorProjectTypeId; labelKey: string }> = [
  { id: 'bathroom', labelKey: 'costEstimator.featured.bathroom' },
  { id: 'kitchen', labelKey: 'costEstimator.featured.kitchen' },
  { id: 'renovation', labelKey: 'costEstimator.featured.multiRoom' },
  { id: 'house_renovation', labelKey: 'costEstimator.featured.addition' },
  { id: 'new_construction', labelKey: 'costEstimator.featured.newHome' },
  { id: 'roof', labelKey: 'costEstimator.featured.roofing' },
  { id: 'solar', labelKey: 'costEstimator.featured.solar' },
  { id: 'commercial', labelKey: 'costEstimator.featured.commercial' },
]

/** urgencyTypesModel.getInitial() minus the empty placeholder. */
export const BZ_URGENCY_OPTIONS = [
  { id: 'flexible', value: "I'm flexible", labelKey: 'costEstimator.quote.urgency.flexible' },
  { id: 'asap', value: 'As soon as possible', labelKey: 'costEstimator.quote.urgency.asap' },
  { id: 'weeks', value: 'Within the next few weeks', labelKey: 'costEstimator.quote.urgency.weeks' },
  { id: 'months', value: 'Within the next few months', labelKey: 'costEstimator.quote.urgency.months' },
] as const

/** landOwnershipModel.getForProjectForm() */
export const BZ_LAND_OPTIONS = [
  { id: 'yes', value: 'owns', labelKey: 'costEstimator.quote.land.yes' },
  { id: 'process', value: 'closing', labelKey: 'costEstimator.quote.land.process' },
  { id: 'no', value: 'needs agent', labelKey: 'costEstimator.quote.land.no' },
] as const

/** property_type contractorAttributes */
export const BZ_PROPERTY_TYPES = [
  { id: 'home', label: 'Single Family Home', labelKey: 'costEstimator.quote.property.home' },
  { id: 'condo', label: 'Condo/Apartment', labelKey: 'costEstimator.quote.property.condo' },
  { id: 'office', label: 'Office/Commercial', labelKey: 'costEstimator.quote.property.office' },
  { id: 'other', label: 'Other', labelKey: 'costEstimator.quote.property.other' },
] as const

/** propertyRelationshipsModel.getAll() */
export const BZ_RELATIONSHIP_OPTIONS = [
  { id: 'owner', value: 'owner-manager', labelKey: 'costEstimator.quote.relationship.owner' },
  { id: 'renter', value: 'renter', labelKey: 'costEstimator.quote.relationship.renter' },
  { id: 'buying', value: 'potential owner', labelKey: 'costEstimator.quote.relationship.buying' },
  { id: 'agent', value: 'real estate agent', labelKey: 'costEstimator.quote.relationship.agent' },
  { id: 'other', value: 'other', labelKey: 'costEstimator.quote.relationship.other' },
] as const

/** designStatusModel.getForProjectForm() */
export const BZ_DESIGN_OPTIONS = [
  { id: 'yes', value: 'finalized', labelKey: 'costEstimator.quote.design.yes' },
  { id: 'process', value: 'in process', labelKey: 'costEstimator.quote.design.process' },
  { id: 'no', value: 'pre-design', labelKey: 'costEstimator.quote.design.no' },
] as const

/** expectedResponsesScreen: [3, 4, 5] — 4 is Recommended */
export const BZ_BID_OPTIONS = [3, 4, 5] as const

/**
 * budgetTypesModel.getAll(null, "Please select one")
 * EUR labels for Dimarket; same bands as BuildZoom USD.
 */
export const BZ_BUDGET_OPTIONS = [
  { id: '', labelKey: 'costEstimator.quote.budget.placeholder' },
  { id: '0-1000', labelKey: 'costEstimator.quote.budget.lt1k' },
  { id: '1000-5000', labelKey: 'costEstimator.quote.budget.1k5k' },
  { id: '5000-20000', labelKey: 'costEstimator.quote.budget.5k20k' },
  { id: '20000-50000', labelKey: 'costEstimator.quote.budget.20k50k' },
  { id: '50000-100000', labelKey: 'costEstimator.quote.budget.50k100k' },
  { id: '100000-250000', labelKey: 'costEstimator.quote.budget.100k250k' },
  { id: '250000-500000', labelKey: 'costEstimator.quote.budget.250k500k' },
  { id: '500000-1000000', labelKey: 'costEstimator.quote.budget.500k1m' },
  { id: '1000000-9999999', labelKey: 'costEstimator.quote.budget.gt1m' },
  { id: 'private', labelKey: 'costEstimator.quote.budget.guidance' },
] as const

export const BZ_LOADING_STEPS = [
  { id: 'tools', durationMs: 1000, labelKey: 'costEstimator.quote.loading.tools' },
  { id: 'id-card', durationMs: 2000, labelKey: 'costEstimator.quote.loading.licenses' },
  { id: 'location', durationMs: 3000, labelKey: 'costEstimator.quote.loading.area' },
  { id: 'bookmark', durationMs: 2500, labelKey: 'costEstimator.quote.loading.history' },
  { id: 'headphones', durationMs: 3000, labelKey: 'costEstimator.quote.loading.consultant' },
] as const

export type BzQuoteGroup = 'remodel' | 'home_addition' | 'new_construction'

export type BzQuoteScreen =
  | 'title'
  | 'urgency'
  | 'land'
  | 'property'
  | 'email'
  | 'phone'
  | 'name'
  | 'location'
  | 'relationship'
  | 'design'
  | 'budget'
  | 'description'
  | 'password'
  | 'loading'

export type BzQuoteDraft = {
  title: string
  typeId: EstimatorProjectTypeId | null
  urgency: (typeof BZ_URGENCY_OPTIONS)[number]['id'] | null
  land: (typeof BZ_LAND_OPTIONS)[number]['id'] | null
  propertyType: (typeof BZ_PROPERTY_TYPES)[number]['id'] | null
  email: string
  phone: string
  name: string
  bids: (typeof BZ_BID_OPTIONS)[number] | null
  street: string
  city: string
  region: string
  country: string
  postalCode: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
  relationship: (typeof BZ_RELATIONSHIP_OPTIONS)[number]['id'] | null
  designStatus: (typeof BZ_DESIGN_OPTIONS)[number]['id'] | null
  budget: (typeof BZ_BUDGET_OPTIONS)[number]['id'] | null
  financing: boolean
  description: string
}

export type BzAuthContext = {
  signedIn: boolean
  hasPhone: boolean
}

export const EMPTY_BZ_QUOTE: BzQuoteDraft = {
  title: '',
  typeId: null,
  urgency: null,
  land: null,
  propertyType: null,
  email: '',
  phone: '',
  name: '',
  bids: null,
  street: '',
  city: '',
  region: '',
  country: '',
  postalCode: '',
  locationLabel: '',
  latitude: null,
  longitude: null,
  relationship: null,
  designStatus: null,
  budget: null,
  financing: false,
  description: '',
}

/** Same branch as BuildZoom projectFormScreenService HOME_ADDITION / NEW_CONSTRUCTION. */
export function quoteGroupForType(typeId: EstimatorProjectTypeId | null): BzQuoteGroup {
  if (typeId === 'new_construction') return 'new_construction'
  if (typeId === 'house_renovation') return 'home_addition'
  return 'remodel'
}

/** Exact arrays from module 19075: kt / Zs / vJ (ids mapped to Dimarket screen keys). */
export const BZ_SCREEN_LISTS: Record<BzQuoteGroup, BzQuoteScreen[]> = {
  remodel: [
    'title',
    'urgency',
    'property',
    'email',
    'phone',
    'name',
    'location',
    'relationship',
    'budget',
    'description',
    'password',
  ],
  home_addition: [
    'title',
    'urgency',
    'property',
    'email',
    'phone',
    'name',
    'location',
    'design',
    'budget',
    'description',
    'password',
  ],
  new_construction: [
    'title',
    'urgency',
    'land',
    'email',
    'phone',
    'name',
    'location',
    'design',
    'budget',
    'description',
    'password',
  ],
}

export function baseScreensForQuoteType(typeId: EstimatorProjectTypeId | null): BzQuoteScreen[] {
  return [...BZ_SCREEN_LISTS[quoteGroupForType(typeId)]]
}

/**
 * BuildZoom setUserScreen + description.continue password skip for existing users.
 * competing-bids is not part of the homepage list.
 */
export function screensForQuoteType(
  typeId: EstimatorProjectTypeId | null,
  auth: BzAuthContext = { signedIn: false, hasPhone: false },
): BzQuoteScreen[] {
  const screens = baseScreensForQuoteType(typeId)
  if (!auth.signedIn) return screens
  return screens.filter((screen) => {
    if (screen === 'email' || screen === 'name' || screen === 'password') return false
    if (screen === 'phone' && auth.hasPhone) return false
    return true
  })
}

export function nextScreenAfter(
  current: BzQuoteScreen,
  typeId: EstimatorProjectTypeId | null,
  auth?: BzAuthContext,
): BzQuoteScreen | 'loading' {
  const screens = screensForQuoteType(typeId, auth)
  const index = screens.indexOf(current)
  if (index < 0) return screens[0] ?? 'loading'
  if (index >= screens.length - 1) return 'loading'
  return screens[index + 1]
}

export function prevScreenBefore(
  current: BzQuoteScreen,
  typeId: EstimatorProjectTypeId | null,
  auth?: BzAuthContext,
): BzQuoteScreen | null {
  if (current === 'loading') {
    const screens = screensForQuoteType(typeId, auth)
    return screens[screens.length - 1] ?? null
  }
  const screens = screensForQuoteType(typeId, auth)
  const index = screens.indexOf(current)
  if (index <= 0) return null
  return screens[index - 1]
}

export function progressPercent(screen: BzQuoteScreen, typeId: EstimatorProjectTypeId | null, auth?: BzAuthContext) {
  const screens = screensForQuoteType(typeId, auth)
  if (screen === 'loading') return 100
  const index = Math.max(0, screens.indexOf(screen))
  return Math.round(((index + 1) / Math.max(1, screens.length)) * 100)
}

export function isSurveyScreen(screen: BzQuoteScreen) {
  return (
    screen === 'urgency' ||
    screen === 'land' ||
    screen === 'property' ||
    screen === 'relationship' ||
    screen === 'design'
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseBudgetBand(budget: string | null | undefined): { min: number; max: number } | null {
  if (!budget || budget === 'private') return null
  const [minRaw, maxRaw] = budget.split('-')
  const min = Number(minRaw)
  const max = Number(maxRaw)
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return { min, max }
}

export function isLowBudget(budget: string | null | undefined) {
  const parsed = parseBudgetBand(budget)
  return Boolean(parsed && parsed.max <= 1000)
}

export function budgetTierFromBand(budget: string | null | undefined): PricingTierId {
  const parsed = parseBudgetBand(budget)
  if (!parsed) return 'standard'
  if (parsed.max <= 20000) return 'economy'
  if (parsed.max <= 100000) return 'standard'
  return 'premium'
}

export function areaSqmFromBudget(budget: string | null | undefined, perSqm: number) {
  const parsed = parseBudgetBand(budget)
  const rate = perSqm > 0 ? perSqm : 90
  if (!parsed) return 10
  const mid = (parsed.min + Math.min(parsed.max, 1_000_000)) / 2
  return Math.min(400, Math.max(8, Math.round(mid / rate)))
}

export function validateQuoteScreen(
  screen: BzQuoteScreen,
  draft: BzQuoteDraft,
  extra?: { password?: string },
): string | null {
  if (screen === 'title' && draft.title.trim().length < 1) {
    return 'costEstimator.quote.errors.title'
  }
  if (screen === 'email' && !EMAIL_RE.test(draft.email.trim())) {
    return 'costEstimator.quote.errors.email'
  }
  if (screen === 'phone') {
    const digits = draft.phone.replace(/\D/g, '')
    if (digits.length < 8) return 'costEstimator.quote.errors.phone'
  }
  if (screen === 'name' && !draft.name.trim()) {
    return 'costEstimator.quote.errors.name'
  }
  if (screen === 'location' && !draft.city.trim()) {
    return 'costEstimator.quote.errors.location'
  }
  if (screen === 'budget') {
    if (!draft.budget) return 'costEstimator.quote.errors.budget'
    if (isLowBudget(draft.budget)) return 'costEstimator.quote.errors.lowBudget'
  }
  if (screen === 'description') {
    const needsMin =
      draft.budget === '1000-5000' && draft.description.trim().length < 50
    if (needsMin) return 'costEstimator.quote.errors.description'
  }
  if (screen === 'password') {
    const password = extra?.password ?? ''
    if (password.length < 6) return 'costEstimator.quote.errors.password'
  }
  return null
}

/** @deprecated use nextScreenAfter — kept for existing imports during migration */
export function screensForQuoteTypeLegacy(typeId: EstimatorProjectTypeId | null): BzQuoteScreen[] {
  return screensForQuoteType(typeId)
}

export function nextScreenAfterUrgency(typeId: EstimatorProjectTypeId | null): 'land' | 'property' {
  return quoteGroupForType(typeId) === 'new_construction' ? 'land' : 'property'
}
