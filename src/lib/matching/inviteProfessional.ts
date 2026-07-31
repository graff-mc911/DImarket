import { supabase } from '../supabase'
import { ensureConversation } from '../chat/conversations'
import { sendChatMessage } from '../chat/messages'
import { navigateTo } from '../navigation'

/**
 * Invite a matched professional to a project via chat.
 */
export async function inviteProfessionalToProject(input: {
  professionalId: string
  listingId: string
  projectTitle?: string | null
}): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    navigateTo('/login')
    return { ok: false, error: 'auth_required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const conversationId = await ensureConversation(input.professionalId, input.listingId)
  if (!conversationId) {
    return { ok: false, error: 'conversation_failed' }
  }

  const title = input.projectTitle?.trim() || 'my project'
  const content = `Hi! You’ve been invited via AI Match to quote on “${title}”. Looking forward to your proposal.`

  const message = await sendChatMessage({
    conversationId,
    senderId: user.id,
    senderName: (profile as { full_name?: string | null } | null)?.full_name || 'Customer',
    recipientId: input.professionalId,
    listingId: input.listingId,
    content,
  })

  if (!message) {
    return { ok: false, error: 'message_failed' }
  }

  try {
    sessionStorage.setItem('open_conversation', conversationId)
    sessionStorage.setItem('conversation_with', input.professionalId)
  } catch {
    /* ignore */
  }

  navigateTo('/messages')
  return { ok: true, conversationId }
}

export async function toggleSavedProfessional(
  professionalId: string,
): Promise<{ saved: boolean } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    navigateTo('/login')
    return { error: 'auth_required' }
  }

  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_type', 'profile')
    .eq('item_id', professionalId)
    .maybeSingle()

  const row = existing as { id?: string } | null
  if (row?.id) {
    await supabase.from('saved_items').delete().eq('id', row.id)
    return { saved: false }
  }

  const { error } = await supabase.from('saved_items').insert({
    user_id: user.id,
    item_type: 'profile',
    item_id: professionalId,
  } as never)
  if (error) return { error: error.message }
  return { saved: true }
}

export async function fetchSavedProfessionalIds(
  professionalIds: string[],
): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !professionalIds.length) return new Set()

  const { data } = await supabase
    .from('saved_items')
    .select('item_id')
    .eq('user_id', user.id)
    .eq('item_type', 'profile')
    .in('item_id', professionalIds)

  return new Set(
    ((data as { item_id: string }[] | null) ?? []).map((r) => r.item_id),
  )
}
