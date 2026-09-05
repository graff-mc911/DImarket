import { Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { VerificationBadge } from '../MatchScoreBadge'
import type { VerificationLevel } from '../../lib/types'

export type TopMatchRow = {
  score: number
  distanceKm?: number | null
  contractor?: {
    id: string
    full_name: string | null
    location: string | null
    rating: number | null
    total_reviews: number | null
    is_verified: boolean | null
    verification_level?: VerificationLevel | null
    phone?: string | null
  } | null
}

interface TopMatchCardsProps {
  matches: TopMatchRow[]
  listingId?: string | null
  compact?: boolean
}

export function TopMatchCards({ matches, listingId, compact = false }: TopMatchCardsProps) {
  const { t } = useApp()
  const rows = matches.filter((m) => m.contractor?.id).slice(0, 3)
  if (!rows.length) return null

  return (
    <div
      className={`rounded-none border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.06)] ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <p className="text-sm font-extrabold text-[#4338ca]">
        {t('matching.topThreeTitle').replace('{count}', String(rows.length))}
      </p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => {
          const c = row.contractor!
          return (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/70 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-[var(--ink-900)]">
                    {c.full_name}
                  </p>
                  <VerificationBadge level={c.verification_level} />
                </div>
                <p className="truncate text-[11px] text-[var(--ink-500)]">
                  {c.location}
                  {row.distanceKm != null && Number.isFinite(row.distanceKm)
                    ? ` · ${Math.round(row.distanceKm)} km`
                    : ''}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                  <Star className="h-3 w-3 fill-current" />
                  {c.rating ?? 0} ({c.total_reviews ?? 0})
                </div>
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="mt-0.5 block text-[11px] font-semibold text-[#4338ca]"
                  >
                    {c.phone}
                  </a>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => navigateTo(`/professional/${c.id}`)}
                  className="text-xs font-semibold text-[#4338ca] underline"
                >
                  {t('matching.viewProfile')}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(`/messages?with=${c.id}`)}
                  className="text-[11px] font-semibold text-[var(--ink-600)] underline"
                >
                  {t('matching.contactChat')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {listingId && (
        <button
          type="button"
          onClick={() => navigateTo(`/project/${listingId}/matches`)}
          className="mt-2 text-xs font-semibold text-[var(--accent-700)] underline"
        >
          {t('pipeline.viewMatches' as never) || t('salesBot.viewListing')}
        </button>
      )}
    </div>
  )
}
