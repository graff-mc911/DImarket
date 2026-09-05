import React, { useEffect, useRef, useState } from 'react'

interface Message {
  sender: 'user' | 'bot'
  text: string
}

export interface AiChatWidgetProps {
  /** Optional override; if not provided the component will look for VITE_AI_WEBHOOK_URL */
  webhookUrl?: string
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ webhookUrl }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Вітаю! Я віртуальний помічник Dimarket. Чим можу допомогти з документами чи пошуком фахівця?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)

  // Resolve webhook URL: prop -> hardcoded n8n URL
  const resolvedWebhookUrl =
    webhookUrl || 'https://karpatsky.app.n8n.cloud/webhook/97ce5a05-05d7-4d25-87e0-9521d23a9713'

  useEffect(() => {
    // Autoscroll to bottom when messages change
    if (listRef.current) {
      try {
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      } catch {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }])
    setLoading(true)
    setLastError(null)

    if (!resolvedWebhookUrl) {
      console.warn('AiChatWidget: no webhook configured (VITE_AI_WEBHOOK_URL or webhookUrl prop)')
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Віджет не налаштовано: відсутній WEBHOOK. Зверніться до адміністратора.'
        }
      ])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(resolvedWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          chat_id: 'web_user_' + Math.random().toString(36).substring(2, 9),
          source: 'dimarket_website'
        })
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        const errMsg = `Помилка: агент відповів статусом ${response.status}` + (text ? ` — ${text.slice(0, 200)}` : '')
        console.error('AiChatWidget: webhook non-OK', response.status, text)
        setMessages((prev) => [...prev, { sender: 'bot', text: errMsg }])
        setLastError(errMsg)
        return
      }

      const data = await response.json().catch(() => null)
      const reply = (data && (data.response || data.reply)) || 'Отримано порожню відповідь від агента.'
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }])
    } catch (error: any) {
      const errMsg = 'Вибачте, сталася тимчасова помилка зв\'язку з сервером.'
      console.error('Помилка запиту до агента:', error)
      setMessages((prev) => [...prev, { sender: 'bot', text: errMsg }])
      setLastError(error?.message ?? String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-chat-n8n">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: '#FFD700',
            color: '#000',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '0',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          💬 Чат з помічником
        </button>
      ) : (
        <div
          style={{
            width: '350px',
            height: '500px',
            background: '#fff',
            borderRadius: '0',
            boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ background: '#0f172a', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#FFD700' }}>Dimarket AI Assistant</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          {/* show configuration warning if webhook missing */}
          {!resolvedWebhookUrl && (
            <div style={{ padding: '8px 12px', background: '#fff7f7', color: '#7f1d1d', fontSize: 13 }}>
              Віджет не налаштовано: встановіть VITE_AI_WEBHOOK_URL у .env або передайте webhookUrl prop.
            </div>
          )}

          <div ref={listRef} style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? '#2563eb' : '#e2e8f0',
                  color: m.sender === 'user' ? '#fff' : '#1e293b',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  maxWidth: '80%',
                  fontSize: '14px',
                  whiteSpace: 'pre-line'
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '13px' }}>Друкує відповідь...</div>}
            {lastError && (
              <div style={{ alignSelf: 'stretch', padding: '8px 12px', background: '#fff7ed', color: '#92400e', fontSize: 13, borderRadius: 8 }}>
                Помилка: {String(lastError)}
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', borderTop: '1px solid #e2e8f0', padding: '8px', background: '#fff' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишіть запит..."
              style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', outline: 'none', fontSize: '14px' }}
            />
            <button type="submit" disabled={loading} style={{ background: '#FFD700', border: 'none', padding: '8px 14px', marginLeft: '6px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>➤</button>
          </form>
        </div>
      )}
    </div>
  )
}
