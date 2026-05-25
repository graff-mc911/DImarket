/** Перевірка доступності AI-провайдерів (ключі лише на сервері). */

export type AiProviderStatus = {
  openai: boolean
  googleVision: boolean
  telegram: boolean
  whatsapp: boolean
}

/** Клієнт не бачить ключів — лише статус з edge або env preview */
export function aiNotConfiguredMessage(locale: string): string {
  if (locale === 'uk') {
    return 'AI-сервіс тимчасово недоступний. Використовується локальний режим.'
  }
  if (locale === 'ru') {
    return 'AI-сервис временно недоступен. Используется локальный режим.'
  }
  return 'AI service is unavailable. Using local fallback mode.'
}
