import type { EstimatorProjectTypeId } from './costEstimatorTypes'

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

/** BuildZoom urgencyTypesModel.getInitial() minus the empty placeholder. */
export const BZ_URGENCY_OPTIONS = [
  { id: 'flexible', value: "I'm flexible", labelKey: 'costEstimator.quote.urgency.flexible' },
  { id: 'asap', value: 'As soon as possible', labelKey: 'costEstimator.quote.urgency.asap' },
  { id: 'weeks', value: 'Within the next few weeks', labelKey: 'costEstimator.quote.urgency.weeks' },
  { id: 'months', value: 'Within the next few months', labelKey: 'costEstimator.quote.urgency.months' },
] as const

/** BuildZoom expectedResponsesOptions */
export const BZ_BID_COUNTS = [3, 4, 5] as const

/** BuildZoom property_type contractorAttributes */
export const BZ_PROPERTY_TYPES = [
  { id: 'home', labelKey: 'costEstimator.quote.property.home' },
  { id: 'condo', labelKey: 'costEstimator.quote.property.condo' },
  { id: 'office', labelKey: 'costEstimator.quote.property.office' },
  { id: 'other', labelKey: 'costEstimator.quote.property.other' },
] as const

export type BzQuoteScreen = 'title' | 'urgency' | 'bids' | 'property'

export const BZ_QUOTE_SCREENS: BzQuoteScreen[] = ['title', 'urgency', 'bids', 'property']

export type BzQuoteDraft = {
  title: string
  typeId: EstimatorProjectTypeId | null
  urgency: (typeof BZ_URGENCY_OPTIONS)[number]['id'] | null
  bids: (typeof BZ_BID_COUNTS)[number] | null
  propertyType: (typeof BZ_PROPERTY_TYPES)[number]['id'] | null
}

export const EMPTY_BZ_QUOTE: BzQuoteDraft = {
  title: '',
  typeId: null,
  urgency: null,
  bids: null,
  propertyType: null,
}
