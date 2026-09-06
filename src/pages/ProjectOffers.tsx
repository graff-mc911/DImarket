import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, Star, User } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatEuro } from '../lib/costEstimator'
import { rankQuotesForListing, type RankedOffer } from '../lib/aiOfferRanking'
import { selectProfessionalForProject } from '../lib/projectManager'
import { startProjectEscrowCheckout } from '../lib/projectEscrow'
import { PROJECT_PAYMENTS_ENABLED } from '../lib/featureFlags'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'

const REASON_LABELS: Record<string, string> = {
  within_budget: 'Within budget',
  near_budget: 'Near budget',
  below_budget: 'Below mid-budget',
  above_budget: 'Above mid-budget',
  high_rating: 'Top rated',
  experienced: 'Experienced',
  strong_match: 'Strong match fit',
  verified: 'Verified',
  already_accepted: 'Already accepted',
  price_fit: 'Price fit',
  match_fit: 'Match fit',
}

function reasonLabel(r: string): string {
  return REASON_LABELS[r] || r.replace(/_/g, ' ')
}

/** AI Ranking of offers — /project/:id/offers */
export function ProjectOffers({ listingId }: { listingId: string }) {
  const { user, t } = useApp()
  const [offers, setOffers] = useState<RankedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [title, setTitle] = useState('Project offers')
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [hiredId, setHiredId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isOwner = Boolean(user?.id && authorId && user.id === authorId)
  const hired = Boolean(hiredId)

  const reload = useCallback(async () => {
    setLoading(true)
    const [ranked, listing] = await Promise.all([
      rankQuotesForListing(listingId),
      supabase
        .from('listings')
        .select('title, hired_professional_id, author_id, pipeline_stage')
        .eq('id', listingId)
        .maybeSingle(),
    ])
    setOffers(ranked)
    const row = listing.data as {
      title?: string
      hired_professional_id?: string | null
      author_id?: string
      pipeline_stage?: string | null
    } | null
    if (row?.title) setTitle(row.title)
    setAuthorId(row?.author_id ?? null)
    setHiredId(row?.hired_professional_id ?? null)
    setLoading(false)
  }, [listingId])

  useEffect(() => {
    void reload()
  }, [reload])

  // Soft poll while comparing offers
  useEffect(() => {
    if (hired) return
    const id = window.setInterval(() => {
      void rankQuotesForListing(listingId).then(setOffers)
    }, 20000)
    return () => window.clearInterval(id)
  }, [listingId, hired])

  const hire = async (offer: RankedOffer) => {
    if (!user?.id) {
      navigateTo('/login')
      return
    }
    if (!isOwner) {
      setError(
        t('pipeline.hireOwnerOnly' as never) ||
          'Only the project owner can hire a professional',
      )
      return
    }
    setBusyId(offer.quoteId)
    setError(null)
    setNotice(null)
    const res = await selectProfessionalForProject({
      listingId,
      customerId: user.id,
      quoteId: offer.quoteId,
      applicationId: offer.applicationId,
      professionalId: offer.professionalId,
    })
    setBusyId(null)
    if ('error' in res) {
      setError(
        /owner|author|not_owner/i.test(res.error)
          ? t('pipeline.hireOwnerOnly' as never) || res.error
          : /already hired/i.test(res.error)
            ? t('pipeline.hiredBanner' as never) || res.error
            : res.error,
      )
      return
    }
    setHiredId(offer.professionalId)

    if (PROJECT_PAYMENTS_ENABLED) {
      setNotice(
        t('pipeline.hiredEscrowNotice' as never) ||
          'Professional hired — opening secure hold for the quote total…',
      )
      const escrow = await startProjectEscrowCheckout({
        listingId,
        customerId: user.id,
        professionalId: offer.professionalId,
        quoteId: offer.quoteId,
        amountEur: offer.total,
        currency: offer.currency || 'EUR',
        projectTitle: title,
      })
      if ('error' in escrow) {
        setError(
          (t('pipeline.escrowStartFailed' as never) || 'Could not start payment hold') +
            `: ${escrow.error}`,
        )
        setNotice(
          t('pipeline.hiredNotice' as never) ||
            'Professional hired — open Project Manager to hold funds or track work.',
        )
        navigateTo(`/project/${listingId}/manage`)
        return
      }
      window.location.href = escrow.url
      return
    }

    setNotice(
      t('pipeline.hiredNotice' as never) ||
        'Professional hired — opening Project Manager…',
    )
    navigateTo(`/project/${listingId}/manage`)
  }

  return (
    <div className="min-h-[70vh] bg-[#f3f0ea] pb-24">
      <div className="border-b border-[rgba(148,163,184,0.22)] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a8178]">
            AI Ranking
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#2f2a24]">
            {t('pipeline.offersTitle' as never) || 'Ranked offers'}
          </h1>
          <p className="mt-2 text-[15px] text-[#6f665d]">{title}</p>
          <p className="mt-1 text-[13px] text-[#8a8178]">
            {t('pipeline.offersSub' as never) ||
              'Compare binding quotes by price, rating, experience and match fit — then hire.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/project/${listingId}/matches`)}
            >
              {t('pipeline.backToMatches' as never) || 'Matches'}
            </button>
            <button
              type="button"
              className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/project/${listingId}/manage`)}
            >
              {t('pipeline.manageTitle' as never) || 'Project manager'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => void reload()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('project.matches.refresh' as never) || 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-6">
        {error ? (
          <p className="rounded-none bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">{error}</p>
        ) : null}
        {notice ? (
          <p className="rounded-none bg-[#ecfdf5] px-4 py-3 text-[13px] font-medium text-[#047857]">
            {notice}
          </p>
        ) : null}
        {hired ? (
          <p className="rounded-none bg-[#ecfdf5] px-4 py-3 text-[13px] font-medium text-[#047857]">
            {t('pipeline.hiredBanner' as never) ||
              'Professional selected — open Project Manager to track milestones.'}
          </p>
        ) : null}
        {user && authorId && !isOwner ? (
          <p className="rounded-none bg-[#f3f0ea] px-4 py-3 text-[13px] text-[#6f665d]">
            {t('pipeline.viewOnlyOffers' as never) ||
              'Viewing ranked offers. Only the project owner can hire.'}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-none bg-white" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white px-6 py-14 text-center">
            <p className="text-[15px] text-[#8a8178]">
              {t('pipeline.offersEmpty' as never) ||
                'No quotes yet. Pros respond Ready / Need inspection / Decline, then send offers.'}
            </p>
            <button
              type="button"
              className="mt-5 rounded-full bg-[#2f2a24] px-5 py-2.5 text-[13px] font-semibold text-white"
              onClick={() => navigateTo(`/project/${listingId}/matches`)}
            >
              {t('pipeline.backToMatches' as never) || 'Back to matches'}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {offers.map((o, i) => {
              const isHiredRow =
                o.status === 'accepted' || (hiredId != null && hiredId === o.professionalId)
              return (
                <li
                  key={o.quoteId}
                  className={`rounded-none border bg-white p-4 md:p-5 ${
                    i === 0 && !hired ? 'border-[#2f2a24]' : 'border-[rgba(148,163,184,0.22)]'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f2a24] text-[12px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-none bg-[#f3f0ea]">
                        {o.photo ? (
                          <img src={o.photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-[#8a8178]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="truncate text-left text-[16px] font-semibold text-[#2f2a24] hover:underline"
                            onClick={() => navigateTo(`/professional/${o.professionalId}`)}
                          >
                            {o.professionalName}
                          </button>
                          {i === 0 && !hired ? (
                            <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#047857]">
                              {t('pipeline.bestOffer' as never) || 'Best fit'}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-[#6f665d]">
                          <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" />
                          {o.rating.toFixed(1)} · {o.reviews} reviews · {o.completedJobs} jobs
                          {o.verification ? ` · ${o.verification}` : ''}
                        </p>
                        {o.reasons.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {o.reasons.slice(0, 4).map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-[#f3f0ea] px-2.5 py-1 text-[11px] font-medium text-[#6f665d]"
                              >
                                {reasonLabel(r)}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {o.notes ? (
                          <p className="mt-2 line-clamp-2 text-[13px] text-[#8a8178]">{o.notes}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div className="text-left sm:text-right">
                        <p className="text-[22px] font-semibold tabular-nums tracking-tight text-[#2f2a24]">
                          {formatEuro(o.total)}
                        </p>
                        <span className="mt-1 inline-flex rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[12px] font-bold text-[#047857]">
                          {o.rankScore}% AI
                          {o.matchScore != null ? ` · ${Math.round(o.matchScore)}% match` : ''}
                        </span>
                      </div>
                      {isHiredRow ? (
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#047857]">
                          <Check className="h-4 w-4" />
                          {t('pipeline.hired' as never) || 'Hired'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={hired || busyId === o.quoteId || (Boolean(user) && !isOwner)}
                          className="rounded-full bg-[#2f2a24] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => void hire(o)}
                        >
                          {busyId === o.quoteId
                            ? t('pipeline.hiring' as never) || 'Hiring…'
                            : t('pipeline.hirePro' as never) ||
                              t('pipeline.selectPro' as never) ||
                              'Hire'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
