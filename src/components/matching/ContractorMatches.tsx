import { useEffect, useState } from 'react'
import { Sparkles, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { fetchMatchScoresForListing } from '../../lib/matching/persistMatches'
import { navigateTo } from '../../lib/navigation'
import { VerificationBadge } from '../MatchScoreBadge'
import type { VerificationLevel } from '../../lib/types'

type MatchRow = {
  score: number
  reasons: string[]
  contractor?: {
    id: string
    full_name: string | null
    location: string | null
    rating: number | null
    total_reviews: number | null
    is_verified: boolean | null
    verification_level?: VerificationLevel | null
  } | null
}

type Props = {
  listingId: string
}

export function ContractorMatches({ listingId }: Props) {
  const { t } = useApp()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const data = await fetchMatchScoresForListing(listingId)
      setRows((data as unknown as MatchRow[]) ?? [])
      setLoading(false)
    })()
  }, [listingId])

  if (loading || rows.length === 0) return null

  return (
    <section className="glass-panel mt-8 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('matching.suggested')}</h2>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => {
          const c = row.contractor
          if (!c?.id) return null
          return (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/60 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-semibold text-slate-900">{c.full_name}</p>
                  <VerificationBadge level={c.verification_level} />
                </div>
                <p className="truncate text-xs text-slate-500">{c.location}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {c.rating ?? 0} ({c.total_reviews ?? 0})
                  {!c.verification_level && c.is_verified ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                      {t('matching.verified')}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-indigo-600">{Math.round(row.score)}</p>
                <button
                  type="button"
                  onClick={() => navigateTo(`/professional/${c.id}`)}
                  className="mt-1 text-xs font-semibold text-indigo-600 underline"
                >
                  {t('matching.viewProfile')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
