import { useRef, useEffect, useState } from 'react'
import { Bot, Loader2, RotateCcw, Send } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useSalesChat } from '../hooks/useSalesChat'
import { navigateTo } from '../lib/navigation'

type SalesChatbotProps = {
  compact?: boolean
  className?: string
}

export function SalesChatbot({ compact = false, className = '' }: SalesChatbotProps) {
  const { t } = useApp()
  const {
    messages,
    draft,
    loading,
    publishing,
    error,
    listingId,
    quickReplies,
    sendMessage,
    resetChat,
  } = useSalesChat()

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

  const mapQuickReply = (q: string) => {
    if (q === 'yes') return t('salesBot.quickYes')
    if (q === 'no') return t('salesBot.quickNo')
    if (q === 'skip') return t('salesBot.quickSkip')
    return q
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.55)] shadow-[0_8px_32px_rgba(67,44,26,0.08)] ${compact ? 'max-h-[32rem]' : 'min-h-[28rem]'} ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(148,163,184,0.15)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[rgba(99,102,241,0.12)] text-[#6366f1]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2f2a24]">{t('salesBot.title')}</p>
            <p className="text-[11px] text-[#6f665d]">{t('salesBot.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetChat}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-[#6366f1]"
          title={t('salesBot.reset')}
        >
          <RotateCcw className="h-3 w-3" />
          {t('salesBot.reset')}
        </button>
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
              {msg.content}
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

      {draft.categorySlug && !compact && (
        <div className="mx-4 mb-2 rounded-[12px] border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.06)] px-3 py-2 text-[10px] text-[#5f5a54]">
          <span className="font-semibold">{t('salesBot.draftLabel')}:</span>{' '}
          {[draft.categorySlug, draft.location, draft.price != null ? `${draft.price} ${draft.currency}` : null]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}

      {error && (
        <p className="mx-4 mb-2 text-xs font-medium text-[#c45a4a]">{error}</p>
      )}

      {listingId && (
        <div className="mx-4 mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigateTo(`/listing/${listingId}`)}
            className="btn-primary rounded-full px-4 py-2 text-xs"
          >
            {t('salesBot.viewListing')}
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/listings')}
            className="rounded-full border border-[rgba(148,163,184,0.3)] px-4 py-2 text-xs font-semibold text-[#5f5a54]"
          >
            {t('salesBot.allListings')}
          </button>
        </div>
      )}

      {quickReplies.length > 0 && !listingId && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading || publishing}
              onClick={() => void sendMessage(q === 'yes' || q === 'no' || q === 'skip' ? q : q)}
              className="rounded-full border border-[rgba(99,102,241,0.25)] bg-white/70 px-3 py-1 text-[11px] font-semibold text-[#6366f1] disabled:opacity-50"
            >
              {mapQuickReply(q)}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[rgba(148,163,184,0.15)] p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('salesBot.inputPlaceholder')}
          disabled={loading || publishing || Boolean(listingId)}
          className="input-glass min-w-0 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={loading || publishing || !input.trim() || Boolean(listingId)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
