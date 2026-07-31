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
  FEATURE_COMPARISON,
  PRICING_PLANS,
  SUPPORT_COPY,
  getPlan,
  planPrice,
  plansForAudience,
  yearlySavingsPct,
  type BillingInterval,
  type PlanAudience,
  type PlanId,
} from '../lib/monetization/plans'
import { startAddonCheckout, startPlanCheckout } from '../lib/monetization/billing'
import { PlanComparisonTable } from '../components/membership/PlanComparisonTable'
import { MembershipBadge } from '../components/membership/MembershipBadge'

const AUDIENCES: { id: PlanAudience | 'all'; label: string }[] = [
  { id: 'all', label: 'All plans' },
  { id: 'customer', label: 'Customers' },
  { id: 'professional', label: 'Professionals' },
  { id: 'company', label: 'Companies' },
  { id: 'enterprise', label: 'Enterprise' },
]

export function Pricing() {
  const { user, profile } = useApp()
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [audience, setAudience] = useState<PlanAudience | 'all'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const currentPlan = getPlan(profile?.plan_id)
  const visiblePlans = useMemo(() => plansForAudience(audience), [audience])

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
    const plan = getPlan(planId)
    if (!plan.checkoutEnabled) {
      if (plan.id === 'enterprise') navigateTo('/contact')
      else if (plan.id === 'guest') navigateTo('/')
      else if (!user) navigateTo('/register')
      return
    }
    void run(`plan-${plan.storageId}`, () =>
      startPlanCheckout({
        userId: user!.id,
        planId: plan.storageId as PlanId,
        interval,
        withTrial: true,
      }),
    )
  }

  return (
    <div className="py-8 pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
            Premium Membership
          </p>
          <h1 className="text-[34px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[40px]">
            Plans for every role on DImarket
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[#6e6e73]">
            Guest · Customer · Professional Free · Professional Premium · Company Premium ·
            Enterprise. Monthly or yearly billing, 30-day free trial, auto-renewal, cancel anytime.
            Powered by Stripe.
          </p>
          {user ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigateTo('/billing')}
                className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white"
              >
                <CreditCard className="h-4 w-4" />
                Manage billing
              </button>
              <MembershipBadge
                planId={profile?.plan_id}
                isPremium={profile?.is_premium}
                isVerified={profile?.is_verified}
                verificationLevel={profile?.verification_level}
              />
              <span className="inline-flex items-center rounded-full border border-[#e8e8ed] bg-white px-3 py-2 text-[12px] text-[#6e6e73]">
                {currentPlan.name} · {support.label} support
              </span>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[22px] border border-[#e8e8ed] bg-[#fbfbfd] px-4 py-3 text-[13px] text-[#3a3a3c]">
          <strong className="text-[#1d1d1f]">30-day free trial</strong> on paid plans · then
          auto-renews monthly or yearly · cancel anytime in Billing / Stripe portal. Promotion
          codes supported at checkout.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAudience(a.id)}
              className={`rounded-full px-3.5 py-2 text-[12px] font-semibold ${
                audience === a.id ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlans.map((plan) => {
            const price = planPrice(plan, interval)
            const isCurrent = currentPlan.storageId === plan.storageId
            const save = yearlySavingsPct(plan)
            return (
              <article
                key={plan.storageId}
                className={`relative flex flex-col rounded-[24px] border bg-white p-5 shadow-sm ${
                  plan.recommended || plan.popular ? 'border-[#1d1d1f]' : 'border-[#e8e8ed]'
                }`}
              >
                {plan.recommended || plan.popular ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-semibold text-white">
                    Recommended
                  </span>
                ) : null}
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                  {plan.audience}
                </p>
                <h2 className="mt-1 text-[20px] font-semibold text-[#1d1d1f]">{plan.name}</h2>
                <p className="mt-1 text-[13px] text-[#86868b]">{plan.tagline}</p>
                <p className="mt-4">
                  <span className="text-[32px] font-semibold tracking-tight text-[#1d1d1f]">
                    €{price}
                  </span>
                  <span className="text-[13px] text-[#86868b]">
                    {price > 0 ? `/${interval === 'year' ? 'year' : 'mo'}` : ''}
                  </span>
                </p>
                {interval === 'year' && save > 0 ? (
                  <p className="mt-1 text-[12px] font-medium text-emerald-700">Save {save}%</p>
                ) : plan.trialDays > 0 ? (
                  <p className="mt-1 text-[12px] font-medium text-[#6e6e73]">
                    {plan.trialDays}-day free trial
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-transparent">.</p>
                )}
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.highlights.slice(0, 6).map((h) => (
                    <li key={h} className="flex gap-2 text-[13px] text-[#3a3a3c]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || loading === `plan-${plan.storageId}`}
                  onClick={() => onPlan(plan.id)}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 ${
                    plan.recommended || plan.popular
                      ? 'bg-[#1d1d1f] text-white'
                      : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'
                  }`}
                >
                  {isCurrent
                    ? 'Current plan'
                    : loading === `plan-${plan.storageId}`
                      ? 'Redirecting…'
                      : plan.cta}
                  {!isCurrent ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </article>
            )
          })}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-[22px] font-semibold text-[#1d1d1f]">Compare all plans</h2>
            <p className="mt-1 text-[14px] text-[#6e6e73]">
              {FEATURE_COMPARISON.length} features across Guest to Enterprise.
            </p>
          </div>
          <PlanComparisonTable />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#1d1d1f]">Growth add-ons</h2>
            <p className="mt-1 text-[14px] text-[#6e6e73]">
              Buy à la carte — Featured profile, Sponsored projects, Lead credits, Google Ads,
              Banner ads.
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
          </div>
          <div className="rounded-[22px] border border-[#e8e8ed] bg-[#fbfbfd] p-5">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <Megaphone className="h-5 w-5" />
              <h2 className="text-[16px] font-semibold">Billing notes</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#3a3a3c]">
              <li>Stripe invoices & payment history in Billing</li>
              <li>Failed payments mark subscription past due</li>
              <li>Cancel anytime via Stripe Customer Portal</li>
              <li>Enterprise sales: custom pricing & Gold Partner</li>
            </ul>
            <button
              type="button"
              onClick={() => navigateTo('/contact')}
              className="mt-4 text-[13px] font-semibold text-[#1d1d1f] underline-offset-2 hover:underline"
            >
              Contact sales
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
