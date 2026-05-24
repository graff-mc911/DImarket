/** Зрозумілий текст помилки Supabase для UI */
export function formatSupabaseError(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback

  const e = err as { message?: string; code?: string; details?: string; hint?: string }
  const msg = e.message?.trim()
  if (!msg) return fallback

  if (msg.includes('Bucket not found') || msg.includes('bucket') && msg.includes('not found')) {
    return 'Сховище для банерів (ad-media) не налаштовано на сервері. Вставте URL зображення вручну або зверніться до підтримки.'
  }
  if (msg.includes('regions') && msg.includes('does not exist')) {
    return 'База даних потребує оновлення (колонка regions). Застосуйте міграцію Supabase або спробуйте пізніше.'
  }
  if (msg.includes('violates foreign key constraint') && msg.includes('advertiser_id')) {
    return 'Профіль користувача не знайдено. Вийдіть і увійдіть знову або оновіть профіль у налаштуваннях.'
  }
  if (msg.includes('Requested function was not found') || msg.includes('NOT_FOUND')) {
    return 'Оплата Stripe тимчасово недоступна (edge function не розгорнута). Як власник — опублікуйте без оплати.'
  }

  return msg.length > 180 ? fallback + ' (' + msg.slice(0, 120) + '…)' : msg
}
