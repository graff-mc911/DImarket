// ============================================================
// Checkout.tsx — Сторінка після оплати через Stripe
//
// Stripe перенаправляє сюди після оплати з параметром:
// /checkout?session_id=cs_test_...
//
// Сторінка:
// 1. Перевіряє session_id в URL
// 2. Показує успішну оплату або помилку
// 3. Активує куплену послугу в базі даних
// ============================================================

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'

// Статус перевірки оплати
type CheckoutStatus = 'loading' | 'success' | 'error' | 'no_session'

export function Checkout() {
  const { user } = useApp()
  const [status, setStatus]         = useState<CheckoutStatus>('loading')
  const [message, setMessage]       = useState('')
  const [paymentType, setPaymentType] = useState('')

  useEffect(() => {
    void verifyPayment()
  }, [])

  // Перевіряємо сесію Stripe і активуємо послугу
  const verifyPayment = async () => {
    // Отримуємо session_id з URL
    const params    = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')

    if (!sessionId) {
      setStatus('no_session')
      return
    }

    if (!user) {
      navigateTo('/login')
      return
    }

    try {
      // Перевіряємо статус сесії через Edge Function
      const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
        body: { session_id: sessionId, user_id: user.id },
      })

      if (error || !data) throw new Error('Помилка перевірки оплати')

      if (data.payment_status === 'paid') {
        setPaymentType(data.payment_type || '')
        setMessage(data.description || 'Оплата успішна')

        // Активуємо куплену послугу в базі
        await activateService(data.payment_type, data.reference_id, data.metadata)
        setStatus('success')

        // Очищаємо URL від session_id
        window.history.replaceState({}, '', '/checkout')
      } else {
        setStatus('error')
        setMessage('Оплата не завершена або скасована.')
      }
    } catch (err) {
      console.error('Помилка Checkout:', err)
      setStatus('error')
      setMessage('Не вдалося перевірити оплату. Зверніться до підтримки.')
    }
  }

  // Активує відповідну послугу після успішної оплати
  const activateService = async (
    paymentType: string,
    referenceId: string,
    metadata: Record<string, string>
  ) => {
    const now         = new Date()
    const durationDays = parseInt(metadata?.duration_days || '30')
    const expiresAt   = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()

    switch (paymentType) {
      // Активуємо преміум профіль
      case 'premium_profile':
        await supabase
          .from('profiles')
          .update({ is_premium: true, premium_expires_at: expiresAt })
          .eq('id', user!.id)
        break

      // Активуємо верифікований бейдж
      case 'verified_badge':
        await supabase
          .from('profiles')
          .update({ is_verified: true, verified_at: now.toISOString() })
          .eq('id', user!.id)
        break

      // Активуємо виділене оголошення
      case 'featured_listing':
        if (referenceId) {
          await supabase
            .from('listings')
            .update({ is_promoted: true, promoted_expires_at: expiresAt })
            .eq('id', referenceId)
            .eq('author_id', user!.id)
        }
        break

      // Активуємо рекламну кампанію
      case 'ad_campaign':
        if (referenceId) {
          const amountEur =
            parseFloat(metadata?.amount_total || '0') / 100
          await supabase
            .from('ad_campaigns')
            .update({
              status:            'active',
              stripe_payment_id: metadata?.session_id,
              price_paid:        amountEur > 0 ? amountEur : null,
              currency_paid:     metadata?.currency || 'eur',
            })
            .eq('id', referenceId)
            .eq('advertiser_id', user!.id)
        }
        break

      default:
        console.warn('Невідомий тип оплати:', paymentType)
    }

    // Записуємо платіж в таблицю payments
    await supabase.from('payments').insert({
      user_id:             user!.id,
      payment_type:        paymentType,
      reference_id:        referenceId || null,
      amount:              parseFloat(metadata?.amount_total || '0') / 100,
      currency:            metadata?.currency || 'eur',
      stripe_session_id:   metadata?.session_id,
      status:              'completed',
    })
  }

  // Повідомлення залежно від типу оплати
  const getSuccessMessage = () => {
    switch (paymentType) {
      case 'premium_profile':   return 'Ваш профіль тепер преміум — він показується вгорі каталогу майстрів!'
      case 'verified_badge':    return 'Верифікований бейдж активовано — зелена галочка з\'явиться на вашому профілі!'
      case 'featured_listing':  return 'Оголошення виділено — воно показуватиметься першим у каталозі!'
      case 'ad_campaign':       return 'Рекламна кампанія активована — ваш банер вже показується користувачам!'
      default:                  return 'Оплата успішна! Послуга активована.'
    }
  }

  // Куди перейти після оплати
  const getRedirectPath = () => {
    switch (paymentType) {
      case 'premium_profile':
      case 'verified_badge':   return '/profile'
      case 'featured_listing': return '/my-listings'
      case 'ad_campaign':      return '/advertising'
      default:                 return '/'
    }
  }

  const getRedirectLabel = () => {
    switch (paymentType) {
      case 'premium_profile':
      case 'verified_badge':   return 'Переглянути профіль'
      case 'featured_listing': return 'Мої оголошення'
      case 'ad_campaign':      return 'Мої кампанії'
      default:                 return 'На головну'
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 text-center">

          {/* Завантаження */}
          {status === 'loading' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: 'rgba(199,138,96,0.12)' }}>
                <Loader className="h-10 w-10 animate-spin" style={{ color: 'var(--accent-700)' }} />
              </div>
              <h1 className="mt-6 text-2xl font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Перевіряємо оплату...
              </h1>
              <p className="muted-text mt-3 text-sm">
                Зачекайте кілька секунд
              </p>
            </>
          )}

          {/* Успіх */}
          {status === 'success' && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle className="h-10 w-10" style={{ color: '#15803d' }} />
              </div>
              <h1 className="mt-6 text-2xl font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Оплата успішна!
              </h1>
              <p className="muted-text mt-3 text-sm leading-relaxed">
                {getSuccessMessage()}
              </p>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => navigateTo(getRedirectPath())}
                  className="btn-primary w-full justify-center rounded-full"
                >
                  {getRedirectLabel()}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/')}
                  className="btn-secondary w-full justify-center rounded-full"
                >
                  На головну
                </button>
              </div>
            </>
          )}

          {/* Помилка */}
          {(status === 'error' || status === 'no_session') && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: 'rgba(239,68,68,0.10)' }}>
                <XCircle className="h-10 w-10" style={{ color: '#b91c1c' }} />
              </div>
              <h1 className="mt-6 text-2xl font-extrabold" style={{ color: 'var(--ink-900)' }}>
                {status === 'no_session' ? 'Сторінка недоступна' : 'Щось пішло не так'}
              </h1>
              <p className="muted-text mt-3 text-sm leading-relaxed">
                {status === 'no_session'
                  ? 'Ця сторінка відкривається тільки після оплати через Stripe.'
                  : message}
              </p>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => navigateTo('/contact')}
                  className="btn-primary w-full justify-center rounded-full"
                >
                  Зв\'язатися з підтримкою
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/')}
                  className="btn-secondary w-full justify-center rounded-full"
                >
                  На головну
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}