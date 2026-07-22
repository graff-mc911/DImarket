import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  fetchConversationsForUser,
  ensureConversation,
  setTypingIndicator,
} from '../lib/chat/conversations'
import {
  fetchMessages,
  markConversationRead,
  markMessagesDelivered,
  sendChatMessage,
  fetchAttachmentsForMessages,
} from '../lib/chat/messages'
import {
  uploadChatAttachment,
  attachToMessage,
  captionForAttachment,
  type ChatAttachmentType,
} from '../lib/chat/attachments'
import type { ChatConversation, ChatMessage, MessageAttachment } from '../lib/chat/types'

export function useChat(userId: string | undefined, senderName: string) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [active, setActive] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [attachments, setAttachments] = useState<Map<string, MessageAttachment[]>>(new Map())
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeIdRef.current = active?.id ?? null
  }, [active?.id])

  const mergeAttachments = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return
    const attMap = await fetchAttachmentsForMessages(messageIds)
    setAttachments((prev) => {
      const next = new Map(prev)
      for (const [k, v] of attMap) next.set(k, v)
      return next
    })
  }, [])

  const refreshConversations = useCallback(async () => {
    if (!userId) return
    setLoadingList(true)
    try {
      const list = await fetchConversationsForUser(userId)
      setConversations(list)
    } finally {
      setLoadingList(false)
    }
  }, [userId])

  const openConversation = useCallback(
    async (conv: ChatConversation) => {
      if (!userId) return
      setActive(conv)
      setLoadingThread(true)
      try {
        const rows = await fetchMessages(conv.id)
        setMessages(rows)
        await mergeAttachments(rows.map((m) => m.id))
        await markConversationRead(conv.id, userId)
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)),
        )
        setMessages((prev) =>
          prev.map((m) =>
            m.recipient_id === userId ? { ...m, is_read: true, delivery_status: 'read' } : m,
          ),
        )
      } finally {
        setLoadingThread(false)
      }
    },
    [mergeAttachments, userId],
  )

  const openWithParticipant = useCallback(
    async (otherUserId: string, listingId?: string | null) => {
      const convId = await ensureConversation(otherUserId, listingId)
      if (!convId) return null
      await refreshConversations()
      const found = conversations.find((c) => c.id === convId)
      const conv: ChatConversation = found ?? {
        id: convId,
        listing_id: listingId ?? null,
        listing_title: null,
        other_user_id: otherUserId,
        other_user_name: 'User',
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      }
      await openConversation(conv)
      return conv
    },
    [conversations, openConversation, refreshConversations],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !active || !content.trim() || sending) return false
      setSending(true)
      const text = content.trim()
      try {
        const msg = await sendChatMessage({
          conversationId: active.id,
          senderId: userId,
          senderName,
          recipientId: active.other_user_id,
          listingId: active.listing_id,
          content: text,
        })
        if (msg) {
          setMessages((prev) => [...prev, msg])
          setConversations((prev) =>
            prev.map((c) =>
              c.id === active.id
                ? { ...c, last_message: text, last_message_at: msg.created_at }
                : c,
            ),
          )
          void setTypingIndicator(active.id, null)
        }
        return !!msg
      } finally {
        setSending(false)
      }
    },
    [active, senderName, sending, userId],
  )

  const sendFile = useCallback(
    async (file: File, caption?: string, forceType?: ChatAttachmentType) => {
      if (!userId || !active || sending) return false
      setSending(true)
      try {
        const upload = await uploadChatAttachment(file, active.id, userId, forceType)
        if (!upload) return false
        const label = caption?.trim() || captionForAttachment(upload.type, file.name)
        const msg = await sendChatMessage({
          conversationId: active.id,
          senderId: userId,
          senderName,
          recipientId: active.other_user_id,
          listingId: active.listing_id,
          content: label,
        })
        if (!msg) return false
        await attachToMessage(msg.id, {
          ...upload,
          fileName: file.name,
          size: file.size,
        })
        setMessages((prev) => [...prev, { ...msg, attachment_count: 1 }])
        await mergeAttachments([msg.id])
        setConversations((prev) =>
          prev.map((c) =>
            c.id === active.id
              ? { ...c, last_message: label, last_message_at: msg.created_at }
              : c,
          ),
        )
        return true
      } finally {
        setSending(false)
      }
    },
    [active, mergeAttachments, senderName, sending, userId],
  )

  const signalTyping = useCallback(() => {
    if (!userId || !active) return
    void setTypingIndicator(active.id, userId)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      void setTypingIndicator(active.id, null)
    }, 2500)
  }, [active, userId])

  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`chat:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as ChatMessage
          if (row.sender_id !== userId && row.recipient_id !== userId) return

          setConversations((prev) => {
            const existing = prev.find((c) => c.id === row.conversation_id)
            const otherId = row.sender_id === userId ? row.recipient_id : row.sender_id!
            const updated: ChatConversation = existing
              ? {
                  ...existing,
                  last_message: row.content,
                  last_message_at: row.created_at,
                  unread_count:
                    activeIdRef.current === row.conversation_id
                      ? 0
                      : row.recipient_id === userId
                        ? existing.unread_count + 1
                        : existing.unread_count,
                }
              : {
                  id: row.conversation_id,
                  listing_id: row.listing_id,
                  listing_title: null,
                  other_user_id: otherId,
                  other_user_name: row.sender_name || 'User',
                  last_message: row.content,
                  last_message_at: row.created_at,
                  unread_count: row.recipient_id === userId ? 1 : 0,
                }
            const rest = prev.filter((c) => c.id !== row.conversation_id)
            return [updated, ...rest]
          })

          if (activeIdRef.current === row.conversation_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev
              return [...prev, row]
            })
            if ((row.attachment_count ?? 0) > 0) {
              void mergeAttachments([row.id])
            }
            if (row.recipient_id === userId) {
              void markConversationRead(row.conversation_id, userId)
            }
          } else if (row.recipient_id === userId && row.sender_id) {
            void markMessagesDelivered(row.conversation_id, userId)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as ChatMessage
          if (row.sender_id !== userId && row.recipient_id !== userId) return
          setMessages((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? {
                    ...m,
                    is_read: row.is_read,
                    delivery_status: row.delivery_status,
                  }
                : m,
            ),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_attachments' },
        (payload) => {
          const row = payload.new as MessageAttachment
          setAttachments((prev) => {
            const next = new Map(prev)
            const list = next.get(row.message_id) ?? []
            if (list.some((a) => a.id === row.id)) return prev
            next.set(row.message_id, [...list, row])
            return next
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          const row = payload.new as { id: string; typing_user_id?: string | null }
          if (activeIdRef.current === row.id) {
            setActive((a) => (a ? { ...a, typing_user_id: row.typing_user_id } : a))
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [mergeAttachments, userId])

  return {
    conversations,
    active,
    setActive,
    messages,
    attachments,
    loadingList,
    loadingThread,
    sending,
    refreshConversations,
    openConversation,
    openWithParticipant,
    sendMessage,
    sendFile,
    signalTyping,
  }
}
