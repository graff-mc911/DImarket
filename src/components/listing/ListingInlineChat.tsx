import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { ensureConversation } from '../../lib/chat/conversations'
import { fetchListingConversations } from '../../lib/chat/listingConversations'
import {
  fetchMessages,
  markConversationRead,
  sendChatMessage,
} from '../../lib/chat/messages'
import type { ChatConversation, ChatMessage } from '../../lib/chat/types'
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
  const endRef = useRef<HTMLDivElement>(null)

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
          if (row.recipient_id === user.id) {
            void markConversationRead(active.id, user.id)
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [active?.id, user])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || !user || !otherPartyId || sending) return

    setSending(true)
    try {
      let convId = active?.id
      if (!convId) {
        convId = await ensureConversation(otherPartyId, listingId)
        if (!convId) return
        await loadThreads()
        const refreshed = await fetchListingConversations(user.id, listingId)
        const found = refreshed.find((c) => c.id === convId) ?? {
          id: convId,
          listing_id: listingId,
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
      }
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
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className="mt-1 text-[10px] opacity-70"
                        >
                          {new Date(msg.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  )
                })}
                <div ref={endRef} />
              </ul>
            )}
          </div>

          <div
            className="flex items-end gap-2 border-t p-2"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
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
