import { supabase } from '../supabase'
import type { ChatConversation } from './types'

/** Resolve or create a UUID conversation for messaging. */
export async function ensureConversation(
  otherUserId: string,
  listingId?: string | null,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_conversation', {
    p_other_user_id: otherUserId,
    p_listing_id: listingId ?? null,
  })
  if (error) {
    console.error('ensure_conversation:', error)
    return null
  }
  return typeof data === 'string' ? data : null
}

export async function fetchConversationsForUser(userId: string): Promise<ChatConversation[]> {
  const { data: convRows, error: convError } = await supabase
    .from('conversations')
    .select('id, listing_id, participant_a, participant_b, last_message_preview, last_message_at, typing_user_id')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (!convError && convRows?.length) {
    const listingIds = convRows.map((c) => c.listing_id).filter(Boolean) as string[]
    const otherIds = convRows.map((c) =>
      c.participant_a === userId ? c.participant_b : c.participant_a,
    )

    const [{ data: listings }, { data: profiles }] = await Promise.all([
      listingIds.length
        ? supabase.from('listings').select('id, title').in('id', listingIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      supabase.from('profiles').select('id, full_name').in('id', otherIds),
    ])

    const unreadByConv = await countUnreadByConversation(userId)

    return convRows.map((c) => {
      const otherId = c.participant_a === userId ? c.participant_b : c.participant_a
      const listing = listings?.find((l) => l.id === c.listing_id)
      const prof = profiles?.find((p) => p.id === otherId)
      return {
        id: c.id,
        listing_id: c.listing_id,
        listing_title: listing?.title ?? null,
        other_user_id: otherId,
        other_user_name: prof?.full_name || 'User',
        last_message: c.last_message_preview || '',
        last_message_at: c.last_message_at || c.id,
        unread_count: unreadByConv.get(c.id) ?? 0,
        typing_user_id: c.typing_user_id,
      }
    })
  }

  return fetchConversationsLegacy(userId)
}

async function countUnreadByConversation(userId: string): Promise<Map<string, number>> {
  const { data } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('recipient_id', userId)
    .eq('is_read', false)

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const id = row.conversation_id as string
    map.set(id, (map.get(id) ?? 0) + 1)
  }
  return map
}

/** Fallback: derive conversations from messages (legacy string conversation_id). */
async function fetchConversationsLegacy(userId: string): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error || !data?.length) return []

  const convMap = new Map<string, ChatConversation>()
  for (const msg of data) {
    if (convMap.has(msg.conversation_id)) continue
    const isSender = msg.sender_id === userId
    const otherUserId = isSender ? msg.recipient_id : (msg.sender_id || '')
    const unreadCount = data.filter(
      (m) =>
        m.conversation_id === msg.conversation_id &&
        m.recipient_id === userId &&
        !m.is_read,
    ).length
    convMap.set(msg.conversation_id, {
      id: msg.conversation_id,
      listing_id: msg.listing_id,
      listing_title: null,
      other_user_id: otherUserId,
      other_user_name: isSender ? 'Recipient' : (msg.sender_name || 'Sender'),
      last_message: msg.content,
      last_message_at: msg.created_at,
      unread_count: unreadCount,
    })
  }

  const convList = Array.from(convMap.values())
  const listingIds = convList.map((c) => c.listing_id).filter(Boolean) as string[]
  const userIds = convList.map((c) => c.other_user_id).filter(Boolean)

  if (listingIds.length) {
    const { data: listings } = await supabase.from('listings').select('id, title').in('id', listingIds)
    for (const conv of convList) {
      const listing = listings?.find((l) => l.id === conv.listing_id)
      if (listing) conv.listing_title = listing.title
    }
  }
  if (userIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
    for (const conv of convList) {
      const p = profiles?.find((pr) => pr.id === conv.other_user_id)
      if (p?.full_name) conv.other_user_name = p.full_name
    }
  }
  return convList
}

export async function setTypingIndicator(conversationId: string, userId: string | null): Promise<void> {
  await supabase
    .from('conversations')
    .update({ typing_user_id: userId, typing_at: userId ? new Date().toISOString() : null })
    .eq('id', conversationId)
}
