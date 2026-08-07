/**
 * AI Project Manager — calendar, reminders, progress, media, docs, completion.
 * Extends listings + project_milestones SSoT (no parallel PM product).
 */
import { supabase } from './supabase'
import { createNotification } from './notifications/notifications'
import { recomputeProPerformance } from './proPerformance'

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
  reminder_sent_at?: string | null
}

export type ProjectMediaPhase = 'before' | 'during' | 'after'

export type ProjectMediaItem = {
  id: string
  listing_id: string
  phase: ProjectMediaPhase
  url: string
  caption: string | null
  created_at: string
}

export type ProjectDocument = {
  id: string
  listing_id: string
  doc_type: 'act' | 'invoice' | 'warranty' | 'payment_note'
  title: string
  body_html: string | null
  status: string
  amount: number | null
  currency: string | null
  created_at: string
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
  opts?: { force?: boolean },
): Promise<ProjectMilestone[]> {
  const existing = await fetchMilestones(listingId)
  if (existing.length && !opts?.force) return existing

  if (existing.length && opts?.force) {
    const { error: delErr } = await db
      .from('project_milestones')
      .delete()
      .eq('listing_id', listingId)
    if (delErr) {
      console.warn('seedMilestones delete:', delErr.message)
      return existing
    }
  }

  const start = new Date()
  const rows = (stages.length
    ? stages
    : [
        { label: 'Preparation', order: 1, laborHours: 8 },
        { label: 'Construction', order: 2, laborHours: 24 },
        { label: 'Finishing', order: 3, laborHours: 16 },
        { label: 'Inspection', order: 4, laborHours: 4 },
      ]
  ).map((s, i) => {
    const due = new Date(start)
    due.setDate(due.getDate() + (i + 1) * 3)
    return {
      listing_id: listingId,
      label: s.label,
      trade_id: s.tradeId || null,
      sort_order: s.order ?? i + 1,
      status: i === 0 ? 'in_progress' : 'pending',
      labor_hours: s.laborHours ?? null,
      due_at: due.toISOString(),
    }
  })

  const { data, error } = await db.from('project_milestones').insert(rows).select('*')
  if (error || !data) {
    console.warn('seedMilestones:', error?.message)
    return []
  }
  return data as ProjectMilestone[]
}

async function listingParties(listingId: string): Promise<{
  authorId: string | null
  hiredId: string | null
  title: string
}> {
  const { data } = await supabase
    .from('listings')
    .select('author_id, hired_professional_id, title')
    .eq('id', listingId)
    .maybeSingle()
  const row = data as {
    author_id?: string
    hired_professional_id?: string | null
    title?: string
  } | null
  return {
    authorId: row?.author_id ?? null,
    hiredId: row?.hired_professional_id ?? null,
    title: row?.title || 'Project',
  }
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
  opts?: { notify?: boolean },
): Promise<boolean> {
  const { data: before } = await db
    .from('project_milestones')
    .select('*')
    .eq('id', milestoneId)
    .maybeSingle()
  if (!before) return false

  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'done') payload.completed_at = new Date().toISOString()

  const { error } = await db.from('project_milestones').update(payload).eq('id', milestoneId)
  if (error) return false

  if (opts?.notify !== false) {
    const parties = await listingParties(String(before.listing_id))
    const label = String(before.label)
    const msg =
      status === 'done'
        ? `Stage completed: ${label}`
        : status === 'in_progress'
          ? `Stage in progress: ${label}`
          : status === 'blocked'
            ? `Stage blocked: ${label}`
            : `Stage updated: ${label} → ${status}`

    for (const uid of [parties.authorId, parties.hiredId]) {
      if (!uid) continue
      await createNotification({
        userId: uid,
        type: 'project',
        title: parties.title,
        body: msg,
        linkPath: `/project/${before.listing_id}/manage`,
        referenceType: 'listing',
        referenceId: String(before.listing_id),
      })
    }

    // Remind pro about next pending stage when one is done — auto-start it
    if (status === 'done') {
      const all = await fetchMilestones(String(before.listing_id))
      const next = all.find((m) => m.status === 'pending')
      if (next) {
        await db
          .from('project_milestones')
          .update({
            status: 'in_progress',
            reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', next.id)
        if (parties.hiredId) {
          await createNotification({
            userId: parties.hiredId,
            type: 'project',
            title: 'Next stage started',
            body: `Please continue: ${next.label}${next.due_at ? ` (due ${new Date(next.due_at).toLocaleDateString()})` : ''}`,
            linkPath: `/project/${before.listing_id}/manage`,
            referenceType: 'listing',
            referenceId: String(before.listing_id),
          })
        }
        if (parties.authorId) {
          await createNotification({
            userId: parties.authorId,
            type: 'project',
            title: parties.title,
            body: `Next stage: ${next.label}`,
            linkPath: `/project/${before.listing_id}/manage`,
            referenceType: 'listing',
            referenceId: String(before.listing_id),
          })
        }
      }
    }
  }

  return true
}

export async function selectProfessionalForProject(opts: {
  listingId: string
  customerId: string
  quoteId: string
  applicationId: string
  professionalId: string
}): Promise<{ ok: true } | { error: string }> {
  const now = new Date().toISOString()

  const { data: listingRow, error: listingErr } = await supabase
    .from('listings')
    .select('author_id, hired_professional_id, title')
    .eq('id', opts.listingId)
    .maybeSingle()

  if (listingErr) return { error: listingErr.message }
  const listing = listingRow as {
    author_id?: string
    hired_professional_id?: string | null
    title?: string
  } | null
  if (!listing?.author_id) return { error: 'Project not found' }
  if (listing.author_id !== opts.customerId) {
    return { error: 'Only the project owner can hire a professional' }
  }
  if (listing.hired_professional_id) {
    return { error: 'A professional is already hired for this project' }
  }

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

  let stages: Array<{ label: string; tradeId?: string; laborHours?: number; order?: number }> = []
  try {
    const { data: est } = await db
      .from('cost_estimates')
      .select('estimate_json')
      .eq('listing_id', opts.listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const wbs = (
      est?.estimate_json as {
        workStages?: Array<{ label: string; tradeId?: string; laborHours?: number; order?: number }>
      } | null
    )?.workStages
    if (wbs?.length) stages = wbs
  } catch {
    /* ignore */
  }
  await seedMilestonesFromStages(opts.listingId, stages, { force: true })

  await createNotification({
    userId: opts.professionalId,
    type: 'lead',
    title: 'You were selected for a project',
    body: 'AI Project Manager created your work calendar. Open the project to start.',
    linkPath: `/project/${opts.listingId}/manage`,
    referenceType: 'listing',
    referenceId: opts.listingId,
  })

  await createNotification({
    userId: opts.customerId,
    type: 'project',
    title: 'Professional hired',
    body: 'Track progress, photos and documents in AI Project Manager.',
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

export async function fetchProjectMedia(listingId: string): Promise<ProjectMediaItem[]> {
  const { data, error } = await db
    .from('project_media')
    .select('id, listing_id, phase, url, caption, created_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as ProjectMediaItem[]
}

export async function uploadProjectPhasePhoto(opts: {
  listingId: string
  userId: string
  phase: ProjectMediaPhase
  file: File
  caption?: string
}): Promise<ProjectMediaItem | null> {
  const safe = opts.file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${opts.userId}/${opts.listingId}/${opts.phase}_${Date.now()}_${safe}`
  const { error: upErr } = await supabase.storage.from('project-files').upload(path, opts.file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (upErr) {
    console.warn('phase photo upload:', upErr.message)
    return null
  }
  const { data: pub } = supabase.storage.from('project-files').getPublicUrl(path)
  const { data, error } = await db
    .from('project_media')
    .insert({
      listing_id: opts.listingId,
      uploaded_by: opts.userId,
      phase: opts.phase,
      url: pub.publicUrl,
      storage_path: path,
      caption: opts.caption || null,
    })
    .select('id, listing_id, phase, url, caption, created_at')
    .single()
  if (error || !data) return null

  const parties = await listingParties(opts.listingId)
  for (const uid of [parties.authorId, parties.hiredId]) {
    if (!uid || uid === opts.userId) continue
    await createNotification({
      userId: uid,
      type: 'project',
      title: parties.title,
      body: `New ${opts.phase} photo uploaded`,
      linkPath: `/project/${opts.listingId}/manage`,
      referenceType: 'listing',
      referenceId: opts.listingId,
    })
  }
  return data as ProjectMediaItem
}

export async function fetchProjectDocuments(listingId: string): Promise<ProjectDocument[]> {
  const { data, error } = await db
    .from('project_documents')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as ProjectDocument[]
}

export async function issueProjectDocuments(opts: {
  listingId: string
  userId: string
  amount?: number | null
}): Promise<ProjectDocument[]> {
  const parties = await listingParties(opts.listingId)
  const amount = opts.amount ?? null
  const date = new Date().toLocaleDateString()
  const docs = [
    {
      doc_type: 'act' as const,
      title: `Acceptance act — ${parties.title}`,
      body_html: `<h1>Acceptance Act</h1><p>Project: <strong>${parties.title}</strong></p><p>Date: ${date}</p><p>The parties confirm the works listed in the project milestones have been performed according to the agreed Scope of Work.</p><p>Client signature: __________</p><p>Contractor signature: __________</p>`,
      amount: null,
    },
    {
      doc_type: 'invoice' as const,
      title: `Invoice — ${parties.title}`,
      body_html: `<h1>Invoice</h1><p>Project: <strong>${parties.title}</strong></p><p>Date: ${date}</p><p>Amount due: <strong>${amount != null ? `${amount} EUR` : 'As per accepted quote'}</strong></p><p>Payment terms: upon acceptance of works.</p>`,
      amount,
    },
    {
      doc_type: 'warranty' as const,
      title: `Warranty — ${parties.title}`,
      body_html: `<h1>Warranty Certificate</h1><p>Project: <strong>${parties.title}</strong></p><p>Issued: ${date}</p><p>The contractor warrants workmanship for 12 months from acceptance, excluding misuse and third-party damage.</p>`,
      amount: null,
    },
    {
      doc_type: 'payment_note' as const,
      title: `Payment checklist — ${parties.title}`,
      body_html: `<h1>Payment checklist</h1><ol><li>Deposit (if agreed)</li><li>Progress payment after construction stage</li><li>Final payment after inspection & acceptance act</li></ol><p>Track status in AI Project Manager.</p>`,
      amount,
    },
  ]

  const inserted: ProjectDocument[] = []
  for (const d of docs) {
    const { data, error } = await db
      .from('project_documents')
      .insert({
        listing_id: opts.listingId,
        doc_type: d.doc_type,
        title: d.title,
        body_html: d.body_html,
        status: 'issued',
        amount: d.amount,
        currency: 'EUR',
        created_by: opts.userId,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    if (!error && data) inserted.push(data as ProjectDocument)
  }

  if (parties.hiredId) {
    await createNotification({
      userId: parties.hiredId,
      type: 'project',
      title: 'Documents issued',
      body: 'Act, invoice, warranty and payment checklist are ready.',
      linkPath: `/project/${opts.listingId}/manage`,
      referenceType: 'listing',
      referenceId: opts.listingId,
    })
  }
  return inserted
}

export function openDocumentPrint(doc: ProjectDocument) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(
    `<!doctype html><html><head><title>${doc.title}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#1d1d1f} h1{font-size:22px}</style></head><body>${doc.body_html || ''}<script>window.print()</script></body></html>`,
  )
  w.document.close()
}

/** Mark project completed → docs prompt + review prompt + learning recompute. */
export async function completeProject(opts: {
  listingId: string
  customerId: string
}): Promise<{ ok: true } | { error: string }> {
  const parties = await listingParties(opts.listingId)
  if (parties.authorId !== opts.customerId) return { error: 'not_owner' }

  const now = new Date().toISOString()
  await db
    .from('listings')
    .update({
      pipeline_stage: 'completed',
      pipeline_completed_at: now,
      review_prompted_at: now,
      updated_at: now,
    })
    .eq('id', opts.listingId)
    .eq('author_id', opts.customerId)

  const ms = await fetchMilestones(opts.listingId)
  for (const m of ms) {
    if (m.status !== 'done' && m.status !== 'skipped') {
      await updateMilestoneStatus(m.id, 'done', { notify: false })
    }
  }

  await issueProjectDocuments({
    listingId: opts.listingId,
    userId: opts.customerId,
  })

  if (parties.hiredId) {
    await createNotification({
      userId: parties.hiredId,
      type: 'project',
      title: 'Project completed',
      body: 'Client marked the project complete. Documents were issued.',
      linkPath: `/project/${opts.listingId}/manage`,
      referenceType: 'listing',
      referenceId: opts.listingId,
    })
    void recomputeProPerformance(parties.hiredId)
  }

  await createNotification({
    userId: opts.customerId,
    type: 'project',
    title: 'Leave a review',
    body: 'How was the work? Your feedback trains better matching for everyone.',
    linkPath: parties.hiredId
      ? `/professional/${parties.hiredId}?listing=${opts.listingId}&review=1`
      : `/project/${opts.listingId}/manage`,
    referenceType: 'listing',
    referenceId: opts.listingId,
  })

  return { ok: true }
}

/** Calendar view model from milestones. */
export function milestonesAsCalendar(milestones: ProjectMilestone[]) {
  return milestones
    .filter((m) => m.due_at)
    .map((m) => ({
      id: m.id,
      title: m.label,
      dueAt: m.due_at!,
      status: m.status,
      laborHours: m.labor_hours,
    }))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}
