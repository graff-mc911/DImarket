import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Check,
  Columns2,
  Languages,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Timer,
  Trophy,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  fetchMatchScoresForListing,
  fetchSavedProfessionalIds,
  inviteProfessionalToProject,
  toggleSavedProfessional,
  TOP_MATCH_LIMIT,
  REASON_LABELS,
  computeMatchFacets,
  facetLabelsForMatch,
  sortMatchesByFacet,
  type MatchFacetKey,
} from '../lib/matching'
import type { RankedMatch } from '../lib/bots/types'
import { MatchScoreBadge, VerificationBadge } from '../components/MatchScoreBadge'
import type { VerificationLevel } from '../lib/types'
import { supabase } from '../lib/supabase'

type MatchRow = {
  score: number
  reasons: string[] | null
  explanation?: string | null
  breakdown?: Record<string, number> | null
  distance_km?: number | null
  value_score?: number | null
  response_score?: number | null
  rank_position?: number | null
  contractor: {
    id: string
    full_name: string | null
    location: string | null
    rating: number | null
    total_reviews: number | null
    is_verified: boolean | null
    is_premium?: boolean | null
    verification_level?: VerificationLevel | null
    profile_photo?: string | null
    avatar_url?: string | null
    completed_jobs?: number | null
    availability_status?: string | null
    languages?: string[] | null
    portfolio_images?: string[] | null
    response_rate?: number | null
  } | null
}

const FACET_TABS: { id: MatchFacetKey; label: string; icon: typeof Trophy }[] = [
  { id: 'top', label: 'Top 10', icon: Sparkles },
  { id: 'best_value', label: 'Best value', icon: Wallet },
  { id: 'fastest_response', label: 'Fastest response', icon: Timer },
  { id: 'highest_rating', label: 'Highest rating', icon: Trophy },
  { id: 'closest', label: 'Closest', icon: MapPin },
]

const FACET_CHIP: Record<string, { label: string; className: string }> = {
  best_value: {
    label: 'Best value',
    className: 'bg-[#e8f5e9] text-[#1b5e20]',
  },
  fastest_response: {
    label: 'Fastest response',
    className: 'bg-[#e3f2fd] text-[#0d47a1]',
  },
  highest_rating: {
    label: 'Highest rating',
    className: 'bg-[#fff8e1] text-[#e65100]',
  },
  closest: {
    label: 'Closest',
    className: 'bg-[#e0f2f1] text-[#00695c]',
  },
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)))
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  const color = pct >= 92 ? '#248a3d' : pct >= 80 ? '#c2410c' : '#0066cc'

  return (
    <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="88" height="88" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e8e8ed" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold tabular-nums leading-none text-[#1d1d1f]">
          {pct}%
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">
          match
        </span>
      </div>
    </div>
  )
}

function rowToRanked(row: MatchRow): RankedMatch | null {
  const p = row.contractor
  if (!p) return null
  return {
    profileId: p.id,
    fullName: p.full_name || 'Professional',
    location: p.location,
    rating: p.rating ?? 0,
    totalReviews: p.total_reviews ?? 0,
    responseRate: p.response_rate ?? row.response_score ?? null,
    score: Number(row.score),
    reasons: row.reasons || [],
    explanation: row.explanation || undefined,
    distanceKm: row.distance_km ?? null,
    valueScore: row.value_score ?? undefined,
    responseScore: row.response_score ?? p.response_rate ?? undefined,
    verificationLevel: p.verification_level ?? null,
    avatarUrl: p.profile_photo || p.avatar_url || null,
    completedJobs: p.completed_jobs ?? p.total_reviews ?? 0,
    availabilityStatus: p.availability_status || 'available',
    isPremium: p.is_premium,
    isVerified: p.is_verified,
    languages: p.languages,
  }
}

export function ProjectMatches({ listingId }: { listingId: string }) {
  const { t } = useApp()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [facet, setFacet] = useState<MatchFacetKey>('top')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [projectTitle, setProjectTitle] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const [data, listing] = await Promise.all([
        fetchMatchScoresForListing(listingId, TOP_MATCH_LIMIT),
        supabase.from('listings').select('title').eq('id', listingId).maybeSingle(),
      ])
      if (cancelled) return
      const matchRows = (data as MatchRow[]) ?? []
      setRows(matchRows)
      setProjectTitle((listing.data as { title?: string } | null)?.title ?? null)
      const ids = matchRows.map((r) => r.contractor?.id).filter(Boolean) as string[]
      const saved = await fetchSavedProfessionalIds(ids)
      if (!cancelled) {
        setSavedIds(saved)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [listingId])

  const ranked = useMemo(() => {
    return rows.map(rowToRanked).filter(Boolean) as RankedMatch[]
  }, [rows])

  const facets = useMemo(() => computeMatchFacets(ranked), [ranked])

  const visible = useMemo(() => {
    const sorted = sortMatchesByFacet(ranked, facet)
    const byId = new Map(rows.map((r) => [r.contractor?.id, r]))
    return sorted
      .map((m) => ({ match: m, row: byId.get(m.profileId) }))
      .filter((x): x is { match: RankedMatch; row: MatchRow } => Boolean(x.row))
  }, [ranked, facet, rows])

  const compareMatches = useMemo(
    () => ranked.filter((m) => compareIds.includes(m.profileId)),
    [ranked, compareIds],
  )

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const onInvite = async (professionalId: string) => {
    setBusyId(professionalId)
    await inviteProfessionalToProject({
      professionalId,
      listingId,
      projectTitle,
    })
    setBusyId(null)
  }

  const onSave = async (professionalId: string) => {
    setBusyId(professionalId)
    const result = await toggleSavedProfessional(professionalId)
    if ('saved' in result) {
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (result.saved) next.add(professionalId)
        else next.delete(professionalId)
        return next
      })
    }
    setBusyId(null)
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            AI Matching Engine
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[34px]">
            {t('project.matches.title' as never) || 'Top matched professionals'}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-[#86868b]">
            {t('project.matches.sub' as never) ||
              'AI ranked Top 10 by category, location, budget, timeline, languages, rating, jobs, response time & availability'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
              onClick={() => navigateTo(`/listing/${listingId}`)}
            >
              {t('project.matches.viewProject' as never) || 'View project'}
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
              onClick={() => navigateTo('/my-projects')}
            >
              {t('project.matches.myProjects' as never) || 'My projects'}
            </button>
            {compareIds.length >= 2 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white"
                onClick={() => setShowCompare(true)}
              >
                <Columns2 className="h-3.5 w-3.5" />
                Compare ({compareIds.length})
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[20px] bg-white" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[20px] border border-[#e8e8ed] bg-white px-6 py-14 text-center">
            <p className="text-[15px] text-[#86868b]">
              {t('project.matches.empty' as never) ||
                'No matches yet. Professionals will be notified.'}
            </p>
            <button
              type="button"
              className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white"
              onClick={() => navigateTo('/professionals')}
            >
              Browse professionals
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FACET_TABS.map((tab) => {
                const Icon = tab.icon
                const active = facet === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFacet(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                      active
                        ? 'bg-[#1d1d1f] text-white'
                        : 'border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="mb-4 flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#86868b]">
                Top {visible.length} of {TOP_MATCH_LIMIT}
              </p>
              {ranked[0] ? (
                <p className="text-[13px] text-[#86868b]">
                  Best match{' '}
                  <span className="font-semibold text-[#248a3d]">
                    {Math.round(ranked[0].score)}%
                  </span>
                </p>
              ) : null}
            </div>

            <ul className="space-y-3">
              {visible.map(({ match, row }, index) => {
                const p = row.contractor!
                const photo = p.profile_photo || p.avatar_url
                const score = Math.round(Number(row.score))
                const reasonChips = (row.reasons || [])
                  .map((r) => REASON_LABELS[r] || r.replace(/_/g, ' '))
                  .slice(0, 4)
                const jobs = p.completed_jobs ?? p.total_reviews ?? 0
                const tags = facetLabelsForMatch(p.id, facets)
                const inCompare = compareIds.includes(p.id)
                const isSaved = savedIds.has(p.id)
                const explanation =
                  row.explanation ||
                  match.explanation ||
                  `AI Match ${score}% based on your project criteria.`

                return (
                  <li
                    key={p.id}
                    className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex items-center gap-3 sm:contents">
                        <div className="relative">
                          <ScoreRing score={score} />
                          <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-[11px] font-bold text-white">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
                            {photo ? (
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-6 w-6 text-[#86868b]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                className="truncate text-left text-[17px] font-semibold text-[#1d1d1f] hover:underline"
                                onClick={() => navigateTo(`/professional/${p.id}`)}
                              >
                                {p.full_name || 'Professional'}
                              </button>
                              <VerificationBadge level={p.verification_level} />
                              {p.is_verified &&
                              (!p.verification_level || p.verification_level === 'none') ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-[#067d62]">
                                  <BadgeCheck className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-[#86868b]">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {p.location || 'Location TBD'}
                              {row.distance_km != null ? (
                                <span className="text-[#6e6e73]">
                                  · {Math.round(Number(row.distance_km))} km
                                </span>
                              ) : null}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" />
                                {(p.rating ?? 0).toFixed(1)} · {p.total_reviews ?? 0} reviews
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {jobs} jobs
                              </span>
                              {(p.response_rate ?? row.response_score) != null ? (
                                <span className="inline-flex items-center gap-1">
                                  <Timer className="h-3.5 w-3.5" />
                                  {Math.round(Number(p.response_rate ?? row.response_score))}%
                                  response
                                </span>
                              ) : null}
                              {p.languages?.length ? (
                                <span className="inline-flex items-center gap-1">
                                  <Languages className="h-3.5 w-3.5" />
                                  {p.languages.slice(0, 3).join(', ')}
                                </span>
                              ) : null}
                            </div>
                            {tags.length ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${FACET_CHIP[tag].className}`}
                                  >
                                    {FACET_CHIP[tag].label}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:w-[140px] sm:flex-col sm:items-end">
                        <MatchScoreBadge score={score} large />
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black disabled:opacity-60 sm:w-auto"
                          onClick={() => void onInvite(p.id)}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Invite
                        </button>
                        <div className="flex w-full gap-2 sm:w-auto">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold sm:flex-none ${
                              isSaved
                                ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                                : 'border-[#d2d2d7] bg-white text-[#1d1d1f]'
                            }`}
                            onClick={() => void onSave(p.id)}
                            title={isSaved ? 'Saved' : 'Save'}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Bookmark className="h-3.5 w-3.5" />
                            )}
                            Save
                          </button>
                          <button
                            type="button"
                            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold sm:flex-none ${
                              inCompare
                                ? 'border-[#0066cc] bg-[#e8f1ff] text-[#0066cc]'
                                : 'border-[#d2d2d7] bg-white text-[#1d1d1f]'
                            }`}
                            onClick={() => toggleCompare(p.id)}
                            title="Compare"
                          >
                            {inCompare ? <Check className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                            Compare
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-[#f0f0f2] pt-3">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
                        Why recommended
                      </p>
                      <p className="mt-1 text-[14px] leading-relaxed text-[#1d1d1f]">
                        {explanation}
                      </p>
                      {reasonChips.length > 0 ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {reasonChips.map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#6e6e73]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {showCompare && compareMatches.length >= 2 ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[24px] bg-white p-5 shadow-xl md:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
                  Compare professionals
                </p>
                <h2 className="text-[20px] font-semibold text-[#1d1d1f]">
                  Side-by-side ({compareMatches.length})
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#d2d2d7] p-2 text-[#1d1d1f]"
                onClick={() => setShowCompare(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className={`grid gap-3 ${
                compareMatches.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
              }`}
            >
              {compareMatches.map((m) => (
                <div
                  key={m.profileId}
                  className="rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-[#1d1d1f]">
                        {m.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#86868b]">
                        {m.location || '—'}
                      </p>
                    </div>
                    <MatchScoreBadge score={m.score} />
                  </div>
                  <dl className="mt-4 space-y-2 text-[13px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#86868b]">Rating</dt>
                      <dd className="font-semibold text-[#1d1d1f]">
                        {m.rating.toFixed(1)} ({m.totalReviews})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#86868b]">Jobs</dt>
                      <dd className="font-semibold text-[#1d1d1f]">{m.completedJobs ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#86868b]">Response</dt>
                      <dd className="font-semibold text-[#1d1d1f]">
                        {m.responseScore != null || m.responseRate != null
                          ? `${Math.round(Number(m.responseScore ?? m.responseRate))}%`
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#86868b]">Distance</dt>
                      <dd className="font-semibold text-[#1d1d1f]">
                        {m.distanceKm != null ? `${Math.round(m.distanceKm)} km` : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#86868b]">Availability</dt>
                      <dd className="font-semibold capitalize text-[#1d1d1f]">
                        {m.availabilityStatus || '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#86868b]">Value score</dt>
                      <dd className="font-semibold text-[#1d1d1f]">
                        {m.valueScore != null ? Math.round(m.valueScore) : '—'}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[12px] leading-relaxed text-[#6e6e73]">
                    {m.explanation}
                  </p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white"
                    onClick={() => void onInvite(m.profileId)}
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
