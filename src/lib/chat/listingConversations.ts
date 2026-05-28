import { supabase } from '../supabase'
import type { ChatConversation } from './types'

/** Conversations for one listing visible only to the current participant (RLS). */
export async function fetchListingConversations(
  userId: string,
  listingId: string,
): Promise<ChatConversation[]> {
  const { data: convRows, error } = await supabase
    .from('conversations')
    .select('id, listing_id, participant_a, participant_b, last_message_preview, last_message_at')
    .eq('listing_id', listingId)
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error || !convRows?.length) return []

  const otherIds = convRows.map((c) =>
    c.participant_a === userId ? c.participant_b : c.participant_a,
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', otherIds)

  return convRows.map((c) => {
    const otherId = c.participant_a === userId ? c.participant_b : c.participant_a
    const prof = profiles?.find((p) => p.id === otherId)
    return {
      id: c.id,
      listing_id: c.listing_id,
      listing_title: null,
      other_user_id: otherId,
      other_user_name: prof?.full_name || 'User',
      last_message: c.last_message_preview || '',
      last_message_at: c.last_message_at || c.id,
      unread_count: 0,
    }
  })
}
