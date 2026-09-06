import { useState } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { submitReviewV2 } from '../../lib/reviews/reviews'
import {
  REVIEW_MEDIA_ACCEPT,
  REVIEW_MEDIA_MAX_FILES,
  uploadReviewMedia,
  type ReviewMediaItem,
} from '../../lib/reviewMediaUpload'

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
  const [media, setMedia] = useState<ReviewMediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const room = REVIEW_MEDIA_MAX_FILES - media.length
      const batch = Array.from(files).slice(0, room)
      const uploaded: ReviewMediaItem[] = []
      for (const file of batch) {
        uploaded.push(await uploadReviewMedia(user.id, file))
      }
      setMedia((prev) => [...prev, ...uploaded].slice(0, REVIEW_MEDIA_MAX_FILES))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('reviews.error'))
    } finally {
      setUploading(false)
    }
  }

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
      media_urls: media,
    })
    setSubmitting(false)
    if (!result.ok) {
      if (result.error === 'duplicate') setError(t('reviews.duplicate'))
      else if (result.error === 'empty') setError('Add a comment or photo/video')
      else setError(t('reviews.error'))
      return
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="glass-panel space-y-4 rounded-none p-5">
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
        className="w-full rounded-none border border-slate-200 px-3 py-2 text-sm"
      />

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Photos & videos</p>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#2f2a24] px-3 py-1.5 text-[12px] font-semibold text-white">
            <ImagePlus className="h-3.5 w-3.5" />
            {uploading ? 'Uploading…' : 'Add media'}
            <input
              type="file"
              accept={REVIEW_MEDIA_ACCEPT}
              multiple
              className="hidden"
              disabled={uploading || media.length >= REVIEW_MEDIA_MAX_FILES}
              onChange={(e) => {
                void onPickFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {media.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {media.map((m) => (
              <div key={m.url} className="relative h-16 w-16 overflow-hidden rounded-none">
                {m.type === 'video' ? (
                  <video src={m.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  onClick={() => setMedia((prev) => prev.filter((x) => x.url !== m.url))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[12px] text-slate-500">Up to {REVIEW_MEDIA_MAX_FILES} files</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {submitting ? t('common.loading') : t('reviews.submit')}
      </button>
    </form>
  )
}
