/** Зрозумілий текст помилки Supabase для UI */
export function formatSupabaseError(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback

  const e = err as { message?: string; code?: string; details?: string; hint?: string }
  const msg = e.message?.trim()
  if (!msg) return fallback

  if (msg.includes('Bucket not found') || (msg.includes('bucket') && msg.includes('not found'))) {
    return 'Сховище для банерів (media) не налаштовано на сервері. Вставте URL зображення вручну або зверніться до підтримки.'
  }
  if (msg.includes('row-level security') || msg.includes('policy')) {
    return 'Немає прав на цю дію (RLS). Перевірте, що ви увійшли як власник або рекламодавець, і спробуйте знову.'
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
  if (msg.includes('Invalid amount') || msg.includes('Missing required fields')) {
    return 'Невірна сума або дані для Stripe. Перевірте географію/слоти або натисніть «Оплатити» ще раз.'
  }
  if (msg.includes('Failed to send a request to the Edge Function') || msg.includes('FunctionsFetchError')) {
    return 'Немає звʼязку з сервером оплати. Перевірте інтернет і спробуйте знову.'
  }

  return msg.length > 180 ? fallback + ' (' + msg.slice(0, 120) + '…)' : msg
}
