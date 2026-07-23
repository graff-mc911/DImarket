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
} from '../lib/monetization/plans'
import { startAddonCheckout, startPlanCheckout } from '../lib/monetization/billing'

export function Pricing() {
  const { user, profile } = useApp()
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const currentPlan = getPlan(profile?.plan_id)

  const support = useMemo(
    () => SUPPORT_COPY[currentPlan.supportTier],
    [currentPlan.supportTier],
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
      setError(err instanceof Error ? err.message : 'Payment failed')
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

  return (
    <div className="py-8 pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
            Monetization
          </p>
          <h1 className="text-[34px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[40px]">
            Plans that grow with your business
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[#6e6e73]">
            Free · Pro · Business · Enterprise — plus featured profiles, sponsored projects,
            lead credits, banner ads, and Google Ads. Powered by Stripe subscriptions.
          </p>
          {user ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigateTo('/billing')}
                className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white"
              >
                <CreditCard className="h-4 w-4" />
                Manage billing
              </button>
              <span className="inline-flex items-center rounded-full border border-[#e8e8ed] bg-white px-3 py-2 text-[12px] text-[#6e6e73]">
                Current: {currentPlan.name} · {support.label} support ·{' '}
                {profile?.lead_credits ?? 0} credits
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
              interval === 'month' ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              interval === 'year' ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
            }`}
          >
            Yearly · save up to 17%
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
                  plan.popular ? 'border-[#1d1d1f]' : 'border-[#e8e8ed]'
                }`}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                ) : null}
                <h2 className="text-[20px] font-semibold text-[#1d1d1f]">{plan.name}</h2>
                <p className="mt-1 text-[13px] text-[#86868b]">{plan.tagline}</p>
                <p className="mt-4">
                  <span className="text-[32px] font-semibold tracking-tight text-[#1d1d1f]">
                    €{price}
                  </span>
                  <span className="text-[13px] text-[#86868b]">
                    /{interval === 'year' ? 'year' : 'mo'}
                  </span>
                </p>
                {interval === 'year' && save > 0 ? (
                  <p className="mt-1 text-[12px] font-medium text-emerald-700">Save {save}%</p>
                ) : (
                  <p className="mt-1 text-[12px] text-transparent">.</p>
                )}
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-[13px] text-[#3a3a3c]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || loading === `plan-${plan.id}`}
                  onClick={() => onPlan(plan.id)}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-[#1d1d1f] text-white'
                      : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'
                  }`}
                >
                  {isCurrent ? 'Current plan' : loading === `plan-${plan.id}` ? 'Redirecting…' : plan.cta}
                  {!isCurrent ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </article>
            )
          })}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#1d1d1f]">Growth add-ons</h2>
            <p className="mt-1 text-[14px] text-[#6e6e73]">
              Buy à la carte — Featured profile, Sponsored projects, Lead credits, Google Ads, Banner ads.
            </p>
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
              return (
                <div
                  key={addon.id}
                  className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#1d1d1f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-[#1d1d1f]">{addon.name}</h3>
                      <p className="mt-1 text-[13px] text-[#6e6e73]">{addon.description}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[16px] font-semibold text-[#1d1d1f]">
                          {addon.href ? `from €${addon.priceEur}/wk` : `€${addon.priceEur}`}
                        </span>
                        <button
                          type="button"
                          disabled={loading === addon.id}
                          onClick={() =>
                            void run(addon.id, () =>
                              startAddonCheckout({ userId: user?.id || '', addonId: addon.id }),
                            )
                          }
                          className="rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        >
                          {loading === addon.id ? '…' : addon.href ? 'Open' : 'Buy'}
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
          <div className="rounded-[22px] border border-[#e8e8ed] bg-[#fbfbfd] p-5">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <LifeBuoy className="h-5 w-5" />
              <h2 className="text-[16px] font-semibold">Support by plan</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#3a3a3c]">
              {(Object.keys(SUPPORT_COPY) as Array<keyof typeof SUPPORT_COPY>).map((key) => (
                <li key={key}>
                  <span className="font-semibold">{SUPPORT_COPY[key].label}:</span>{' '}
                  {SUPPORT_COPY[key].sla}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigateTo('/contact')}
              className="mt-4 text-[13px] font-semibold text-[#1d1d1f] underline-offset-2 hover:underline"
            >
              Contact support
            </button>
          </div>
          <div className="rounded-[22px] border border-[#e8e8ed] bg-[#fbfbfd] p-5">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <Megaphone className="h-5 w-5" />
              <h2 className="text-[16px] font-semibold">Ads</h2>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#3a3a3c]">
              Run native banner ads on DImarket, or request managed Google Ads campaigns.
              Business and Enterprise plans include higher discounts; Enterprise includes Google Ads management.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/advertise')}
                className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-semibold"
              >
                Banner ads
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/boost')}
                className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-semibold"
              >
                Profile boost
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
