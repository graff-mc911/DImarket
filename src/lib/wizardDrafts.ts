import { supabase } from './supabase'
import {
  hydrateWizardState,
  serializeWizardState,
  type ProjectWizardState,
} from './projectWizard'

const LOCAL_KEY = 'dimarket_project_wizard_draft_v2'

export function saveWizardDraftLocal(state: ProjectWizardState): void {
  try {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({
        ...serializeWizardState(state),
        savedAt: Date.now(),
      }),
    )
  } catch {
    /* ignore quota */
  }
}

export function loadWizardDraftLocal(): ProjectWizardState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return hydrateWizardState(parsed)
  } catch {
    return null
  }
}

export function clearWizardDraftLocal(): void {
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    /* ignore */
  }
}

export async function upsertWizardDraftRemote(
  userId: string,
  state: ProjectWizardState,
): Promise<{ draftId: string } | { error: string }> {
  const payload = {
    user_id: userId,
    listing_id: state.listingId,
    state: serializeWizardState(state),
    step: state.step,
    status: 'draft' as const,
  }

  if (state.draftId) {
    const { data, error } = await supabase
      .from('project_wizard_drafts')
      .update(payload as never)
      .eq('id', state.draftId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()
    if (error) {
      if (/relation|schema cache|does not exist/i.test(error.message)) {
        return { error: 'unavailable' }
      }
      return { error: error.message }
    }
    return { draftId: (data as { id: string } | null)?.id || state.draftId }
  }

  const { data, error } = await supabase
    .from('project_wizard_drafts')
    .insert(payload as never)
    .select('id')
    .single()

  if (error) {
    if (/relation|schema cache|does not exist/i.test(error.message)) {
      return { error: 'unavailable' }
    }
    return { error: error.message }
  }
  return { draftId: (data as { id: string }).id }
}

export async function loadLatestWizardDraftRemote(
  userId: string,
): Promise<ProjectWizardState | null> {
  const { data, error } = await supabase
    .from('project_wizard_drafts')
    .select('id, state, step, listing_id')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const row = data as {
    id: string
    state: Record<string, unknown>
    step: number
    listing_id: string | null
  }
  return hydrateWizardState({
    ...row.state,
    draftId: row.id,
    listingId: row.listing_id,
    step: row.step || Number(row.state.step) || 1,
  })
}

export async function markWizardDraftPublished(
  userId: string,
  draftId: string | null,
  listingId: string,
): Promise<void> {
  if (!draftId) return
  await supabase
    .from('project_wizard_drafts')
    .update({
      status: 'published',
      listing_id: listingId,
    } as never)
    .eq('id', draftId)
    .eq('user_id', userId)
}

export function recentTradeIds(limit = 4): string[] {
  try {
    const raw = localStorage.getItem('dimarket_recent_trades')
    if (!raw) return []
    const list = JSON.parse(raw) as string[]
    return Array.isArray(list) ? list.slice(0, limit) : []
  } catch {
    return []
  }
}

export function pushRecentTrade(tradeId: string): void {
  try {
    const prev = recentTradeIds(12).filter((id) => id !== tradeId)
    localStorage.setItem('dimarket_recent_trades', JSON.stringify([tradeId, ...prev].slice(0, 8)))
  } catch {
    /* ignore */
  }
}
