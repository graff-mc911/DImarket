import { useEffect, useMemo, useState } from 'react'
import {
  Columns2,
  FileText,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { navigateTo } from '../lib/navigation'
import {
  clearCompare,
  exportComparePdf,
  fetchCompareProfessionals,
  getCompareIds,
  MAX_COMPARE,
  removeFromCompare,
  setCompareIds,
  subscribeCompare,
  type CompareProfessional,
} from '../lib/compare'
import { CompareTable } from '../components/compare/CompareTable'

function parseIdsFromUrl(): string[] {
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('ids') || ''
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_COMPARE)
  } catch {
    return []
  }
}

function syncUrl(ids: string[]) {
  const url = ids.length ? `/compare?ids=${ids.join(',')}` : '/compare'
  window.history.replaceState({}, '', url)
}

export function CompareProfessionals() {
  const [ids, setIds] = useState<string[]>([])
  const [pros, setPros] = useState<CompareProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fromUrl = parseIdsFromUrl()
    const fromStore = getCompareIds()
    const initial = fromUrl.length ? fromUrl : fromStore
    if (fromUrl.length) setCompareIds(fromUrl)
    setIds(initial)
    return subscribeCompare((next) => {
      setIds(next)
      syncUrl(next)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!ids.length) {
        setPros([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const data = await fetchCompareProfessionals(ids)
        if (!cancelled) setPros(data)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load comparison')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ids.join(',')])

  const title = useMemo(() => {
    if (pros.length < 2) return 'Compare professionals'
    return `Comparing ${pros.length} professionals`
  }, [pros.length])

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-28">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            <Columns2 className="h-4 w-4" />
            Comparison
          </p>
          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[32px]">
                {title}
              </h1>
              <p className="mt-1 max-w-xl text-[15px] text-[#86868b]">
                Side-by-side rating, reviews, projects, price, experience, languages,
                response time, availability, distance, certificates, portfolio & warranty.
                Up to {MAX_COMPARE} professionals.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/professionals')}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[12px] font-semibold text-[#1d1d1f]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add professionals
              </button>
              <button
                type="button"
                disabled={pros.length < 2}
                onClick={() => exportComparePdf(pros)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[12px] font-semibold text-[#1d1d1f] disabled:opacity-40"
              >
                <FileText className="h-3.5 w-3.5" />
                Export PDF
              </button>
              {ids.length ? (
                <button
                  type="button"
                  onClick={() => {
                    clearCompare()
                    syncUrl([])
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-semibold text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#86868b]" />
          </div>
        ) : pros.length === 0 ? (
          <EmptyCompare />
        ) : pros.length === 1 ? (
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#e8e8ed] bg-white px-5 py-4 text-[14px] text-[#6e6e73]">
              Add at least one more professional to compare (max {MAX_COMPARE}).
            </div>
            <CompareTable professionals={pros} />
            <button
              type="button"
              onClick={() => removeFromCompare(pros[0].id)}
              className="text-[12px] font-semibold text-[#86868b] underline"
            >
              Remove {pros[0].fullName}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {pros.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => removeFromCompare(p.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
                >
                  {p.fullName}
                  <Trash2 className="h-3 w-3 text-[#86868b]" />
                </button>
              ))}
              {pros.length < MAX_COMPARE ? (
                <button
                  type="button"
                  onClick={() => navigateTo('/professionals')}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#86868b]"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              ) : null}
            </div>
            <div id="compare-print-root">
              <CompareTable professionals={pros} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyCompare() {
  return (
    <div className="rounded-[22px] border border-[#e8e8ed] bg-white px-6 py-16 text-center shadow-sm">
      <Columns2 className="mx-auto h-10 w-10 text-[#d2d2d7]" />
      <p className="mt-4 text-[16px] font-semibold text-[#1d1d1f]">No professionals selected</p>
      <p className="mt-1 text-[14px] text-[#86868b]">
        Use Compare on a professional card to add up to {MAX_COMPARE}, then open this page.
      </p>
      <button
        type="button"
        onClick={() => navigateTo('/professionals')}
        className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        Browse professionals
      </button>
    </div>
  )
}
