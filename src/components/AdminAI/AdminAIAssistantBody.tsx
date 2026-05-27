import { Bot, ChevronDown, X } from 'lucide-react'
import type { AdminAiAlert, AdminAiMessage } from '../../lib/adminAI/adminAiApi'
import { AdminAIChat } from './AdminAIChat'
import { AdminAIInput } from './AdminAIInput'

export type AdminAIAssistantBodyProps = {
  lang: string
  messages: AdminAiMessage[]
  loading: boolean
  voiceOut: boolean
  setVoiceOut: (v: boolean | ((prev: boolean) => boolean)) => void
  alerts: AdminAiAlert[]
  dismissAlert: (id: string) => void
  sendMessage: (text: string) => void
  navigateHistory: (dir: 'up' | 'down') => string | null
  onCollapse?: () => void
  className?: string
}

export function AdminAIAssistantBody({
  lang,
  messages,
  loading,
  voiceOut,
  setVoiceOut,
  alerts,
  dismissAlert,
  sendMessage,
  navigateHistory,
  onCollapse,
  className = '',
}: AdminAIAssistantBodyProps) {
  return (
    <div className={`flex min-h-0 flex-col overflow-hidden bg-[#18181b] ${className}`}>
      <header className="flex shrink-0 items-center justify-between border-b border-[rgba(148,163,184,0.15)] bg-[rgba(24,24,27,0.95)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c96d2c] text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#fafaf9]">Admin AI</p>
            <p className="text-[10px] text-[#78716c]">Команди: /stats, /health, /help</p>
          </div>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="rounded-lg p-1.5 text-[#a8a29e] hover:bg-[rgba(63,63,70,0.8)]"
            aria-label="Згорнути"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </header>

      {alerts.length > 0 && (
        <div className="max-h-20 shrink-0 space-y-1 overflow-y-auto border-b border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-2 py-1.5">
          {alerts.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-start gap-1 text-[11px] text-[#fecaca]">
              <span className="flex-1">{a.message}</span>
              <button type="button" onClick={() => dismissAlert(a.id)} className="shrink-0">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AdminAIChat messages={messages} loading={loading} />

      <AdminAIInput
        onSend={sendMessage}
        loading={loading}
        voiceOut={voiceOut}
        onToggleVoiceOut={() => setVoiceOut((v) => !v)}
        onHistoryNav={navigateHistory}
        lang={lang}
      />
    </div>
  )
}
