import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAdminAI } from '../../hooks/useAdminAI'
import { AdminAIAssistantBody } from './AdminAIAssistantBody'

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
      className="pointer-events-auto fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] z-[300] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.35)] shadow-2xl"
      style={{ height: 'min(520px, calc(100dvh - 5rem - env(safe-area-inset-bottom, 0px)))' }}
    >
      <AdminAIAssistantBody
        lang={lang}
        messages={messages}
        loading={loading}
        voiceOut={voiceOut}
        setVoiceOut={setVoiceOut}
        alerts={alerts}
        dismissAlert={dismissAlert}
        sendMessage={sendMessage}
        navigateHistory={navigateHistory}
        onCollapse={() => setExpanded(false)}
        className="h-full"
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
