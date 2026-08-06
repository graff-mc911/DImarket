/**
 * AI Project Manager — milestones on a listing after hire.
 * Seeds from cost-estimate WBS / default stages; updates via customer UI.
 */
import { supabase } from './supabase'
import { createNotification } from './notifications/notifications'

export type MilestoneStatus = 'pending' | 'in_progress' | 'blocked' | 'done' | 'skipped'

export type ProjectMilestone = {
  id: string
  listing_id: string
  label: string
  trade_id: string | null
  sort_order: number
  status: MilestoneStatus
  labor_hours: number | null
  due_at: string | null
  completed_at: string | null
  notes: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchMilestones(listingId: string): Promise<ProjectMilestone[]> {
  const { data, error } = await db
    .from('project_milestones')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
  if (error || !data) return []
  return data as ProjectMilestone[]
}

export async function seedMilestonesFromStages(
  listingId: string,
  stages: Array<{ label: string; tradeId?: string; laborHours?: number; order?: number }>,
): Promise<ProjectMilestone[]> {
  const existing = await fetchMilestones(listingId)
  if (existing.length) return existing

  const rows = (stages.length
    ? stages
    : [
        { label: 'Preparation', order: 1 },
        { label: 'Construction', order: 2 },
        { label: 'Finishing', order: 3 },
        { label: 'Inspection', order: 4 },
      ]
  ).map((s, i) => ({
    listing_id: listingId,
    label: s.label,
    trade_id: s.tradeId || null,
    sort_order: s.order ?? i + 1,
    status: i === 0 ? 'in_progress' : 'pending',
    labor_hours: s.laborHours ?? null,
  }))

  const { data, error } = await db.from('project_milestones').insert(rows).select('*')
  if (error || !data) {
    console.warn('seedMilestones:', error?.message)
    return []
  }
  return data as ProjectMilestone[]
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'done') payload.completed_at = new Date().toISOString()
  const { error } = await db.from('project_milestones').update(payload).eq('id', milestoneId)
  return !error
}

export async function selectProfessionalForProject(opts: {
  listingId: string
  customerId: string
  quoteId: string
  applicationId: string
  professionalId: string
}): Promise<{ ok: true } | { error: string }> {
  const now = new Date().toISOString()

  const { error: qErr } = await supabase
    .from('quotes')
    .update({ status: 'accepted', updated_at: now } as never)
    .eq('id', opts.quoteId)
    .eq('listing_id', opts.listingId)
  if (qErr) return { error: qErr.message }

  await supabase
    .from('quotes')
    .update({ status: 'rejected', updated_at: now } as never)
    .eq('listing_id', opts.listingId)
    .neq('id', opts.quoteId)
    .eq('status', 'sent')

  await supabase
    .from('project_applications')
    .update({ status: 'accepted', updated_at: now } as never)
    .eq('id', opts.applicationId)

  await supabase
    .from('project_applications')
    .update({ status: 'rejected', updated_at: now } as never)
    .eq('listing_id', opts.listingId)
    .neq('id', opts.applicationId)
    .in('status', ['applied', 'ready', 'needs_inspection', 'saved'])

  await db
    .from('listings')
    .update({
      hired_professional_id: opts.professionalId,
      pipeline_stage: 'in_progress',
      updated_at: now,
    })
    .eq('id', opts.listingId)
    .eq('author_id', opts.customerId)

  // Seed PM from linked cost estimate WBS when available
  let stages: Array<{ label: string; tradeId?: string; laborHours?: number; order?: number }> = []
  try {
    const { data: est } = await db
      .from('cost_estimates')
      .select('estimate_json')
      .eq('listing_id', opts.listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const wbs = (est?.estimate_json as { workStages?: Array<{ label: string; tradeId?: string; laborHours?: number; order?: number }> } | null)
      ?.workStages
    if (wbs?.length) stages = wbs
  } catch {
    /* ignore */
  }
  await seedMilestonesFromStages(opts.listingId, stages)

  await createNotification({
    userId: opts.professionalId,
    type: 'lead',
    title: 'You were selected for a project',
    body: 'The client chose your offer. Open the project to start work.',
    linkPath: `/project/${opts.listingId}/manage`,
    referenceType: 'listing',
    referenceId: opts.listingId,
  })

  return { ok: true }
}

export function projectProgress(milestones: ProjectMilestone[]): number {
  if (!milestones.length) return 0
  const done = milestones.filter((m) => m.status === 'done' || m.status === 'skipped').length
  return Math.round((done / milestones.length) * 100)
}
