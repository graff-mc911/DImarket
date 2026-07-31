export type ProjectLifecycle =
  | 'draft'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export const PROJECT_LIFECYCLE_LABELS: Record<ProjectLifecycle, string> = {
  draft: 'Draft',
  published: 'Published',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** Map listing row fields → customer-facing project lifecycle. */
export function mapListingLifecycle(row: {
  status?: string | null
  wizard_completed?: boolean | null
  lifecycle_status?: string | null
}): ProjectLifecycle {
  const explicit = row.lifecycle_status
  if (
    explicit === 'draft' ||
    explicit === 'published' ||
    explicit === 'in_progress' ||
    explicit === 'completed' ||
    explicit === 'cancelled'
  ) {
    return explicit
  }

  const status = (row.status || '').toLowerCase()
  if (status === 'draft' || row.wizard_completed === false) return 'draft'
  if (status === 'completed' || status === 'sold') return 'completed'
  if (status === 'deleted' || status === 'expired' || status === 'closed') return 'cancelled'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'active') return 'published'
  return 'published'
}

export function lifecycleProgress(status: ProjectLifecycle): number {
  switch (status) {
    case 'draft':
      return 15
    case 'published':
      return 40
    case 'in_progress':
      return 70
    case 'completed':
      return 100
    case 'cancelled':
      return 0
    default:
      return 20
  }
}

export function lifecycleTone(status: ProjectLifecycle): string {
  switch (status) {
    case 'draft':
      return 'bg-[#f5f5f7] text-[#6e6e73]'
    case 'published':
      return 'bg-blue-50 text-blue-700'
    case 'in_progress':
      return 'bg-amber-50 text-amber-800'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-[#f5f5f7] text-[#6e6e73]'
  }
}

export type LeadLifecycle = 'new' | 'accepted' | 'rejected' | 'expired'

export function mapLeadLifecycle(row: {
  status?: string | null
  hidden?: boolean | null
  listingStatus?: string | null
  createdAt?: string | null
}): LeadLifecycle {
  const st = (row.status || '').toLowerCase()
  if (st === 'accepted') return 'accepted'
  if (st === 'rejected') return 'rejected'
  if (row.listingStatus === 'expired' || row.listingStatus === 'deleted') return 'expired'
  if (row.createdAt) {
    const age = Date.now() - new Date(row.createdAt).getTime()
    if (age > 1000 * 60 * 60 * 24 * 21) return 'expired'
  }
  return 'new'
}
