import { useApp } from '../contexts/AppContext'
import { SalesChatbot } from '../components/SalesChatbot'

/** Сторінка AI Sales Chatbot — діалог → структуроване оголошення. */
export function JobRequestChat() {
  const { t } = useApp()

  return (
    <div className="layout-page-content mx-auto max-w-3xl px-4 py-8 md:py-10">
      <h1 className="mb-5 text-center text-2xl font-extrabold text-[#2f2a24] md:text-3xl">
        {t('salesBot.pageTitle')}
      </h1>

      <div className="mt-6">
        <SalesChatbot />
      </div>
    </div>
  )
}
