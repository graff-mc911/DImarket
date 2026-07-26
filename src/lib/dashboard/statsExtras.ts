import type { Listing, ProjectApplication, Quote } from '../types'
import { mapLeadLifecycle, mapListingLifecycle, type LeadLifecycle, type ProjectLifecycle } from './projectStatus'

export type StatusCounts<T extends string> = Record<T, number>

export function countProjectStatuses(projects: Listing[]): StatusCounts<ProjectLifecycle> {
  const counts: StatusCounts<ProjectLifecycle> = {
    draft: 0,
    published: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  }
  for (const p of projects) {
    counts[mapListingLifecycle(p)] += 1
  }
  return counts
}

export function countLeadStatuses(
  apps: Array<ProjectApplication & { listing?: { status?: string | null } | null }>,
): StatusCounts<LeadLifecycle> {
  const counts: StatusCounts<LeadLifecycle> = {
    new: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
  }
  for (const a of apps) {
    counts[
      mapLeadLifecycle({
        status: a.status,
        hidden: a.hidden,
        listingStatus: a.listing?.status,
        createdAt: a.created_at,
      })
    ] += 1
  }
  return counts
}

/** Average hours from application create → first quote update (approx response time). */
export function averageResponseHours(
  apps: ProjectApplication[],
  quotes: Quote[],
): number | null {
  const byApp = new Map<string, Quote>()
  for (const q of quotes) {
    if (!q.application_id) continue
    const prev = byApp.get(q.application_id)
    if (!prev || new Date(q.created_at).getTime() < new Date(prev.created_at).getTime()) {
      byApp.set(q.application_id, q)
    }
  }
  const hours: number[] = []
  for (const a of apps) {
    const q = byApp.get(a.id)
    if (!q) continue
    const h = (new Date(q.created_at).getTime() - new Date(a.created_at).getTime()) / 3600000
    if (h >= 0 && h < 24 * 60) hours.push(h)
  }
  if (!hours.length) return null
  return Math.round((hours.reduce((s, n) => s + n, 0) / hours.length) * 10) / 10
}

export function completionRate(projects: Listing[]): number {
  if (!projects.length) return 0
  const completed = projects.filter((p) => mapListingLifecycle(p) === 'completed').length
  return Math.round((completed / projects.length) * 100)
}
