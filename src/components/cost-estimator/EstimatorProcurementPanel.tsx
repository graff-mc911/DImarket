import { useEffect, useState } from 'react'
import { formatEuro } from '../../lib/costEstimator'
import {
  approveProcurementItem,
  buildProcurementPlan,
  type ProcurementPlan,
} from '../../lib/aiProcurement'
import type { MaterialLine } from '../../lib/costEstimatorTypes'
import { navigateTo } from '../../lib/navigation'

type Props = {
  materials: MaterialLine[]
  city?: string
  lat?: number | null
  lng?: number | null
  listingId?: string | null
  estimateId?: string | null
}

/** AI Procurement — compare marketplace suppliers for BOM lines. */
export function EstimatorProcurementPanel({
  materials,
  city,
  lat,
  lng,
  listingId,
  estimateId,
}: Props) {
  const [plan, setPlan] = useState<ProcurementPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void buildProcurementPlan({ materials, city, lat, lng }).then((p) => {
      if (!cancelled) {
        setPlan(p)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [materials, city, lat, lng])

  if (loading) {
    return <p className="text-[13px] text-[#86868b]">AI Procurement is comparing suppliers…</p>
  }
  if (!plan?.lines.length) {
    return (
      <p className="text-[13px] text-[#86868b]">
        No marketplace offers found yet — publish more sell-rent listings to power procurement.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#6e6e73]">
        Estimated materials {formatEuro(plan.totalEstimated)} · {plan.supplierCount} live offers
        compared by price fit and distance.
      </p>
      {msg ? <p className="text-[12px] font-medium text-[#047857]">{msg}</p> : null}
      {plan.lines.map((line) => (
        <div key={line.materialId} className="rounded-2xl border border-[#f0f0f2] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[14px] font-semibold text-[#1d1d1f]">
              {line.name}{' '}
              <span className="text-[12px] font-medium text-[#86868b]">
                {line.quantity} {line.unit}
              </span>
            </p>
            <p className="text-[12px] tabular-nums text-[#6e6e73]">
              est. {formatEuro(line.estimatedUnitCost * line.quantity)}
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {line.suppliers.map((s) => (
              <li
                key={s.listingId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2"
              >
                <button
                  type="button"
                  className="text-left text-[13px] font-medium text-[#1d1d1f] hover:underline"
                  onClick={() => navigateTo(`/listing/${s.listingId}`)}
                >
                  {s.title}
                  <span className="mt-0.5 block text-[11px] text-[#86868b]">
                    {s.city || '—'}
                    {s.distanceKm != null ? ` · ${s.distanceKm.toFixed(1)} km` : ''}
                    {s.reasons.length ? ` · ${s.reasons[0].replace(/_/g, ' ')}` : ''}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold tabular-nums">
                    {s.price != null ? formatEuro(s.price) : '—'}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#047857]">
                    {s.score}%
                  </span>
                  <button
                    type="button"
                    className="rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-semibold text-white"
                    onClick={() =>
                      void approveProcurementItem({
                        listingId: listingId ?? null,
                        estimateId: estimateId ?? null,
                        materialName: line.name,
                        category: line.category,
                        quantity: line.quantity,
                        unit: line.unit,
                        chosenListingId: s.listingId,
                        chosenPrice: s.price,
                        deliveryEstimate:
                          s.distanceKm != null ? `~${Math.ceil(s.distanceKm / 40)} day delivery` : undefined,
                      }).then((r) => {
                        if ('id' in r) setMsg(`Approved: ${line.name}`)
                        else setMsg(r.error)
                      })
                    }
                  >
                    Approve
                  </button>
                </div>
              </li>
            ))}
            {!line.suppliers.length ? (
              <li className="text-[12px] text-[#86868b]">
                <button
                  type="button"
                  className="font-semibold text-[#0066cc]"
                  onClick={() =>
                    navigateTo(`/sell-rent?q=${encodeURIComponent(line.name)}`)
                  }
                >
                  Search marketplace
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ))}
    </div>
  )
}
