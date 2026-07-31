import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Languages,
  MapPin,
  MessageCircle,
  Star,
  User,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { fetchMatchScoresForListing, TOP_MATCH_LIMIT } from '../lib/matching'
import { MatchScoreBadge, TrustBadges, VerificationBadge } from '../components/MatchScoreBadge'
import type { VerificationLevel } from '../lib/types'

type MatchRow = {
  score: number
  reasons: string[] | null
  rank_position?: number | null
  contractor: {
    id: string
    full_name: string | null
    location: string | null
    rating: number | null
    total_reviews: number | null
    is_verified: boolean | null
    verification_level?: VerificationLevel | null
    trust_level?: number | null
    trust_score?: number | null
    identity_verified?: boolean | null
    business_verified?: boolean | null
    insurance_verified?: boolean | null
    trusted_professional?: boolean | null
    is_premium?: boolean | null
    email_verified_at?: string | null
    phone_verified_at?: string | null
    profile_photo?: string | null
    avatar_url?: string | null
    completed_jobs?: number | null
    availability_status?: string | null
    languages?: string[] | null
    portfolio_images?: string[] | null
  } | null
}

const REASON_LABELS: Record<string, string> = {
  distance_close: 'Close by',
  near_location: 'Near you',
  within_radius: 'In area',
  same_country: 'Same country',
  subcategory_match: 'Exact trade',
  trade_group_match: 'Related trade',
  category_match: 'Category fit',
  high_rating: 'Top rated',
  experienced: 'Experienced',
  completed_jobs: 'Proven jobs',
  language_match: 'Language fit',
  available_now: 'Available now',
  available: 'Available',
  verified_platinum: 'Platinum verified',
  verified_gold: 'Gold verified',
  verified_silver: 'Silver verified',
  verified_bronze: 'Bronze verified',
  verified: 'Verified',
  portfolio_quality: 'Strong portfolio',
  portfolio: 'Has portfolio',
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

export function ProjectMatches({ listingId }: { listingId: string }) {
  const { t } = useApp()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchMatchScoresForListing(listingId, TOP_MATCH_LIMIT).then((data) => {
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
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            AI Match
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[34px]">
            {t('project.matches.title' as never) || 'Top matched professionals'}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-[#86868b]">
            {t('project.matches.sub' as never) ||
              'Ranked by distance, specialization, rating, jobs, languages, availability, verification & portfolio'}
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
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[20px] bg-white" />
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
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#86868b]">
                Top {rows.length} of {TOP_MATCH_LIMIT}
              </p>
              {rows[0] ? (
                <p className="text-[13px] text-[#86868b]">
                  Best match{' '}
                  <span className="font-semibold text-[#248a3d]">
                    {Math.round(Number(rows[0].score))}%
                  </span>
                </p>
              ) : null}
            </div>

            <ul className="space-y-3">
              {rows.map((row, index) => {
                const p = row.contractor
                if (!p) return null
                const photo = p.profile_photo || p.avatar_url
                const score = Math.round(Number(row.score))
                const reasons = (row.reasons || [])
                  .map((r) => REASON_LABELS[r] || r.replace(/_/g, ' '))
                  .slice(0, 4)
                const jobs = p.completed_jobs ?? p.total_reviews ?? 0

                return (
                  <li
                    key={p.id}
                    className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3 sm:contents">
                        <div className="relative">
                          <ScoreRing score={score} />
                          <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-[11px] font-bold text-white">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 items-center gap-3">
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
                              <VerificationBadge
                                trustLevel={p.trust_level}
                                level={p.verification_level}
                              />
                            </div>
                            <div className="mt-1">
                              <TrustBadges source={p} size="sm" max={3} />
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              {p.is_verified &&
                              !p.identity_verified &&
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
                              {p.languages?.length ? (
                                <span className="inline-flex items-center gap-1">
                                  <Languages className="h-3.5 w-3.5" />
                                  {p.languages.slice(0, 3).join(', ')}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <MatchScoreBadge score={score} large />
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black"
                          onClick={() => navigateTo(`/professional/${p.id}`)}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Contact
                        </button>
                      </div>
                    </div>

                    {reasons.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#f0f0f2] pt-3">
                        {reasons.map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#6e6e73]"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
