// ============================================================
// Messages.tsx — Повідомлення та чати користувача
//
// Структура:
// - Ліва панель: список розмов (conversations)
// - Права панель: повідомлення вибраної розмови
//
// Кожна розмова прив'язана до оголошення (listing_id)
// і має унікальний conversation_id.
// Повідомлення конфіденційні — кожен бачить тільки свої.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Send,
  User,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { navigateTo }  from '../lib/navigation'
import type { Message } from '../lib/types'

// Тип розмови — групує повідомлення по conversation_id
interface Conversation {
  conversation_id: string
  listing_id: string | null
  listing_title: string | null
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export function Messages() {
  const { user, profile, t } = useApp()

  // Список розмов
  const [conversations, setConversations]     = useState<Conversation[]>([])
  // Повідомлення вибраної розмови
  const [messages, setMessages]               = useState<Message[]>([])
  // Вибрана розмова
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  // Текст нового повідомлення
  const [newMessage, setNewMessage]           = useState('')
  // Стани завантаження
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending]                 = useState(false)
  // Чи є таблиця messages в базі
  const [tableNotFound, setTableNotFound]     = useState(false)
  // На мобільному — показуємо або список або чат
  const [showChat, setShowChat]               = useState(false)

  // Для автоскролу до останнього повідомлення
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      void loadConversations()
    } else {
      navigateTo('/login')
    }
  }, [user])

  // Автоскрол при нових повідомленнях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Завантаження списку розмов поточного користувача
  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      // Отримуємо всі повідомлення де user є відправником або отримувачем
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or('sender_id.eq.' + user!.id + ',recipient_id.eq.' + user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          setTableNotFound(true)
          return
        }
        throw error
      }

      if (!data) {
        setConversations([])
        return
      }

      // Групуємо повідомлення по conversation_id
      const convMap = new Map<string, Conversation>()

      for (const msg of data) {
        if (convMap.has(msg.conversation_id)) continue

        // Визначаємо хто є "іншим" учасником розмови
        const isISender   = msg.sender_id === user!.id
        const otherUserId = isISender ? msg.recipient_id : (msg.sender_id || '')
        const otherName   = isISender
          ? 'Отримувач'
          : (msg.sender_name || 'Відправник')

        // Рахуємо непрочитані — тільки ті що надіслані мені
        const unreadCount = data.filter(m =>
          m.conversation_id === msg.conversation_id &&
          m.recipient_id === user!.id &&
          !m.is_read
        ).length

        convMap.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          listing_id:      msg.listing_id,
          listing_title:   null,
          other_user_id:   otherUserId,
          other_user_name: otherName,
          last_message:    msg.content,
          last_message_at: msg.created_at,
          unread_count:    unreadCount,
        })
      }

      const convList = Array.from(convMap.values())

      // Завантажуємо назви оголошень для кожної розмови
      const listingIds = convList
        .map(c => c.listing_id)
        .filter(Boolean) as string[]

      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from('listings')
          .select('id, title')
          .in('id', listingIds)

        for (const conv of convList) {
          const listing = listings?.find(l => l.id === conv.listing_id)
          if (listing) conv.listing_title = listing.title
        }
      }

      // Завантажуємо імена інших учасників
      const userIds = convList
        .map(c => c.other_user_id)
        .filter(Boolean)

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        for (const conv of convList) {
          const p = profiles?.find(pr => pr.id === conv.other_user_id)
          if (p?.full_name) conv.other_user_name = p.full_name
        }
      }

      setConversations(convList)
    } catch (error) {
      console.error('Помилка завантаження розмов:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  // Завантаження повідомлень вибраної розмови
  const loadMessages = async (conv: Conversation) => {
    setActiveConversation(conv)
    setLoadingMessages(true)
    setShowChat(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.conversation_id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Позначаємо всі повідомлення як прочитані
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conv.conversation_id)
        .eq('recipient_id', user!.id)
        .eq('is_read', false)

      // Оновлюємо лічильник непрочитаних у списку
      setConversations(prev =>
        prev.map(c =>
          c.conversation_id === conv.conversation_id
            ? { ...c, unread_count: 0 }
            : c
        )
      )
    } catch (error) {
      console.error('Помилка завантаження повідомлень:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Відправка нового повідомлення
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.conversation_id,
          sender_id:       user!.id,
          sender_name:     profile?.full_name || 'Користувач',
          recipient_id:    activeConversation.other_user_id,
          listing_id:      activeConversation.listing_id,
          content,
          is_read:         false,
        })
        .select()
        .single()

      if (error) throw error

      // Додаємо повідомлення локально без перезавантаження
      if (data) {
        setMessages(prev => [...prev, data as Message])
        // Оновлюємо останнє повідомлення у списку розмов
        setConversations(prev =>
          prev.map(c =>
            c.conversation_id === activeConversation.conversation_id
              ? { ...c, last_message: content, last_message_at: data.created_at }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Помилка відправки повідомлення:', error)
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  // Форматування часу повідомлення
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now   = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
  }

  // --- Якщо таблиця не існує ---
  if (tableNotFound) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-2xl">
          <div className="glass-panel p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]"
              style={{ background: 'rgba(242,171,116,0.18)', color: 'var(--accent-700)' }}>
              <MessageSquare className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Повідомлення
            </h1>
            <p className="muted-text mx-auto mt-4 max-w-md text-sm leading-7">
              Для роботи чату потрібна таблиця <code className="rounded bg-[rgba(0,0,0,0.06)] px-1.5 py-0.5 text-xs">messages</code> у Supabase.
            </p>
            <div className="mt-6 rounded-[20px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.4)] p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-500)' }}>
                SQL для створення таблиці
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[14px] bg-[rgba(0,0,0,0.05)] p-4 text-xs leading-relaxed" style={{ color: 'var(--ink-900)' }}>
{`CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT,
  sender_email TEXT,
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients mark as read"
ON messages FOR UPDATE
USING (auth.uid() = recipient_id);`}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/listings')}
              className="btn-primary mt-6 rounded-full"
            >
              До оголошень
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 pb-24 lg:pb-8">
          <div>

            {/* Заголовок */}
            <div className="mb-5 flex items-center gap-3">
              {showChat && (
                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] md:hidden"
                  style={{ color: 'var(--ink-700)' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-extrabold tracking-[-0.03em]" style={{ color: 'var(--ink-900)' }}>
                  {t('header.messages')}
                </h1>
                <p className="muted-text mt-0.5 text-sm">
                  Конфіденційні розмови по оголошеннях
                </p>
              </div>
            </div>

            {/* Двопанельний чат */}
            <div className="glass-panel overflow-hidden" style={{ height: '70vh', display: 'flex' }}>

              {/* Ліва панель — список розмов */}
              <div
                className={'flex flex-col border-r ' + (showChat ? 'hidden md:flex' : 'flex w-full md:w-80')}
                style={{ borderColor: 'var(--glass-border)', minWidth: '0' }}
              >
                <div className="border-b p-4" style={{ borderColor: 'var(--glass-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                    Розмови
                  </p>
                </div>

                {/* Список розмов */}
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="py-12 text-center px-4">
                      <MessageSquare className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--glass-border-strong)' }} />
                      <p className="muted-text text-sm">Розмов ще немає</p>
                      <p className="muted-text mt-1 text-xs">
                        Напишіть автору оголошення щоб почати
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.conversation_id}
                        type="button"
                        onClick={() => loadMessages(conv)}
                        className="flex w-full items-start gap-3 border-b p-4 text-left transition hover:bg-[rgba(255,255,255,0.3)]"
                        style={{
                          borderColor: 'var(--glass-border)',
                          background: activeConversation?.conversation_id === conv.conversation_id
                            ? 'rgba(199,138,96,0.08)'
                            : 'transparent',
                        }}
                      >
                        {/* Аватар співрозмовника */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                          style={{ background: 'rgba(199,138,96,0.15)', color: 'var(--accent-700)' }}
                        >
                          <User className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Ім'я та час */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                              {conv.other_user_name}
                            </span>
                            <span className="shrink-0 text-xs" style={{ color: 'var(--ink-400)' }}>
                              {formatTime(conv.last_message_at)}
                            </span>
                          </div>

                          {/* Назва оголошення */}
                          {conv.listing_title && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'var(--accent-700)' }}>
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{conv.listing_title}</span>
                            </div>
                          )}

                          {/* Останнє повідомлення та лічильник */}
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="muted-text truncate text-xs">
                              {conv.last_message}
                            </p>
                            {conv.unread_count > 0 && (
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ background: 'var(--accent-700)' }}
                              >
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Права панель — повідомлення */}
              <div
                className={'flex flex-col ' + (showChat ? 'flex flex-1' : 'hidden md:flex md:flex-1')}
              >
                {activeConversation ? (
                  <>
                    {/* Шапка чату */}
                    <div
                      className="flex items-center gap-3 border-b px-4 py-3"
                      style={{ borderColor: 'var(--glass-border)' }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ background: 'rgba(199,138,96,0.15)', color: 'var(--accent-700)' }}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                          {activeConversation.other_user_name}
                        </p>
                        {activeConversation.listing_title && (
                          <p className="truncate text-xs" style={{ color: 'var(--ink-500)' }}>
                            {activeConversation.listing_title}
                          </p>
                        )}
                      </div>

                      {/* Перейти до оголошення */}
                      {activeConversation.listing_id && (
                        <button
                          type="button"
                          onClick={() => navigateTo('/listing/' + activeConversation.listing_id)}
                          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                          style={{ background: 'rgba(199,138,96,0.12)', color: 'var(--accent-700)' }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Оголошення
                        </button>
                      )}
                    </div>

                    {/* Список повідомлень */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="muted-text text-sm">Повідомлень ще немає</p>
                          <p className="muted-text mt-1 text-xs">Напишіть перше повідомлення</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMine = msg.sender_id === user!.id
                          return (
                            <div
                              key={msg.id}
                              className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}
                            >
                              <div
                                className="max-w-[75%] rounded-[18px] px-4 py-2.5"
                                style={isMine
                                  ? { background: 'var(--accent-700)', color: '#fff' }
                                  : { background: 'rgba(255,255,255,0.6)', border: '1px solid var(--glass-border)', color: 'var(--ink-900)' }}
                              >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <p
                                  className="mt-1 text-right text-xs"
                                  style={{ opacity: 0.7 }}
                                >
                                  {formatTime(msg.created_at)}
                                  {isMine && (
                                    <span className="ml-1">
                                      {msg.is_read ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      {/* Якір для автоскролу */}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Поле вводу повідомлення */}
                    <div
                      className="border-t p-3"
                      style={{ borderColor: 'var(--glass-border)' }}
                    >
                      <div className="flex items-end gap-2">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            // Відправка по Enter (без Shift)
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              void sendMessage()
                            }
                          }}
                          placeholder="Написати повідомлення..."
                          rows={1}
                          className="flex-1 resize-none rounded-[16px] border px-4 py-2.5 text-sm outline-none transition focus:ring-2"
                          style={{
                            background: 'rgba(255,255,255,0.6)',
                            borderColor: 'var(--glass-border)',
                            color: 'var(--ink-900)',
                            maxHeight: '120px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void sendMessage()}
                          disabled={!newMessage.trim() || sending}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                          style={{ background: 'var(--accent-700)', color: '#fff' }}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="muted-text mt-1.5 text-center text-xs">
                        Enter — відправити · Shift+Enter — новий рядок
                      </p>
                    </div>
                  </>
                ) : (
                  /* Заглушка коли розмова не вибрана */
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-[22px]"
                      style={{ background: 'rgba(199,138,96,0.12)', color: 'var(--accent-700)' }}
                    >
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <p className="font-bold" style={{ color: 'var(--ink-900)' }}>
                      Оберіть розмову
                    </p>
                    <p className="muted-text max-w-xs text-sm">
                      Виберіть розмову зі списку або напишіть автору оголошення
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo('/listings')}
                      className="btn-secondary mt-2 rounded-full"
                    >
                      Переглянути оголошення
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
    </div>
  )
}