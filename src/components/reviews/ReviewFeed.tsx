import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  computeRatingStats,
  fetchReviewableProjects,
  fetchReviewFeed,
  sortReviews,
  type ReviewableProject,
  type ReviewFeedItem,
  type ReviewSort,
} from '../../lib/reviews/reviews'
import { ReviewCard } from './ReviewCard'
import { ReviewStats } from './ReviewStats'
import { ReviewFormV2 } from './ReviewFormV2'

type Props = {
  professionalId: string
  viewerId?: string | null
  viewerName?: string | null
  showForm?: boolean
  onSubmitted?: () => void
}

export function ReviewFeed({
  professionalId,
  viewerId,
  viewerName,
  showForm = false,
  onSubmitted,
}: Props) {
  const { t } = useApp()
  const [sort, setSort] = useState<ReviewSort>('newest')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [items, setItems] = useState<ReviewFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formDone, setFormDone] = useState(false)
  const [eligibleProjects, setEligibleProjects] = useState<ReviewableProject[]>([])
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  const SORTS: { id: ReviewSort; label: string }[] = [
    { id: 'newest', label: t('reviews.sortNewest') },
    { id: 'highest', label: t('reviews.sortHighest') },
    { id: 'lowest', label: t('reviews.sortLowest') },
    { id: 'most_helpful', label: t('reviews.sortMostHelpful') },
  ]

  const reload = useCallback(async () => {
    setLoading(true)
    const rows = await fetchReviewFeed(professionalId, viewerId, 'newest')
    setItems(rows)
    setLoading(false)
  }, [professionalId, viewerId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!showForm || !viewerId || formDone) {
      setEligibleProjects([])
      return
    }
    let cancelled = false
    setCheckingEligibility(true)
    void fetchReviewableProjects(viewerId, professionalId).then((rows) => {
      if (cancelled) return
      setEligibleProjects(rows)
      setCheckingEligibility(false)
    })
    return () => {
      cancelled = true
    }
  }, [showForm, viewerId, professionalId, formDone])

  const stats = useMemo(() => computeRatingStats(items), [items])

  const visibleItems = useMemo(() => {
    const filtered = verifiedOnly
      ? items.filter((r) => r.is_verified_project || r.is_verified_customer)
      : items
    return sortReviews(filtered, sort)
  }, [items, verifiedOnly, sort])

  const patchItem = (next: ReviewFeedItem) => {
    setItems((prev) => prev.map((r) => (r.id === next.id ? next : r)))
  }

  const canShowForm = showForm && !formDone && !checkingEligibility && eligibleProjects.length > 0

  return (
    <div className="space-y-4">
      <ReviewStats stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] font-semibold text-[#1d1d1f]">
            {loading
              ? t('reviews.loading')
              : t('reviews.countLabel').replace('{count}', String(visibleItems.length))}
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#6e6e73]">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-[#d2d2d7]"
            />
            {t('reviews.verifiedOnly')}
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                sort === s.id
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && visibleItems.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#86868b]">{t('reviews.empty')}</p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              viewerId={viewerId}
              viewerName={viewerName}
              professionalId={professionalId}
              onChanged={patchItem}
            />
          ))}
        </div>
      )}

      {showForm && !formDone && checkingEligibility ? (
        <p className="text-[13px] text-[#86868b]">{t('common.loading')}</p>
      ) : null}

      {showForm && !formDone && !checkingEligibility && eligibleProjects.length === 0 ? (
        <div className="rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-5 text-[13px] text-[#6e6e73]">
          {t('reviews.onlyCompleted')}
        </div>
      ) : null}

      {canShowForm ? (
        <ReviewFormV2
          professionalId={professionalId}
          projects={eligibleProjects}
          onSuccess={() => {
            setFormDone(true)
            onSubmitted?.()
            void reload()
          }}
        />
      ) : null}

      {showForm && formDone ? (
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800">
          {t('reviews.thanks')}
        </div>
      ) : null}
    </div>
  )
}
