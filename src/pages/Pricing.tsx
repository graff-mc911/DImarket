import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  CreditCard,
  LifeBuoy,
  Megaphone,
  Sparkles,
  Star,
  Wallet,
  Zap,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import type { TranslationKey } from '../lib/i18n'
import { navigateTo } from '../lib/navigation'
import {
  ADDONS,
  PLANS,
  SUPPORT_COPY,
  getPlan,
  planPrice,
  yearlySavingsPct,
  type BillingInterval,
  type PlanId,
  type SupportTier,
} from '../lib/monetization/plans'
import { startAddonCheckout, startPlanCheckout } from '../lib/monetization/billing'

const PLAN_HIGHLIGHTS: Record<PlanId, TranslationKey[]> = {
  free: [
    'pricing.plan.free.h1',
    'pricing.plan.free.h2',
    'pricing.plan.free.h3',
    'pricing.plan.free.h4',
  ],
  pro: [
    'pricing.plan.pro.h1',
    'pricing.plan.pro.h2',
    'pricing.plan.pro.h3',
    'pricing.plan.pro.h4',
  ],
  business: [
    'pricing.plan.business.h1',
    'pricing.plan.business.h2',
    'pricing.plan.business.h3',
    'pricing.plan.business.h4',
    'pricing.plan.business.h5',
  ],
  enterprise: [
    'pricing.plan.enterprise.h1',
    'pricing.plan.enterprise.h2',
    'pricing.plan.enterprise.h3',
    'pricing.plan.enterprise.h4',
    'pricing.plan.enterprise.h5',
  ],
}

export function Pricing() {
  const { user, profile, t } = useApp()
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const currentPlan = getPlan(profile?.plan_id)

  const supportTier = useMemo(
    () => Object.keys(SUPPORT_COPY) as SupportTier[],
    [],
  )

  const run = async (key: string, fn: () => Promise<{ url: string }>) => {
    if (!user) {
      navigateTo('/login')
      return
    }
    setLoading(key)
    setError('')
    try {
      const result = await fn()
      if (result.url.startsWith('http')) window.location.href = result.url
      else navigateTo(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricing.paymentFailed'))
      setLoading(null)
    }
  }

  const onPlan = (planId: PlanId) => {
    if (planId === 'free') return
    if (planId === 'enterprise') {
      navigateTo('/contact')
      return
    }
    void run(`plan-${planId}`, () =>
      startPlanCheckout({ userId: user!.id, planId, interval }),
    )
  }

  const planName = (id: PlanId) => t(`pricing.plan.${id}.name` as TranslationKey)
  const supportLabel = (tier: SupportTier) =>
    t(`pricing.support.${tier}.label` as TranslationKey)

  return (
    <div className="py-8 pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8178]">
            {t('pricing.eyebrow')}
          </p>
          <h1 className="text-[34px] font-semibold tracking-tight text-[#2f2a24] sm:text-[40px]">
            {t('pricing.title')}
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[#6f665d]">
            {t('pricing.subtitle')}
          </p>
          {user ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigateTo('/billing')}
                className="inline-flex items-center gap-2 rounded-full bg-[#2f2a24] px-4 py-2 text-[13px] font-semibold text-white"
              >
                <CreditCard className="h-4 w-4" />
                {t('pricing.manageBilling')}
              </button>
              <span className="inline-flex items-center rounded-full border border-[rgba(148,163,184,0.22)] bg-white px-3 py-2 text-[12px] text-[#6f665d]">
                {t('pricing.currentBadge')
                  .replace('{plan}', planName(currentPlan.id))
                  .replace('{support}', supportLabel(currentPlan.supportTier))
                  .replace('{credits}', String(profile?.lead_credits ?? 0))}
              </span>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              interval === 'month' ? 'bg-[#2f2a24] text-white' : 'bg-[#f3f0ea] text-[#2f2a24]'
            }`}
          >
            {t('pricing.monthly')}
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              interval === 'year' ? 'bg-[#2f2a24] text-white' : 'bg-[#f3f0ea] text-[#2f2a24]'
            }`}
          >
            {t('pricing.yearly')}
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const price = planPrice(plan, interval)
            const isCurrent = currentPlan.id === plan.id
            const save = yearlySavingsPct(plan)
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-[24px] border bg-white p-5 shadow-sm ${
                  plan.popular ? 'border-[#2f2a24]' : 'border-[rgba(148,163,184,0.22)]'
                }`}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#2f2a24] px-3 py-1 text-[11px] font-semibold text-white">
                    {t('pricing.mostPopular')}
                  </span>
                ) : null}
                <h2 className="text-[20px] font-semibold text-[#2f2a24]">
                  {planName(plan.id)}
                </h2>
                <p className="mt-1 text-[13px] text-[#8a8178]">
                  {t(`pricing.plan.${plan.id}.tagline` as TranslationKey)}
                </p>
                <p className="mt-4">
                  <span className="text-[32px] font-semibold tracking-tight text-[#2f2a24]">
                    €{price}
                  </span>
                  <span className="text-[13px] text-[#8a8178]">
                    {interval === 'year' ? t('pricing.perYear') : t('pricing.perMonth')}
                  </span>
                </p>
                {interval === 'year' && save > 0 ? (
                  <p className="mt-1 text-[12px] font-medium text-emerald-700">
                    {t('pricing.savePct').replace('{pct}', String(save))}
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-transparent">.</p>
                )}
                <ul className="mt-4 flex-1 space-y-2">
                  {PLAN_HIGHLIGHTS[plan.id].map((key) => (
                    <li key={key} className="flex gap-2 text-[13px] text-[#3a3a3c]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || loading === `plan-${plan.id}`}
                  onClick={() => onPlan(plan.id)}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-[#2f2a24] text-white'
                      : 'border border-[rgba(148,163,184,0.35)] bg-white text-[#2f2a24]'
                  }`}
                >
                  {isCurrent
                    ? t('pricing.currentPlan')
                    : loading === `plan-${plan.id}`
                      ? t('pricing.redirecting')
                      : t(`pricing.plan.${plan.id}.cta` as TranslationKey)}
                  {!isCurrent ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </article>
            )
          })}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#2f2a24]">{t('pricing.addonsTitle')}</h2>
            <p className="mt-1 text-[14px] text-[#6f665d]">{t('pricing.addonsSub')}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ADDONS.map((addon) => {
              const Icon =
                addon.paymentType === 'featured_profile'
                  ? Star
                  : addon.paymentType === 'sponsored_project'
                    ? Zap
                    : addon.paymentType === 'lead_credits'
                      ? Wallet
                      : addon.paymentType === 'google_ads'
                        ? Sparkles
                        : Megaphone
              const nameKey = `pricing.addon.${addon.id}.name` as TranslationKey
              const descKey = `pricing.addon.${addon.id}.desc` as TranslationKey
              return (
                <div
                  key={addon.id}
                  className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3f0ea] text-[#2f2a24]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-[#2f2a24]">{t(nameKey)}</h3>
                      <p className="mt-1 text-[13px] text-[#6f665d]">{t(descKey)}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[16px] font-semibold text-[#2f2a24]">
                          {addon.href
                            ? t('pricing.fromPriceWeek').replace('{price}', String(addon.priceEur))
                            : t('pricing.priceEur').replace('{price}', String(addon.priceEur))}
                        </span>
                        <button
                          type="button"
                          disabled={loading === addon.id}
                          onClick={() =>
                            void run(addon.id, () =>
                              startAddonCheckout({ userId: user?.id || '', addonId: addon.id }),
                            )
                          }
                          className="rounded-full bg-[#2f2a24] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        >
                          {loading === addon.id
                            ? '…'
                            : addon.href
                              ? t('pricing.open')
                              : t('pricing.buy')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-[#fbfbfd] p-5">
            <div className="flex items-center gap-2 text-[#2f2a24]">
              <LifeBuoy className="h-5 w-5" />
              <h2 className="text-[16px] font-semibold">{t('pricing.supportByPlan')}</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#3a3a3c]">
              {supportTier.map((key) => (
                <li key={key}>
                  <span className="font-semibold">
                    {t(`pricing.support.${key}.label` as TranslationKey)}:
                  </span>{' '}
                  {t(`pricing.support.${key}.sla` as TranslationKey)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigateTo('/contact')}
              className="mt-4 text-[13px] font-semibold text-[#2f2a24] underline-offset-2 hover:underline"
            >
              {t('pricing.contactSupport')}
            </button>
          </div>
          <div className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-[#fbfbfd] p-5">
            <div className="flex items-center gap-2 text-[#2f2a24]">
              <Megaphone className="h-5 w-5" />
              <h2 className="text-[16px] font-semibold">{t('pricing.adsSection')}</h2>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#3a3a3c]">
              {t('pricing.adsBody')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/advertise')}
                className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-3 py-1.5 text-[12px] font-semibold"
              >
                {t('pricing.bannerAds')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/boost')}
                className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-3 py-1.5 text-[12px] font-semibold"
              >
                {t('pricing.profileBoost')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
