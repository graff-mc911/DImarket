import { useEffect, useMemo, useState } from 'react'
import { Copy, FileSpreadsheet, FileText, Trash2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatEuro } from '../lib/costEstimator'
import { downloadCsv, estimateToCsv, openEstimatePdfPrint } from '../lib/costEstimatorExport'
import {
  deleteCostEstimate,
  duplicateCostEstimate,
  listCostEstimates,
  type SavedCostEstimateRow,
} from '../lib/costEstimatorPersist'
import { EMPTY_ESTIMATOR_STATE, type EstimatorState } from '../lib/costEstimatorTypes'
import { navigateTo } from '../lib/navigation'

/** Saved AI cost estimates — /cost-estimator/history */
export function CostEstimatorHistory() {
  const { t, user } = useApp()
  const [rows, setRows] = useState<SavedCostEstimateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const reload = async () => {
    setLoading(true)
    const list = await listCostEstimates(user?.id ?? null)
    setRows(list)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [user?.id])

  const compared = useMemo(
    () => rows.filter((r) => compareIds.includes(r.id)).slice(0, 3),
    [rows, compareIds],
  )

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  const exportRow = (row: SavedCostEstimateRow) => {
    const est = row.estimate_json
    if (!est) return
    const input = (row.input_json || {}) as Partial<EstimatorState>
    const state: EstimatorState = {
      ...EMPTY_ESTIMATOR_STATE,
      projectTypeId: (input.projectTypeId as EstimatorState['projectTypeId']) || est.projectTypeId,
      description: (input.description as string) || '',
      location: {
        ...EMPTY_ESTIMATOR_STATE.location,
        ...(input.location || {}),
        locationLabel: row.location_label || '',
      },
      measurements: {
        ...EMPTY_ESTIMATOR_STATE.measurements,
        ...(input.measurements || {}),
        areaSqm: Number(row.area_sqm) || 0,
      },
    }
    openEstimatePdfPrint(est, state, 'standard')
  }

  const exportCsvRow = (row: SavedCostEstimateRow) => {
    const est = row.estimate_json
    if (!est) return
    const input = (row.input_json || {}) as Partial<EstimatorState>
    const state: EstimatorState = {
      ...EMPTY_ESTIMATOR_STATE,
      projectTypeId: (input.projectTypeId as EstimatorState['projectTypeId']) || est.projectTypeId,
      description: (input.description as string) || '',
      location: {
        ...EMPTY_ESTIMATOR_STATE.location,
        ...(input.location || {}),
        locationLabel: row.location_label || '',
      },
      measurements: {
        ...EMPTY_ESTIMATOR_STATE.measurements,
        ...(input.measurements || {}),
        areaSqm: Number(row.area_sqm) || 0,
      },
    }
    downloadCsv(`dimarket-estimate-${row.id.slice(0, 8)}.csv`, estimateToCsv(est, state))
  }

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

        {compared.length >= 2 ? (
          <div className="mt-6 overflow-x-auto rounded-[20px] border border-[#e8e8ed] bg-white p-4">
            <p className="mb-3 text-[13px] font-semibold text-[#1d1d1f]">
              {t('costEstimator.compare')} ({compared.length})
            </p>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[#86868b]">
                  <th className="pb-2">Estimate</th>
                  <th className="pb-2">Economy</th>
                  <th className="pb-2">Standard</th>
                  <th className="pb-2">Premium</th>
                  <th className="pb-2">Area</th>
                </tr>
              </thead>
              <tbody>
                {compared.map((row) => (
                  <tr key={row.id} className="border-t border-[#f0f0f2]">
                    <td className="py-2 font-medium text-[#1d1d1f]">{row.title}</td>
                    <td className="py-2 tabular-nums">{formatEuro(Number(row.total_economy) || 0)}</td>
                    <td className="py-2 tabular-nums">{formatEuro(Number(row.total_standard) || 0)}</td>
                    <td className="py-2 tabular-nums">{formatEuro(Number(row.total_premium) || 0)}</td>
                    <td className="py-2 tabular-nums">{row.area_sqm ?? '—'} m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

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
                className="rounded-[20px] border border-[#e8e8ed] bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                  <label className="inline-flex items-center gap-2 text-[12px] text-[#6e6e73]">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(row.id)}
                      onChange={() => toggleCompare(row.id)}
                      className="rounded border-[#d2d2d7]"
                    />
                    {t('costEstimator.compare')}
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
                    onClick={() => navigateTo(`/cost-estimator?id=${encodeURIComponent(row.id)}`)}
                  >
                    {t('costEstimator.open')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold text-[#1d1d1f]"
                    onClick={() =>
                      void duplicateCostEstimate(row.id, user?.id ?? null).then((r) => {
                        if (r) void reload()
                      })
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('costEstimator.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold text-[#1d1d1f]"
                    onClick={() => exportRow(row)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold text-[#1d1d1f]"
                    onClick={() => exportCsvRow(row)}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    CSV
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-2 text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#c41e3a]"
                    aria-label={t('costEstimator.delete')}
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
