import { useEffect, useMemo, useState } from 'react'
import { Bookmark, EyeOff, MapPin, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  applyToProject,
  fetchMyApplications,
  hideApplication,
  setApplicationSaved,
} from '../lib/projectApplications'
import type { Listing, ProjectApplication, ProjectFile } from '../lib/types'

type LeadListing = Listing & {
  project_files?: ProjectFile[] | null
  category?: { name: string; slug: string } | null
}

export function LeadFeed() {
  const { user, profile, t } = useApp()
  const [leads, setLeads] = useState<LeadListing[]>([])
  const [apps, setApps] = useState<ProjectApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [country, setCountry] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const isPro =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    profile?.is_professional

  useEffect(() => {
    if (!user || !isPro) return
    let cancelled = false
    setLoading(true)
    void Promise.all([
      supabase
        .from('listings')
        .select('*, project_files(*), category:categories(name, slug)')
        .eq('listing_type', 'service_request')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60),
      fetchMyApplications(user.id),
    ]).then(([listRes, myApps]) => {
      if (cancelled) return
      setLeads((listRes.data as LeadListing[]) ?? [])
      setApps(myApps)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, isPro])

  const appByListing = useMemo(() => {
    const map = new Map<string, ProjectApplication>()
    for (const a of apps) map.set(a.listing_id, a)
    return map
  }, [apps])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const app = appByListing.get(l.id)
      if (app?.hidden) return false
      if (country && !(l.country_name || l.location || '').toLowerCase().includes(country.toLowerCase())) {
        return false
      }
      if (urgency && l.urgency !== urgency) return false
      if (category && l.category?.slug !== category && !(l.subcategory_slugs || []).some((s) => s.includes(category))) {
        return false
      }
      if (budgetMax) {
        const max = Number(budgetMax)
        if (l.budget_min != null && l.budget_min > max) return false
      }
      return true
    })
  }, [leads, appByListing, country, urgency, category, budgetMax])

  if (!user) {
    return (
      <div className="py-16 text-center">
        <button type="button" className="btn-primary" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-xl font-bold">Professionals only</h1>
        <p className="mt-2 text-sm text-[var(--ink-600)]">Switch to a professional account to see leads.</p>
        <button type="button" className="btn-secondary mt-4" onClick={() => navigateTo('/for-professionals')}>
          Learn more
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl py-6 pb-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink-900)] md:text-3xl">
            {t('leads.title' as never) || 'Project leads'}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-600)]">
            {t('leads.sub' as never) || 'Incoming customer projects near you'}
          </p>
        </div>
      </div>

      <div className="amazon-section-card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
        />
        <input
          placeholder="Category slug"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
        />
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          className="rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
        >
          <option value="">Any urgency</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input
          placeholder="Max budget €"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          className="rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="amazon-section-card p-10 text-center text-sm text-[var(--ink-600)]">
          No leads match your filters.
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((lead) => {
            const app = appByListing.get(lead.id)
            const photos = (lead.project_files || []).filter((f) => f.kind === 'photo').slice(0, 3)
            const budget =
              lead.budget_min != null || lead.budget_max != null
                ? `€${lead.budget_min ?? '—'} – €${lead.budget_max ?? '—'}`
                : lead.price != null
                  ? `€${lead.price}`
                  : 'Budget TBD'

            return (
              <li key={lead.id} className="amazon-section-card overflow-hidden p-0">
                <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                  <div className="flex gap-1 bg-[#f7fafa] p-2 md:flex-col">
                    {photos.length ? (
                      photos.map((ph) => (
                        <img key={ph.id} src={ph.url} alt="" className="h-20 w-full rounded-sm object-cover md:h-24" />
                      ))
                    ) : (
                      <div className="flex h-24 items-center justify-center text-xs text-[var(--ink-500)]">No photos</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#c45500]">
                          {lead.category?.name || 'Project'} · {lead.urgency || 'normal'}
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-[var(--ink-900)]">{lead.title}</h2>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-600)]">
                          <MapPin className="h-3.5 w-3.5" />
                          {lead.city_name || lead.location}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[var(--ink-900)]">{budget}</p>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-700)]">{lead.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === lead.id || app?.status === 'applied'}
                        className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-60"
                        onClick={async () => {
                          setBusyId(lead.id)
                          const res = await applyToProject(lead.id, user.id)
                          setBusyId(null)
                          if ('id' in res) {
                            setApps(await fetchMyApplications(user.id))
                            navigateTo(`/leads/${res.id}/quote`)
                          }
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {app?.status === 'applied' ? 'Applied' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                        onClick={async () => {
                          await setApplicationSaved(lead.id, user.id, !app?.saved)
                          setApps(await fetchMyApplications(user.id))
                        }}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {app?.saved ? 'Saved' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                        onClick={async () => {
                          await hideApplication(lead.id, user.id)
                          setApps(await fetchMyApplications(user.id))
                        }}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Hide
                      </button>
                      {app?.id ? (
                        <button
                          type="button"
                          className="amazon-link text-xs font-semibold"
                          onClick={() => navigateTo(`/leads/${app.id}/quote`)}
                        >
                          Quote →
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
    </div>
  )
}
