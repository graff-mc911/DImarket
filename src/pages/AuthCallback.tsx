import { useEffect, useState } from 'react'
import { Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { getAuthErrorMessage, getPostLoginPath } from '../lib/authMessages'
import { ensureUserProfile, getIntendedRole } from '../lib/profileSync'
import { navigateTo } from '../lib/navigation'

/**
 * Повернення після Google / Apple OAuth (PKCE ?code=).
 */
export function AuthCallback() {
  const { t } = useApp()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const oauthError = params.get('error_description') || params.get('error')
        if (oauthError) {
          throw new Error(oauthError)
        }

        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!data.session?.user) {
          const code = params.get('code')
          if (!code) {
            throw new Error(t('auth.error.oauthNoSession'))
          }
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        const { data: after, error: afterError } = await supabase.auth.getSession()
        if (afterError) throw afterError
        if (!after.session?.user) {
          throw new Error(t('auth.error.oauthNoSession'))
        }

        const profile = await ensureUserProfile(after.session.user)
        if (cancelled) return

        const path = getPostLoginPath(profile, {
          intendedRole: getIntendedRole(profile, after.session.user),
        })
        window.history.replaceState({}, '', path)
        navigateTo(path)
      } catch (err) {
        if (!cancelled) {
          setError(getAuthErrorMessage(err, t))
        }
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [t])

  if (error) {
    return (
      <div className="layout-page-content py-16 text-center">
        <p className="text-sm text-[#a44a3a]">{error}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigateTo('/login')}>
          {t('login.title')}
        </button>
      </div>
    )
  }

  return (
    <div className="layout-page-content flex flex-col items-center justify-center gap-4 py-24">
      <Loader className="h-8 w-8 animate-spin text-[var(--accent-700)]" />
      <p className="text-sm text-[#6f665d]">{t('auth.oauthLoading')}</p>
    </div>
  )
}
