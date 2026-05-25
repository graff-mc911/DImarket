import { useState } from 'react'
import { Bot, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { BOT_IDS, type BotId } from '../../lib/bots'
import { navigateTo } from '../../lib/navigation'
import { SalesChatbot } from '../SalesChatbot'
import { AiBotPanel } from './AiBotPanel'

/** Плаваючий віджет AI — вибір бота та швидкий доступ */
export function AiChatWidget() {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const [bot, setBot] = useState<BotId>('sales')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#6366f1] text-white shadow-lg transition hover:scale-105"
        aria-label={t('ai.widget.open')}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.25)] bg-white/95 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap gap-1 border-b border-[rgba(148,163,184,0.15)] p-2">
            {BOT_IDS.filter((id) => id !== 'messaging' && id !== 'ad_image').map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === 'sales') {
                    navigateTo('/assistant/job')
                    setOpen(false)
                    return
                  }
                  setBot(id)
                }}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  bot === id ? 'bg-[#6366f1] text-white' : 'text-[#6f665d]'
                }`}
              >
                {t(`ai.bot.${id}`)}
              </button>
            ))}
          </div>

          {bot === 'sales' ? (
            <SalesChatbot compact className="border-0 shadow-none" />
          ) : (
            <AiBotPanel botId={bot} />
          )}
        </div>
      )}
    </>
  )
}
