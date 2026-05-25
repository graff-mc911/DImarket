/** Перевірка доступності AI-провайдерів (ключі лише на сервері). */

export type AiProviderStatus = {
  openai: boolean
  googleVision: boolean
  telegram: boolean
  whatsapp: boolean
}

import { getTranslation, type LanguageCode } from '../i18n'

/** Клієнт не бачить ключів — лише статус з edge або env preview */
export function aiNotConfiguredMessage(locale: string): string {
  const key = 'ai.fallback' as const
  const text = getTranslation(locale as LanguageCode, key)
  return text !== key ? text : getTranslation('en', key)
}
