export type ChatConversation = {
  id: string
  listing_id: string | null
  listing_title: string | null
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_at: string
  unread_count: number
  typing_user_id?: string | null
}

export type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_name: string | null
  recipient_id: string
  listing_id: string | null
  content: string
  is_read: boolean
  delivery_status?: string | null
  attachment_count?: number
  created_at: string
}

export type MessageAttachment = {
  id: string
  message_id: string
  storage_path: string
  public_url: string
  file_name: string | null
  mime_type: string | null
  attachment_type: string
}
