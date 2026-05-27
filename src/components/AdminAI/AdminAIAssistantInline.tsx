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
    <section className="overflow-hidden rounded-[24px] border border-[rgba(201,109,44,0.35)] shadow-[0_8px_32px_rgba(67,44,26,0.12)]">
      <div className="border-b border-[rgba(201,109,44,0.2)] bg-[rgba(255,248,241,0.85)] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c96d2c] text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#2f2a24]">
              {t('ai.admin.assistantTitle')}
            </h2>
            <p className="mt-1 text-sm text-[#6f665d]">{t('ai.admin.assistantHint')}</p>
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
        className="min-h-[420px]"
        style={{ height: 'min(420px, 55vh)' }}
      />
    </section>
  )
}
