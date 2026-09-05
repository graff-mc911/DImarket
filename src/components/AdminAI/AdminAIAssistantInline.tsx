import { Bot } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAdminAI } from '../../hooks/useAdminAI'
import { AdminAIAssistantBody } from './AdminAIAssistantBody'

/** Вбудований чат на сторінці /admin/ai — завжди видиме поле вводу */
export function AdminAIAssistantInline() {
  const { profile, t } = useApp()
  const lang = profile?.preferred_language === 'en' ? 'en-US' : 'uk-UA'
  const ai = useAdminAI(lang)

  return (
    <section className="overflow-hidden rounded-2xl border border-[rgba(201,109,44,0.35)] shadow-[0_8px_32px_rgba(67,44,26,0.12)] sm:rounded-none">
      <div className="border-b border-[rgba(201,109,44,0.2)] bg-white px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c96d2c] text-white sm:h-10 sm:w-10">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#2f2a24] sm:text-lg">
              {t('ai.admin.assistantTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-[#6f665d] sm:mt-1 sm:text-sm">{t('ai.admin.assistantHint')}</p>
          </div>
        </div>
      </div>
      <AdminAIAssistantBody
        lang={lang}
        messages={ai.messages}
        loading={ai.loading}
        voiceOut={ai.voiceOut}
        setVoiceOut={ai.setVoiceOut}
        alerts={ai.alerts}
        dismissAlert={ai.dismissAlert}
        sendMessage={ai.sendMessage}
        navigateHistory={ai.navigateHistory}
        className="min-h-[min(360px,52dvh)]"
        style={{ height: 'min(360px, 52dvh)' }}
      />
    </section>
  )
}
