import { supabase } from './supabase'
import type { ProjectApplication } from './types'

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
    prev === 'applied' || prev === 'accepted' || prev === 'rejected'
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
  await supabase.from('project_applications').upsert(
    {
      listing_id: listingId,
      professional_id: professionalId,
      hidden: true,
      status: 'withdrawn',
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: 'listing_id,professional_id' },
  )
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
