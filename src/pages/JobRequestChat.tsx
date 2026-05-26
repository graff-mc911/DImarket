import { FileText } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { SalesChatbot } from '../components/SalesChatbot'
import { navigateTo } from '../lib/navigation'

/** Сторінка AI Sales Chatbot — діалог → структурована заявка на роботу. */
export function JobRequestChat() {
  const { t } = useApp()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <h1 className="mb-5 text-center text-2xl font-extrabold text-[#2f2a24] md:text-3xl">
        {t('salesBot.pageTitle')}
      </h1>

      <SalesChatbot />

      <div className="mt-6 flex justify-center">
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
