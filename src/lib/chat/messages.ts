import { supabase } from '../supabase'
import type { ChatMessage, MessageAttachment } from './types'

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ChatMessage[]
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ is_read: true, delivery_status: 'read' })
    .eq('conversation_id', conversationId)
    .eq('recipient_id', userId)
    .eq('is_read', false)
}

export async function sendChatMessage(input: {
  conversationId: string
  senderId: string
  senderName: string
  recipientId: string
  listingId: string | null
  content: string
}): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_name: input.senderName,
      recipient_id: input.recipientId,
      listing_id: input.listingId,
      content: input.content,
      is_read: false,
      delivery_status: 'sent',
    })
    .select()
    .single()

  if (error) {
    console.error('sendChatMessage:', error)
    return null
  }
  return data as ChatMessage
}

export async function fetchAttachmentsForMessages(
  messageIds: string[],
): Promise<Map<string, MessageAttachment[]>> {
  if (!messageIds.length) return new Map()
  const { data, error } = await supabase
    .from('message_attachments')
    .select('*')
    .in('message_id', messageIds)

  if (error) {
    if (error.code === '42P01') return new Map()
    console.error('fetchAttachmentsForMessages:', error)
    return new Map()
  }

  const map = new Map<string, MessageAttachment[]>()
  for (const row of data ?? []) {
    const att = row as MessageAttachment
    const list = map.get(att.message_id) ?? []
    list.push(att)
    map.set(att.message_id, list)
  }
  return map
}
