import React, { useState } from 'react'

interface Message {
  sender: 'user' | 'bot'
  text: string
}

export interface AiChatWidgetProps {
  /** Optional override; if not provided the component will look for NEXT_PUBLIC_AI_WEBHOOK_URL */
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

  // Resolve webhook URL: prop -> process.env -> empty
  const resolvedWebhookUrl =
    webhookUrl || (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_AI_WEBHOOK_URL : undefined) || ''

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }])
    setLoading(true)

    if (!resolvedWebhookUrl) {
      console.warn('AiChatWidget: no webhook configured (NEXT_PUBLIC_AI_WEBHOOK_URL or webhookUrl prop)')
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
        // Try to surface HTTP error
        const text = await response.text()
        console.error('AiChatWidget: webhook responded with non-OK status', response.status, text)
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Помилка з'єднання з агентом (HTTP ' + response.status + ').' }])
        return
      }

      const data = await response.json().catch(() => null)
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: (data && (data.response || data.reply)) || 'Отримано порожню відповідь від агента.' }
      ])
    } catch (error) {
      console.error('Помилка запиту до агента:', error)
      setMessages((prev) => [...prev, { sender: 'bot', text: "Вибачте, сталася тимчасова помилка зв'язку з сервером." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: '#FFD700',
            color: '#000',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '30px',
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
            height: '450px',
            background: '#fff',
            borderRadius: '12px',
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

          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
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
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', borderTop: '1px solid #e2e8f0', padding: '8px', background: '#fff' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишіть запит..."
              style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', outline: 'none', fontSize: '14px' }}
            />
            <button type="submit" style={{ background: '#FFD700', border: 'none', padding: '8px 14px', marginLeft: '6px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>➤</button>
          </form>
        </div>
      )}
    </div>
  )
}
