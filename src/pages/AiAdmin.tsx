import { useApp } from '../contexts/AppContext'
import { isSiteOwner } from '../lib/siteOwner'
import { navigateTo } from '../lib/navigation'
import { AiAdminDashboard } from '../components/ai/AiAdminDashboard'

export function AiAdmin() {
  const { user, profile, t } = useApp()
  const allowed = isSiteOwner(profile, user?.email)

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[#6f665d]">{t('ai.admin.denied')}</p>
        <button type="button" onClick={() => navigateTo('/')} className="btn-primary mt-4 rounded-full">
          {t('ai.admin.home')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AiAdminDashboard />
    </div>
  )
}
