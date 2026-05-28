import { categoryLabel, t, type BotLocale } from './i18n.ts'

export type BotStep =
  | 'idle'
  | 'category'
  | 'city'
  | 'budget'
  | 'deadline'
  | 'description'
  | 'photos'
  | 'contact'
  | 'confirm'

export type ListingDraft = {
  categoryId?: string
  categorySlug?: string
  categoryName?: string
  location?: string
  price?: number | null
  currency?: string
  deadlineDays?: number
  description?: string
  imageUrls?: string[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  telegramUsername?: string
}

export type CategoryRow = { id: string; slug: string; name: string; icon: string | null }

const SKIP = /^(skip|пропустити|пропустить|pomiń|überspringen|omitir|немає|ні|no|none|—|-)$/i

export function emptyDraft(): ListingDraft {
  return { imageUrls: [], currency: 'EUR', deadlineDays: 30 }
}

export function parseBudget(text: string): number | null {
  const normalized = text.replace(/\s/g, '').replace(',', '.')
  const match = normalized.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const n = parseFloat(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

export function parseDeadlineDays(text: string): number {
  const lower = text.toLowerCase()
  const num = parseBudget(text)
  if (num && num <= 365) return Math.round(num)
  if (/тижд|week/i.test(lower)) return 7
  if (/міся|month/i.test(lower)) return 30
  if (/терміново|urgent|asap/i.test(lower)) return 7
  return 30
}

export function extractUrls(text: string): string[] {
  return (text.match(/https?:\/\/[^\s,]+/gi) ?? []).map((u) => u.replace(/[.,;]+$/, ''))
}

export function matchCategory(
  text: string,
  categories: CategoryRow[],
  locale: BotLocale,
): CategoryRow | null {
  const lower = text.toLowerCase().trim()
  for (const cat of categories) {
    const label = categoryLabel(cat.slug, locale, cat.name).toLowerCase()
    if (lower.includes(cat.slug) || lower.includes(label) || label.includes(lower)) return cat
  }
  const num = lower.match(/^(\d{1,2})$/)
  if (num) {
    const idx = parseInt(num[1], 10) - 1
    if (categories[idx]) return categories[idx]
  }
  return null
}

export function needsContact(draft: ListingDraft): boolean {
  return !draft.contactPhone?.trim() && !draft.contactEmail?.trim()
}

export function buildTitle(draft: ListingDraft, locale: BotLocale): string {
  const cat = draft.categorySlug
    ? categoryLabel(draft.categorySlug, locale, draft.categoryName || '')
    : ''
  const city = draft.location?.split(',')[0]?.trim() || ''
  const parts = [cat, city].filter(Boolean)
  if (parts.length) return parts.join(' — ')
  return (draft.description || '').trim().slice(0, 80) || 'Job request'
}

export type FlowReply = {
  text: string
  step: BotStep
  draft: ListingDraft
  publish?: boolean
}

export function processText(
  step: BotStep,
  draft: ListingDraft,
  text: string,
  locale: BotLocale,
  categories: CategoryRow[],
): FlowReply {
  const msg = text.trim()
  const next = { ...draft, imageUrls: [...(draft.imageUrls ?? [])] }

  if (step === 'confirm') {
    if (/^(так|yes|да|tak|sí|si|ok|підтвердж|publish|опубліку|ja)/i.test(msg)) {
      return { text: t(locale, 'publishing'), step: 'confirm', draft: next, publish: true }
    }
    if (/^(ні|no|nie|нет|edit|змінити|назад)/i.test(msg)) {
      return { text: t(locale, 'askDescription'), step: 'description', draft: next }
    }
    return { text: t(locale, 'confirmHint'), step: 'confirm', draft: next }
  }

  switch (step) {
    case 'idle':
    case 'category': {
      const cat = matchCategory(msg, categories, locale)
      if (!cat) {
        return { text: t(locale, 'categoryUnknown'), step: 'category', draft: next }
      }
      next.categoryId = cat.id
      next.categorySlug = cat.slug
      next.categoryName = cat.name
      return { text: t(locale, 'askCity'), step: 'city', draft: next }
    }
    case 'city':
      if (msg.length < 2) return { text: t(locale, 'cityTooShort'), step: 'city', draft: next }
      next.location = msg
      return { text: t(locale, 'askBudget'), step: 'budget', draft: next }
    case 'budget': {
      const budget = parseBudget(msg)
      if (budget === null && !SKIP.test(msg)) {
        return { text: t(locale, 'budgetInvalid'), step: 'budget', draft: next }
      }
      next.price = budget
      return { text: t(locale, 'askDeadline'), step: 'deadline', draft: next }
    }
    case 'deadline':
      next.deadlineDays = SKIP.test(msg) ? 30 : parseDeadlineDays(msg)
      return { text: t(locale, 'askDescription'), step: 'description', draft: next }
    case 'description':
      if (msg.length < 15) {
        return { text: t(locale, 'descriptionTooShort'), step: 'description', draft: next }
      }
      next.description = msg
      return { text: t(locale, 'askPhotos'), step: 'photos', draft: next }
    case 'photos':
      if (!SKIP.test(msg)) {
        const urls = extractUrls(msg)
        if (urls.length) next.imageUrls = [...(next.imageUrls ?? []), ...urls]
        else if (msg.length > 3) {
          return { text: t(locale, 'photosNeedUrl'), step: 'photos', draft: next }
        }
      }
      if (needsContact(next)) {
        return { text: t(locale, 'askContact'), step: 'contact', draft: next }
      }
      return confirmReply(next, locale)
    case 'contact': {
      const phoneMatch = msg.match(/\+?[\d\s()-]{8,}/)
      const emailMatch = msg.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)
      if (phoneMatch) next.contactPhone = phoneMatch[0].replace(/\s/g, '')
      if (emailMatch) next.contactEmail = emailMatch[0]
      if (!phoneMatch && !emailMatch && msg.includes('@')) next.contactEmail = msg
      if (needsContact(next)) {
        return { text: t(locale, 'contactRequired'), step: 'contact', draft: next }
      }
      return confirmReply(next, locale)
    }
    default:
      return { text: t(locale, 'newListing'), step: 'category', draft: emptyDraft() }
  }
}

function confirmReply(draft: ListingDraft, locale: BotLocale): FlowReply {
  const cat = draft.categorySlug
    ? categoryLabel(draft.categorySlug, locale, draft.categoryName || draft.categorySlug)
    : '—'
  return {
    text: t(locale, 'confirm', {
      category: cat,
      city: draft.location || '—',
      budget: draft.price != null ? String(draft.price) : '—',
      deadline: String(draft.deadlineDays ?? 30),
      description: (draft.description || '').slice(0, 200),
      photos: String(draft.imageUrls?.length ?? 0),
    }),
    step: 'confirm',
    draft,
  }
}

export function applyCategoryPick(
  draft: ListingDraft,
  cat: CategoryRow,
  locale: BotLocale,
): FlowReply {
  const next = { ...draft, imageUrls: [...(draft.imageUrls ?? [])] }
  next.categoryId = cat.id
  next.categorySlug = cat.slug
  next.categoryName = cat.name
  return { text: t(locale, 'askCity'), step: 'city', draft: next }
}

export function startNewListing(locale: BotLocale): FlowReply {
  return { text: t(locale, 'newListing'), step: 'category', draft: emptyDraft() }
}
