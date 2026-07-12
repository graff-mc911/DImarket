import { useEffect, useState, type ReactNode } from 'react'
import { Building2, ChevronDown, Globe, HardHat, Loader, Megaphone, User, UserPlus } from 'lucide-react'
import { PasswordField } from '../components/PasswordField'
import { getAuthErrorMessage, getPostLoginPath } from '../lib/authMessages'
import {
  ensureUserProfile,
  normalizeProfileRole,
  savePendingRegistration,
  type RegistrationRole,
} from '../lib/profileSync'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { triggerRegistrationMarketing } from '../lib/marketing/agentApi'
import { LANGUAGES }  from '../lib/types'
import {
  IP_COUNTRY_MAP,
  isRegistrationCountry,
  sortedRegistrationCountries,
} from '../lib/registrationGeoData'
import { applyReferralCode } from '../lib/referrals'
import {
  catalogCitiesForRegion,
  fetchGeoCatalogForCountry,
  upsertGeoCatalogEntry,
  upsertGeoCatalogFromLocation,
  type AdGeoCountry,
} from '../lib/adGeoCatalog'

export function Register() {
  const { t, language, setLanguage } = useApp()

  const ROLE_OPTIONS: {
    role: RegistrationRole
    icon: ReactNode
    title: string
    description: string
  }[] = [
    { role: 'client', icon: <User className="h-6 w-6" />, title: t('register.roleClient'), description: t('register.roleClientDesc') },
    { role: 'professional', icon: <HardHat className="h-6 w-6" />, title: t('register.roleProfessional'), description: t('register.roleProfessionalDesc') },
    { role: 'company', icon: <Building2 className="h-6 w-6" />, title: t('register.roleCompany'), description: t('register.roleCompanyDesc') },
    { role: 'advertiser', icon: <Megaphone className="h-6 w-6" />, title: t('register.roleAdvertiser'), description: t('register.roleAdvertiserDesc') },
  ]

  const [fullName,     setFullName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [companyName,  setCompanyName]  = useState('')
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('client')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success, setSuccess] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)

  const [country,    setCountry]    = useState('')
  const [region,     setRegion]     = useState('')
  const [city,       setCity]       = useState('')
  const [geoLoading, setGeoLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [countryCatalog, setCountryCatalog] = useState<AdGeoCountry | null>(null)
  const [autoDetected, setAutoDetected] = useState(false)
  const [manualRegion, setManualRegion] = useState(false)
  const [manualCity, setManualCity] = useState(false)
  const [referralCode, setReferralCode] = useState('')

  const sortedCountries = sortedRegistrationCountries()
  const availableRegions = countryCatalog?.regions.map((r) => r.name) ?? []
  const availableCities =
    country && region && countryCatalog
      ? catalogCitiesForRegion([countryCatalog], country, region)
      : []

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const role = params.get('role')
    if (
      role === 'client' ||
      role === 'professional' ||
      role === 'company' ||
      role === 'advertiser'
    ) {
      setSelectedRole(role)
    }
    const ref = params.get('ref')
    if (ref) setReferralCode(ref.trim())
  }, [])

  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        const name = IP_COUNTRY_MAP[data.country_code as string]
        if (name && isRegistrationCountry(name)) {
          setCountry(name)
          setAutoDetected(true)
        }
      } catch { /* нічого */ }
      finally { setGeoLoading(false) }
    }
    void detect()
  }, [])

  useEffect(() => {
    if (!country) {
      setCountryCatalog(null)
      return
    }
    let cancelled = false
    setCatalogLoading(true)
    void fetchGeoCatalogForCountry(country).then((data) => {
      if (!cancelled) setCountryCatalog(data)
    }).finally(() => {
      if (!cancelled) setCatalogLoading(false)
    })
    return () => { cancelled = true }
  }, [country])

  const buildPendingRegistration = () => {
    const displayName =
      selectedRole === 'company' ? (companyName.trim() || fullName.trim()) : fullName.trim()
    return {
      role: selectedRole,
      full_name: displayName || undefined,
      phone: phone.trim() || undefined,
      location:
        city.trim() && country.trim()
          ? [city.trim(), (region.trim() || 'Інші'), country.trim()].join(', ')
          : undefined,
      company_name: companyName.trim() || undefined,
    }
  }

  const handleCountryChange = (val: string) => {
    setCountry(val)
    setRegion('')
    setCity('')
    setManualRegion(false)
    setManualCity(false)
    setAutoDetected(false)
  }
  const handleRegionChange = (val: string) => {
    setRegion(val)
    setCity('')
    setManualCity(false)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setConfirmEmail(false)

    const trimmedEmail = email.trim().toLowerCase()
    const displayName =
      selectedRole === 'company' ? (companyName.trim() || fullName.trim()) : fullName.trim()

    if (selectedRole === 'company' && !companyName.trim()) {
      setError(t('register.companyName'))
      return
    }
    if (!fullName.trim() && selectedRole !== 'company') {
      setError(t('register.fullName'))
      return
    }
    if (!trimmedEmail) {
      setError(t('auth.error.invalidEmail'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.error.passwordTooShort'))
      return
    }
    if (!country.trim() || !city.trim()) {
      setError(t('register.locationRequired'))
      return
    }

    const regionVal = region.trim() || 'Інші'
    const cityVal = city.trim()
    const locationStr = [cityVal, regionVal, country.trim()].join(', ')

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: displayName,
            user_role: selectedRole,
            phone: phone.trim() || null,
            location: locationStr,
          },
        },
      })
      if (authError) throw authError
      if (!authData.user) {
        throw new Error(t('common.error'))
      }

      const { user_role, is_professional } = normalizeProfileRole(selectedRole)

      void upsertGeoCatalogEntry(country.trim(), regionVal, cityVal)

      if (authData.session) {
        const profile = await ensureUserProfile(authData.user, {
          role: selectedRole,
          full_name: displayName,
          phone: phone.trim() || undefined,
          location: locationStr,
          company_name: companyName.trim() || undefined,
        })

        void upsertGeoCatalogFromLocation(locationStr)

        if (!profile) {
          const { error: profileError } = await supabase.from('profiles').upsert(
            {
              id: authData.user.id,
              full_name: displayName,
              phone: phone.trim() || null,
              location: locationStr,
              user_role,
              is_professional,
            },
            { onConflict: 'id' },
          )
          if (profileError) throw profileError
        }

        if (
          referralCode &&
          (selectedRole === 'professional' || selectedRole === 'company')
        ) {
          void applyReferralCode(referralCode, authData.user.id)
        }

        const marketingRole =
          selectedRole === 'professional' ? 'master' : selectedRole
        triggerRegistrationMarketing({
          userId: authData.user.id,
          userRole: marketingRole,
          languageCode: document.documentElement.lang?.slice(0, 2) || 'uk',
          countryCode: country.trim().slice(0, 2).toUpperCase() || 'UA',
        })

        setSuccess(true)
        setTimeout(() => {
          navigateTo(
            getPostLoginPath(profile ?? { user_role, is_site_owner: false }, {
              intendedRole: selectedRole,
            }),
          )
        }, 1200)
        return
      }

      setConfirmEmail(true)
      setSuccess(true)
    } catch (err) {
      setError(getAuthErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  const hintText = () => {
    if (selectedRole === 'client')       return t('register.hintClient')
    if (selectedRole === 'professional') return t('register.hintProfessional')
    if (selectedRole === 'company')      return t('register.hintCompany')
    if (selectedRole === 'advertiser')   return t('register.hintAdvertiser')
    return ''
  }
  const hintIcon = () => {
    if (selectedRole === 'client')       return '👤'
    if (selectedRole === 'professional') return '🔨'
    if (selectedRole === 'company')      return '🏢'
    if (selectedRole === 'advertiser')   return '📢'
    return ''
  }

  return (
    <div className="py-10">
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
            </div>

            {error && (
              <div className="mt-5 rounded-[20px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-4 py-3 text-sm text-[#a44a3a]">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-5 rounded-[20px] border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] px-4 py-3 text-sm text-[#3d7a52]">
                {confirmEmail ? t('register.confirmEmail') : t('register.success')}
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
                    <button key={option.role} type="button" data-testid={`register-role-${option.role}`}
                      onClick={() => setSelectedRole(option.role)}
                      className="flex flex-col items-center gap-2 rounded-[20px] border p-3 text-center transition-all"
                      style={{
                        borderColor: selectedRole === option.role ? 'var(--accent-700)' : 'var(--glass-border)',
                        background:  selectedRole === option.role ? 'rgba(199,138,96,0.12)' : 'rgba(255,255,255,0.4)',
                        color:       selectedRole === option.role ? 'var(--accent-700)' : 'var(--ink-600)',
                      }}>
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

              <PasswordField
                label={t('login.password')}
                value={password}
                onChange={setPassword}
                placeholder={t('login.passwordPlaceholder')}
                required
                minLength={6}
                hint={t('register.passwordMin')}
                autoComplete="new-password"
              />

              {/* Телефон */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('createAd.phone')}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="input-glass" placeholder={t('register.phonePlaceholder')} />
              </div>

              {/* Географія */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#2f2a24]">
                  {t('register.yourLocation')}
                </label>

                {geoLoading && (
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-500)]">
                    <Loader className="h-3 w-3 animate-spin" />
                    {t('register.detectingLocation')}
                  </div>
                )}

                {/* Країна */}
                <div className="relative">
                  <select value={country} onChange={e => handleCountryChange(e.target.value)}
                    className="input-glass appearance-none pr-10">
                    <option value="">{t('register.selectCountry')}</option>
                    {sortedCountries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                </div>

                {autoDetected && country && (
                  <p className="text-xs text-[var(--ink-500)]">
                    🌍 {t('register.locationAutoDetected')}
                  </p>
                )}

                {country && catalogLoading && (
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-500)]">
                    <Loader className="h-3 w-3 animate-spin" />
                    {t('register.catalogLoading')}
                  </div>
                )}

                {country && !catalogLoading && (
                  <p className="text-xs leading-5 text-[var(--ink-500)]">{t('register.geoFromUsers')}</p>
                )}

                {country && availableRegions.length > 0 && !manualRegion && (
                  <div className="relative">
                    <select value={region} onChange={e => handleRegionChange(e.target.value)}
                      className="input-glass appearance-none pr-10">
                      <option value="">{t('register.selectRegion')}</option>
                      {availableRegions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                  </div>
                )}

                {country && (manualRegion || availableRegions.length === 0) && (
                  <input
                    type="text"
                    value={region}
                    onChange={e => { setRegion(e.target.value); setCity(''); setManualCity(false) }}
                    className="input-glass"
                    placeholder={t('register.regionPlaceholder')}
                  />
                )}

                {country && availableRegions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setManualRegion(v => !v); setRegion(''); setCity(''); setManualCity(false) }}
                    className="text-xs underline"
                    style={{ color: 'var(--accent-700)' }}
                  >
                    {manualRegion ? t('register.selectRegion') : t('register.regionNotInList')}
                  </button>
                )}

                {country && (region || manualRegion || availableRegions.length === 0) && !manualCity && availableCities.length > 0 && (
                  <div className="relative">
                    <select value={city} onChange={e => setCity(e.target.value)}
                      className="input-glass appearance-none pr-10">
                      <option value="">{t('register.selectCity')}</option>
                      {availableCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                  </div>
                )}

                {country && (region || manualRegion || availableRegions.length === 0) && (manualCity || availableCities.length === 0) && (
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="input-glass"
                    placeholder={t('register.cityPlaceholder')}
                  />
                )}

                {country && region && availableCities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setManualCity(v => !v); setCity('') }}
                    className="text-xs underline"
                    style={{ color: 'var(--accent-700)' }}
                  >
                    {manualCity ? t('register.selectCity') : t('register.cityNotInList')}
                  </button>
                )}
              </div>

              {/* Підказка */}
              <div className="rounded-[16px] p-3 text-xs leading-relaxed"
                style={{ background: 'rgba(199,138,96,0.08)', color: 'var(--ink-600)' }}>
                {hintIcon()} {hintText()}
              </div>

              <button
                type="submit"
                disabled={loading || (success && !confirmEmail)}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? t('register.creating') : t('register.createAccount')}
              </button>

              {confirmEmail && success && (
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="btn-secondary w-full justify-center text-sm"
                >
                  {t('footer.signIn')}
                </button>
              )}
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