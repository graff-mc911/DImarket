import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  ImagePlus,
  MessageSquare,
  Mic,
  Paperclip,
  Send,
  Square,
  User,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { useChat } from '../../hooks/useChat'
import type { ChatConversation, MessageAttachment } from '../../lib/chat/types'
import { CHAT_MEDIA_ACCEPT } from '../../lib/chat/attachments'
import {
  savePushSubscription,
  vapidPublicKey,
} from '../../lib/notifications/notifications'

type Props = {
  bootstrap?: { otherUserId: string; listingId?: string | null }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

function Receipt({ mine, status, isRead }: { mine: boolean; status?: string | null; isRead: boolean }) {
  if (!mine) return null
  const read = isRead || status === 'read'
  const delivered = read || status === 'delivered'
  if (read) {
    return (
      <span className="ml-1 inline-flex items-center gap-0.5 text-indigo-200" title="Read">
        <CheckCheck className="h-3 w-3" />
      </span>
    )
  }
  if (delivered) {
    return (
      <span className="ml-1 inline-flex items-center gap-0.5 text-indigo-200" title="Delivered">
        <CheckCheck className="h-3 w-3 opacity-70" />
      </span>
    )
  }
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 text-indigo-200" title="Sent">
      <Check className="h-3 w-3" />
    </span>
  )
}

function AttachmentBlock({
  atts,
  mine,
}: {
  atts: MessageAttachment[]
  mine: boolean
}) {
  return (
    <>
      {atts.map((a) => {
        if (a.attachment_type === 'image') {
          return (
            <a key={a.id} href={a.public_url} target="_blank" rel="noreferrer">
              <img
                src={a.public_url}
                alt=""
                className="mb-2 max-h-56 rounded-xl object-cover"
                loading="lazy"
              />
            </a>
          )
        }
        if (a.attachment_type === 'video') {
          return (
            <video
              key={a.id}
              src={a.public_url}
              controls
              playsInline
              className="mb-2 max-h-56 w-full rounded-xl bg-black"
            />
          )
        }
        if (a.attachment_type === 'voice' || a.attachment_type === 'audio') {
          return (
            <audio key={a.id} src={a.public_url} controls className="mb-2 w-full min-w-[200px]" />
          )
        }
        return (
          <a
            key={a.id}
            href={a.public_url}
            target="_blank"
            rel="noreferrer"
            className={`mb-2 flex items-center gap-2 underline ${mine ? 'text-indigo-100' : ''}`}
          >
            <Paperclip className="h-4 w-4" />
            {a.file_name || (a.attachment_type === 'pdf' ? 'PDF' : 'File')}
          </a>
        )
      })}
    </>
  )
}

export function ChatMessenger({ bootstrap }: Props) {
  const { user, profile, t } = useApp()
  const [newMessage, setNewMessage] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const chat = useChat(user?.id, profile?.full_name || 'User')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, chat.attachments])

  useEffect(() => {
    if (!user) return
    void (async () => {
      const key = vapidPublicKey()
      if (!key || !('serviceWorker' in navigator) || !('PushManager' in window)) return
      try {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') return
        const reg = await navigator.serviceWorker.register('/sw.js')
        const existing = await reg.pushManager.getSubscription()
        const sub =
          existing ||
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          }))
        await savePushSubscription(user.id, sub)
      } catch (e) {
        console.error('chat push enable:', e)
      }
    })()
  }, [user?.id])

  useEffect(() => {
    if (!user || !bootstrap) return
    void (async () => {
      const conv = await chat.openWithParticipant(bootstrap.otherUserId, bootstrap.listingId)
      if (conv) setShowChat(true)
    })()
  }, [user?.id, bootstrap?.otherUserId, bootstrap?.listingId])

  useEffect(() => {
    const openId = sessionStorage.getItem('open_conversation')
    const otherId = sessionStorage.getItem('conversation_with')
    const listingId = sessionStorage.getItem('conversation_listing')
    if (!user || !otherId) return

    void (async () => {
      if (openId && openId.includes('-') && openId.length > 40) {
        await chat.openWithParticipant(otherId, listingId || null)
      } else if (openId) {
        const conv = chat.conversations.find((c) => c.id === openId)
        if (conv) await chat.openConversation(conv)
        else await chat.openWithParticipant(otherId, listingId || null)
      } else {
        await chat.openWithParticipant(otherId, listingId || null)
      }
      setShowChat(true)
      sessionStorage.removeItem('open_conversation')
      sessionStorage.removeItem('conversation_with')
      sessionStorage.removeItem('conversation_listing')
    })()
  }, [user?.id])

  if (!user) return null

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  }

  const onSelectConversation = (conv: ChatConversation) => {
    void chat.openConversation(conv)
    setShowChat(true)
  }

  const handleSend = async () => {
    const ok = await chat.sendMessage(newMessage)
    if (ok) setNewMessage('')
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    await chat.sendFile(file)
  }

  const startRecording = async () => {
    setRecordError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream)
      chunks.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: mime })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        void chat.sendFile(file, undefined, 'voice')
      }
      mediaRecorder.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setRecordError('Microphone permission required')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight" style={{ color: 'var(--ink-900)' }}>
        {t('header.messages')}
      </h1>

      <div className="glass-panel overflow-hidden rounded-[28px] border border-[var(--glass-border)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex min-h-[520px] md:min-h-[600px]">
          <aside
            className={`w-full shrink-0 border-r border-[var(--glass-border)] bg-[rgba(255,255,255,0.35)] md:w-[320px] lg:w-[360px] ${
              showChat ? 'hidden md:block' : 'block'
            }`}
          >
            {chat.loadingList ? (
              <div className="p-6 text-sm muted-text">{t('common.loading')}</div>
            ) : chat.conversations.length === 0 ? (
              <div className="p-8 text-center text-sm muted-text">{t('messages.empty')}</div>
            ) : (
              <ul className="max-h-[600px] overflow-y-auto">
                {chat.conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conv)}
                      className={`flex w-full gap-3 border-b border-[var(--glass-border)] px-4 py-4 text-left transition hover:bg-[rgba(99,102,241,0.06)] ${
                        chat.active?.id === conv.id ? 'bg-[rgba(99,102,241,0.08)]' : ''
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(148,163,184,0.15)]">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-[var(--ink-900)]">
                            {conv.other_user_name}
                          </span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-500">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        {conv.listing_title && (
                          <p className="mt-0.5 truncate text-xs text-indigo-600">{conv.listing_title}</p>
                        )}
                        <p className="mt-1 truncate text-sm text-slate-600">{conv.last_message}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section
            className={`flex min-w-0 flex-1 flex-col bg-[rgba(255,255,255,0.5)] ${
              showChat ? 'flex' : 'hidden md:flex'
            }`}
          >
            {!chat.active ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm muted-text">{t('messages.selectConversation')}</p>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
                  <button
                    type="button"
                    className="rounded-full p-2 hover:bg-slate-100 md:hidden"
                    onClick={() => setShowChat(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--ink-900)]">{chat.active.other_user_name}</p>
                    {chat.active.listing_title && (
                      <p className="truncate text-xs text-indigo-600">{chat.active.listing_title}</p>
                    )}
                    {chat.active.typing_user_id && chat.active.typing_user_id !== user.id ? (
                      <p className="animate-pulse text-xs text-emerald-600">{t('messages.typing')}</p>
                    ) : null}
                  </div>
                  {chat.active.listing_id && (
                    <button
                      type="button"
                      onClick={() => navigateTo(`/listing/${chat.active!.listing_id}`)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                    >
                      <FileText className="mr-1 inline h-3.5 w-3.5" />
                      {t('messages.viewListing')}
                    </button>
                  )}
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {chat.loadingThread ? (
                    <p className="text-sm muted-text">{t('common.loading')}</p>
                  ) : (
                    chat.messages.map((msg) => {
                      const mine = msg.sender_id === user.id
                      const atts = chat.attachments.get(msg.id) ?? []
                      const hideCaption =
                        atts.length > 0 &&
                        /^(📷|🎬|🎤|🔊|📄|📎)/.test(msg.content.trim())
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              mine
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-200 bg-white text-slate-800'
                            }`}
                          >
                            <AttachmentBlock atts={atts} mine={mine} />
                            {!hideCaption ? (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : null}
                            <p
                              className={`mt-1 flex items-center text-[10px] ${
                                mine ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              {formatTime(msg.created_at)}
                              <Receipt
                                mine={mine}
                                status={msg.delivery_status}
                                isRead={msg.is_read}
                              />
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <footer className="border-t border-[var(--glass-border)] p-3">
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
                  {recordError ? (
                    <p className="mb-2 text-[12px] text-red-600">{recordError}</p>
                  ) : null}
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="rounded-2xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                      title={t('messages.attach')}
                    >
                      <ImagePlus className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => (recording ? stopRecording() : void startRecording())}
                      className={`rounded-2xl border p-3 ${
                        recording
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title="Voice message"
                    >
                      {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        chat.signalTyping()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void handleSend()
                        }
                      }}
                      rows={1}
                      placeholder={t('messages.placeholder')}
                      className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      disabled={chat.sending || !newMessage.trim()}
                      onClick={() => void handleSend()}
                      className="rounded-2xl bg-indigo-600 p-3 text-white disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
