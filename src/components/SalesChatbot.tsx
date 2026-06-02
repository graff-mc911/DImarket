import { useRef, useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { messageDisplayContent } from '../lib/ai/formatBotReply'
import { useSalesChat } from '../hooks/useSalesChat'
import { AdWizardChatbot } from './ai/AdWizardChatbot'

type SalesChatbotProps = {
  compact?: boolean
  className?: string
}

export function SalesChatbot({ compact = false, className = '' }: SalesChatbotProps) {
  const { t } = useApp()
  const {
    messages,
    loading,
    publishing,
    error,
    adWizardActive,
    sendMessage,
  } = useSalesChat()

  if (adWizardActive) {
    return <AdWizardChatbot compact={compact} className={className} />
  }

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    void sendMessage(text)
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.55)] shadow-[0_8px_32px_rgba(67,44,26,0.08)] ${compact ? 'max-h-[32rem]' : 'min-h-[28rem]'} ${className}`}
    >
      <div className="border-b border-[rgba(148,163,184,0.15)] px-4 py-3">
        <p className="text-sm font-semibold text-[#2f2a24]">{t('salesBot.cardMessage')}</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-[16px] px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#6366f1] text-white'
                  : 'border border-[rgba(148,163,184,0.2)] bg-white/80 text-[#2f2a24]'
              }`}
            >
              {messageDisplayContent(msg, t)}
            </div>
          </div>
        ))}
        {(loading || publishing) && (
          <div className="flex items-center gap-2 text-xs text-[#6f665d]">
            <Loader2 className="h-4 w-4 animate-spin" />
            {publishing ? t('salesBot.publishing') : t('salesBot.thinking')}
          </div>
        )}
      </div>

      {error && (
        <p className="mx-4 mb-2 text-xs font-medium text-[#c45a4a]">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[rgba(148,163,184,0.15)] p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('salesBot.inputPlaceholder')}
          disabled={loading || publishing}
          className="input-glass min-w-0 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={loading || publishing || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
