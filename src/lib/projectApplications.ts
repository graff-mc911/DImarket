import { supabase } from './supabase'
import type { ProjectApplication } from './types'

export type ProResponseStatus = 'ready' | 'needs_inspection' | 'declined'

export async function applyToProject(
  listingId: string,
  professionalId: string,
  message?: string,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('project_applications')
    .upsert(
      {
        listing_id: listingId,
        professional_id: professionalId,
        status: 'applied',
        message: message?.trim() || null,
        hidden: false,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'listing_id,professional_id' },
    )
    .select('id')
    .single()

  if (error || !data) return { error: error?.message || 'apply_failed' }
  return { id: (data as { id: string }).id }
}

/** Pro triad: Ready / Need inspection / Decline (AI Dispatcher responses). */
export async function respondToProject(
  listingId: string,
  professionalId: string,
  status: ProResponseStatus,
  note?: string,
): Promise<{ id: string } | { error: string }> {
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    listing_id: listingId,
    professional_id: professionalId,
    status,
    message: note?.trim() || null,
    hidden: status === 'declined',
    updated_at: now,
  }

  let { data, error } = await supabase
    .from('project_applications')
    .upsert(payload as never, { onConflict: 'listing_id,professional_id' })
    .select('id')
    .single()

  // Fallback if new statuses not yet in DB check constraint
  if (error && /check|status|violates/i.test(error.message || '')) {
    const legacy =
      status === 'ready'
        ? 'applied'
        : status === 'needs_inspection'
          ? 'saved'
          : 'withdrawn'
    const fallback = {
      listing_id: listingId,
      professional_id: professionalId,
      status: legacy,
      message:
        note?.trim() ||
        (status === 'ready'
          ? 'Ready'
          : status === 'needs_inspection'
            ? 'Need inspection'
            : 'Declined'),
      hidden: status === 'declined',
      updated_at: now,
    }
    ;({ data, error } = await supabase
      .from('project_applications')
      .upsert(fallback as never, { onConflict: 'listing_id,professional_id' })
      .select('id')
      .single())
  }

  if (error || !data) return { error: error?.message || 'respond_failed' }
  return { id: (data as { id: string }).id }
}

export async function setApplicationSaved(
  listingId: string,
  professionalId: string,
  saved: boolean,
): Promise<void> {
  const { data: existing } = await supabase
    .from('project_applications')
    .select('status')
    .eq('listing_id', listingId)
    .eq('professional_id', professionalId)
    .maybeSingle()

  const prev = (existing as { status?: string } | null)?.status
  const keepApplied =
    prev === 'applied' ||
    prev === 'ready' ||
    prev === 'needs_inspection' ||
    prev === 'accepted' ||
    prev === 'rejected'
  const status = keepApplied ? prev! : 'saved'

  await supabase.from('project_applications').upsert(
    {
      listing_id: listingId,
      professional_id: professionalId,
      saved,
      status,
      hidden: false,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: 'listing_id,professional_id' },
  )
}

export async function hideApplication(
  listingId: string,
  professionalId: string,
): Promise<void> {
  await respondToProject(listingId, professionalId, 'declined')
}

export async function fetchMyApplications(professionalId: string): Promise<ProjectApplication[]> {
  const { data, error } = await supabase
    .from('project_applications')
    .select('*')
    .eq('professional_id', professionalId)

  if (error) {
    console.error('fetchMyApplications:', error)
    return []
  }
  return (data ?? []) as ProjectApplication[]
}
