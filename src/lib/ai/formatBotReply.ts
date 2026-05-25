import type { TranslationKey } from '../i18n'
import type { JobRequestDraft } from './jobRequestDraft'
import {
  categoryListText,
  type SalesBotContext,
  type SalesBotMessage,
  type SalesBotMessageTurn,
  type SalesBotTurnResult,
} from './salesBotEngine'

export function interpolateTemplate(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] ?? '')
}

export function formatBotReply(
  turn: Pick<SalesBotTurnResult, 'replyKey' | 'replyParams' | 'replyText'>,
  t: (key: TranslationKey) => string,
): string {
  if (turn.replyText) return turn.replyText
  return interpolateTemplate(t(turn.replyKey), turn.replyParams)
}

export function turnFromResult(
  turn: Pick<SalesBotTurnResult, 'replyKey' | 'replyParams' | 'replyText'>,
): SalesBotMessageTurn {
  return {
    replyKey: turn.replyKey,
    replyParams: turn.replyParams,
    replyText: turn.replyText,
  }
}

export function assistantMessage(
  turn: Pick<SalesBotTurnResult, 'replyKey' | 'replyParams' | 'replyText'>,
  t: (key: TranslationKey) => string,
): SalesBotMessage {
  const payload = turnFromResult(turn)
  return {
    role: 'assistant',
    turn: payload,
    content: formatBotReply(payload, t),
  }
}

export function messageDisplayContent(
  msg: SalesBotMessage,
  t: (key: TranslationKey) => string,
): string {
  if (msg.role === 'user') return msg.content
  if (msg.turn) return formatBotReply(msg.turn, t)
  return msg.content
}

/** Оновлює параметри шаблону (назви категорій тощо) під поточну мову. */
export function refreshAssistantTurn(
  turn: SalesBotMessageTurn,
  draft: JobRequestDraft,
  ctx: SalesBotContext,
): SalesBotMessageTurn {
  if (turn.replyText) return turn

  const key = turn.replyKey
  if (key === 'salesBot.welcome' || key === 'salesBot.categoryUnknown') {
    return {
      ...turn,
      replyParams: { categories: categoryListText(ctx.categories, ctx.categoryLabels) },
    }
  }
  if (key === 'salesBot.askCity' && draft.categorySlug) {
    return {
      ...turn,
      replyParams: {
        category: ctx.categoryLabels[draft.categorySlug] || draft.categorySlug,
      },
    }
  }
  if (key === 'salesBot.confirm') {
    const cat = draft.categorySlug
      ? ctx.categoryLabels[draft.categorySlug] || draft.categorySlug
      : '—'
    return {
      ...turn,
      replyParams: {
        category: cat,
        city: draft.location || '—',
        budget: draft.price != null ? String(draft.price) : '—',
        deadline: String(draft.deadlineDays ?? 30),
        description: (draft.description || '').slice(0, 200),
        photos: String(draft.imageUrls?.length ?? 0),
      },
    }
  }
  return turn
}

export function remapAssistantMessages(
  messages: SalesBotMessage[],
  t: (key: TranslationKey) => string,
  draft: JobRequestDraft,
  ctx?: SalesBotContext,
): SalesBotMessage[] {
  return messages.map((m) => {
    if (m.role !== 'assistant' || !m.turn) return m
    const turn = ctx ? refreshAssistantTurn(m.turn, draft, ctx) : m.turn
    return { ...m, turn, content: formatBotReply(turn, t) }
  })
}
