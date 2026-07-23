// ============================================================
// BoostProfile.tsx — Сторінка платного просування профілю
//
// Дозволяє майстру купити:
// - Преміум профіль (показується вгорі каталогу)
// - Верифікований бейдж (зелена галочка)
//
// Оплата через Stripe Checkout.
// ============================================================

import { useState } from 'react'
import { ShieldCheck, Star, Zap, ArrowRight, Loader } from 'lucide-react'
import { useApp }        from '../contexts/AppContext'
import { navigateTo }    from '../lib/navigation'
import { createCheckoutSession, eurosToCents, BOOST_PACKAGES } from '../lib/stripe'

export function BoostProfile() {
  const { user, profile } = useApp()
  const [loading, setLoading]   = useState<string | null>(null)
  const [error, setError]       = useState('')

  // Запускаємо оплату через Stripe
  const handlePurchase = async (packageId: string) => {
    if (!user) { navigateTo('/login'); return }

    const pkg = BOOST_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return

    setLoading(packageId)
    setError('')

    try {
      const result = await createCheckoutSession({
        payment_type: pkg.type,
        reference_id: user.id,
        user_id:      user.id,
        amount:       eurosToCents(pkg.price_eur),
        currency:     'eur',
        description:  pkg.name,
        duration_days: pkg.duration_days,
      })

      // Перенаправляємо на Stripe Checkout
      window.location.href = result.url
    } catch (err) {
      console.error('Помилка оплати:', err)
      setError(err instanceof Error ? err.message : 'Помилка оплати. Спробуйте ще раз.')
      setLoading(null)
    }
  }

  const premiumPackages  = BOOST_PACKAGES.filter(p => p.type === 'premium_profile')
  const verifiedPackage  = BOOST_PACKAGES.find(p => p.type === 'verified_badge')

  return (
    <div className="py-8 pb-24 lg:pb-8">
          <div className="space-y-6">

            {/* Заголовок */}
            <div className="glass-panel p-6 md:p-8">
              <div className="eyebrow">
                <Zap className="h-4 w-4" />
                <span>Просування профілю</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--ink-900)' }}>
                Отримуйте більше клієнтів
              </h1>
              <p className="muted-text mt-3 text-base leading-relaxed">
                Виділіть свій профіль серед інших майстрів і отримуйте більше замовлень.
              </p>
            </div>

            {error && (
              <div className="rounded-[20px] border p-4 text-sm font-semibold"
                style={{ background: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.3)', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            {/* Преміум профіль */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px]"
                  style={{ background: 'rgba(199,138,96,0.14)', color: 'var(--accent-700)' }}>
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                    Преміум профіль
                  </h2>
                  <p className="muted-text text-sm">Показується вгорі каталогу майстрів</p>
                </div>
              </div>

              {/* Переваги */}
              <div className="mb-6 space-y-2">
                {[
                  'Ваш профіль вгорі пошукової видачі',
                  'Помаранчева преміум-смужка на картці',
                  'Більше переглядів і звернень від клієнтів',
                  'Пріоритет у результатах фільтрації',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-700)' }}>
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent-700)' }} />
                    {benefit}
                  </div>
                ))}
              </div>

              {/* Пакети */}
              <div className="grid gap-3 sm:grid-cols-2">
                {premiumPackages.map((pkg) => {
                  const isActive  = loading === pkg.id
                  const isExpired = profile?.premium_expires_at
                    ? new Date(profile.premium_expires_at) < new Date()
                    : true
                  const alreadyHas = profile?.is_premium && !isExpired

                  return (
                    <div key={pkg.id} className="rounded-[22px] border p-5"
                      style={{ borderColor: 'var(--glass-border)', background: 'rgba(255,255,255,0.4)' }}>
                      <div className="text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                        {pkg.price_eur}€
                      </div>
                      <div className="mt-1 text-sm" style={{ color: 'var(--ink-500)' }}>
                        {pkg.duration_days} днів
                      </div>
                      <div className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-700)' }}>
                        {pkg.name.replace('Преміум профіль — ', '')}
                      </div>

                      {alreadyHas ? (
                        <div className="mt-4 rounded-full px-4 py-2 text-center text-sm font-semibold"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}>
                          ✓ Активний
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isActive}
                          onClick={() => handlePurchase(pkg.id)}
                          className="btn-primary mt-4 w-full justify-center rounded-full disabled:opacity-50"
                        >
                          {isActive ? <Loader className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                          {isActive ? 'Переходимо...' : 'Придбати'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Верифікований бейдж */}
            {verifiedPackage && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px]"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                      Верифікований бейдж
                    </h2>
                    <p className="muted-text text-sm">Зелена галочка підвищує довіру клієнтів</p>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  {[
                    'Зелена галочка ✓ на вашому профілі',
                    'Підвищена довіра від клієнтів',
                    'Пріоритет при однаковому рейтингу',
                    'Термін дії — 1 рік',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-700)' }}>
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#15803d' }} />
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold" style={{ color: 'var(--ink-900)' }}>
                      {verifiedPackage.price_eur}€
                    </div>
                    <div className="text-sm" style={{ color: 'var(--ink-500)' }}>
                      на 1 рік
                    </div>
                  </div>

                  {profile?.is_verified ? (
                    <div className="rounded-full px-5 py-2.5 text-sm font-semibold"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}>
                      ✓ Верифіковано
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={loading === verifiedPackage.id}
                      onClick={() => handlePurchase(verifiedPackage.id)}
                      className="btn-primary rounded-full disabled:opacity-50"
                    >
                      {loading === verifiedPackage.id
                        ? <Loader className="h-4 w-4 animate-spin" />
                        : <ShieldCheck className="h-4 w-4" />}
                      {loading === verifiedPackage.id ? 'Переходимо...' : 'Отримати бейдж'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Тестова картка */}
            <div className="glass-card p-5 text-center">
              <p className="text-xs font-semibold" style={{ color: 'var(--ink-500)' }}>
                🧪 Тестовий режим Stripe — використовуйте картку
              </p>
              <p className="mt-1 font-mono text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                4242 4242 4242 4242
              </p>
              <p className="text-xs" style={{ color: 'var(--ink-400)' }}>
                Будь-який термін дії та CVV
              </p>
            </div>

          </div>
    </div>
  )
}