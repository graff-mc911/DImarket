import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bookmark,
  Building2,
  Check,
  Columns2,
  FolderKanban,
  FolderTree,
  Heart,
  Loader2,
  MapPin,
  Search,
  Share2,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { VerificationBadge } from '../components/MatchScoreBadge'
import {
  fetchFavoritesBundle,
  removeFavorite,
  shareFavorite,
  shareUrlForFavorite,
  tabCounts,
  type FavoriteCategory,
  type FavoriteProfessional,
  type FavoriteProject,
  type FavoriteSearch,
  type FavoriteTab,
  type FavoritesBundle,
} from '../lib/favorites'
import type { VerificationLevel } from '../lib/types'

const TABS: { id: FavoriteTab; label: string; icon: typeof User }[] = [
  { id: 'professionals', label: 'Professionals', icon: User },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'searches', label: 'Searches', icon: Search },
]

const EMPTY: FavoritesBundle = {
  professionals: [],
  companies: [],
  projects: [],
  categories: [],
  searches: [],
}

function formatSavedDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function Favorites() {
  const { user, t } = useApp()
  const [bundle, setBundle] = useState<FavoritesBundle>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FavoriteTab>('professionals')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const data = await fetchFavoritesBundle(user.id)
    setBundle(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    void load()
  }, [user?.id, load])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`favorites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, load])

  useEffect(() => {
    setCompareIds([])
    setShowCompare(false)
  }, [tab])

  const counts = useMemo(() => tabCounts(bundle), [bundle])
  const comparable = tab === 'professionals' || tab === 'companies' || tab === 'projects'

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  const onRemove = async (savedId: string) => {
    setBusyId(savedId)
    const res = await removeFavorite(savedId)
    if (res.ok) {
      setBundle((prev) => ({
        professionals: prev.professionals.filter((x) => x.savedId !== savedId),
        companies: prev.companies.filter((x) => x.savedId !== savedId),
        projects: prev.projects.filter((x) => x.savedId !== savedId),
        categories: prev.categories.filter((x) => x.savedId !== savedId),
        searches: prev.searches.filter((x) => x.savedId !== savedId),
      }))
      setCompareIds((ids) => ids.filter((id) => id !== savedId))
      flash('Removed from favorites')
    }
    setBusyId(null)
  }

  const onShare = async (title: string, url: string) => {
    const result = await shareFavorite({ title, url, text: `Saved on DImarket: ${title}` })
    flash(result === 'copied' ? 'Link copied' : result === 'shared' ? 'Shared' : 'Share failed')
  }

  const toggleCompare = (savedId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(savedId)) return prev.filter((x) => x !== savedId)
      if (prev.length >= 3) return prev
      return [...prev, savedId]
    })
  }

  const compareItems = useMemo(() => {
    if (tab === 'professionals') {
      return bundle.professionals.filter((p) => compareIds.includes(p.savedId))
    }
    if (tab === 'companies') {
      return bundle.companies.filter((p) => compareIds.includes(p.savedId))
    }
    if (tab === 'projects') {
      return bundle.projects.filter((p) => compareIds.includes(p.savedId))
    }
    return []
  }, [tab, bundle, compareIds])

  if (!user) return null

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            <Heart className="h-4 w-4" />
            Favorites
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[32px]">
            {t('favorites.title') || 'Favorites'}
          </h1>
          <p className="mt-1 max-w-xl text-[15px] text-[#86868b]">
            {t('favorites.description') ||
              'Save professionals, companies, projects, categories, and searches — sync across devices.'}
          </p>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              const count = counts[item.id]
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                    active
                      ? 'bg-[#1d1d1f] text-white'
                      : 'border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  {count > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-white/20' : 'bg-[#f5f5f7] text-[#6e6e73]'
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {comparable && compareIds.length >= 2 ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
              onClick={() => setShowCompare(true)}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Compare ({compareIds.length})
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#86868b]" />
          </div>
        ) : (
          <>
            {tab === 'professionals' && (
              <ProList
                items={bundle.professionals}
                emptyTitle="No saved professionals"
                emptyCta="Browse professionals"
                emptyHref="/professionals"
                compareIds={compareIds}
                busyId={busyId}
                onRemove={onRemove}
                onShare={onShare}
                onCompare={toggleCompare}
              />
            )}
            {tab === 'companies' && (
              <ProList
                items={bundle.companies}
                emptyTitle="No saved companies"
                emptyCta="Browse companies"
                emptyHref="/companies"
                compareIds={compareIds}
                busyId={busyId}
                onRemove={onRemove}
                onShare={onShare}
                onCompare={toggleCompare}
              />
            )}
            {tab === 'projects' && (
              <ProjectList
                items={bundle.projects}
                compareIds={compareIds}
                busyId={busyId}
                onRemove={onRemove}
                onShare={onShare}
                onCompare={toggleCompare}
              />
            )}
            {tab === 'categories' && (
              <CategoryList items={bundle.categories} busyId={busyId} onRemove={onRemove} onShare={onShare} />
            )}
            {tab === 'searches' && (
              <SearchList items={bundle.searches} busyId={busyId} onRemove={onRemove} onShare={onShare} />
            )}
          </>
        )}
      </div>

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white shadow-lg lg:bottom-8">
          {toast}
        </div>
      ) : null}

      {showCompare && compareItems.length >= 2 ? (
        <CompareModal
          tab={tab}
          items={compareItems}
          onClose={() => setShowCompare(false)}
        />
      ) : null}
    </div>
  )
}

function EmptyState({
  title,
  cta,
  href,
}: {
  title: string
  cta: string
  href: string
}) {
  return (
    <div className="rounded-[22px] border border-[#e8e8ed] bg-white px-6 py-16 text-center shadow-sm">
      <Bookmark className="mx-auto h-10 w-10 text-[#d2d2d7]" />
      <p className="mt-4 text-[15px] font-semibold text-[#1d1d1f]">{title}</p>
      <p className="mt-1 text-[13px] text-[#86868b]">Save items to find them here later.</p>
      <button
        type="button"
        onClick={() => navigateTo(href)}
        className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        {cta}
      </button>
    </div>
  )
}

function ActionRow({
  savedId,
  busy,
  comparable,
  inCompare,
  onRemove,
  onShare,
  onCompare,
}: {
  savedId: string
  busy: boolean
  comparable?: boolean
  inCompare?: boolean
  onRemove: () => void
  onShare: () => void
  onCompare?: () => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {comparable && onCompare ? (
        <button
          type="button"
          onClick={onCompare}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${
            inCompare
              ? 'border-[#0066cc] bg-[#e8f1ff] text-[#0066cc]'
              : 'border-[#d2d2d7] bg-white text-[#1d1d1f]'
          }`}
        >
          {inCompare ? <Check className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
          Compare
        </button>
      ) : null}
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onRemove}
        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </button>
    </div>
  )
}

function ProList({
  items,
  emptyTitle,
  emptyCta,
  emptyHref,
  compareIds,
  busyId,
  onRemove,
  onShare,
  onCompare,
}: {
  items: FavoriteProfessional[]
  emptyTitle: string
  emptyCta: string
  emptyHref: string
  compareIds: string[]
  busyId: string | null
  onRemove: (id: string) => void
  onShare: (title: string, url: string) => void
  onCompare: (id: string) => void
}) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} cta={emptyCta} href={emptyHref} />
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const url = shareUrlForFavorite({
          type: item.kind,
          itemId: item.itemId,
        })
        return (
          <li
            key={item.savedId}
            className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-sm md:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => navigateTo(`/professional/${item.itemId}`)}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
                  {item.photo ? (
                    <img src={item.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-[#86868b]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[16px] font-semibold text-[#1d1d1f]">{item.fullName}</p>
                    <VerificationBadge level={item.verificationLevel as VerificationLevel} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[#86868b]">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.location || 'Location TBD'}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-[#6e6e73]">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" />
                      {item.rating.toFixed(1)} ({item.totalReviews})
                    </span>
                    <span>Saved {formatSavedDate(item.createdAt)}</span>
                  </div>
                </div>
              </button>
              <ActionRow
                savedId={item.savedId}
                busy={busyId === item.savedId}
                comparable
                inCompare={compareIds.includes(item.savedId)}
                onRemove={() => onRemove(item.savedId)}
                onShare={() => onShare(item.fullName, url)}
                onCompare={() => onCompare(item.savedId)}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ProjectList({
  items,
  compareIds,
  busyId,
  onRemove,
  onShare,
  onCompare,
}: {
  items: FavoriteProject[]
  compareIds: string[]
  busyId: string | null
  onRemove: (id: string) => void
  onShare: (title: string, url: string) => void
  onCompare: (id: string) => void
}) {
  if (!items.length) {
    return (
      <EmptyState title="No saved projects" cta="Browse projects" href="/projects" />
    )
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const url = shareUrlForFavorite({ type: 'project', itemId: item.itemId })
        return (
          <li
            key={item.savedId}
            className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-sm md:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => navigateTo(`/listing/${item.itemId}`)}
              >
                <p className="text-[16px] font-semibold text-[#1d1d1f]">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-[13px] text-[#86868b]">{item.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
                  {item.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.location}
                    </span>
                  ) : null}
                  {item.price != null ? (
                    <span className="font-semibold text-[#1d1d1f]">
                      {item.price.toLocaleString()} {item.currency || 'EUR'}
                    </span>
                  ) : null}
                  <span>Saved {formatSavedDate(item.createdAt)}</span>
                </div>
              </button>
              <ActionRow
                savedId={item.savedId}
                busy={busyId === item.savedId}
                comparable
                inCompare={compareIds.includes(item.savedId)}
                onRemove={() => onRemove(item.savedId)}
                onShare={() => onShare(item.title, url)}
                onCompare={() => onCompare(item.savedId)}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function CategoryList({
  items,
  busyId,
  onRemove,
  onShare,
}: {
  items: FavoriteCategory[]
  busyId: string | null
  onRemove: (id: string) => void
  onShare: (title: string, url: string) => void
}) {
  if (!items.length) {
    return <EmptyState title="No saved categories" cta="Browse categories" href="/" />
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const path = `/category/${item.slug || item.itemId}`
        const url = shareUrlForFavorite({ type: 'category', itemId: item.itemId, path })
        return (
          <li
            key={item.savedId}
            className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-sm md:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => navigateTo(path)}
              >
                <p className="text-[16px] font-semibold text-[#1d1d1f]">{item.name}</p>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-[13px] text-[#86868b]">{item.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-[#6e6e73]">
                  <span>{item.professionalsCount} professionals</span>
                  {item.avgRating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" />
                      {item.avgRating.toFixed(1)}
                    </span>
                  ) : null}
                  <span>Saved {formatSavedDate(item.createdAt)}</span>
                </div>
              </button>
              <ActionRow
                savedId={item.savedId}
                busy={busyId === item.savedId}
                onRemove={() => onRemove(item.savedId)}
                onShare={() => onShare(item.name, url)}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function SearchList({
  items,
  busyId,
  onRemove,
  onShare,
}: {
  items: FavoriteSearch[]
  busyId: string | null
  onRemove: (id: string) => void
  onShare: (title: string, url: string) => void
}) {
  if (!items.length) {
    return <EmptyState title="No saved searches" cta="Go to search" href="/search" />
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const path = item.path || `/search?q=${encodeURIComponent(item.query)}`
        const url = shareUrlForFavorite({ type: 'search', itemId: item.itemId, path })
        return (
          <li
            key={item.savedId}
            className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-sm md:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => navigateTo(path)}
              >
                <p className="text-[16px] font-semibold text-[#1d1d1f]">{item.title}</p>
                <p className="mt-1 text-[13px] text-[#86868b]">
                  {[item.query, item.city, item.country].filter(Boolean).join(' · ') || path}
                </p>
                <p className="mt-2 text-[12px] text-[#6e6e73]">
                  Saved {formatSavedDate(item.createdAt)}
                </p>
              </button>
              <ActionRow
                savedId={item.savedId}
                busy={busyId === item.savedId}
                onRemove={() => onRemove(item.savedId)}
                onShare={() => onShare(item.title, url)}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function CompareModal({
  tab,
  items,
  onClose,
}: {
  tab: FavoriteTab
  items: Array<FavoriteProfessional | FavoriteProject>
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[24px] bg-white p-5 shadow-xl md:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
              Compare favorites
            </p>
            <h2 className="text-[20px] font-semibold text-[#1d1d1f]">
              {tab} · {items.length}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#d2d2d7] p-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={`grid gap-3 ${items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
        >
          {items.map((item) => {
            if ('fullName' in item) {
              return (
                <div key={item.savedId} className="rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] p-4">
                  <p className="font-semibold text-[#1d1d1f]">{item.fullName}</p>
                  <p className="mt-1 text-[12px] text-[#86868b]">{item.location || '—'}</p>
                  <dl className="mt-3 space-y-1.5 text-[13px]">
                    <div className="flex justify-between">
                      <dt className="text-[#86868b]">Rating</dt>
                      <dd className="font-semibold">{item.rating.toFixed(1)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#86868b]">Reviews</dt>
                      <dd className="font-semibold">{item.totalReviews}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-full bg-[#1d1d1f] px-3 py-2 text-[12px] font-semibold text-white"
                    onClick={() => navigateTo(`/professional/${item.itemId}`)}
                  >
                    Open profile
                  </button>
                </div>
              )
            }
            return (
              <div key={item.savedId} className="rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] p-4">
                <p className="font-semibold text-[#1d1d1f]">{item.title}</p>
                <p className="mt-1 text-[12px] text-[#86868b]">{item.location || '—'}</p>
                <dl className="mt-3 space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-[#86868b]">Budget</dt>
                    <dd className="font-semibold">
                      {item.price != null
                        ? `${item.price.toLocaleString()} ${item.currency || ''}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#86868b]">Status</dt>
                    <dd className="font-semibold capitalize">{item.status || '—'}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="mt-4 w-full rounded-full bg-[#1d1d1f] px-3 py-2 text-[12px] font-semibold text-white"
                  onClick={() => navigateTo(`/listing/${item.itemId}`)}
                >
                  Open project
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
