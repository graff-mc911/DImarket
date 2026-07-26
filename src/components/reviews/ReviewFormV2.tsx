import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  fetchReviewableProjects,
  guessCountryCode,
  submitReviewV2,
  type ReviewableProject,
} from '../../lib/reviews/reviews'
import {
  REVIEW_MEDIA_ACCEPT,
  REVIEW_MEDIA_MAX_FILES,
  uploadReviewMedia,
  type ReviewMediaItem,
} from '../../lib/reviewMediaUpload'

type Props = {
  professionalId: string
  listingId?: string | null
  projects?: ReviewableProject[]
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

function MediaPicker({
  label,
  items,
  uploading,
  onPick,
  onRemove,
  t,
}: {
  label: string
  items: ReviewMediaItem[]
  uploading: boolean
  onPick: (files: FileList | null) => void
  onRemove: (url: string) => void
  t: (key: string) => string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[12px] font-semibold text-white">
          <ImagePlus className="h-3.5 w-3.5" />
          {uploading ? t('reviews.uploading') : t('reviews.addMedia')}
          <input
            type="file"
            accept={REVIEW_MEDIA_ACCEPT}
            multiple
            className="hidden"
            disabled={uploading || items.length >= REVIEW_MEDIA_MAX_FILES}
            onChange={(e) => {
              onPick(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((m) => (
            <div key={m.url} className="relative h-16 w-16 overflow-hidden rounded-xl">
              {m.type === 'video' ? (
                <video src={m.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                onClick={() => onRemove(m.url)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[12px] text-slate-500">
          {t('reviews.mediaOptionalHint').replace('{max}', String(REVIEW_MEDIA_MAX_FILES))}
        </p>
      )}
    </div>
  )
}

export function ReviewFormV2({ professionalId, listingId, projects: projectsProp, onSuccess }: Props) {
  const { user, profile, t } = useApp()
  const [projects, setProjects] = useState<ReviewableProject[]>(projectsProp ?? [])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [rating, setRating] = useState(5)
  const [workQuality, setWorkQuality] = useState(5)
  const [communication, setCommunication] = useState(5)
  const [speed, setSpeed] = useState(5)
  const [reliability, setReliability] = useState(5)
  const [recommend, setRecommend] = useState(true)
  const [comment, setComment] = useState('')
  const [beforeMedia, setBeforeMedia] = useState<ReviewMediaItem[]>([])
  const [afterMedia, setAfterMedia] = useState<ReviewMediaItem[]>([])
  const [media, setMedia] = useState<ReviewMediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(!projectsProp)

  useEffect(() => {
    if (projectsProp) {
      setProjects(projectsProp)
      setLoadingProjects(false)
      return
    }
    if (!user) return
    let cancelled = false
    setLoadingProjects(true)
    void fetchReviewableProjects(user.id, professionalId).then((rows) => {
      if (cancelled) return
      setProjects(rows)
      setLoadingProjects(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, professionalId, projectsProp])

  useEffect(() => {
    if (!projects.length) {
      setSelectedKey('')
      return
    }
    const preferred =
      projects.find((p) => listingId && p.listing_id === listingId) || projects[0]
    const key = preferred.listing_id
      ? `listing:${preferred.listing_id}`
      : `booking:${preferred.booking_id}`
    setSelectedKey(key)
  }, [projects, listingId])

  if (!user) return null

  if (loadingProjects) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-sm text-slate-600">
        {t('common.loading')}
      </div>
    )
  }

  if (!projects.length) {
    return (
      <div className="rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-5 text-[13px] text-[#6e6e73]">
        {t('reviews.onlyCompleted')}
      </div>
    )
  }

  const selected =
    projects.find((p) =>
      selectedKey.startsWith('listing:')
        ? p.listing_id === selectedKey.slice('listing:'.length)
        : p.booking_id === selectedKey.slice('booking:'.length),
    ) || projects[0]

  const uploadTo = async (
    files: FileList | null,
    setter: Dispatch<SetStateAction<ReviewMediaItem[]>>,
    current: ReviewMediaItem[],
  ) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const room = REVIEW_MEDIA_MAX_FILES - current.length
      const batch = Array.from(files).slice(0, room)
      const uploaded: ReviewMediaItem[] = []
      for (const file of batch) {
        uploaded.push(await uploadReviewMedia(user.id, file))
      }
      setter((prev) => [...prev, ...uploaded].slice(0, REVIEW_MEDIA_MAX_FILES))
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
      reviewer_avatar_url: profile?.avatar_url || profile?.profile_photo || null,
      reviewer_country_code:
        selected.country_code || guessCountryCode(selected.country_name || profile?.location),
      listing_id: selected.listing_id,
      booking_id: selected.booking_id,
      project_category: selected.project_category,
      project_completed_at: selected.project_completed_at,
      rating,
      comment: comment.trim() || null,
      work_quality: workQuality,
      communication,
      speed,
      reliability,
      would_recommend: recommend,
      media_urls: media,
      before_media_urls: beforeMedia,
      after_media_urls: afterMedia,
    })
    setSubmitting(false)
    if (!result.ok) {
      if (result.error === 'duplicate') setError(t('reviews.duplicate'))
      else if (result.error === 'empty') setError(t('reviews.emptyContent'))
      else if (result.error === 'not_eligible' || result.error === 'self') {
        setError(t('reviews.onlyCompleted'))
      } else setError(t('reviews.error'))
      return
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="glass-panel space-y-4 rounded-2xl p-5">
      <h3 className="text-lg font-bold text-[var(--ink-900)]">{t('reviews.writeTitle')}</h3>

      {projects.length > 1 ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">{t('reviews.selectProject')}</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {projects.map((p) => {
              const key = p.listing_id ? `listing:${p.listing_id}` : `booking:${p.booking_id}`
              const meta = [p.project_category, p.project_completed_at?.slice(0, 10)]
                .filter(Boolean)
                .join(' · ')
              return (
                <option key={key} value={key}>
                  {p.project_title}
                  {meta ? ` (${meta})` : ''}
                </option>
              )
            })}
          </select>
        </label>
      ) : (
        <p className="text-[13px] text-slate-600">
          <span className="font-semibold text-slate-800">{selected.project_title}</span>
          {selected.project_category ? ` · ${selected.project_category}` : ''}
        </p>
      )}

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

      <MediaPicker
        label={t('reviews.beforePhotos')}
        items={beforeMedia}
        uploading={uploading}
        onPick={(files) => void uploadTo(files, setBeforeMedia, beforeMedia)}
        onRemove={(url) => setBeforeMedia((prev) => prev.filter((x) => x.url !== url))}
        t={t}
      />
      <MediaPicker
        label={t('reviews.afterPhotos')}
        items={afterMedia}
        uploading={uploading}
        onPick={(files) => void uploadTo(files, setAfterMedia, afterMedia)}
        onRemove={(url) => setAfterMedia((prev) => prev.filter((x) => x.url !== url))}
        t={t}
      />
      <MediaPicker
        label={t('reviews.extraMedia')}
        items={media}
        uploading={uploading}
        onPick={(files) => void uploadTo(files, setMedia, media)}
        onRemove={(url) => setMedia((prev) => prev.filter((x) => x.url !== url))}
        t={t}
      />

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
