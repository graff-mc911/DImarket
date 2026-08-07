import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { navigateTo } from '../lib/navigation'
import type { Listing } from '../lib/types'
import {
  fetchPendingReviewProjects,
  type PendingReviewProject,
} from '../lib/reviews/reviews'

export function MyProjects() {
  const { user, t } = useApp()
  const [projects, setProjects] = useState<Listing[]>([])
  const [pendingReviews, setPendingReviews] = useState<PendingReviewProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    void Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('author_id', user.id)
        .eq('listing_type', 'service_request')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false }),
      fetchPendingReviewProjects(user.id),
    ]).then(([listRes, pending]) => {
      if (cancelled) return
      setProjects((listRes.data as Listing[]) ?? [])
      setPendingReviews(pending)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) {
    return (
      <div className="py-16 text-center">
        <button type="button" className="btn-primary" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  const pendingIds = new Set(pendingReviews.map((p) => p.listingId))

  return (
    <div className="mx-auto max-w-3xl py-6 pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">My projects</h1>
        <button type="button" className="btn-primary text-sm" onClick={() => navigateTo('/create-project')}>
          New project
        </button>
      </div>

      {pendingReviews.length > 0 ? (
        <div className="amazon-section-card mb-4 border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13px] font-semibold text-amber-900">
            {t('pipeline.pendingReviews' as never) || 'Leave a review'}
          </p>
          <ul className="mt-2 space-y-2">
            {pendingReviews.map((p) => (
              <li key={p.listingId} className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[var(--ink-900)]">{p.title}</p>
                  <p className="text-[12px] text-[var(--ink-500)]">
                    {p.professionalName || 'Professional'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => navigateTo(`/project/${p.listingId}/manage`)}
                >
                  {t('pipeline.leaveReview' as never) || 'Leave a review'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="amazon-section-card p-10 text-center">
          <p className="text-sm text-[var(--ink-600)]">You have no projects yet.</p>
          <button type="button" className="btn-primary mt-4 text-sm" onClick={() => navigateTo('/create-project')}>
            Create your first project
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="amazon-section-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-bold text-[var(--ink-900)]">{p.title}</h2>
                <p className="text-xs text-[var(--ink-500)]">
                  {p.status} · {p.city_name || p.location}
                  {p.pipeline_stage ? ` · ${String(p.pipeline_stage).replace(/_/g, ' ')}` : ''}
                  {p.wizard_completed ? ' · wizard' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {pendingIds.has(p.id) ? (
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => navigateTo(`/project/${p.id}/manage`)}
                  >
                    {t('pipeline.leaveReview' as never) || 'Review'}
                  </button>
                ) : null}
                {p.hired_professional_id ||
                p.pipeline_stage === 'in_progress' ||
                p.pipeline_stage === 'completed' ? (
                  <button
                    type="button"
                    className={pendingIds.has(p.id) ? 'btn-secondary text-xs' : 'btn-primary text-xs'}
                    onClick={() => navigateTo(`/project/${p.id}/manage`)}
                  >
                    Manage
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => navigateTo(`/project/${p.id}/matches`)}
                >
                  Matches
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => navigateTo(`/project/${p.id}/offers`)}
                >
                  Offers
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => navigateTo(`/listing/${p.id}`)}
                >
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
