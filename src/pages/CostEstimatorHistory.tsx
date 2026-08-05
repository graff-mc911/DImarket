import { useEffect, useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatEuro } from '../lib/costEstimator'
import {
  deleteCostEstimate,
  listCostEstimates,
  type SavedCostEstimateRow,
} from '../lib/costEstimatorPersist'
import { navigateTo } from '../lib/navigation'

/** Saved AI cost estimates — /cost-estimator/history */
export function CostEstimatorHistory() {
  const { t, user } = useApp()
  const [rows, setRows] = useState<SavedCostEstimateRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    const list = await listCostEstimates(user?.id ?? null)
    setRows(list)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [user?.id])

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] px-4 py-10 pb-24">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          className="mb-4 text-[13px] font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
          onClick={() => navigateTo('/cost-estimator')}
        >
          ← {t('costEstimator.title')}
        </button>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
          {t('costEstimator.history')}
        </h1>
        <p className="mt-2 text-[14px] text-[#6e6e73]">{t('costEstimator.disclaimer')}</p>

        {loading ? (
          <p className="mt-8 text-[14px] text-[#86868b]">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-[24px] border border-dashed border-[#d2d2d7] bg-white/70 px-6 py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-[#d2d2d7]" />
            <p className="mt-3 text-[15px] font-semibold text-[#1d1d1f]">No saved estimates yet</p>
            <button
              type="button"
              className="mt-4 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white"
              onClick={() => navigateTo('/cost-estimator')}
            >
              Create estimate
            </button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#e8e8ed] bg-white px-5 py-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">{row.title}</p>
                  <p className="mt-1 text-[12px] text-[#86868b]">
                    {row.location_label || '—'} · {row.area_sqm ?? '—'} m² ·{' '}
                    {new Date(row.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-[14px] font-semibold tabular-nums text-[#1d1d1f]">
                    {formatEuro(Number(row.total_standard) || 0)}
                    <span className="ml-2 text-[12px] font-medium text-[#86868b]">
                      ({formatEuro(Number(row.total_economy) || 0)} –{' '}
                      {formatEuro(Number(row.total_premium) || 0)})
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold text-[#1d1d1f]"
                    onClick={() => navigateTo('/cost-estimator')}
                  >
                    New from scratch
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-2 text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#c41e3a]"
                    aria-label="Delete"
                    onClick={() =>
                      void deleteCostEstimate(row.id, user?.id ?? null).then(() => reload())
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
