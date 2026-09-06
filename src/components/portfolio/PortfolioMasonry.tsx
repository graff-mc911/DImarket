import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  Heart,
  Images,
  Play,
  Share2,
  X,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  coverUrl,
  portfolioCategoryKey,
  sharePortfolioItem,
  togglePortfolioLike,
  type PortfolioItemRow,
} from '../../lib/portfolio'

type Props = {
  items: PortfolioItemRow[]
  profileId: string
  viewerId?: string | null
  editable?: boolean
  onChanged?: (items: PortfolioItemRow[]) => void
  onEdit?: (item: PortfolioItemRow) => void
  onDelete?: (item: PortfolioItemRow) => void
  filterCategory?: string
  highlightItemId?: string | null
}

export function PortfolioMasonry({
  items,
  profileId,
  viewerId,
  editable,
  onChanged,
  onEdit,
  onDelete,
  filterCategory = '',
  highlightItemId = null,
}: Props) {
  const { t } = useApp()
  const [lightbox, setLightbox] = useState<PortfolioItemRow | null>(null)
  const [busyLike, setBusyLike] = useState<string | null>(null)
  const [shareNotice, setShareNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightItemId || !items.length) return
    const hit = items.find((i) => i.id === highlightItemId)
    if (hit) setLightbox(hit)
  }, [highlightItemId, items])

  const filtered = useMemo(() => {
    if (!filterCategory) return items
    if (filterCategory === 'certificate') {
      return items.filter((i) => i.media_type === 'certificate' || i.category_slug === 'certificate')
    }
    return items.filter((i) => i.category_slug === filterCategory)
  }, [items, filterCategory])

  const onLike = async (item: PortfolioItemRow) => {
    if (!viewerId) return
    setBusyLike(item.id)
    const res = await togglePortfolioLike(item.id, viewerId, Boolean(item.liked_by_me))
    setBusyLike(null)
    if ('error' in res) return
    onChanged?.(
      items.map((i) =>
        i.id === item.id
          ? { ...i, liked_by_me: res.liked, like_count: res.likeCount }
          : i,
      ),
    )
    if (lightbox?.id === item.id) {
      setLightbox({ ...item, liked_by_me: res.liked, like_count: res.likeCount })
    }
  }

  const onShare = async (item: PortfolioItemRow) => {
    await sharePortfolioItem(item, profileId)
    setShareNotice('Link copied / share sheet opened')
    window.setTimeout(() => setShareNotice(null), 2000)
  }

  if (!filtered.length) {
    return (
      <div className="rounded-none border border-dashed border-[rgba(148,163,184,0.35)] bg-white/60 px-6 py-14 text-center">
        <Images className="mx-auto h-10 w-10 text-[rgba(148,163,184,0.35)]" />
        <p className="mt-3 text-[14px] font-semibold text-[#2f2a24]">No portfolio items yet</p>
        <p className="mt-1 text-[13px] text-[#8a8178]">
          Add photos, videos, certificates and before/after projects.
        </p>
      </div>
    )
  }

  return (
    <>
      {shareNotice ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
          {shareNotice}
        </p>
      ) : null}

      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {filtered.map((item) => {
          const cover = coverUrl(item)
          return (
            <article
              key={item.id}
              className="mb-3 break-inside-avoid overflow-hidden rounded-none border border-[rgba(148,163,184,0.22)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <button
                type="button"
                className="relative block w-full text-left"
                onClick={() => setLightbox(item)}
              >
                {item.media_type === 'before_after' && item.before_url && item.after_url ? (
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <img src={item.before_url} alt="Before" className="h-40 w-full object-cover sm:h-48" loading="lazy" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Before
                      </span>
                    </div>
                    <div className="relative">
                      <img src={item.after_url} alt="After" className="h-40 w-full object-cover sm:h-48" loading="lazy" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        After
                      </span>
                    </div>
                  </div>
                ) : item.media_type === 'video' && item.video_url ? (
                  <div className="relative bg-[#0b0b0f]">
                    {cover && cover !== item.video_url ? (
                      <img src={cover} alt="" className="h-48 w-full object-cover opacity-90" loading="lazy" />
                    ) : (
                      <video
                        src={item.video_url}
                        className="h-48 w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-white/90 p-3 shadow">
                        <Play className="h-5 w-5 text-[#2f2a24]" />
                      </span>
                    </span>
                  </div>
                ) : cover ? (
                  <img
                    src={cover}
                    alt={item.title}
                    className="w-full object-cover"
                    style={{ minHeight: 140 }}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-[#f3f0ea]">
                    <Award className="h-8 w-8 text-[#8a8178]" />
                  </div>
                )}
              </button>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#2f2a24]">{item.title}</p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#8a8178]">
                      {item.media_type === 'certificate'
                        ? t('portfolio.cat.certificate')
                        : item.media_type === 'before_after'
                          ? t('portfolio.media.beforeAfter' as never)
                          : item.media_type === 'video'
                            ? t('ads.videoBadge')
                            : t(portfolioCategoryKey(item.category_slug) as never)}
                    </p>
                  </div>
                </div>
                {item.description ? (
                  <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-[#6f665d]">
                    {item.description}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!viewerId || busyLike === item.id}
                    onClick={() => void onLike(item)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition ${
                      item.liked_by_me
                        ? 'bg-[#fff1f0] text-[#c41e3a]'
                        : 'bg-[#f3f0ea] text-[#6f665d] hover:bg-[rgba(148,163,184,0.22)]'
                    } disabled:opacity-50`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${item.liked_by_me ? 'fill-current' : ''}`} />
                    {item.like_count || 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onShare(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#f3f0ea] px-2.5 py-1.5 text-[12px] font-semibold text-[#6f665d] hover:bg-[rgba(148,163,184,0.22)]"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  {editable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit?.(item)}
                        className="ml-auto text-[12px] font-semibold text-[#0066cc]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(item)}
                        className="text-[12px] font-semibold text-[#c41e3a]"
                      >
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-none bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white"
              onClick={() => setLightbox(null)}
            >
              <X className="h-4 w-4" />
            </button>

            {lightbox.media_type === 'before_after' && lightbox.before_url && lightbox.after_url ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase text-[#8a8178]">Before</p>
                  <img src={lightbox.before_url} alt="Before" className="w-full rounded-2xl object-cover" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase text-[#8a8178]">After</p>
                  <img src={lightbox.after_url} alt="After" className="w-full rounded-2xl object-cover" />
                </div>
              </div>
            ) : lightbox.media_type === 'video' && lightbox.video_url ? (
              <video src={lightbox.video_url} controls className="w-full rounded-2xl bg-black" playsInline />
            ) : coverUrl(lightbox) ? (
              <img src={coverUrl(lightbox)!} alt={lightbox.title} className="w-full rounded-2xl object-contain" />
            ) : null}

            <div className="mt-4">
              <h3 className="text-[18px] font-semibold text-[#2f2a24]">{lightbox.title}</h3>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-[#8a8178]">
                {t(portfolioCategoryKey(lightbox.category_slug) as never)} ·{' '}
                {lightbox.media_type.replace('_', ' ')}
              </p>
              {lightbox.description ? (
                <p className="mt-3 text-[14px] leading-relaxed text-[#6f665d]">{lightbox.description}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={!viewerId}
                  onClick={() => void onLike(lightbox)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f0ea] px-4 py-2 text-[13px] font-semibold"
                >
                  <Heart className={`h-4 w-4 ${lightbox.liked_by_me ? 'fill-[#c41e3a] text-[#c41e3a]' : ''}`} />
                  {lightbox.like_count || 0} likes
                </button>
                <button
                  type="button"
                  onClick={() => void onShare(lightbox)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#2f2a24] px-4 py-2 text-[13px] font-semibold text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
