import { useApp } from '../contexts/AppContext'
import { isSiteOwner } from '../lib/siteOwner'
import { navigateTo } from '../lib/navigation'
import { OfficialSourcesHealthDashboard } from '../components/officialSources/OfficialSourcesHealthDashboard'

export function OfficialSourcesAdmin() {
  const { user, profile, t } = useApp()
  const allowed = isSiteOwner(profile, user?.email)

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[#6f665d]">{t('osm.admin.denied')}</p>
        <button
          type="button"
          onClick={() => navigateTo('/')}
          className="btn-primary mt-4 rounded-full"
        >
          {t('osm.admin.home')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:px-4 sm:py-8 sm:pb-8">
      <OfficialSourcesHealthDashboard />
    </div>
  )
}
