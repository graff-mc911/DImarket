/** Структурований чернетка заявки / гіда AI (listings + інші інтенти). */

export type JobRequestVisibilityRadius =
  | 'city'
  | 'district'
  | 'region'
  | 'country'
  | 'state'
  | 'land'
  | 'global'

/** Що клієнт хоче зробити — визначає асистент з вільного тексту. */
export type GuideIntent =
  | 'job_service'
  | 'advertising'
  | 'profile_pro'
  | 'profile_company'
  | 'vacancy'
  | 'sell_rent'

export type TradeRole =
  | 'electrician'
  | 'handyman'
  | 'plumber'
  | 'cleaner'
  | 'hvac'
  | 'painter'
  | 'general'

export type ListingType = 'service_request' | 'service_offer' | 'item_sale' | 'item_wanted'

export type JobRequestDraft = {
  title?: string
  description?: string
  categoryId?: string
  categorySlug?: string
  subcategorySlugs?: string[]
  location?: string
  price?: number | null
  currency?: string
  deadlineDays?: number
  imageUrls?: string[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  visibilityRadius?: JobRequestVisibilityRadius
  /** Multi-intent guide fields */
  intent?: GuideIntent | null
  problemText?: string
  /** power_outage | ac_cooling | plumbing | heating | appliance | painting | cleaning | general */
  problemKind?: string
  diagnoseDuration?: string
  diagnoseSymptoms?: string
  tradeRole?: TradeRole
  latitude?: number | null
  longitude?: number | null
  listingType?: ListingType
  /** Extra collected fields (salary, ad goal, sell mode…) */
  guideMeta?: Record<string, string>
}

export type SalesBotStep =
  | 'welcome'
  | 'category'
  | 'diagnose_duration'
  | 'diagnose_symptoms'
  | 'trade_confirm'
  | 'renovation_choice'
  | 'geo'
  | 'show_matches'
  | 'ask_publish'
  | 'city'
  | 'budget'
  | 'deadline'
  | 'description'
  | 'photos'
  | 'contact'
  | 'confirm'
  | 'ad_goal'
  | 'ad_geo'
  | 'ad_budget'
  | 'ad_ready'
  | 'profile_name'
  | 'profile_city'
  | 'profile_trade'
  | 'profile_phone'
  | 'profile_ready'
  | 'vacancy_title'
  | 'vacancy_city'
  | 'vacancy_salary'
  | 'vacancy_desc'
  | 'vacancy_confirm'
  | 'sell_mode'
  | 'sell_what'
  | 'sell_city'
  | 'sell_price'
  | 'sell_desc'
  | 'sell_confirm'
  | 'done'

export const SALES_BOT_STEPS_ORDER: SalesBotStep[] = [
  'welcome',
  'category',
  'diagnose_duration',
  'diagnose_symptoms',
  'trade_confirm',
  'renovation_choice',
  'geo',
  'show_matches',
  'ask_publish',
  'city',
  'budget',
  'deadline',
  'description',
  'photos',
  'contact',
  'confirm',
  'ad_goal',
  'ad_geo',
  'ad_budget',
  'ad_ready',
  'profile_name',
  'profile_city',
  'profile_trade',
  'profile_phone',
  'profile_ready',
  'vacancy_title',
  'vacancy_city',
  'vacancy_salary',
  'vacancy_desc',
  'vacancy_confirm',
  'sell_mode',
  'sell_what',
  'sell_city',
  'sell_price',
  'sell_desc',
  'sell_confirm',
  'done',
]

export type SalesCategoryOption = {
  id: string
  slug: string
  name: string
}

export function emptyJobRequestDraft(): JobRequestDraft {
  return {
    imageUrls: [],
    visibilityRadius: 'city',
    intent: null,
    guideMeta: {},
    listingType: 'service_request',
  }
}

export function draftNeedsContact(draft: JobRequestDraft): boolean {
  return !draft.contactPhone?.trim() && !draft.contactEmail?.trim()
}

export function buildDraftTitle(draft: JobRequestDraft, categoryLabel?: string): string {
  if (draft.title?.trim()) return draft.title.trim()
  if (draft.problemText?.trim()) {
    const city = draft.location?.split(',')[0]?.trim() || ''
    return city ? `${draft.problemText.trim().slice(0, 60)} — ${city}` : draft.problemText.trim().slice(0, 80)
  }
  const cat = categoryLabel || draft.categorySlug || ''
  const city = draft.location?.split(',')[0]?.trim() || ''
  const parts = [cat, city].filter(Boolean)
  if (parts.length) return parts.join(' — ')
  return (draft.description || '').trim().slice(0, 80) || 'Job request'
}
