import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Send } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { ensureConversation, setTypingIndicator } from '../../lib/chat/conversations'
import { fetchListingConversations } from '../../lib/chat/listingConversations'
import {
  fetchAttachmentsForMessages,
  fetchMessages,
  markConversationRead,
  sendChatMessage,
} from '../../lib/chat/messages'
import {
  attachToMessage,
  captionForAttachment,
  CHAT_MEDIA_ACCEPT,
  uploadChatAttachment,
} from '../../lib/chat/attachments'
import type { ChatConversation, ChatMessage, MessageAttachment } from '../../lib/chat/types'
import { supabase } from '../../lib/supabase'

type Props = {
  listingId: string
  authorId: string
}

export function ListingInlineChat({ listingId, authorId }: Props) {
  const { user, profile, t } = useApp()
  const [threads, setThreads] = useState<ChatConversation[]>([])
  const [active, setActive] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [attachments, setAttachments] = useState<Map<string, MessageAttachment[]>>(new Map())
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwner = user?.id === authorId
  const otherPartyId = isOwner ? active?.other_user_id : authorId
  const canUseChat = Boolean(user && authorId && (isOwner || user.id !== authorId))

  const loadThreads = useCallback(async () => {
    if (!user || !canUseChat) {
      setThreads([])
      setActive(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (isOwner) {
        const list = await fetchListingConversations(user.id, listingId)
        setThreads(list)
        setActive((prev) => {
          if (prev && list.some((c) => c.id === prev.id)) return prev
          return list[0] ?? null
        })
      } else {
        const list = await fetchListingConversations(user.id, listingId)
        const mine = list[0] ?? null
        setThreads(mine ? [mine] : [])
        setActive(mine)
      }
    } finally {
      setLoading(false)
    }
  }, [user, canUseChat, isOwner, listingId])

  const loadMessages = useCallback(async (convId: string) => {
    const rows = await fetchMessages(convId)
    setMessages(rows)
    const attMap = await fetchAttachmentsForMessages(rows.map((m) => m.id))
    setAttachments(attMap)
    if (user) await markConversationRead(convId, user.id)
  }, [user])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (!active?.id) {
      setMessages([])
      return
    }
    void loadMessages(active.id)
  }, [active?.id, loadMessages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!active?.id || !user) return

    const channel = supabase
      .channel(`listing-chat-${active.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${active.id}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row]
          })
          if ((row.attachment_count ?? 0) > 0) {
            void fetchAttachmentsForMessages([row.id]).then((map) => {
              setAttachments((prev) => {
                const next = new Map(prev)
                for (const [k, v] of map) next.set(k, v)
                return next
              })
            })
          }
          if (row.recipient_id === user.id) {
            void markConversationRead(active.id, user.id)
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${active.id}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage
          setMessages((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? { ...m, is_read: row.is_read, delivery_status: row.delivery_status }
                : m,
            ),
          )
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${active.id}`,
        },
        (payload) => {
          const row = payload.new as { typing_user_id?: string | null }
          setTyping(Boolean(row.typing_user_id && row.typing_user_id !== user.id))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [active?.id, user])

  const signalTyping = () => {
    if (!active?.id || !user) return
    void setTypingIndicator(active.id, user.id)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      void setTypingIndicator(active.id, null)
    }, 2500)
  }

  const ensureActiveConversation = async () => {
    if (!user || !otherPartyId) return null
    let convId: string | null | undefined = active?.id
    if (!convId) {
      convId = await ensureConversation(otherPartyId, listingId ?? null)
      if (!convId) return null
      await loadThreads()
      const refreshed = await fetchListingConversations(user.id, listingId)
      const found = refreshed.find((c) => c.id === convId) ?? {
        id: convId,
        listing_id: listingId ?? null,
        listing_title: null,
        other_user_id: otherPartyId,
        other_user_name: isOwner ? 'User' : t('listing.chatOwner'),
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      }
      setActive(found)
      if (isOwner) setThreads(refreshed)
    }
    return convId
  }

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || !user || !otherPartyId || sending) return

    setSending(true)
    try {
      const convId = await ensureActiveConversation()
      if (!convId) return

      const msg = await sendChatMessage({
        conversationId: convId,
        senderId: user.id,
        senderName: profile?.full_name || 'User',
        recipientId: otherPartyId,
        listingId,
        content: text,
      })
      if (msg) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        setDraft('')
        void setTypingIndicator(convId, null)
      }
    } finally {
      setSending(false)
    }
  }

  const handleFile = async (file?: File) => {
    if (!file || !user || !otherPartyId || sending) return
    setSending(true)
    try {
      const convId = await ensureActiveConversation()
      if (!convId) return
      const upload = await uploadChatAttachment(file, convId, user.id)
      if (!upload) return
      const label = captionForAttachment(upload.type, file.name)
      const msg = await sendChatMessage({
        conversationId: convId,
        senderId: user.id,
        senderName: profile?.full_name || 'User',
        recipientId: otherPartyId,
        listingId,
        content: label,
      })
      if (!msg) return
      await attachToMessage(msg.id, { ...upload, fileName: file.name, size: file.size })
      setMessages((prev) => [...prev, { ...msg, attachment_count: 1 }])
      const map = await fetchAttachmentsForMessages([msg.id])
      setAttachments((prev) => {
        const next = new Map(prev)
        for (const [k, v] of map) next.set(k, v)
        return next
      })
    } finally {
      setSending(false)
    }
  }

  if (!authorId) return null

  return (
    <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--glass-border)' }}>
      <h2 className="mb-3 text-base font-extrabold" style={{ color: 'var(--ink-900)' }}>
        {t('listing.chatTitle')}
      </h2>
      <p className="muted-text mb-3 text-xs">{t('listing.chatPrivateHint')}</p>

      {!user ? (
        <button
          type="button"
          onClick={() => navigateTo('/login')}
          className="btn-secondary w-full justify-center rounded-full text-sm"
        >
          {t('listing.chatLogin')}
        </button>
      ) : !canUseChat ? null : (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: 'var(--glass-border)', background: 'rgba(255,255,255,0.45)' }}
        >
          {isOwner && threads.length > 1 && (
            <div className="flex gap-1 overflow-x-auto border-b p-2" style={{ borderColor: 'var(--glass-border)' }}>
              {threads.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setActive(th)}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition"
                  style={{
                    background: active?.id === th.id ? 'var(--accent-700)' : 'var(--glass-bg)',
                    color: active?.id === th.id ? '#fff' : 'var(--ink-700)',
                  }}
                >
                  {th.other_user_name}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-64 min-h-[140px] overflow-y-auto p-3">
            {loading ? (
              <p className="muted-text text-center text-xs">{t('common.loading')}</p>
            ) : messages.length === 0 ? (
              <p className="muted-text text-center text-xs">{t('listing.chatEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {messages.map((msg) => {
                  const mine = msg.sender_id === user.id
                  const atts = attachments.get(msg.id) ?? []
                  return (
                    <li
                      key={msg.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                        style={{
                          background: mine ? 'var(--accent-700)' : 'var(--glass-bg)',
                          color: mine ? '#fff' : 'var(--ink-800)',
                        }}
                      >
                        {atts.map((a) =>
                          a.attachment_type === 'image' ? (
                            <img
                              key={a.id}
                              src={a.public_url}
                              alt=""
                              className="mb-1 max-h-32 rounded-lg object-cover"
                            />
                          ) : a.attachment_type === 'video' ? (
                            <video
                              key={a.id}
                              src={a.public_url}
                              controls
                              className="mb-1 max-h-32 w-full rounded-lg"
                            />
                          ) : a.attachment_type === 'voice' || a.attachment_type === 'audio' ? (
                            <audio key={a.id} src={a.public_url} controls className="mb-1 w-full" />
                          ) : (
                            <a
                              key={a.id}
                              href={a.public_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mb-1 block underline"
                            >
                              {a.file_name || 'File'}
                            </a>
                          ),
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {mine && (msg.is_read || msg.delivery_status === 'read') ? ' · read' : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
                {typing ? (
                  <li className="text-[11px] text-emerald-600">typing…</li>
                ) : null}
                <div ref={endRef} />
              </ul>
            )}
          </div>

          <div
            className="flex items-end gap-2 border-t p-2"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={CHAT_MEDIA_ACCEPT}
              onChange={(e) => {
                void handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: 'var(--glass-border)' }}
              aria-label="Attach"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                signalTyping()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              rows={2}
              placeholder={t('listing.chatPlaceholder')}
              className="min-h-[40px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--ink-900)',
              }}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!draft.trim() || sending}
              className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0 disabled:opacity-50"
              aria-label={t('listing.chatSend')}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
