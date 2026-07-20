import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  Clock,
  EyeOff,
  MapPin,
  Navigation,
  Radio,
  Send,
  Wallet,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  applyToProject,
  fetchMyApplications,
  hideApplication,
  setApplicationSaved,
} from '../lib/projectApplications'
import {
  EMPTY_PROJECT_FEED_FILTERS,
  fetchProjectById,
  fetchProjectFeedPage,
  formatBudget,
  formatDistanceKm,
  formatRelativeTime,
  getBrowserLocation,
  urgencyTone,
  type GeoPoint,
  type ProjectFeedFilters,
  type ProjectFeedItem,
} from '../lib/projectFeed'
import { PROJECT_TRADES } from '../lib/projectWizard'
import type { ProjectApplication } from '../lib/types'

const filterInput =
  'w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]'

export function ProjectFeed() {
  const { user, profile, t } = useApp()
  const [items, setItems] = useState<ProjectFeedItem[]>([])
  const [apps, setApps] = useState<ProjectApplication[]>([])
  const [filters, setFilters] = useState<ProjectFeedFilters>(EMPTY_PROJECT_FEED_FILTERS)
  const [draft, setDraft] = useState<ProjectFeedFilters>(EMPTY_PROJECT_FEED_FILTERS)
  const [origin, setOrigin] = useState<GeoPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [livePulse, setLivePulse] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const filtersRef = useRef(filters)
  const originRef = useRef(origin)
  const appsRef = useRef(apps)

  filtersRef.current = filters
  originRef.current = origin
  appsRef.current = apps

  const isPro =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    Boolean(profile?.is_professional)

  const appByListing = useMemo(() => {
    const map = new Map<string, ProjectApplication>()
    for (const a of apps) map.set(a.listing_id, a)
    return map
  }, [apps])

  const hiddenIds = useMemo(() => {
    const set = new Set<string>()
    for (const a of apps) if (a.hidden) set.add(a.listing_id)
    return set
  }, [apps])

  const loadPage = useCallback(
    async (opts: { reset: boolean; nextOffset: number }) => {
      if (!user || !isPro) return
      if (opts.reset) setLoading(true)
      else setLoadingMore(true)

      const hidden = new Set(
        appsRef.current.filter((a) => a.hidden).map((a) => a.listing_id),
      )
      const res = await fetchProjectFeedPage({
        offset: opts.nextOffset,
        filters: filtersRef.current,
        origin: originRef.current,
        hiddenListingIds: hidden,
      })

      setItems((prev) => {
        if (opts.reset) return res.items
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...res.items.filter((i) => !seen.has(i.id))]
      })
      setHasMore(res.hasMore)
      setOffset(opts.nextOffset + res.items.length)
      setLoading(false)
      setLoadingMore(false)
    },
    [user, isPro],
  )

  useEffect(() => {
    if (!user || !isPro) return
    let cancelled = false
    void (async () => {
      const [geo, myApps] = await Promise.all([
        getBrowserLocation(),
        fetchMyApplications(user.id),
      ])
      if (cancelled) return
      setOrigin(geo)
      setApps(myApps)
      originRef.current = geo
      appsRef.current = myApps
      await loadPage({ reset: true, nextOffset: 0 })
    })()
    return () => {
      cancelled = true
    }
  }, [user, isPro, loadPage])

  // Reload when filters applied
  useEffect(() => {
    if (!user || !isPro) return
    setNewCount(0)
    void loadPage({ reset: true, nextOffset: 0 })
  }, [filters, user, isPro, loadPage])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || loading || loadingMore) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadPage({ reset: false, nextOffset: offset })
        }
      },
      { rootMargin: '240px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, loadingMore, offset, loadPage])

  // Realtime: new / updated customer projects
  useEffect(() => {
    if (!user || !isPro) return

    const channel = supabase
      .channel('project-feed-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload) => {
          const row = payload.new as { id?: string; listing_type?: string; status?: string }
          if (row.listing_type !== 'service_request' || row.status !== 'active' || !row.id) return
          void fetchProjectById(row.id, originRef.current).then((item) => {
            if (!item) return
            if (hiddenIds.has(item.id)) return
            setItems((prev) => {
              if (prev.some((p) => p.id === item.id)) return prev
              return [item, ...prev]
            })
            setNewCount((c) => c + 1)
            setLivePulse(true)
            window.setTimeout(() => setLivePulse(false), 1800)
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings' },
        (payload) => {
          const row = payload.new as { id?: string; status?: string; listing_type?: string }
          if (!row.id) return
          if (row.status !== 'active' || row.listing_type !== 'service_request') {
            setItems((prev) => prev.filter((p) => p.id !== row.id))
            return
          }
          void fetchProjectById(row.id, originRef.current).then((item) => {
            if (!item) return
            setItems((prev) => prev.map((p) => (p.id === item.id ? item : p)))
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, isPro, hiddenIds])

  const applyFilters = () => {
    setFilters({ ...draft })
  }

  const resetFilters = () => {
    setDraft(EMPTY_PROJECT_FEED_FILTERS)
    setFilters(EMPTY_PROJECT_FEED_FILTERS)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Project feed</h1>
        <p className="mt-2 text-[15px] text-[#86868b]">Sign in as a professional to see incoming projects.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Professionals only</h1>
        <p className="mt-2 text-[15px] text-[#86868b]">
          Switch to a professional account to browse customer projects.
        </p>
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => navigateTo('/for-professionals')}
        >
          Learn more
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6 md:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  livePulse
                    ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#248a3d]'
                    : 'border-[#e8e8ed] bg-[#f5f5f7] text-[#86868b]'
                }`}
              >
                <Radio className="h-3 w-3" />
                Live
              </span>
              {newCount > 0 ? (
                <span className="text-[12px] font-medium text-[#0066cc]">
                  {newCount} new {newCount === 1 ? 'project' : 'projects'}
                </span>
              ) : null}
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[34px]">
              {t('projects.title' as never) || 'Project feed'}
            </h1>
            <p className="mt-1 text-[15px] text-[#86868b]">
              {t('projects.sub' as never) || 'Incoming customer projects — apply, save, or hide'}
            </p>
          </div>
          {!origin ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-medium text-[#1d1d1f]"
              onClick={() => {
                void getBrowserLocation().then((g) => {
                  setOrigin(g)
                  originRef.current = g
                  void loadPage({ reset: true, nextOffset: 0 })
                })
              }}
            >
              <Navigation className="h-3.5 w-3.5" />
              Enable distance
            </button>
          ) : (
            <p className="text-[12px] text-[#86868b]">Distance from your location</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-6 rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#86868b]">
                Country
              </span>
              <input
                className={filterInput}
                value={draft.country}
                onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                placeholder="Germany"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#86868b]">
                Category
              </span>
              <select
                className={filterInput}
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              >
                <option value="">All categories</option>
                {PROJECT_TRADES.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.labelEn}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#86868b]">
                Budget min €
              </span>
              <input
                className={filterInput}
                type="number"
                min={0}
                value={draft.budgetMin}
                onChange={(e) => setDraft((d) => ({ ...d, budgetMin: e.target.value }))}
                placeholder="500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#86868b]">
                Budget max €
              </span>
              <input
                className={filterInput}
                type="number"
                min={0}
                value={draft.budgetMax}
                onChange={(e) => setDraft((d) => ({ ...d, budgetMax: e.target.value }))}
                placeholder="20000"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#86868b]">
                Distance km
              </span>
              <select
                className={filterInput}
                value={draft.distanceKm}
                onChange={(e) => setDraft((d) => ({ ...d, distanceKm: e.target.value }))}
              >
                <option value="">Any distance</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
                <option value="250">Within 250 km</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#86868b]">
                Urgency
              </span>
              <select
                className={filterInput}
                value={draft.urgency}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    urgency: e.target.value as ProjectFeedFilters['urgency'],
                  }))
                }
              >
                <option value="">Any urgency</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0f0f2] pt-4">
            <span className="mr-1 text-[12px] font-semibold text-[#86868b]">Sort</span>
            {(
              [
                ['newest', 'Newest'],
                ['budget_desc', 'Highest budget'],
                ['closest', 'Closest'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, sort: value }))}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  draft.sort === value
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                }`}
              >
                {label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-full bg-[#1d1d1f] px-5 py-2 text-[13px] font-semibold text-white hover:bg-black"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-[20px] border border-[#e8e8ed] bg-white"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[20px] border border-[#e8e8ed] bg-white px-6 py-16 text-center">
            <p className="text-[17px] font-semibold text-[#1d1d1f]">No projects match</p>
            <p className="mt-1 text-[14px] text-[#86868b]">Try widening filters or check back soon.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((project) => {
              const app = appByListing.get(project.id)
              const photos = (project.project_files || [])
                .filter((f) => f.kind === 'photo' || f.mime_type?.startsWith('image/'))
                .slice(0, 4)
              const applied = app?.status === 'applied' || app?.status === 'accepted'
              const urgency = project.urgency || 'normal'

              return (
                <li
                  key={project.id}
                  className="overflow-hidden rounded-[20px] border border-[#e8e8ed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                    <div className="bg-[#fafafa] p-3">
                      {photos.length ? (
                        <div
                          className={`grid gap-1.5 ${
                            photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          }`}
                        >
                          {photos.map((ph) => (
                            <img
                              key={ph.id}
                              src={ph.url}
                              alt=""
                              className="h-24 w-full rounded-xl object-cover md:h-28"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[#d2d2d7] text-[12px] text-[#86868b] md:h-full md:min-h-[140px]">
                          No photos
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col p-4 md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#1d1d1f] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                              {project.tradeLabel || 'Project'}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${urgencyTone(
                                urgency,
                              )}`}
                            >
                              {urgency}
                            </span>
                          </div>
                          <h2 className="mt-2 text-[18px] font-semibold leading-snug tracking-tight text-[#1d1d1f] md:text-[20px]">
                            {project.title}
                          </h2>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#6e6e73]">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {[project.city_name, project.country_name || project.location]
                                .filter(Boolean)
                                .join(', ') || 'Location TBD'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Navigation className="h-3.5 w-3.5 shrink-0" />
                              {formatDistanceKm(project.distanceKm)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                              <Wallet className="h-3.5 w-3.5 shrink-0 text-[#6e6e73]" />
                              {formatBudget(project)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              {formatRelativeTime(project.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-[#6e6e73]">
                        {project.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f0f0f2] pt-4">
                        <button
                          type="button"
                          disabled={busyId === project.id || applied}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-50"
                          onClick={async () => {
                            setBusyId(project.id)
                            const res = await applyToProject(project.id, user.id)
                            setBusyId(null)
                            if ('id' in res) {
                              setApps(await fetchMyApplications(user.id))
                              navigateTo(`/leads/${res.id}/quote`)
                            }
                          }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {applied ? 'Applied' : 'Apply'}
                        </button>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                            app?.saved
                              ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                              : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
                          }`}
                          onClick={async () => {
                            await setApplicationSaved(project.id, user.id, !app?.saved)
                            setApps(await fetchMyApplications(user.id))
                          }}
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          {app?.saved ? 'Saved' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#6e6e73] transition hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                          onClick={async () => {
                            await hideApplication(project.id, user.id)
                            const next = await fetchMyApplications(user.id)
                            setApps(next)
                            setItems((prev) => prev.filter((p) => p.id !== project.id))
                          }}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </button>
                        {app?.id && applied ? (
                          <button
                            type="button"
                            className="ml-auto text-[13px] font-semibold text-[#0066cc]"
                            onClick={() => navigateTo(`/leads/${app.id}/quote`)}
                          >
                            Open quote →
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div ref={sentinelRef} className="h-8" />
        {loadingMore ? (
          <p className="py-4 text-center text-[13px] text-[#86868b]">Loading more…</p>
        ) : null}
        {!hasMore && items.length > 0 ? (
          <p className="py-4 text-center text-[13px] text-[#86868b]">You&apos;re all caught up</p>
        ) : null}
      </div>
    </div>
  )
}
