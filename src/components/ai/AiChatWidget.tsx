import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { bindPathListener, navigateTo } from '../../lib/navigation'
import {
  toolsForAudience,
  type AssistantAudience,
  type AssistantTool,
} from '../../lib/ai/assistantTools'

/** Після відкриття блокуємо «ghost click» (iOS/Android) на overlay. */
const OVERLAY_CLICK_GUARD_MS = 700

/** Плаваючий віджет AI Assistant — швидкий доступ до Customer / Pro tools */
export function AiChatWidget() {
  const { t, profile } = useApp()
  const [open, setOpen] = useState(false)
  const [overlayReady, setOverlayReady] = useState(false)
  const [path, setPath] = useState(() => window.location.pathname)
  const blockOutsideUntil = useRef(0)

  const audience: AssistantAudience =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    Boolean(profile?.is_professional)
      ? 'professional'
      : 'customer'

  const tools = useMemo(() => toolsForAudience(audience), [audience])

  useLayoutEffect(() => {
    const sync = (p: string) => setPath(p)
    bindPathListener(sync)
    return () => bindPathListener(null)
  }, [])

  useEffect(() => {
    if (!open) {
      setOverlayReady(false)
      return
    }

    blockOutsideUntil.current = Date.now() + OVERLAY_CLICK_GUARD_MS
    const timer = window.setTimeout(() => setOverlayReady(true), OVERLAY_CLICK_GUARD_MS)

    const blockGhostClick = (e: Event) => {
      if (Date.now() < blockOutsideUntil.current) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', blockGhostClick, true)
    document.addEventListener('touchend', blockGhostClick, true)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', blockGhostClick, true)
      document.removeEventListener('touchend', blockGhostClick, true)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (
    path === '/assistant' ||
    path.startsWith('/assistant/') ||
    path === '/dashboard' ||
    path === '/admin/ai' ||
    path === '/admin/marketing-agent'
  ) {
    return null
  }

  const openPanel = () => {
    setOpen(true)
    blockOutsideUntil.current = Date.now() + OVERLAY_CLICK_GUARD_MS
  }

  const closePanel = () => setOpen(false)

  const handleFabClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (open) {
      if (Date.now() < blockOutsideUntil.current) return
      closePanel()
      return
    }
    openPanel()
  }

  const openTool = (tool: AssistantTool) => {
    closePanel()
    if (tool.href) {
      navigateTo(tool.href)
      return
    }
    navigateTo(`/assistant?tool=${tool.id}`)
  }

  const layer = (
    <div className="ai-chat-widget-layer pointer-events-none fixed inset-0 z-[200]">
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={`pointer-events-auto fixed inset-0 bg-black/35 transition-opacity ${
            overlayReady ? 'cursor-pointer' : 'pointer-events-none'
          }`}
          onClick={() => {
            if (!overlayReady) return
            closePanel()
          }}
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('ai.widget.open')}
          className="pointer-events-auto fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 flex max-h-[min(32rem,calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.25)] bg-white shadow-2xl sm:left-auto sm:right-4 sm:w-[min(100vw-2rem,24rem)]"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="border-b border-[#f0f0f2] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
              AI Assistant · {audience === 'professional' ? 'Professional' : 'Customer'}
            </p>
            <h2 className="text-[16px] font-semibold text-[#2f2a24]">What do you need?</h2>
            <p className="mt-1 text-[12px] leading-snug text-[#6f665d]">
              Describe the problem — we ask only what is missing.
            </p>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                closePanel()
                navigateTo('/assistant/job')
              }}
              className="mb-1 flex w-full items-start gap-3 rounded-xl bg-[#eef2ff] px-3 py-2.5 text-left transition hover:bg-[#e0e7ff]"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#4338ca]">
                <Bot className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-[#2f2a24]">
                  Start guided chat
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[#6f665d]">
                  No light, ads, pro profile, vacancy, sell/rent…
                </span>
              </span>
            </button>
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => openTool(tool)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f3f0ea]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f3f0ea] text-[#2f2a24]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-[#2f2a24]">{tool.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-[#6f665d]">
                      {tool.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="border-t border-[#f0f0f2] p-3">
            <button
              type="button"
              onClick={() => {
                closePanel()
                navigateTo('/assistant/job')
              }}
              className="w-full rounded-full bg-[#2f2a24] py-2.5 text-[13px] font-semibold text-white"
            >
              Open AI guide
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleFabClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="pointer-events-auto fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[var(--brand-ai)] text-white shadow-lg transition hover:scale-105 active:scale-95"
        aria-label={t('ai.widget.open')}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  )

  return createPortal(layer, document.body)
}
