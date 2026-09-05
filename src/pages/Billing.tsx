import { useEffect, useState } from 'react'
import {
  CreditCard,
  ExternalLink,
  LifeBuoy,
  Loader,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  fetchBillingProfile,
  fetchCreditLedger,
  openBillingPortal,
  submitGoogleAdsRequest,
  type BillingProfile,
} from '../lib/monetization/billing'
import { getPlan } from '../lib/monetization/plans'

export function Billing() {
  const { user, profile, t } = useApp()
  const [billing, setBilling] = useState<BillingProfile | null>(null)
  const [ledger, setLedger] = useState<
    Array<{ id: string; delta: number; balance_after: number; reason: string; created_at: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')
  const [gAds, setGAds] = useState({
    businessName: '',
    websiteUrl: '',
    monthlyBudgetEur: '',
    goals: '',
  })
  const [gAdsMsg, setGAdsMsg] = useState('')

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    void (async () => {
      setLoading(true)
      const [b, l] = await Promise.all([
        fetchBillingProfile(user.id),
        fetchCreditLedger(user.id),
      ])
      setBilling(b)
      setLedger(l as typeof ledger)
      setLoading(false)
    })()
  }, [user?.id])

  const plan = getPlan(billing?.plan_id ?? profile?.plan_id)

  const onPortal = async () => {
    if (!user) return
    setPortalLoading(true)
    setError('')
    try {
      const url = await openBillingPortal(user.id)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal')
      setPortalLoading(false)
    }
  }

  const onGoogleAds = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setGAdsMsg('')
    try {
      await submitGoogleAdsRequest({
        userId: user.id,
        businessName: gAds.businessName.trim(),
        websiteUrl: gAds.websiteUrl.trim() || undefined,
        monthlyBudgetEur: gAds.monthlyBudgetEur ? Number(gAds.monthlyBudgetEur) : undefined,
        goals: gAds.goals.trim() || undefined,
      })
      setGAdsMsg('Request submitted. Our team will follow up shortly.')
      setGAds({ businessName: '', websiteUrl: '', monthlyBudgetEur: '', goals: '' })
    } catch (err) {
      setGAdsMsg(err instanceof Error ? err.message : 'Failed to submit request')
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-[#8a8178]" />
      </div>
    )
  }

  return (
    <div className="py-8 pb-24 lg:pb-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <header>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8178]">
            Billing
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#2f2a24]">
            Subscription & credits
          </h1>
          <p className="mt-2 text-[14px] text-[#6f665d]">
            Manage your Stripe subscription, lead credits, and Google Ads requests.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[#2f2a24]">
                {t('billing.planSuffix').replace(
                  '{plan}',
                  t(`pricing.plan.${plan.id}.name` as never),
                )}
              </h2>
              <p className="mt-1 text-[13px] text-[#6f665d]">
                Status: {billing?.subscription_status || profile?.subscription_status || 'none'}
                {billing?.subscription_period_end
                  ? ` · renews/ends ${new Date(billing.subscription_period_end).toLocaleDateString()}`
                  : ''}
              </p>
              <p className="mt-2 text-[13px] text-[#3a3a3c]">
                <LifeBuoy className="mr-1 inline h-4 w-4" />
                {t(`pricing.support.${plan.supportTier}.label` as never)}:{' '}
                {t(`pricing.support.${plan.supportTier}.sla` as never)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/pricing')}
                className="rounded-full border border-[rgba(148,163,184,0.35)] px-3 py-2 text-[12px] font-semibold"
              >
                Change plan
              </button>
              <button
                type="button"
                disabled={portalLoading}
                onClick={() => void onPortal()}
                className="inline-flex items-center gap-2 rounded-full bg-[#2f2a24] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {portalLoading ? 'Opening…' : 'Stripe portal'}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Lead credits" value={String(billing?.lead_credits ?? 0)} icon={Wallet} />
            <Stat
              label="Premium"
              value={billing?.is_premium ? 'On' : 'Off'}
            />
            <Stat
              label="Featured"
              value={billing?.is_featured ? 'On' : 'Off'}
            />
            <Stat label={t('pricing.supportByPlan')} value={t(`pricing.support.${plan.supportTier}.label` as never)} />
          </div>
        </section>

        <section className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-sm">
          <h2 className="text-[16px] font-semibold text-[#2f2a24]">Credit history</h2>
          <div className="mt-3 space-y-2">
            {ledger.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-[#f0f0f2] px-3 py-2 text-[13px]"
              >
                <div>
                  <p className="font-medium text-[#2f2a24]">{row.reason.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] text-[#8a8178]">
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <p className={row.delta >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-600'}>
                  {row.delta >= 0 ? '+' : ''}
                  {row.delta} → {row.balance_after}
                </p>
              </div>
            ))}
            {!ledger.length ? (
              <p className="text-[13px] text-[#8a8178]">No credit activity yet. Upgrade or buy a pack.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#2f2a24]" />
            <h2 className="text-[16px] font-semibold text-[#2f2a24]">Google Ads</h2>
          </div>
          <p className="mt-2 text-[13px] text-[#6f665d]">
            Request a managed Google Ads campaign. Enterprise includes management; others can buy
            setup as an add-on on Pricing.
          </p>
          <form onSubmit={onGoogleAds} className="mt-4 space-y-3">
            <input
              required
              value={gAds.businessName}
              onChange={(e) => setGAds((s) => ({ ...s, businessName: e.target.value }))}
              placeholder="Business name"
              className="w-full rounded-xl border border-[rgba(148,163,184,0.35)] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f2a24]"
            />
            <input
              value={gAds.websiteUrl}
              onChange={(e) => setGAds((s) => ({ ...s, websiteUrl: e.target.value }))}
              placeholder="Website URL"
              className="w-full rounded-xl border border-[rgba(148,163,184,0.35)] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f2a24]"
            />
            <input
              value={gAds.monthlyBudgetEur}
              onChange={(e) => setGAds((s) => ({ ...s, monthlyBudgetEur: e.target.value }))}
              placeholder="Monthly budget (EUR)"
              type="number"
              min={0}
              className="w-full rounded-xl border border-[rgba(148,163,184,0.35)] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f2a24]"
            />
            <textarea
              value={gAds.goals}
              onChange={(e) => setGAds((s) => ({ ...s, goals: e.target.value }))}
              placeholder="Goals (leads, calls, brand…)"
              rows={3}
              className="w-full rounded-xl border border-[rgba(148,163,184,0.35)] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f2a24]"
            />
            <button
              type="submit"
              className="rounded-full bg-[#2f2a24] px-4 py-2 text-[13px] font-semibold text-white"
            >
              Submit Google Ads request
            </button>
            {gAdsMsg ? <p className="text-[13px] text-[#3a3a3c]">{gAdsMsg}</p> : null}
          </form>
        </section>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Wallet
}) {
  return (
    <div className="rounded-xl bg-[#f3f0ea] px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a8178]">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[16px] font-semibold text-[#2f2a24]">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {value}
      </p>
    </div>
  )
}
