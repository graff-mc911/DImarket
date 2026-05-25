/** Структурований чернетка заявки на роботу (listings.service_request). */

export type JobRequestVisibilityRadius =
  | 'city'
  | 'district'
  | 'region'
  | 'country'
  | 'state'
  | 'land'
  | 'global'

export type JobRequestDraft = {
  title?: string
  description?: string
  categoryId?: string
  categorySlug?: string
  location?: string
  price?: number | null
  currency?: string
  deadlineDays?: number
  imageUrls?: string[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  visibilityRadius?: JobRequestVisibilityRadius
}

export type SalesBotStep =
  | 'welcome'
  | 'category'
  | 'city'
  | 'budget'
  | 'deadline'
  | 'description'
  | 'photos'
  | 'contact'
  | 'confirm'
  | 'done'

export const SALES_BOT_STEPS_ORDER: SalesBotStep[] = [
  'welcome',
  'category',
  'city',
  'budget',
  'deadline',
  'description',
  'photos',
  'contact',
  'confirm',
  'done',
]

export type SalesCategoryOption = {
  id: string
  slug: string
  name: string
}

export function emptyJobRequestDraft(): JobRequestDraft {
  return { imageUrls: [], visibilityRadius: 'city' }
}

export function draftNeedsContact(draft: JobRequestDraft): boolean {
  return !draft.contactPhone?.trim() && !draft.contactEmail?.trim()
}

export function buildDraftTitle(draft: JobRequestDraft, categoryLabel?: string): string {
  if (draft.title?.trim()) return draft.title.trim()
  const cat = categoryLabel || draft.categorySlug || ''
  const city = draft.location?.split(',')[0]?.trim() || ''
  const parts = [cat, city].filter(Boolean)
  if (parts.length) return parts.join(' — ')
  return (draft.description || '').trim().slice(0, 80) || 'Job request'
}
