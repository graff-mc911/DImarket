import { useState } from 'react'
import { Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { submitReviewV2 } from '../../lib/reviews/reviews'

type Props = {
  professionalId: string
  listingId?: string | null
  onSuccess?: () => void
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
            <Star
              className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewFormV2({ professionalId, listingId, onSuccess }: Props) {
  const { user, profile, t } = useApp()
  const [rating, setRating] = useState(5)
  const [workQuality, setWorkQuality] = useState(5)
  const [communication, setCommunication] = useState(5)
  const [speed, setSpeed] = useState(5)
  const [reliability, setReliability] = useState(5)
  const [recommend, setRecommend] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await submitReviewV2({
      professional_id: professionalId,
      reviewer_id: user.id,
      reviewer_name: profile?.full_name || 'Client',
      reviewer_email: user.email,
      reviewer_role: 'client',
      listing_id: listingId,
      rating,
      comment: comment.trim() || null,
      work_quality: workQuality,
      communication,
      speed,
      reliability,
      would_recommend: recommend,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error === 'duplicate' ? t('reviews.duplicate') : t('reviews.error'))
      return
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="glass-panel space-y-4 rounded-2xl p-5">
      <h3 className="text-lg font-bold text-[var(--ink-900)]">{t('reviews.writeTitle')}</h3>
      <StarRow label={t('reviews.overall')} value={rating} onChange={setRating} />
      <StarRow label={t('reviews.workQuality')} value={workQuality} onChange={setWorkQuality} />
      <StarRow label={t('reviews.communication')} value={communication} onChange={setCommunication} />
      <StarRow label={t('reviews.speed')} value={speed} onChange={setSpeed} />
      <StarRow label={t('reviews.reliability')} value={reliability} onChange={setReliability} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} />
        {t('reviews.recommend')}
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder={t('reviews.commentPlaceholder')}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {submitting ? t('common.loading') : t('reviews.submit')}
      </button>
    </form>
  )
}
