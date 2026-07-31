import { useEffect, useState } from 'react'
import {
  fetchMembershipCoupons,
  fetchSubscriptionPlansAdmin,
  updateSubscriptionPlanAdmin,
  upsertMembershipCoupon,
} from '../../lib/monetization/billing'

type PlanRow = {
  id: string
  name: string
  price_eur_month?: number
  price_eur_year?: number
  trial_days?: number
  is_active?: boolean
  audience?: string
}

type CouponRow = {
  id: string
  code: string
  percent_off: number | null
  amount_off_eur: number | null
  trial_days_override: number | null
  active: boolean
  redemption_count: number
  max_redemptions: number | null
}

/** Admin tools: plans, prices, trials, coupons */
export function MembershipAdminPanel() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [notice, setNotice] = useState('')
  const [couponForm, setCouponForm] = useState({
    code: '',
    percentOff: '20',
    trialDays: '30',
    description: '',
  })

  const refresh = async () => {
    const [p, c] = await Promise.all([fetchSubscriptionPlansAdmin(), fetchMembershipCoupons()])
    setPlans(p as PlanRow[])
    setCoupons(c as CouponRow[])
  }

  useEffect(() => {
    void refresh()
  }, [])

  const toast = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{notice}</p>
      ) : null}

      <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-sm">
        <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Plans · prices · trials</h2>
        <p className="mt-1 text-[13px] text-[#86868b]">
          Edit catalog prices and trial days. Stripe checkout uses app catalog amounts.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e8ed] text-[11px] uppercase text-[#86868b]">
                <th className="py-2 pr-2">Plan</th>
                <th className="py-2 pr-2">€/mo</th>
                <th className="py-2 pr-2">€/yr</th>
                <th className="py-2 pr-2">Trial</th>
                <th className="py-2 pr-2">Active</th>
                <th className="py-2">Save</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <PlanEditorRow
                  key={p.id}
                  plan={p}
                  onSaved={() => {
                    toast('Plan updated')
                    void refresh()
                  }}
                  onError={(m) => toast(m)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-sm">
        <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Coupons & discounts</h2>
        <p className="mt-1 text-[13px] text-[#86868b]">
          Platform coupons (plus Stripe promotion codes at checkout).
        </p>
        <form
          className="mt-4 grid gap-2 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            void upsertMembershipCoupon({
              code: couponForm.code,
              percentOff: couponForm.percentOff ? Number(couponForm.percentOff) : null,
              trialDays: couponForm.trialDays ? Number(couponForm.trialDays) : null,
              description: couponForm.description || null,
              active: true,
            })
              .then(() => {
                toast('Coupon saved')
                setCouponForm({ code: '', percentOff: '20', trialDays: '30', description: '' })
                void refresh()
              })
              .catch((err) => toast(err instanceof Error ? err.message : 'Failed'))
          }}
        >
          <input
            required
            placeholder="CODE"
            value={couponForm.code}
            onChange={(e) => setCouponForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
            className="rounded-xl border border-[#d2d2d7] px-3 py-2"
          />
          <input
            type="number"
            placeholder="% off"
            value={couponForm.percentOff}
            onChange={(e) => setCouponForm((s) => ({ ...s, percentOff: e.target.value }))}
            className="rounded-xl border border-[#d2d2d7] px-3 py-2"
          />
          <input
            type="number"
            placeholder="Trial days"
            value={couponForm.trialDays}
            onChange={(e) => setCouponForm((s) => ({ ...s, trialDays: e.target.value }))}
            className="rounded-xl border border-[#d2d2d7] px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
          >
            Save coupon
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {coupons.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0f0f2] px-3 py-2 text-[13px]"
            >
              <span className="font-semibold text-[#1d1d1f]">{c.code}</span>
              <span className="text-[#6e6e73]">
                {c.percent_off != null ? `${c.percent_off}%` : ''}
                {c.trial_days_override != null ? ` · ${c.trial_days_override}d trial` : ''}
                {' · '}
                {c.redemption_count}
                {c.max_redemptions != null ? `/${c.max_redemptions}` : ''} used
                {c.active ? '' : ' · inactive'}
              </span>
            </li>
          ))}
          {!coupons.length ? (
            <p className="text-[13px] text-[#86868b]">No coupons yet.</p>
          ) : null}
        </ul>
      </section>
    </div>
  )
}

function PlanEditorRow({
  plan,
  onSaved,
  onError,
}: {
  plan: PlanRow
  onSaved: () => void
  onError: (m: string) => void
}) {
  const [month, setMonth] = useState(String(plan.price_eur_month ?? 0))
  const [year, setYear] = useState(String(plan.price_eur_year ?? 0))
  const [trial, setTrial] = useState(String(plan.trial_days ?? 0))
  const [active, setActive] = useState(plan.is_active !== false)
  const [busy, setBusy] = useState(false)

  return (
    <tr className="border-b border-[#f0f0f2]">
      <td className="py-2 pr-2 font-medium text-[#1d1d1f]">
        {plan.name}
        <span className="ml-1 text-[11px] text-[#86868b]">{plan.id}</span>
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-20 rounded-lg border border-[#e8e8ed] px-2 py-1"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-20 rounded-lg border border-[#e8e8ed] px-2 py-1"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={trial}
          onChange={(e) => setTrial(e.target.value)}
          className="w-16 rounded-lg border border-[#e8e8ed] px-2 py-1"
        />
      </td>
      <td className="py-2 pr-2">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </td>
      <td className="py-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            void updateSubscriptionPlanAdmin({
              id: plan.id,
              priceEurMonth: Number(month) || 0,
              priceEurYear: Number(year) || 0,
              trialDays: Number(trial) || 0,
              isActive: active,
            })
              .then(onSaved)
              .catch((e) => onError(e instanceof Error ? e.message : 'Failed'))
              .finally(() => setBusy(false))
          }}
        >
          Save
        </button>
      </td>
    </tr>
  )
}
