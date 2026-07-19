import { useEffect, useState } from 'react'
import { MessageCircle, Star, User } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { fetchMatchScoresForListing } from '../lib/matching/persistMatches'
import { MatchScoreBadge, VerificationBadge } from '../components/MatchScoreBadge'
import type { VerificationLevel } from '../lib/types'

type MatchRow = {
  score: number
  reasons: string[] | null
  contractor: {
    id: string
    full_name: string | null
    location: string | null
    rating: number | null
    total_reviews: number | null
    is_verified: boolean | null
    verification_level?: VerificationLevel | null
    profile_photo?: string | null
    avatar_url?: string | null
  } | null
}

export function ProjectMatches({ listingId }: { listingId: string }) {
  const { t } = useApp()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchMatchScoresForListing(listingId, 20).then((data) => {
      if (!cancelled) {
        setRows((data as MatchRow[]) ?? [])
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [listingId])

  return (
    <div className="mx-auto max-w-3xl py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink-900)] md:text-3xl">
          {t('project.matches.title' as never) || 'Matched professionals'}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-600)]">
          {t('project.matches.sub' as never) || 'Ranked by match score for your project'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => navigateTo(`/listing/${listingId}`)}>
            {t('project.matches.viewProject' as never) || 'View project'}
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={() => navigateTo('/my-projects')}>
            {t('project.matches.myProjects' as never) || 'My projects'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">…</p>
      ) : rows.length === 0 ? (
        <div className="amazon-section-card p-8 text-center">
          <p className="text-sm text-[var(--ink-600)]">
            {t('project.matches.empty' as never) || 'No matches yet. Professionals will be notified.'}
          </p>
          <button type="button" className="btn-primary mt-4 text-sm" onClick={() => navigateTo('/professionals')}>
            Browse professionals
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const p = row.contractor
            if (!p) return null
            const photo = p.profile_photo || p.avatar_url
            return (
              <li key={p.id} className="amazon-section-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#f0f2f2]">
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-[#565959]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="truncate text-left text-base font-bold text-[var(--ink-900)] hover:text-[#c45500]"
                        onClick={() => navigateTo(`/professional/${p.id}`)}
                      >
                        {p.full_name || 'Professional'}
                      </button>
                      <VerificationBadge level={p.verification_level} />
                      {p.is_verified && !p.verification_level ? (
                        <span className="text-[10px] font-bold uppercase text-[#067d62]">Verified</span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">{p.location}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-700)]">
                      <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" />
                      {(p.rating ?? 0).toFixed(1)} · {p.total_reviews ?? 0} reviews
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <MatchScoreBadge score={Number(row.score)} />
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                    onClick={() => navigateTo(`/professional/${p.id}`)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Contact
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
