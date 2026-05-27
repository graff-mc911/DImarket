import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { isSiteOwner } from '../lib/siteOwner'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { AiAdminDashboard } from '../components/ai/AiAdminDashboard'
export function AiAdmin() {
  const { user, profile, t } = useApp()
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) setSessionReady(true)
    }, 3000)
    void supabase.auth.getSession().finally(() => {
      if (!cancelled) {
        window.clearTimeout(timeout)
        setSessionReady(true)
      }
    })
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (user) setSessionReady(true)
  }, [user])

  if (!sessionReady) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#c96d2c]" />
        <p className="mt-4 text-sm text-[#6f665d]">Завантаження…</p>
      </div>
    )
  }

  const allowed = isSiteOwner(profile, user?.email)

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[#6f665d]">{t('ai.admin.denied')}</p>
        <p className="mt-3 text-xs text-[#9a8776]">
          Увійдіть як власник сайту ({'ivan.sovban@gmail.com'}).
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => navigateTo('/login')} className="btn-primary rounded-full">
            Увійти
          </button>
          <button type="button" onClick={() => navigateTo('/')} className="btn-secondary rounded-full">
            {t('ai.admin.home')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AiAdminDashboard />
    </div>
  )
}
