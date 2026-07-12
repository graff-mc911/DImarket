import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { bindPathListener } from '../../lib/navigation'
import { SalesChatbot } from '../SalesChatbot'

/** Після відкриття блокуємо «ghost click» (iOS/Android) на overlay. */
const OVERLAY_CLICK_GUARD_MS = 700

/** Плаваючий віджет AI — вибір бота та швидкий доступ */
export function AiChatWidget() {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const [overlayReady, setOverlayReady] = useState(false)
  const [path, setPath] = useState(() => window.location.pathname)
  const blockOutsideUntil = useRef(0)

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

  // На /dashboard — окремий Admin AI; не перекриваємо поле вводу фіолетовим ботом
  if (
    path === '/assistant/job' ||
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
          className="pointer-events-auto fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 flex min-h-[18rem] max-h-[min(32rem,calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.25)] bg-white shadow-2xl sm:left-auto sm:right-4 sm:w-[min(100vw-2rem,24rem)]"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SalesChatbot compact className="min-h-[14rem] flex-1 border-0 shadow-none" />
        </div>
      )}

      <button
        type="button"
        onClick={handleFabClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="pointer-events-auto fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] hidden h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[var(--brand-ai)] text-white shadow-lg transition hover:scale-105 active:scale-95 xl:flex"
        aria-label={t('ai.widget.open')}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  )

  return createPortal(layer, document.body)
}
