import type { TranslationKey } from '../i18n'
import {
  buildDraftTitle,
  draftNeedsContact,
  emptyJobRequestDraft,
  type JobRequestDraft,
  type SalesBotStep,
  type SalesCategoryOption,
} from './jobRequestDraft'

/** Збережений хід бота — для перекладу при зміні мови інтерфейсу. */
export type SalesBotMessageTurn = {
  replyKey: TranslationKey
  replyParams?: Record<string, string>
  replyText?: string
}

export type SalesBotMessage = {
  role: 'user' | 'assistant'
  /** Кешований текст (оновлюється при зміні мови, якщо є turn). */
  content: string
  turn?: SalesBotMessageTurn
}

export type SalesBotTurnResult = {
  replyKey: TranslationKey
  replyParams?: Record<string, string>
  /** Прямий текст (LLM або fallback), якщо задано — пріоритет над replyKey */
  replyText?: string
  step: SalesBotStep
  draft: JobRequestDraft
  quickReplies?: string[]
  canPublish: boolean
  publishedListingId?: string
}

export type SalesBotContext = {
  locale: string
  categories: SalesCategoryOption[]
  categoryLabels: Record<string, string>
  profileName?: string
  profileEmail?: string
  profilePhone?: string
  currencyCode: string
}

const SKIP_WORDS = /^(skip|пропустити|немає|ні|no|none|—|-)$/i

function parseBudget(text: string): number | null {
  const normalized = text.replace(/\s/g, '').replace(',', '.')
  const match = normalized.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const n = parseFloat(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

function parseDeadlineDays(text: string): number {
  const lower = text.toLowerCase()
  const num = parseBudget(text)
  if (num && num <= 365) return Math.round(num)
  if (/тижд|week/i.test(lower)) return 7
  if (/міся|month/i.test(lower)) return 30
  if (/терміново|urgent|asap|швидко/i.test(lower)) return 7
  if (/гнучк|flex/i.test(lower)) return 60
  return 30
}

function extractUrls(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s,]+/gi) ?? []
  return urls.map((u) => u.replace(/[.,;]+$/, ''))
}

function matchCategory(
  text: string,
  categories: SalesCategoryOption[],
  labels: Record<string, string>,
): SalesCategoryOption | null {
  const lower = text.toLowerCase().trim()
  for (const cat of categories) {
    const label = (labels[cat.slug] || cat.name).toLowerCase()
    if (lower.includes(cat.slug) || lower.includes(label) || label.includes(lower)) {
      return cat
    }
  }
  const byNum = lower.match(/^(\d{1,2})$/)
  if (byNum) {
    const idx = parseInt(byNum[1], 10) - 1
    if (categories[idx]) return categories[idx]
  }
  return null
}

export function categoryListText(categories: SalesCategoryOption[], labels: Record<string, string>): string {
  return categories
    .map((c, i) => `${i + 1}. ${labels[c.slug] || c.name}`)
    .join('\n')
}

export function getInitialTurn(ctx: SalesBotContext): SalesBotTurnResult {
  const draft = emptyJobRequestDraft()
  draft.currency = ctx.currencyCode
  if (ctx.profileName) draft.contactName = ctx.profileName
  if (ctx.profileEmail) draft.contactEmail = ctx.profileEmail
  if (ctx.profilePhone) draft.contactPhone = ctx.profilePhone

  return {
    replyKey: 'salesBot.welcome',
    replyParams: { categories: categoryListText(ctx.categories, ctx.categoryLabels) },
    step: 'category',
    draft,
    quickReplies: ctx.categories.slice(0, 6).map((c) => ctx.categoryLabels[c.slug] || c.name),
    canPublish: false,
  }
}

export function processSalesBotTurn(
  step: SalesBotStep,
  draft: JobRequestDraft,
  userMessage: string,
  ctx: SalesBotContext,
): SalesBotTurnResult {
  const text = userMessage.trim()
  const next = { ...draft }

  if (step === 'confirm') {
    if (/^(так|yes|ok|підтвердж|publish|опубліку)/i.test(text)) {
      return {
        replyKey: 'salesBot.publishing',
        step: 'confirm',
        draft: next,
        canPublish: true,
      }
    }
    if (/^(ні|no|edit|змінити|назад)/i.test(text)) {
      return {
        replyKey: 'salesBot.askDescription',
        step: 'description',
        draft: next,
        canPublish: false,
      }
    }
    return {
      replyKey: 'salesBot.confirmHint',
      step: 'confirm',
      draft: next,
      quickReplies: ['yes', 'no'],
      canPublish: false,
    }
  }

  switch (step) {
    case 'welcome':
    case 'category': {
      const cat = matchCategory(text, ctx.categories, ctx.categoryLabels)
      if (!cat) {
        return {
          replyKey: 'salesBot.categoryUnknown',
          replyParams: { categories: categoryListText(ctx.categories, ctx.categoryLabels) },
          step: 'category',
          draft: next,
          quickReplies: ctx.categories.slice(0, 6).map((c) => ctx.categoryLabels[c.slug] || c.name),
          canPublish: false,
        }
      }
      next.categoryId = cat.id
      next.categorySlug = cat.slug
      return {
        replyKey: 'salesBot.askCity',
        replyParams: { category: ctx.categoryLabels[cat.slug] || cat.name },
        step: 'city',
        draft: next,
        canPublish: false,
      }
    }

    case 'city': {
      if (text.length < 2) {
        return { replyKey: 'salesBot.cityTooShort', step: 'city', draft: next, canPublish: false }
      }
      next.location = text
      return { replyKey: 'salesBot.askBudget', step: 'budget', draft: next, canPublish: false }
    }

    case 'budget': {
      const budget = parseBudget(text)
      if (budget === null && !SKIP_WORDS.test(text)) {
        return { replyKey: 'salesBot.budgetInvalid', step: 'budget', draft: next, canPublish: false }
      }
      next.price = budget
      return {
        replyKey: 'salesBot.askDeadline',
        step: 'deadline',
        draft: next,
        quickReplies: ['7', '14', '30', '60'],
        canPublish: false,
      }
    }

    case 'deadline': {
      next.deadlineDays = parseDeadlineDays(text)
      return { replyKey: 'salesBot.askDescription', step: 'description', draft: next, canPublish: false }
    }

    case 'description': {
      if (text.length < 15) {
        return { replyKey: 'salesBot.descriptionTooShort', step: 'description', draft: next, canPublish: false }
      }
      next.description = text
      next.title = buildDraftTitle(next, next.categorySlug ? ctx.categoryLabels[next.categorySlug] : undefined)
      return {
        replyKey: 'salesBot.askPhotos',
        step: 'photos',
        draft: next,
        quickReplies: ['skip'],
        canPublish: false,
      }
    }

    case 'photos': {
      if (!SKIP_WORDS.test(text)) {
        const urls = extractUrls(text)
        if (urls.length) next.imageUrls = urls
        else if (text.length > 3) {
          return { replyKey: 'salesBot.photosNeedUrl', step: 'photos', draft: next, canPublish: false }
        }
      }
      if (draftNeedsContact(next)) {
        return { replyKey: 'salesBot.askContact', step: 'contact', draft: next, canPublish: false }
      }
      return buildConfirmTurn(next, ctx)
    }

    case 'contact': {
      const phoneMatch = text.match(/\+?[\d\s()-]{8,}/)
      const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)
      if (phoneMatch) next.contactPhone = phoneMatch[0].replace(/\s/g, '')
      if (emailMatch) next.contactEmail = emailMatch[0]
      if (!phoneMatch && !emailMatch && text.includes('@')) next.contactEmail = text
      if (draftNeedsContact(next)) {
        return { replyKey: 'salesBot.contactRequired', step: 'contact', draft: next, canPublish: false }
      }
      return buildConfirmTurn(next, ctx)
    }

    default:
      return getInitialTurn(ctx)
  }
}

function buildConfirmTurn(draft: JobRequestDraft, ctx: SalesBotContext): SalesBotTurnResult {
  const cat = draft.categorySlug ? ctx.categoryLabels[draft.categorySlug] || draft.categorySlug : '—'
  return {
    replyKey: 'salesBot.confirm',
    replyParams: {
      category: cat,
      city: draft.location || '—',
      budget: draft.price != null ? String(draft.price) : '—',
      deadline: String(draft.deadlineDays ?? 30),
      description: (draft.description || '').slice(0, 200),
      photos: String(draft.imageUrls?.length ?? 0),
    },
    step: 'confirm',
    draft,
    quickReplies: ['yes', 'no'],
    canPublish: false,
  }
}
