import { Search, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import {
  PROJECT_TRADES,
  suggestTradesFromText,
  type ProjectTrade,
} from '../../lib/projectWizard'
import { recentTradeIds } from '../../lib/wizardDrafts'

type CategoryStepProps = {
  selectedId: string | null
  query: string
  descriptionHint?: string
  onQueryChange: (q: string) => void
  onSelect: (tradeId: string, subcategorySlug: string) => void
  t: (key: string) => string
  error?: string
  labels: {
    search: string
    popular: string
    ai: string
    recent: string
    all: string
  }
}

function TradeGrid({
  trades,
  selectedId,
  onSelect,
  t,
}: {
  trades: ProjectTrade[]
  selectedId: string | null
  onSelect: (tradeId: string, subcategorySlug: string) => void
  t: (key: string) => string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {trades.map((trade) => {
        const Icon = trade.icon
        const active = selectedId === trade.id
        return (
          <button
            key={trade.id}
            type="button"
            onClick={() => onSelect(trade.id, trade.subcategorySlug)}
            aria-pressed={active}
            className={
              'group flex flex-col items-center gap-3 rounded-[22px] border px-3 py-5 text-center transition duration-200 ' +
              (active
                ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-lg shadow-black/10'
                : 'border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] hover:border-[#d2d2d7] hover:bg-white hover:shadow-sm')
            }
          >
            <span
              className={
                'flex h-12 w-12 items-center justify-center rounded-2xl ' +
                (active ? 'bg-white/15' : 'bg-white shadow-sm')
              }
            >
              <Icon className={'h-6 w-6 ' + (active ? 'text-white' : 'text-[#1d1d1f]')} aria-hidden />
            </span>
            <span className="text-[13px] font-semibold leading-snug tracking-[-0.01em]">
              {t(trade.labelKey) || trade.labelEn}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function CategoryStep({
  selectedId,
  query,
  descriptionHint = '',
  onQueryChange,
  onSelect,
  t,
  error,
  labels,
}: CategoryStepProps) {
  const recent = useMemo(() => {
    const ids = recentTradeIds(4)
    return ids
      .map((id) => PROJECT_TRADES.find((t) => t.id === id))
      .filter(Boolean) as ProjectTrade[]
  }, [])

  const popular = useMemo(() => PROJECT_TRADES.filter((t) => t.popular), [])
  const aiSuggestions = useMemo(
    () => suggestTradesFromText(query || descriptionHint, 4),
    [query, descriptionHint],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PROJECT_TRADES
    return PROJECT_TRADES.filter((trade) => {
      const translated = (t(trade.labelKey) || trade.labelEn).toLowerCase()
      return (
        trade.labelEn.toLowerCase().includes(q) ||
        trade.id.includes(q) ||
        trade.subcategorySlug.includes(q) ||
        translated.includes(q)
      )
    })
  }, [query, t])

  return (
    <div className="space-y-6">
      <label className="relative block">
        <span className="sr-only">{labels.search}</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={labels.search}
          className="w-full rounded-full border border-[#e8e8ed] bg-[#fafafa] py-3 pl-11 pr-4 text-[15px] outline-none focus:border-[#1d1d1f] focus:bg-white"
        />
      </label>

      {query.trim() ? (
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
            {labels.all}
          </p>
          <TradeGrid trades={filtered} selectedId={selectedId} onSelect={onSelect} t={t} />
          {!filtered.length ? (
            <p className="mt-3 text-center text-[13px] text-[#86868b]">No matching services</p>
          ) : null}
        </div>
      ) : (
        <>
          {recent.length > 0 ? (
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                {labels.recent}
              </p>
              <TradeGrid trades={recent} selectedId={selectedId} onSelect={onSelect} t={t} />
            </div>
          ) : null}

          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {labels.ai}
            </p>
            <TradeGrid trades={aiSuggestions} selectedId={selectedId} onSelect={onSelect} t={t} />
          </div>

          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              {labels.popular}
            </p>
            <TradeGrid trades={popular} selectedId={selectedId} onSelect={onSelect} t={t} />
          </div>

          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              {labels.all}
            </p>
            <TradeGrid trades={PROJECT_TRADES} selectedId={selectedId} onSelect={onSelect} t={t} />
          </div>
        </>
      )}

      {error ? <p className="text-center text-[13px] text-[#c41e3a]">{error}</p> : null}
    </div>
  )
}
