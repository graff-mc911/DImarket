import { Bot, FileText } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { SalesChatbot } from '../components/SalesChatbot'
import { navigateTo } from '../lib/navigation'

/** Сторінка AI Sales Chatbot — діалог → структурована заявка на роботу. */
export function JobRequestChat() {
  const { t } = useApp()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(99,102,241,0.12)] text-[#6366f1]">
          <Bot className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a8776]">
          {t('salesBot.eyebrow')}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#2f2a24] md:text-3xl">
          {t('salesBot.pageTitle')}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6f665d]">
          {t('salesBot.pageDesc')}
        </p>
      </div>

      <SalesChatbot />

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => navigateTo('/create-ad')}
          className="flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.3)] px-5 py-2.5 text-sm font-semibold text-[#5f5a54]"
        >
          <FileText className="h-4 w-4" />
          {t('salesBot.classicForm')}
        </button>
      </div>
    </div>
  )
}
