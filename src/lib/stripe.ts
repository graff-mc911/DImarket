// ============================================================
// stripe.ts — Утиліта для роботи зі Stripe через Supabase Edge Function
//
// Як працює:
// 1. Фронтенд викликає createCheckoutSession() з параметрами оплати
// 2. Supabase Edge Function створює Stripe Checkout сесію
// 3. Користувач перенаправляється на сторінку оплати Stripe
// 4. Після оплати Stripe повертає на /checkout?session_id=...
// 5. Сторінка Checkout перевіряє статус і активує послугу
// ============================================================

import { supabase } from './supabase'

// Типи платежів які підтримує DImarket
export type PaymentType =
  | 'ad_campaign'       // Рекламна кампанія
  | 'premium_profile'   // Преміум профіль майстра
  | 'featured_listing'  // Виділене оголошення
  | 'verified_badge'    // Верифікований бейдж

// Параметри для створення Checkout сесії
export interface CheckoutParams {
  payment_type:  PaymentType
  reference_id?: string   // ID кампанії, оголошення або профілю
  user_id:       string
  amount:        number   // Сума в центах (EUR) — 2900 = €29.00
  currency:      string   // 'eur', 'usd', 'gbp'
  description:   string   // Назва що показується в Stripe
}

// Результат створення сесії
export interface CheckoutResult {
  url:        string  // URL для перенаправлення на Stripe
  session_id: string  // ID сесії для перевірки після оплати
}

// Перетворює суму в євро на центи для Stripe
export const eurosToCents = (euros: number): number => Math.round(euros * 100)

// Створює Stripe Checkout сесію через Supabase Edge Function
export async function createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      payment_type: params.payment_type,
      reference_id: params.reference_id || '',
      user_id:      params.user_id,
      amount:       params.amount,
      currency:     params.currency.toLowerCase(),
      description:  params.description,
      success_url:  window.location.origin + '/checkout',
      cancel_url:   window.location.origin + window.location.pathname,
    },
  })

  if (error) throw new Error(error.message || 'Stripe помилка')
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('Не отримано URL від Stripe')

  return { url: data.url, session_id: data.session_id }
}

// Пакети для платних послуг DImarket
export const BOOST_PACKAGES = [
  {
    id:           'premium_profile_4w',
    type:         'premium_profile' as PaymentType,
    name:         'Преміум профіль — 4 тижні',
    description:  'Ваш профіль показується вгорі каталогу майстрів',
    price_eur:    29,
    duration_days: 28,
  },
  {
    id:           'premium_profile_12w',
    type:         'premium_profile' as PaymentType,
    name:         'Преміум профіль — 12 тижнів',
    description:  'Ваш профіль показується вгорі каталогу майстрів',
    price_eur:    69,
    duration_days: 84,
  },
  {
    id:           'featured_listing_1w',
    type:         'featured_listing' as PaymentType,
    name:         'Виділене оголошення — 1 тиждень',
    description:  'Оголошення виділяється і показується першим',
    price_eur:    9,
    duration_days: 7,
  },
  {
    id:           'verified_badge',
    type:         'verified_badge' as PaymentType,
    name:         'Верифікований бейдж',
    description:  'Зелена галочка верифікації на вашому профілі',
    price_eur:    49,
    duration_days: 365,
  },
]