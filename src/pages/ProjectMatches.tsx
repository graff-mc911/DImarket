import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Check,
  Languages,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Star,
  User,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { fetchMatchScoresForListing, TOP_MATCH_LIMIT } from '../lib/matching'
import { MatchScoreBadge, VerificationBadge } from '../components/MatchScoreBadge'
import type { VerificationLevel } from '../lib/types'
import { rankQuotesForListing, type RankedOffer } from '../lib/aiOfferRanking'
import { formatEuro } from '../lib/costEstimator'
import {
  buildDispatchPackage,
  defaultMatchPackageIds,
  dispatchToProfessionals,
  parseInvitedProfileIds,
  type DispatchPackage,
} from '../lib/aiDispatcher'
import {
  fetchApplicationsForListing,
  normalizeProResponseLabel,
  type ListingApplicationRow,
} from '../lib/projectApplications'
import { supabase } from '../lib/supabase'

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

function responseTone(key: string): string {
  switch (key) {
    case 'ready':
      return 'bg-[#ecfdf5] text-[#047857]'
    case 'needs_inspection':
      return 'bg-[#fff7ed] text-[#c2410c]'
    case 'declined':
      return 'bg-[#f5f5f7] text-[#86868b]'
    case 'applied':
      return 'bg-[#eff6ff] text-[#1d4ed8]'
    default:
      return 'bg-[#f5f5f7] text-[#6e6e73]'
  }
}

export function ProjectMatches({ listingId }: { listingId: string }) {
  const { t } = useApp()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [offers, setOffers] = useState<RankedOffer[]>([])
  const [applications, setApplications] = useState<ListingApplicationRow[]>([])
  const [pkg, setPkg] = useState<DispatchPackage | null>(null)
  const [pipelineStage, setPipelineStage] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendNote, setSendNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, ranked, apps, dispatchPkg, listingRes] = await Promise.all([
        fetchMatchScoresForListing(listingId, TOP_MATCH_LIMIT),
        rankQuotesForListing(listingId),
        fetchApplicationsForListing(listingId),
        buildDispatchPackage(listingId),
        supabase
          .from('listings')
          .select('pipeline_stage, description')
          .eq('id', listingId)
          .maybeSingle(),
      ])

      const matchRows = (data as MatchRow[]) ?? []
      setRows(matchRows)
      setOffers(ranked)
      setApplications(apps)
      setPkg(dispatchPkg)

      const listing = listingRes.data as
        | { pipeline_stage?: string | null; description?: string | null }
        | null
      setPipelineStage(listing?.pipeline_stage || null)

      const invited = parseInvitedProfileIds(
        listing?.description || dispatchPkg?.description || '',
      )
      const defaults = defaultMatchPackageIds(
        matchRows
          .filter((r) => r.contractor?.id)
          .map((r) => ({ profileId: r.contractor!.id, score: Number(r.score) })),
        invited,
      )
      setSelected((prev) => (prev.size ? prev : new Set(defaults)))
    } catch {
      setError('Could not load matches')
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    void load()
  }, [load])

  // Soft poll while waiting for pro responses
  useEffect(() => {
    if (pipelineStage !== 'awaiting_responses' && !sendNote) return
    const id = window.setInterval(() => {
      void fetchApplicationsForListing(listingId).then(setApplications)
      void rankQuotesForListing(listingId).then(setOffers)
    }, 20000)
    return () => window.clearInterval(id)
  }, [listingId, pipelineStage, sendNote])

  const appByPro = useMemo(() => {
    const map = new Map<string, ListingApplicationRow>()
    for (const a of applications) map.set(a.professional_id, a)
    return map
  }, [applications])

  const responseStats = useMemo(() => {
    let ready = 0
    let inspection = 0
    let declined = 0
    let applied = 0
    for (const a of applications) {
      const n = normalizeProResponseLabel(a.status)
      if (n.key === 'ready') ready += 1
      else if (n.key === 'needs_inspection') inspection += 1
      else if (n.key === 'declined') declined += 1
      else if (n.key === 'applied') applied += 1
    }
    return { ready, inspection, declined, applied, total: applications.length }
  }, [applications])

  const packageSent =
    Boolean(sendNote) ||
    pipelineStage === 'awaiting_responses' ||
    pipelineStage === 'offers' ||
    applications.length > 0

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(
      new Set(rows.filter((r) => r.contractor?.id).map((r) => r.contractor!.id)),
    )
  }

  const selectRecommended = () => {
    const invited = parseInvitedProfileIds(pkg?.description || '')
    setSelected(
      new Set(
        defaultMatchPackageIds(
          rows
            .filter((r) => r.contractor?.id)
            .map((r) => ({ profileId: r.contractor!.id, score: Number(r.score) })),
          invited,
        ),
      ),
    )
  }

  const sendPackage = async () => {
    const ids = [...selected]
    if (!ids.length || sending) return
    setSending(true)
    setError(null)
    try {
      const result = await dispatchToProfessionals(listingId, ids)
      setPipelineStage('awaiting_responses')
      const base =
        t('project.matches.packageSent' as never) ||
        'Package sent — waiting for responses.'
      setSendNote(`${base} (${result.notified})`)
      const apps = await fetchApplicationsForListing(listingId)
      setApplications(apps)
    } catch {
      setError(t('project.matches.sendError' as never) || 'Could not send package')
    } finally {
      setSending(false)
    }
  }

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
              onClick={() => navigateTo(`/project/${listingId}/offers`)}
            >
              {t('project.matches.rankedOffers' as never) || 'Ranked offers'}
              {offers.length ? ` (${offers.length})` : ''}
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
              onClick={() => navigateTo(`/project/${listingId}/manage`)}
            >
              Project manager
            </button>
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
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
              onClick={() => void load()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('project.matches.refresh' as never) || 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:px-6">
        {error ? (
          <p className="rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">
            {error}
          </p>
        ) : null}

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
            {/* Match package composer */}
            <div className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#1d1d1f]">
                    <Package className="h-4 w-4" />
                    {t('project.matches.packageTitle' as never) || 'Match package'}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6e6e73]">
                    {t('project.matches.packageSub' as never) ||
                      'Select professionals, preview the package, then invite them to respond: Ready · Need inspection · Decline.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f]"
                    onClick={selectRecommended}
                  >
                    {t('project.matches.selectRecommended' as never) || 'Recommended'}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f]"
                    onClick={selectAll}
                  >
                    {t('project.matches.selectAll' as never) || 'Select all'}
                  </button>
                </div>
              </div>

              {pkg ? (
                <div className="mt-4 rounded-[14px] bg-[#f5f5f7] px-4 py-3 text-[13px] text-[#6e6e73]">
                  <p className="font-semibold text-[#1d1d1f]">{pkg.title}</p>
                  <p className="mt-1">
                    {[pkg.addressLabel || pkg.city, pkg.estimateSummary]
                      .filter(Boolean)
                      .join(' · ') || pkg.description.slice(0, 140)}
                  </p>
                  <p className="mt-1">
                    {pkg.budgetMin != null || pkg.budgetMax != null
                      ? `Budget: ${pkg.budgetMin ?? '—'} – ${pkg.budgetMax ?? '—'} EUR`
                      : null}
                    {pkg.photoUrls.length ? ` · Photos: ${pkg.photoUrls.length}` : ''}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={sending || selected.size === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void sendPackage()}
                >
                  {sending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : packageSent ? (
                    <Send className="h-3.5 w-3.5" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {sending
                    ? t('project.matches.sending' as never) || 'Sending…'
                    : packageSent
                      ? `${t('project.matches.resendPackage' as never) || 'Send again'} (${selected.size})`
                      : `${t('project.matches.sendPackage' as never) || 'Send match package'} (${selected.size})`}
                </button>
                <span className="text-[12px] text-[#86868b]">
                  {selected.size} / {rows.length}{' '}
                  {t('project.matches.selected' as never) || 'selected'}
                </span>
              </div>

              {sendNote || packageSent ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1.5 text-[12px] font-semibold text-[#047857]">
                  <Check className="h-3.5 w-3.5" />
                  {sendNote ||
                    t('project.matches.waitingResponses' as never) ||
                    'Package sent — waiting for professional responses.'}
                </p>
              ) : null}
            </div>

            {/* Response inbox */}
            <div className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">
                    {t('project.matches.responsesTitle' as never) || 'Professional responses'}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6e6e73]">
                    {t('project.matches.responsesSub' as never) ||
                      'Ready · Need inspection · Decline — then compare quotes.'}
                  </p>
                </div>
                {(responseStats.ready > 0 || offers.length > 0) && (
                  <button
                    type="button"
                    className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
                    onClick={() => navigateTo(`/project/${listingId}/offers`)}
                  >
                    {t('project.matches.viewOffers' as never) || 'View ranked offers'}
                    {offers.length ? ` (${offers.length})` : ''}
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${responseTone('ready')}`}>
                  Ready {responseStats.ready}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${responseTone('needs_inspection')}`}
                >
                  Inspection {responseStats.inspection}
                </span>
                <span className={`rounded-full px-2.5 py-1 font-semibold ${responseTone('applied')}`}>
                  Applied {responseStats.applied}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${responseTone('declined')}`}
                >
                  Declined {responseStats.declined}
                </span>
              </div>

              {applications.length === 0 ? (
                <p className="mt-4 text-[13px] text-[#86868b]">
                  {packageSent
                    ? t('project.matches.noResponsesYet' as never) ||
                      'No responses yet. Pros will answer from their Leads feed.'
                    : t('project.matches.sendToSeeResponses' as never) ||
                      'Send the match package to start collecting responses.'}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[#f0f0f2]">
                  {applications.map((a) => {
                    const n = normalizeProResponseLabel(a.status)
                    const name =
                      a.professional?.full_name ||
                      rows.find((r) => r.contractor?.id === a.professional_id)?.contractor
                        ?.full_name ||
                      'Professional'
                    return (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-left text-[14px] font-semibold text-[#1d1d1f] hover:underline"
                            onClick={() => navigateTo(`/professional/${a.professional_id}`)}
                          >
                            {name}
                          </button>
                          {a.message ? (
                            <p className="mt-0.5 truncate text-[12px] text-[#86868b]">{a.message}</p>
                          ) : null}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${responseTone(n.key)}`}
                        >
                          {n.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Tender comparison board */}
            <div className="overflow-x-auto rounded-[20px] border border-[#e8e8ed] bg-white p-4">
              <p className="text-[15px] font-semibold text-[#1d1d1f]">
                {t('costEstimator.tenderBoard')}
              </p>
              <p className="mt-1 text-[13px] text-[#6e6e73]">
                {offers.length
                  ? 'Binding offers ranked by AI (price, rating, experience, match fit).'
                  : t('costEstimator.tenderBoardSub')}
              </p>
              {offers.length > 0 ? (
                <table className="mt-4 w-full min-w-[720px] text-left text-[12px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-[#86868b]">
                      <th className="pb-2 pr-2 font-semibold">Professional</th>
                      <th className="pb-2 pr-2 font-semibold">Price</th>
                      <th className="pb-2 pr-2 font-semibold">AI score</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colRating')}</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colJobs')}</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colReviews')}</th>
                      <th className="pb-2 font-semibold">{t('costEstimator.colGuarantee')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o) => (
                      <tr key={o.quoteId} className="border-t border-[#f0f0f2]">
                        <td className="py-2.5 pr-2">
                          <button
                            type="button"
                            className="font-semibold text-[#1d1d1f] hover:underline"
                            onClick={() => navigateTo(`/professional/${o.professionalId}`)}
                          >
                            {o.professionalName}
                          </button>
                        </td>
                        <td className="py-2.5 pr-2 font-semibold tabular-nums">
                          {formatEuro(o.total)}
                        </td>
                        <td className="py-2.5 pr-2 tabular-nums text-[#248a3d]">{o.rankScore}%</td>
                        <td className="py-2.5 pr-2 tabular-nums">{o.rating.toFixed(1)}</td>
                        <td className="py-2.5 pr-2 tabular-nums">{o.completedJobs}</td>
                        <td className="py-2.5 pr-2 tabular-nums">{o.reviews}</td>
                        <td className="py-2.5">{o.verification || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="mt-4 w-full min-w-[640px] text-left text-[12px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-[#86868b]">
                      <th className="pb-2 pr-2 font-semibold">Professional</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colPrice')}</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colTimeline')}</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colRating')}</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colJobs')}</th>
                      <th className="pb-2 pr-2 font-semibold">{t('costEstimator.colReviews')}</th>
                      <th className="pb-2 font-semibold">{t('costEstimator.colGuarantee')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const p = row.contractor
                      if (!p) return null
                      const jobs = p.completed_jobs ?? 0
                      const app = appByPro.get(p.id)
                      const statusLabel = app
                        ? normalizeProResponseLabel(app.status).label
                        : (p.availability_status || 'awaiting').replace(/_/g, ' ')
                      return (
                        <tr key={p.id} className="border-t border-[#f0f0f2]">
                          <td className="py-2.5 pr-2">
                            <button
                              type="button"
                              className="font-semibold text-[#1d1d1f] hover:underline"
                              onClick={() => navigateTo(`/professional/${p.id}`)}
                            >
                              {p.full_name || 'Professional'}
                            </button>
                          </td>
                          <td className="py-2.5 pr-2 tabular-nums font-semibold text-[#248a3d]">
                            {Math.round(Number(row.score))}% fit
                          </td>
                          <td className="py-2.5 pr-2 capitalize text-[#6e6e73]">{statusLabel}</td>
                          <td className="py-2.5 pr-2 tabular-nums">
                            {(p.rating ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2.5 pr-2 tabular-nums">{jobs}</td>
                          <td className="py-2.5 pr-2 tabular-nums">{p.total_reviews ?? 0}</td>
                          <td className="py-2.5">
                            {p.verification_level && p.verification_level !== 'none'
                              ? p.verification_level
                              : p.is_verified
                                ? 'verified'
                                : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

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
                const checked = selected.has(p.id)
                const app = appByPro.get(p.id)
                const resp = app ? normalizeProResponseLabel(app.status) : null

                return (
                  <li
                    key={p.id}
                    className={`rounded-[20px] border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:p-5 ${
                      checked ? 'border-[#1d1d1f]' : 'border-[#e8e8ed]'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <label className="flex cursor-pointer items-center gap-3 sm:contents">
                        <input
                          type="checkbox"
                          className="h-5 w-5 shrink-0 rounded border-[#d2d2d7] accent-[#1d1d1f] sm:mr-1"
                          checked={checked}
                          onChange={() => toggle(p.id)}
                          aria-label={`Include ${p.full_name || 'professional'} in package`}
                        />
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
                              <VerificationBadge level={p.verification_level} />
                              {p.is_verified &&
                              (!p.verification_level || p.verification_level === 'none') ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-[#067d62]">
                                  <BadgeCheck className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : null}
                              {resp ? (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${responseTone(resp.key)}`}
                                >
                                  {resp.label}
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
                      </label>

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
