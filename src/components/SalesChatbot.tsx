import { useRef, useEffect, useState } from 'react'
import { Calculator, Loader2, Send } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { messageDisplayContent } from '../lib/ai/formatBotReply'
import { useSalesChat } from '../hooks/useSalesChat'
import { navigateTo } from '../lib/navigation'
import { AdWizardChatbot } from './ai/AdWizardChatbot'
import { TopMatchCards } from './matching/TopMatchCards'

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
    listingId,
    topMatches,
    quickReplies,
    adWizardActive,
    sendMessage,
    resetChat,
    openCostEstimate,
  } = useSalesChat()

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, topMatches, quickReplies, listingId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    void sendMessage(text)
  }

  if (adWizardActive) {
    return <AdWizardChatbot compact={compact} className={className} />
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.55)] shadow-[0_8px_32px_rgba(67,44,26,0.08)] ${compact ? 'max-h-[32rem]' : 'min-h-[28rem]'} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(148,163,184,0.15)] px-4 py-3">
        <p className="text-sm font-semibold text-[#2f2a24]">{t('salesBot.cardMessage')}</p>
        <button
          type="button"
          onClick={() => resetChat()}
          className="text-xs font-semibold text-[#6366f1] underline"
        >
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
        {topMatches.length > 0 && (
          <TopMatchCards matches={topMatches} listingId={listingId} compact />
        )}
        {listingId && !loading && !publishing && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigateTo(`/project/${listingId}/matches`)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3.5 py-2 text-xs font-semibold text-white"
            >
              {t('pipeline.viewMatches' as never) || 'View matches'}
            </button>
            <button
              type="button"
              onClick={() => openCostEstimate()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(99,102,241,0.35)] bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#4338ca]"
            >
              <Calculator className="h-3.5 w-3.5" aria-hidden />
              {t('salesBot.ctaEstimate')}
            </button>
            <button
              type="button"
              onClick={() => navigateTo(`/listing/${listingId}`)}
              className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#6f665d]"
            >
              {t('salesBot.ctaOpenListing')}
            </button>
          </div>
        )}
        {quickReplies.length > 0 && !loading && !publishing && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  if (/матч|matches|підібран|майстрів/i.test(q) && listingId) {
                    navigateTo(`/project/${listingId}/matches`)
                    return
                  }
                  if (/кошторис|estimate|калькулятор/i.test(q)) {
                    openCostEstimate()
                    return
                  }
                  if (/оголошен|listing/i.test(q) && listingId) {
                    navigateTo(`/listing/${listingId}`)
                    return
                  }
                  if (/спочатку|reset|заново/i.test(q)) {
                    resetChat()
                    return
                  }
                  void sendMessage(q)
                }}
                className="rounded-full border border-[rgba(99,102,241,0.35)] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#4338ca] transition hover:bg-[rgba(99,102,241,0.08)]"
              >
                {q === 'yes' || q === 'Так, опублікувати' || q === 'Так, опублікувати заявку'
                  ? t('salesBot.quickYes')
                  : q === 'no' || q === 'Ні'
                    ? t('salesBot.quickNo')
                    : q === 'skip' || q === 'пропустити'
                      ? t('salesBot.quickSkip')
                      : q === 'Зробити кошторис' || q === 'Make cost estimate'
                        ? t('salesBot.ctaEstimate')
                        : q === 'Дивитись матчі' || q === 'View matches'
                          ? t('pipeline.viewMatches' as never) || q
                          : q === 'Відкрити оголошення'
                            ? t('salesBot.ctaOpenListing')
                            : q}
              </button>
            ))}
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
