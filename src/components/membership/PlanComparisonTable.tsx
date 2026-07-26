import { Check, Minus } from 'lucide-react'
import {
  FEATURE_COMPARISON,
  PRICING_PLANS,
  type ComparisonRow,
} from '../../lib/monetization/plans'

const COLS: Array<{ key: keyof ComparisonRow; label: string; highlight?: boolean }> = [
  { key: 'guest', label: 'Guest' },
  { key: 'customer', label: 'Customer' },
  { key: 'customer_premium', label: 'Customer Premium' },
  { key: 'free', label: 'Pro Free' },
  { key: 'pro', label: 'Pro Premium', highlight: true },
  { key: 'company_premium', label: 'Company Premium' },
  { key: 'enterprise', label: 'Enterprise' },
]

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Included" />
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-[#d2d2d7]" aria-label="Not included" />
  }
  return <span className="text-[12px] font-medium text-[#3a3a3c]">{value}</span>
}

export function PlanComparisonTable() {
  const recommended = PRICING_PLANS.find((p) => p.recommended)

  return (
    <div className="overflow-x-auto rounded-[24px] border border-[#e8e8ed] bg-white shadow-sm">
      <table className="min-w-[920px] w-full border-collapse text-left">
        <caption className="sr-only">Membership feature comparison</caption>
        <thead>
          <tr className="border-b border-[#e8e8ed] bg-[#fbfbfd]">
            <th scope="col" className="sticky left-0 z-10 bg-[#fbfbfd] px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
              Feature
            </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-3 py-3 text-center text-[12px] font-semibold ${
                  c.highlight ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f]'
                }`}
              >
                {c.label}
                {c.highlight && recommended ? (
                  <span className="mt-1 block text-[10px] font-medium text-white/70">Recommended</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON.map((row) => (
            <tr key={row.feature} className="border-b border-[#f0f0f2] last:border-0">
              <th
                scope="row"
                className="sticky left-0 bg-white px-4 py-3 text-[13px] font-medium text-[#1d1d1f]"
              >
                {row.feature}
              </th>
              {COLS.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-3 text-center ${c.highlight ? 'bg-[#f5f5f7]/80' : ''}`}
                >
                  <Cell value={row[c.key] as boolean | string} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
