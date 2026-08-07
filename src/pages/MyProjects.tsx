import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { navigateTo } from '../lib/navigation'
import type { Listing } from '../lib/types'

export function MyProjects() {
  const { user } = useApp()
  const [projects, setProjects] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    void supabase
      .from('listings')
      .select('*')
      .eq('author_id', user.id)
      .eq('listing_type', 'service_request')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setProjects((data as Listing[]) ?? [])
          setLoading(false)
        }
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

  return (
    <div className="mx-auto max-w-3xl py-6 pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">My projects</h1>
        <button type="button" className="btn-primary text-sm" onClick={() => navigateTo('/create-project')}>
          New project
        </button>
      </div>

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
                {p.hired_professional_id ||
                p.pipeline_stage === 'in_progress' ||
                p.pipeline_stage === 'completed' ? (
                  <button
                    type="button"
                    className="btn-primary text-xs"
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
