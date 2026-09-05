import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Play,
  Send,
  Star,
} from 'lucide-react'
import {
  addReviewReply,
  toggleReviewLike,
  type ReviewFeedItem,
  type ReviewReplyRow,
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
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-[rgba(148,163,184,0.35)]'
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewCard({
  review,
  viewerId,
  viewerName,
  professionalId,
  onChanged,
}: Props) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const comment = useMemo(() => {
    const c = (review.comment || '').trim()
    return c || null
  }, [review.comment])

  const onLike = async () => {
    if (!viewerId) {
      navigateTo('/login')
      return
    }
    setBusy(true)
    const res = await toggleReviewLike(review.id, viewerId, review.liked_by_me)
    setBusy(false)
    if ('error' in res) return
    onChanged({ ...review, liked_by_me: res.liked, like_count: res.likeCount })
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

  return (
    <article className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-[#2f2a24]">
              {review.reviewer_name}
            </p>
            {review.is_verified_customer ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified customer
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12px] text-[#8a8178]">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <Stars rating={review.rating} />
      </div>

      {comment ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[#3a3a3c]">{comment}</p>
      ) : null}

      {review.would_recommend ? (
        <p className="mt-2 text-[12px] font-medium text-emerald-700">Recommends this professional</p>
      ) : null}

      {review.media_urls.length > 0 ? (
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
                  <span className="rounded-full bg-white p-1.5">
                    <Play className="h-3.5 w-3.5 text-[#2f2a24]" />
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
          onClick={() => void onLike()}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
            review.liked_by_me
              ? 'bg-[#fff1f0] text-[#c41e3a]'
              : 'bg-[#f3f0ea] text-[#6f665d] hover:bg-[rgba(148,163,184,0.22)]'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${review.liked_by_me ? 'fill-current' : ''}`} />
          {review.like_count || 0}
        </button>
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f0ea] px-3 py-1.5 text-[12px] font-semibold text-[#6f665d] hover:bg-[rgba(148,163,184,0.22)]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Reply
          {review.replies.length ? ` (${review.replies.length})` : ''}
        </button>
      </div>

      {review.replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-[#f0f0f2] pt-3">
          {review.replies.map((r) => (
            <div key={r.id} className="rounded-xl bg-[#fafafa] px-3 py-2">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-semibold text-[#2f2a24]">{r.author_name}</p>
                {isOwnerReply(r.author_id) ? (
                  <span className="rounded-full bg-[#2f2a24] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Pro
                  </span>
                ) : null}
                <span className="text-[11px] text-[#8a8178]">
                  {new Date(r.created_at).toLocaleDateString()}
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
            placeholder="Write a reply…"
            className="flex-1 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[#fafafa] px-3 py-2 text-[13px] outline-none focus:border-[#2f2a24] focus:bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onReply()
            }}
          />
          <button
            type="button"
            disabled={busy || !replyText.trim()}
            onClick={() => void onReply()}
            className="inline-flex items-center gap-1 rounded-xl bg-[#2f2a24] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Send
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
