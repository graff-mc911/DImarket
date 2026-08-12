import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { PasswordField } from '../components/PasswordField'
import { LanguageSelector } from '../components/LanguageSelector'
import { getAuthErrorMessage, getPostLoginPath } from '../lib/authMessages'
import { ensureUserProfile, getIntendedRole } from '../lib/profileSync'
import { triggerScbProvisionForPro } from '../lib/scbLight'
export function Login() {
  const { t } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setError(t('auth.error.invalidEmail'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.error.passwordTooShort'))
      return
    }

    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })
      if (authError) throw authError
      if (!data.user) {
        throw new Error(t('auth.error.invalidCredentials'))
      }

      const profile = await ensureUserProfile(data.user)

      triggerScbProvisionForPro(profile?.user_role ?? getIntendedRole(profile, data.user), {
        password,
        fullName: profile?.full_name ?? undefined,
      })

      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null

      navigateTo(
        safeRedirect ||
          getPostLoginPath(profile, {
            intendedRole: getIntendedRole(profile, data.user),
            email: data.user.email,
          }),
      )
    } catch (err) {
      setError(getAuthErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-10">
      <div className="mx-auto flex max-w-md items-center justify-center">
        <div className="w-full">
          <div className="glass-panel p-6 md:p-8">
            <div className="mb-4 flex items-center justify-end">
              <LanguageSelector variant="menu" className="w-full max-w-[220px]" />
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(201,109,44,0.92),rgba(154,85,37,0.92))] text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]">
                <LogIn className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#2f2a24]">
                {t('login.title')}
              </h1>
            </div>

            {error && (
              <div className="mt-5 rounded-[20px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-4 py-3 text-sm text-[#a44a3a]">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {t('login.email')} *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-glass"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>

              <PasswordField
                label={t('login.password')}
                value={password}
                onChange={setPassword}
                placeholder={t('login.passwordPlaceholder')}
                required
                minLength={6}
                autoComplete="current-password"
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-[#6f665d]">
                {t('login.noAccount')}{' '}
                <button
                  onClick={() => navigateTo('/register')}
                  type="button"
                  className="font-semibold text-[#2f2a24] transition hover:text-[#9a5525]"
                >
                  {t('login.registerLink')}
                </button>
              </p>
              <p className="text-sm text-[#6f665d]">
                {t('login.lookingToPost')}{' '}
                <button
                  onClick={() => navigateTo('/create-ad')}
                  type="button"
                  className="font-semibold text-[var(--accent-700)] transition hover:text-[#9a5525]"
                >
                  {t('login.noRegistrationRequired')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
