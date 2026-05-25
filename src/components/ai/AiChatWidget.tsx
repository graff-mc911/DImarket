import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bot, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { BOT_IDS, type BotId } from '../../lib/bots'
import { bindPathListener, navigateTo } from '../../lib/navigation'
import { SalesChatbot } from '../SalesChatbot'
import { AiBotPanel } from './AiBotPanel'

/** Затримка після відкриття — iOS/Android інколи надсилають другий «ghost» click на ту саму кнопку. */
const FAB_CLOSE_GUARD_MS = 500

/** Плаваючий віджет AI — вибір бота та швидкий доступ */
export function AiChatWidget() {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const [bot, setBot] = useState<BotId>('sales')
  const [path, setPath] = useState(() => window.location.pathname)
  const ignoreFabCloseUntil = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const sync = (p: string) => setPath(p)
    bindPathListener(sync)
    return () => bindPathListener(null)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // На повній сторінці чату FAB не потрібен
  if (path === '/assistant/job') return null

  const openPanel = () => {
    setOpen(true)
    ignoreFabCloseUntil.current = Date.now() + FAB_CLOSE_GUARD_MS
  }

  const closePanel = () => setOpen(false)

  const handleFabClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) {
      if (Date.now() < ignoreFabCloseUntil.current) return
      closePanel()
      return
    }
    openPanel()
  }

  const handleBotSelect = (id: BotId) => {
    if (id === 'sales') {
      setBot('sales')
      // На вузьких екранах лишаємо чат у віджеті; на desktop — повна сторінка
      if (window.matchMedia('(min-width: 768px)').matches) {
        navigateTo('/assistant/job')
        closePanel()
      }
      return
    }
    setBot(id)
  }

  const selectableBots = BOT_IDS.filter((id) => id !== 'messaging' && id !== 'ad_image')

  return (
    <>
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="fixed inset-0 z-[55] touch-manipulation bg-black/30 md:bg-black/20"
          onClick={closePanel}
        />
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('ai.widget.open')}
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[60] flex max-h-[min(32rem,calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.25)] bg-white/95 shadow-2xl backdrop-blur-md sm:left-auto sm:right-4 sm:w-[min(100vw-2rem,24rem)]"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap gap-1 border-b border-[rgba(148,163,184,0.15)] p-2">
            {selectableBots.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleBotSelect(id)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  bot === id ? 'bg-[#6366f1] text-white' : 'text-[#6f665d]'
                }`}
              >
                {t(`ai.bot.${id}`)}
              </button>
            ))}
          </div>

          {bot === 'sales' ? (
            <SalesChatbot compact className="min-h-0 flex-1 border-0 shadow-none" />
          ) : (
            <AiBotPanel botId={bot} />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleFabClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] z-[61] flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[#6366f1] text-white shadow-lg transition hover:scale-105 active:scale-95"
        aria-label={t('ai.widget.open')}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </>
  )
}
