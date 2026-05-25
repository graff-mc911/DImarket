import type { TranslationKey } from '../i18n'
import type { SalesBotTurnResult } from './salesBotEngine'

export function interpolateTemplate(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] ?? '')
}

export function formatBotReply(
  turn: SalesBotTurnResult,
  t: (key: TranslationKey) => string,
): string {
  if (turn.replyText) return turn.replyText
  return interpolateTemplate(t(turn.replyKey), turn.replyParams)
}
