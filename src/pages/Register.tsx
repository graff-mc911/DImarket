import { useState } from 'react'
import { Building2, HardHat, Megaphone, User, UserPlus, Globe } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LANGUAGES }  from '../lib/types'
import type { UserRole } from '../lib/types'

export function Register() {
  const { t, language, setLanguage } = useApp()

  const ROLE_OPTIONS = [
    { role: 'client'      as UserRole, icon: <User      className="h-6 w-6" />, title: t('register.roleClient'),      description: t('register.roleClientDesc') },
    { role: 'professional'as UserRole, icon: <HardHat   className="h-6 w-6" />, title: t('register.roleProfessional'),description: t('register.roleProfessionalDesc') },
    { role: 'company'     as UserRole, icon: <Building2 className="h-6 w-6" />, title: t('register.roleCompany'),     description: t('register.roleCompanyDesc') },
    { role: 'advertiser'  as UserRole, icon: <Megaphone className="h-6 w-6" />, title: t('register.roleAdvertiser'),  description: t('register.roleAdvertiserDesc') },
  ]

  const [fullName,     setFullName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [companyName,  setCompanyName]  = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('client')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id:              authData.user.id,
          full_name:       selectedRole === 'company' ? (companyName || fullName) : fullName,
          phone,
          user_role:       selectedRole,
          is_professional: selectedRole === 'professional' || selectedRole === 'company',
        })
        if (profileError) throw profileError
        setSuccess(true)
        setTimeout(() => {
          if (selectedRole === 'client')     navigateTo('/listings')
          else if (selectedRole === 'advertiser') navigateTo('/advertising')
          else navigateTo('/settings')
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const hintText = () => {
    if (selectedRole === 'client')      return t('register.hintClient')
    if (selectedRole === 'professional')return t('register.hintProfessional')
    if (selectedRole === 'company')     return t('register.hintCompany')
    if (selectedRole === 'advertiser')  return t('register.hintAdvertiser')
    return ''
  }

  const hintIcon = () => {
    if (selectedRole === 'client')      return '👤'
    if (selectedRole === 'professional')return '🔨'
    if (selectedRole === 'company')     return '🏢'
    if (selectedRole === 'advertiser')  return '📢'
    return ''
  }

  return (
    <div className="page-bg min-h-screen px-4 py-10 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-lg items-center justify-center">
        <div className="w-full space-y-6">
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
                <UserPlus className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#2f2a24]">
                {t('register.title')}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6f665d]">
                {t('register.subtitle')}
              </p>
            </div>

            {error && (
              <div className="mt-5 rounded-[20px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-4 py-3 text-sm text-[#a44a3a]">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-[20px] border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] px-4 py-3 text-sm text-[#3d7a52]">
                {t('register.success')}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-6 space-y-5 text-left">

              {/* Вибір ролі */}
              <div>
                <label className="mb-3 block text-sm font-bold text-[#2f2a24]">
                  {t('register.whoAreYou')}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ROLE_OPTIONS.map(option => (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setSelectedRole(option.role)}
                      className="flex flex-col items-center gap-2 rounded-[20px] border p-3 text-center transition-all"
                      style={{
                        borderColor: selectedRole === option.role ? 'var(--accent-700)' : 'var(--glass-border)',
                        background:  selectedRole === option.role ? 'rgba(199,138,96,0.12)' : 'rgba(255,255,255,0.4)',
                        color:       selectedRole === option.role ? 'var(--accent-700)' : 'var(--ink-600)',
                      }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px]"
                        style={{ background: selectedRole === option.role ? 'rgba(199,138,96,0.18)' : 'rgba(148,163,184,0.12)' }}>
                        {option.icon}
                      </div>
                      <span className="text-xs font-bold leading-tight">{option.title}</span>
                      <span className="text-[10px] leading-tight" style={{ color: 'var(--ink-500)' }}>
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Назва компанії */}
              {selectedRole === 'company' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                    {t('register.companyName')} *
                  </label>
                  <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                    className="input-glass" placeholder={t('register.companyNamePlaceholder')} />
                </div>
              )}

              {/* Ім'я */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {selectedRole === 'company' ? t('register.representativeName') : t('register.fullName')} *
                </label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="input-glass" placeholder={t('register.fullNamePlaceholder')} />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('login.email')} *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="input-glass" placeholder={t('login.emailPlaceholder')} />
              </div>

              {/* Пароль */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('login.password')} *</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-glass" placeholder={t('login.passwordPlaceholder')} />
                <p className="mt-1.5 text-xs text-[#7a7168]">{t('register.passwordMin')}</p>
              </div>

              {/* Телефон */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('createAd.phone')}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="input-glass" placeholder={t('register.phonePlaceholder')} />
              </div>

              {/* Підказка */}
              <div className="rounded-[16px] p-3 text-xs leading-relaxed"
                style={{ background: 'rgba(199,138,96,0.08)', color: 'var(--ink-600)' }}>
                {hintIcon()} {hintText()}
              </div>

              <button type="submit" disabled={loading || success}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? t('register.creating') : t('register.createAccount')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#6f665d]">
                {t('register.alreadyHave')}{' '}
                <button onClick={() => navigateTo('/login')} type="button"
                  className="font-semibold text-[#2f2a24] transition hover:text-[#9a5525]">
                  {t('footer.signIn')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}