import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, ChevronDown, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAdminAI } from '../../hooks/useAdminAI'
import { AdminAIChat } from './AdminAIChat'
import { AdminAIInput } from './AdminAIInput'

function AdminAIPanelInner() {
  const { profile } = useApp()
  const lang = profile?.preferred_language === 'en' ? 'en-US' : 'uk-UA'
  const {
    messages,
    loading,
    expanded,
    setExpanded,
    voiceOut,
    setVoiceOut,
    alerts,
    dismissAlert,
    sendMessage,
    navigateHistory,
    unreadCount,
  } = useAdminAI(lang)

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="pointer-events-auto fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] z-[300] flex h-14 w-14 items-center justify-center rounded-full bg-[#c96d2c] text-white shadow-lg transition hover:scale-105 hover:bg-[#b85d1c]"
        aria-label="Admin AI"
      >
        <Bot className="h-7 w-7" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Admin AI"
      className="pointer-events-auto fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] z-[300] flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.35)] bg-[#18181b] shadow-2xl"
      style={{ height: 'min(520px, calc(100dvh - 5rem - env(safe-area-inset-bottom, 0px)))' }}
    >
      <header className="shrink-0 flex items-center justify-between border-b border-[rgba(148,163,184,0.15)] bg-[rgba(24,24,27,0.95)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c96d2c] text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#fafaf9]">Admin AI</p>
            <p className="text-[10px] text-[#78716c]">DImarket Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-lg p-1.5 text-[#a8a29e] hover:bg-[rgba(63,63,70,0.8)]"
          aria-label="Згорнути"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </header>

      {alerts.length > 0 && (
        <div className="shrink-0 max-h-20 space-y-1 overflow-y-auto border-b border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-2 py-1.5">
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

export function AdminAIPanel() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <div className="admin-ai-layer pointer-events-none fixed inset-0 z-[300]">
      <AdminAIPanelInner />
    </div>,
    document.body,
  )
}
