import { useEffect, useState } from 'react'
import { Check, Star, User } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatEuro } from '../lib/costEstimator'
import { rankQuotesForListing, type RankedOffer } from '../lib/aiOfferRanking'
import { selectProfessionalForProject } from '../lib/projectManager'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'

/** AI Ranking of offers — /project/:id/offers */
export function ProjectOffers({ listingId }: { listingId: string }) {
  const { user, t } = useApp()
  const [offers, setOffers] = useState<RankedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [title, setTitle] = useState('Project offers')
  const [error, setError] = useState<string | null>(null)
  const [hired, setHired] = useState(false)

  const reload = async () => {
    setLoading(true)
    const [ranked, listing] = await Promise.all([
      rankQuotesForListing(listingId),
      supabase.from('listings').select('title, hired_professional_id, author_id').eq('id', listingId).maybeSingle(),
    ])
    setOffers(ranked)
    const row = listing.data as {
      title?: string
      hired_professional_id?: string | null
      author_id?: string
    } | null
    if (row?.title) setTitle(row.title)
    setHired(Boolean(row?.hired_professional_id))
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [listingId])

  const hire = async (offer: RankedOffer) => {
    if (!user?.id) {
      navigateTo('/login')
      return
    }
    setBusyId(offer.quoteId)
    setError(null)
    const res = await selectProfessionalForProject({
      listingId,
      customerId: user.id,
      quoteId: offer.quoteId,
      applicationId: offer.applicationId,
      professionalId: offer.professionalId,
    })
    setBusyId(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setHired(true)
    navigateTo(`/project/${listingId}/manage`)
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            AI Ranking
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
            {t('pipeline.offersTitle' as never) || 'Ranked offers'}
          </h1>
          <p className="mt-2 text-[15px] text-[#6e6e73]">{title}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/project/${listingId}/matches`)}
            >
              Matches
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/project/${listingId}/manage`)}
            >
              Project manager
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        {error ? (
          <p className="mb-4 rounded-2xl bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">{error}</p>
        ) : null}
        {hired ? (
          <p className="mb-4 rounded-2xl bg-[#ecfdf5] px-4 py-3 text-[13px] font-medium text-[#047857]">
            Professional selected — open Project Manager to track milestones.
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-white" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-[20px] border border-[#e8e8ed] bg-white px-6 py-14 text-center">
            <p className="text-[15px] text-[#86868b]">
              No quotes yet. Professionals will respond with Ready / Need inspection / Decline, then
              send offers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[20px] border border-[#e8e8ed] bg-white">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#f0f0f2] text-[11px] uppercase tracking-wide text-[#86868b]">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Professional</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Jobs</th>
                  <th className="px-4 py-3 font-semibold">AI score</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {offers.map((o, i) => (
                  <tr key={o.quoteId} className="border-t border-[#f0f0f2]">
                    <td className="px-4 py-3 tabular-nums text-[#86868b]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f7]">
                          {o.photo ? (
                            <img src={o.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-[#86868b]" />
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            className="font-semibold text-[#1d1d1f] hover:underline"
                            onClick={() => navigateTo(`/professional/${o.professionalId}`)}
                          >
                            {o.professionalName}
                          </button>
                          <p className="text-[11px] text-[#86868b]">
                            {o.reasons.slice(0, 3).join(' · ').replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatEuro(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" />
                        {o.rating.toFixed(1)} · {o.reviews}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{o.completedJobs}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[12px] font-bold text-[#047857]">
                        {o.rankScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#047857]">
                          <Check className="h-3.5 w-3.5" /> Hired
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={hired || busyId === o.quoteId}
                          className="rounded-full bg-[#1d1d1f] px-3.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
                          onClick={() => void hire(o)}
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
