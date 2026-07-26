import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  MessageCircle,
  Play,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  addReviewReply,
  reviewCountryFlag,
  setReviewVote,
  type ReviewFeedItem,
  type ReviewReplyRow,
  type ReviewVote,
} from '../../lib/reviews/reviews'
import { navigateTo } from '../../lib/navigation'

type Props = {
  review: ReviewFeedItem
  viewerId?: string | null
  viewerName?: string | null
  professionalId: string
  onChanged: (next: ReviewFeedItem) => void
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-[#d2d2d7]'
          }`}
        />
      ))}
    </div>
  )
}

function formatDate(iso: string | null | undefined, locale?: string): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

export function ReviewCard({
  review,
  viewerId,
  viewerName,
  professionalId,
  onChanged,
}: Props) {
  const { t, language } = useApp()
  const locale = language?.code || undefined
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const comment = useMemo(() => {
    const c = (review.comment || '').trim()
    return c || null
  }, [review.comment])

  const initial = (review.reviewer_name || 'C').slice(0, 1).toUpperCase()
  const flag = reviewCountryFlag(review.reviewer_country_code)
  const completedLabel = formatDate(review.project_completed_at, locale)
  const createdLabel = formatDate(review.created_at, locale)

  const onVote = async (next: ReviewVote) => {
    if (!viewerId) {
      navigateTo('/login')
      return
    }
    setBusy(true)
    const vote = review.my_vote === next ? null : next
    const res = await setReviewVote(review.id, viewerId, vote)
    setBusy(false)
    if ('error' in res) return
    onChanged({
      ...review,
      my_vote: res.my_vote,
      liked_by_me: res.my_vote === 'helpful',
      helpful_count: res.helpful_count,
      not_helpful_count: res.not_helpful_count,
      like_count: res.helpful_count,
    })
  }

  const onReply = async () => {
    if (!viewerId) {
      navigateTo('/login')
      return
    }
    if (!replyText.trim()) return
    setBusy(true)
    const res = await addReviewReply({
      reviewId: review.id,
      authorId: viewerId,
      authorName: viewerName || 'User',
      body: replyText,
    })
    setBusy(false)
    if ('error' in res) return
    const replies: ReviewReplyRow[] = [...review.replies, res.reply]
    onChanged({ ...review, replies })
    setReplyText('')
    setReplyOpen(false)
  }

  const isOwnerReply = (authorId: string) => authorId === professionalId
  const hasBeforeAfter =
    review.before_media_urls.length > 0 || review.after_media_urls.length > 0

  return (
    <article className="rounded-[18px] border border-[#e8e8ed] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {review.reviewer_avatar_url ? (
            <img
              src={review.reviewer_avatar_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[13px] font-bold text-[#1d1d1f]"
              aria-hidden
            >
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[14px] font-semibold text-[#1d1d1f]">
                {review.reviewer_name}
                {flag ? (
                  <span className="ml-1.5" title={review.reviewer_country_code || undefined}>
                    {flag}
                  </span>
                ) : null}
              </p>
              {review.is_verified_project || review.is_verified_customer ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t('reviews.verifiedProject')}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#86868b]">
              {review.project_category ? (
                <span className="font-medium text-[#6e6e73]">{review.project_category}</span>
              ) : null}
              {completedLabel ? (
                <span>
                  {t('reviews.completedOn')} {completedLabel}
                </span>
              ) : createdLabel ? (
                <span>{createdLabel}</span>
              ) : null}
            </div>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>

      {comment ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[#3a3a3c]">{comment}</p>
      ) : null}

      {review.would_recommend ? (
        <p className="mt-2 text-[12px] font-medium text-emerald-700">{t('reviews.recommends')}</p>
      ) : null}

      {hasBeforeAfter ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {review.before_media_urls.length > 0 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                {t('reviews.before')}
              </p>
              <div className="flex flex-wrap gap-2">
                {review.before_media_urls.map((m) => (
                  <button
                    key={`before-${m.url}`}
                    type="button"
                    onClick={() => setLightbox(m.url)}
                    className="h-20 w-20 overflow-hidden rounded-xl"
                  >
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {review.after_media_urls.length > 0 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                {t('reviews.after')}
              </p>
              <div className="flex flex-wrap gap-2">
                {review.after_media_urls.map((m) => (
                  <button
                    key={`after-${m.url}`}
                    type="button"
                    onClick={() => setLightbox(m.url)}
                    className="h-20 w-20 overflow-hidden rounded-xl"
                  >
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!hasBeforeAfter && review.media_urls.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.media_urls.map((m) =>
            m.type === 'video' ? (
              <button
                key={m.url}
                type="button"
                onClick={() => setLightbox(m.url)}
                className="relative h-20 w-28 overflow-hidden rounded-xl bg-[#0b0b0f]"
              >
                <video src={m.url} className="h-full w-full object-cover" muted preload="metadata" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-white/90 p-1.5">
                    <Play className="h-3.5 w-3.5 text-[#1d1d1f]" />
                  </span>
                </span>
              </button>
            ) : (
              <button
                key={m.url}
                type="button"
                onClick={() => setLightbox(m.url)}
                className="h-20 w-20 overflow-hidden rounded-xl"
              >
                <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ),
          )}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onVote('helpful')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
            review.my_vote === 'helpful'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${review.my_vote === 'helpful' ? 'fill-current' : ''}`} />
          {t('reviews.helpful')} · {review.helpful_count || 0}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onVote('not_helpful')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
            review.my_vote === 'not_helpful'
              ? 'bg-[#fff1f0] text-[#c41e3a]'
              : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
          }`}
        >
          <ThumbsDown
            className={`h-3.5 w-3.5 ${review.my_vote === 'not_helpful' ? 'fill-current' : ''}`}
          />
          {t('reviews.notHelpful')} · {review.not_helpful_count || 0}
        </button>
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#6e6e73] hover:bg-[#e8e8ed]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {viewerId === professionalId ? t('reviews.proReply') : t('reviews.reply')}
          {review.replies.length ? ` (${review.replies.length})` : ''}
        </button>
      </div>

      {review.replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-[#f0f0f2] pt-3">
          {review.replies.map((r) => (
            <div key={r.id} className="rounded-xl bg-[#fafafa] px-3 py-2">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-semibold text-[#1d1d1f]">{r.author_name}</p>
                {isOwnerReply(r.author_id) ? (
                  <span className="rounded-full bg-[#1d1d1f] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    {t('reviews.proBadge')}
                  </span>
                ) : null}
                <span className="text-[11px] text-[#86868b]">
                  {formatDate(r.created_at, locale)}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#3a3a3c]">{r.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {replyOpen ? (
        <div className="mt-3 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              viewerId === professionalId
                ? t('reviews.proReplyPlaceholder')
                : t('reviews.replyPlaceholder')
            }
            className="flex-1 rounded-xl border border-[#d2d2d7] bg-[#fafafa] px-3 py-2 text-[13px] outline-none focus:border-[#1d1d1f] focus:bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onReply()
            }}
          />
          <button
            type="button"
            disabled={busy || !replyText.trim()}
            onClick={() => void onReply()}
            className="inline-flex items-center gap-1 rounded-xl bg-[#1d1d1f] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {t('reviews.send')}
          </button>
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/\.(mp4|webm|mov)(\?|$)/i.test(lightbox) ? (
              <video src={lightbox} controls autoPlay className="max-h-[85vh] w-full rounded-2xl" />
            ) : (
              <img src={lightbox} alt="" className="max-h-[85vh] w-full rounded-2xl object-contain" />
            )}
          </div>
        </div>
      ) : null}
    </article>
  )
}
