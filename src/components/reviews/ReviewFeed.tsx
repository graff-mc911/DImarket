import { useCallback, useEffect, useState } from 'react'
import {
  computeRatingStats,
  fetchReviewFeed,
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

const SORTS: { id: ReviewSort; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
]

export function ReviewFeed({
  professionalId,
  viewerId,
  viewerName,
  showForm = false,
  onSubmitted,
}: Props) {
  const [sort, setSort] = useState<ReviewSort>('newest')
  const [items, setItems] = useState<ReviewFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formDone, setFormDone] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const rows = await fetchReviewFeed(professionalId, viewerId, sort)
    setItems(rows)
    setLoading(false)
  }, [professionalId, viewerId, sort])

  useEffect(() => {
    void reload()
  }, [reload])

  const stats = computeRatingStats(items)

  const patchItem = (next: ReviewFeedItem) => {
    setItems((prev) => prev.map((r) => (r.id === next.id ? next : r)))
  }

  return (
    <div className="space-y-4">
      <ReviewStats stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-[#1d1d1f]">
          {loading ? 'Loading reviews…' : `${items.length} review${items.length === 1 ? '' : 's'}`}
        </p>
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

      {!loading && items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#86868b]">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((review) => (
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

      {showForm && !formDone ? (
        <ReviewFormV2
          professionalId={professionalId}
          onSuccess={() => {
            setFormDone(true)
            onSubmitted?.()
            void reload()
          }}
        />
      ) : null}

      {showForm && formDone ? (
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800">
          Thanks! Your review was saved.
        </div>
      ) : null}
    </div>
  )
}
