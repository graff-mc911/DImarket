import { useState } from 'react'
import { Globe, LogIn } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LANGUAGES }  from '../lib/types'

export function Login() {
  const { t, language, setLanguage } = useApp()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Визначаємо куди направити залежно від ролі
      const { data: user } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role, is_site_owner')
        .eq('id', user.user?.id || '')
        .single()

      if (profile?.is_site_owner)              window.location.href = '/dashboard'
      else if (profile?.user_role === 'advertiser') window.location.href = '/advertising'
      else if (profile?.user_role === 'client')     window.location.href = '/listings'
      else                                           window.location.href = '/settings'

    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-10">
      <div className="mx-auto flex max-w-md items-center justify-center">
        <div className="w-full">
          <div className="glass-panel p-6 md:p-8">

            {/* Вибір мови */}
            <div className="mb-4 flex items-center justify-end gap-2">
              <Globe className="h-4 w-4 text-[var(--ink-500)]" />
              <select
                value={language.code}
                onChange={e => {
                  const lang = LANGUAGES.find(l => l.code === e.target.value)
                  if (lang) setLanguage(lang)
                }}
                className="select-glass py-1 text-xs"
                style={{ width: 'auto', minWidth: '120px' }}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* Заголовок */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(201,109,44,0.92),rgba(154,85,37,0.92))] text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]">
                <LogIn className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#2f2a24]">
                {t('login.title')}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6f665d]">
                {t('login.subtitle')}
              </p>
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
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-glass"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {t('login.password')} *
                </label>
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-glass"
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-[#6f665d]">
                {t('login.noAccount')}{' '}
                <button onClick={() => navigateTo('/register')} type="button"
                  className="font-semibold text-[#2f2a24] transition hover:text-[#9a5525]">
                  {t('login.registerLink')}
                </button>
              </p>
              <p className="text-sm text-[#6f665d]">
                {t('login.lookingToPost')}{' '}
                <button onClick={() => navigateTo('/create-ad')} type="button"
                  className="font-semibold text-[var(--accent-700)] transition hover:text-[#9a5525]">
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