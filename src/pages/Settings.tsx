import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  DollarSign,
  Globe,
  Image,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
} from 'lucide-react'
import { PasswordField } from '../components/PasswordField'
import { ProfileMediaPicker } from '../components/ProfileMediaPicker'
import { PortfolioManager } from '../components/portfolio/PortfolioManager'
import { useApp } from '../contexts/AppContext'
import { getAuthErrorMessage, getChangePasswordMessage } from '../lib/authMessages'
import { changeUserPassword, userHasEmailPassword } from '../lib/changePassword'
import { deleteCurrentAccount } from '../lib/deleteAccount'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { CURRENCIES, LANGUAGES } from '../lib/types'
import {
  languageDisplayCode,
  languageFlagEmoji,
} from '../lib/languageDisplay'
import { CategorySubcategoryPicker } from '../components/CategorySubcategoryPicker'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import { ReferralPanel } from '../components/ReferralPanel'
import { TelegramLinkPanel } from '../components/TelegramLinkPanel'
import { ConnectPayoutPanel } from '../components/ConnectPayoutPanel'
import { ScbLightPanel } from '../components/ScbLightPanel'
import { PwaInstallButton } from '../components/PwaInstallButton'
import { PROJECT_PAYMENTS_ENABLED } from '../lib/featureFlags'
import { buildOnboardingState } from '../lib/onboardingProgress'
import { syncProfessionalCategoriesFromWorkSlugs } from '../lib/syncProfessionalCategories'
import {
  categorySlugForSubcategory,
  emptyPickerValue,
  type CategoryPickerValue,
} from '../lib/categoryCatalog'
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_CATEGORIES,
  parseNotificationPrefs,
  type NotificationPrefs,
} from '../lib/notifications/notifications'
import type { Profile } from '../lib/types'
import { searchLocations } from '../lib/geocoding'

function profileSaveErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return String(err)
}

type FeedbackState = {
  type: 'success' | 'error'
  text: string
}

type LanguageOption = (typeof LANGUAGES)[number]
type CurrencyOption = (typeof CURRENCIES)[number]

export function Settings() {
  const { user, language, currency, setLanguage, setCurrency, t, signOut } = useApp()

  const [currentUserId, setCurrentUserId] = useState<string | null>(user?.id ?? null)

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [serviceRadiusKm, setServiceRadiusKm] = useState<string>('')
  const [website, setWebsite] = useState('')
  const [profilePhoto, setProfilePhoto] = useState('')
  const [isProfessional, setIsProfessional] = useState(false)
  const [workSubcategories, setWorkSubcategories] = useState<CategoryPickerValue>(
    emptyPickerValue(),
  )

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS,
  )
  const [telegramChatId, setTelegramChatId] = useState<number | null>(null)
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageOption['code']>(language.code)
  const [preferredCurrency, setPreferredCurrency] = useState<CurrencyOption['code']>(currency.code)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [reauthNonce, setReauthNonce] = useState('')
  const [passwordNeedsNonce, setPasswordNeedsNonce] = useState(false)
  const [canChangePassword, setCanChangePassword] = useState(false)
  const [userRole, setUserRole] = useState<string>('client')
  const [advertiserVisitedAds, setAdvertiserVisitedAds] = useState(false)

  useEffect(() => {
    void bootstrapSettings()
    try {
      setAdvertiserVisitedAds(
        localStorage.getItem('dimarket_onboarding_visited_ads') === '1',
      )
    } catch {
      /* ignore */
    }
  }, [user])

  useEffect(() => {
    if (loading) return
    if (window.location.hash !== '#danger') return
    const el = document.getElementById('danger')
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [loading])

  useEffect(() => {
    setPreferredLanguage(language.code)
  }, [language.code])

  useEffect(() => {
    setPreferredCurrency(currency.code)
  }, [currency.code])

  const resetProfileForm = () => {
    setFullName('')
    setBio('')
    setPhone('')
    setLocation('')
    setWebsite('')
    setProfilePhoto('')
    setIsProfessional(false)
    setWorkSubcategories(emptyPickerValue())
    setNotificationsEnabled(true)
    setPreferredLanguage(language.code)
    setPreferredCurrency(currency.code)
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPassword('')
    setReauthNonce('')
    setPasswordNeedsNonce(false)
  }

  const bootstrapSettings = async () => {
    setLoading(true)

    try {
      let activeUser = user

      if (!activeUser) {
        const {
          data: { user: remoteUser },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          throw error
        }

        activeUser = remoteUser ?? null
      }

      if (!activeUser) {
        setCurrentUserId(null)
        resetProfileForm()
        navigateTo('/login')
        return
      }

      setCurrentUserId(activeUser.id)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCanChangePassword(authUser ? userHasEmailPassword(authUser) : false)
      await loadProfile(activeUser.id)
    } catch (error) {
      console.error('Помилка ініціалізації сторінки налаштувань:', error)
      setCurrentUserId(null)
      resetProfileForm()
      navigateTo('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        resetProfileForm()
        return
      }

      const nextLanguage =
        LANGUAGES.find((item) => item.code === data.preferred_language)?.code ?? language.code

      const nextCurrency =
        CURRENCIES.find((item) => item.code === data.preferred_currency)?.code ?? currency.code

      setFullName(data.full_name ?? '')
      setBio(data.bio ?? '')
      setPhone(data.phone ?? '')
      setLocation(data.location ?? '')
      setServiceRadiusKm(
        data.service_radius_km != null && data.service_radius_km > 0
          ? String(data.service_radius_km)
          : '',
      )
      setWebsite(data.website ?? '')
      setProfilePhoto(data.profile_photo ?? '')
      setIsProfessional(Boolean(data.is_professional))
      setUserRole(data.user_role ?? 'client')
      const workSlugs = Array.isArray(data.work_subcategory_slugs)
        ? data.work_subcategory_slugs
        : []
      const catSlug =
        workSlugs.length > 0 ?
          categorySlugForSubcategory(workSlugs[0]) ?? 'construction'
        : ''
      setWorkSubcategories({
        categorySlug: catSlug,
        subcategorySlugs: workSlugs,
      })
      setNotificationsEnabled(data.notifications_enabled !== false)
      setEmailDigestEnabled((data as Profile & { email_digest_enabled?: boolean }).email_digest_enabled !== false)
      setNotificationPrefs(
        parseNotificationPrefs(
          (data as Profile & { notification_prefs?: unknown }).notification_prefs,
        ),
      )
      setTelegramChatId((data as Profile & { telegram_chat_id?: number | null }).telegram_chat_id ?? null)
      setPreferredLanguage(nextLanguage)
      setPreferredCurrency(nextCurrency)
    } catch (error) {
      console.error('Помилка завантаження профілю:', error)
      resetProfileForm()
      setFeedback({
        type: 'error',
        text: t('settings.error.loadProfile'),
      })
    }
  }

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUserId) {
      setFeedback({
        type: 'error',
        text: t('settings.error.noSession'),
      })
      return
    }

    setSavingProfile(true)
    setFeedback(null)

    const normalizedFullName = fullName.trim()
    const normalizedBio = bio.trim()
    const normalizedPhone = phone.trim()
    const normalizedLocation = location.trim()
    const normalizedWebsite = website.trim()
    const normalizedProfilePhoto = profilePhoto.trim()

    try {
      const payload: Record<string, unknown> = {
        full_name: normalizedFullName,
        bio: normalizedBio || null,
        phone: normalizedPhone || null,
        location: normalizedLocation || null,
        website: normalizedWebsite || null,
        profile_photo: normalizedProfilePhoto || null,
        notifications_enabled: notificationsEnabled,
        email_digest_enabled: emailDigestEnabled,
        notification_prefs: notificationPrefs,
        preferred_language: preferredLanguage,
        preferred_currency: preferredCurrency,
        work_subcategory_slugs: isProfessional ? workSubcategories.subcategorySlugs : [],
      }

      if (isProfessional) {
        const radius = serviceRadiusKm.trim() ? Number(serviceRadiusKm) : null
        payload.service_radius_km =
          radius != null && Number.isFinite(radius) && radius > 0 ? Math.round(radius) : null

        if (normalizedLocation) {
          try {
            const hits = await searchLocations(normalizedLocation)
            const hit = hits.find((h) => h.lat != null && h.lon != null)
            if (hit?.lat != null && hit?.lon != null) {
              payload.service_latitude = hit.lat
              payload.service_longitude = hit.lon
            }
          } catch {
            /* optional geocode */
          }
        }
      }

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', currentUserId)
        .select('id')
        .maybeSingle()

      if (error) throw error

      if (!updated) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: currentUserId,
          ...payload,
          user_role: 'client',
          is_professional: isProfessional,
        })
        if (insertError) throw insertError
      }

      if (isProfessional && workSubcategories.subcategorySlugs.length > 0) {
        await syncProfessionalCategoriesFromWorkSlugs(
          currentUserId,
          workSubcategories.subcategorySlugs,
        )
      }

      setFullName(normalizedFullName)
      setBio(normalizedBio)
      setPhone(normalizedPhone)
      setLocation(normalizedLocation)
      setWebsite(normalizedWebsite)
      setProfilePhoto(normalizedProfilePhoto)

      const selectedLanguage = LANGUAGES.find((item) => item.code === preferredLanguage)
      const selectedCurrency = CURRENCIES.find((item) => item.code === preferredCurrency)

      if (selectedLanguage) {
        setLanguage(selectedLanguage)
      }

      if (selectedCurrency) {
        setCurrency(selectedCurrency)
      }

      setFeedback({
        type: 'success',
        text: t('settings.success.profileSaved'),
      })
    } catch (error) {
      console.error('Помилка оновлення профілю:', error, profileSaveErrorMessage(error))
      setFeedback({
        type: 'error',
        text: `${t('settings.error.saveProfile')} ${profileSaveErrorMessage(error)}`.trim(),
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    const trimmedNew = newPassword.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (trimmedNew.length < 6) {
      setFeedback({ type: 'error', text: t('auth.error.passwordTooShort') })
      return
    }

    if (trimmedNew !== trimmedConfirm) {
      setFeedback({
        type: 'error',
        text: t('settings.error.passwordMismatch'),
      })
      return
    }

    if (passwordNeedsNonce && !reauthNonce.trim()) {
      setFeedback({ type: 'error', text: t('settings.error.reauthRequired') })
      return
    }

    if (!passwordNeedsNonce && !currentPassword.trim()) {
      setFeedback({ type: 'error', text: t('settings.error.wrongCurrentPassword') })
      return
    }

    setSavingPassword(true)

    try {
      const result = await changeUserPassword({
        newPassword: trimmedNew,
        currentPassword: passwordNeedsNonce ? undefined : currentPassword,
        nonce: passwordNeedsNonce ? reauthNonce : undefined,
      })

      if (!result.ok) {
        if (result.needsNonce) {
          setPasswordNeedsNonce(true)
          setFeedback({
            type: 'success',
            text: getChangePasswordMessage(result.message, t),
          })
          return
        }
        setFeedback({
          type: 'error',
          text:
            result.message === 'password_too_short' ||
            result.message === 'oauth_only' ||
            result.message === 'no_email' ||
            result.message === 'reauth_email_sent'
              ? getChangePasswordMessage(result.message, t)
              : `${t('settings.error.changePassword')} ${getAuthErrorMessage({ message: result.message }, t)}`,
        })
        return
      }

      setFeedback({
        type: 'success',
        text: t('settings.success.passwordChanged'),
      })

      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setReauthNonce('')
      setPasswordNeedsNonce(false)
    } catch (error) {
      console.error('Помилка зміни пароля:', error)
      setFeedback({
        type: 'error',
        text: `${t('settings.error.changePassword')} ${getAuthErrorMessage(error, t)}`,
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t('settings.confirm.deleteAccount'))

    if (!confirmed || !currentUserId) {
      return
    }

    setFeedback(null)

    try {
      await deleteCurrentAccount()
      setCurrentUserId(null)
      resetProfileForm()
      navigateTo('/')
    } catch (error) {
      console.error('Помилка видалення акаунта:', error)
      setFeedback({
        type: 'error',
        text: t('settings.error.deleteAccount'),
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigateTo('/')
  }

  const onboardingState = useMemo(() => {
    if (!currentUserId) return null
    const role = userRole
    if (role !== 'professional' && role !== 'company' && role !== 'advertiser') {
      return null
    }

    const draftProfile = {
      id: currentUserId,
      full_name: fullName,
      bio,
      phone,
      location,
      profile_photo: profilePhoto,
    } as Profile

    return buildOnboardingState({
      profile: draftProfile,
      workSubcategoryCount: workSubcategories.subcategorySlugs.length,
      role,
      advertiserVisitedAds,
    })
  }, [
    advertiserVisitedAds,
    bio,
    currentUserId,
    fullName,
    location,
    phone,
    profilePhoto,
    userRole,
    workSubcategories.subcategorySlugs.length,
  ])

  if (loading) {
    return (
      <div className="layout-page-content py-10">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel p-10 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(201,109,44,0.18)] border-t-[#c96d2c]" />
            <p className="mt-4 text-sm text-[#6f665d]">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-4xl">
            <section className="glass-panel p-5 md:p-6 xl:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(233,202,177,0.7)] bg-[rgba(255,247,239,0.88)] px-4 py-2 text-sm font-semibold text-[#a26233]">
                  <User className="h-4 w-4" />
                  <span>{t('header.myProfile')}</span>
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#2f2a24] md:text-4xl">
                  {t('header.settings')}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f665d] md:text-base">
                  {t('settings.description')}
                </p>

                <PwaInstallButton variant="settings" />

                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#2f2a24] bg-[#2f2a24] px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:bg-black sm:w-auto"
                >
                  <LogOut className="h-5 w-5" />
                  {t('header.signOut')}
                </button>
              </div>

              {feedback && (
                <div
                  className={`mb-6 rounded-none px-4 py-3 text-sm ${
                    feedback.type === 'error'
                      ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
                      : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              {onboardingState &&
                (userRole === 'professional' ||
                  userRole === 'company' ||
                  userRole === 'advertiser') && (
                  <OnboardingChecklist
                    state={onboardingState}
                    role={userRole as 'professional' | 'company' | 'advertiser'}
                  />
                )}

              {(userRole === 'professional' || userRole === 'company') &&
                currentUserId && (
                  <ReferralPanel
                    userId={currentUserId}
                    role={userRole as 'professional' | 'company'}
                  />
                )}

              {(userRole === 'professional' ||
                userRole === 'company' ||
                userRole === 'owner' ||
                isProfessional) &&
                currentUserId && (
                  <ScbLightPanel userId={currentUserId} />
                )}

              {PROJECT_PAYMENTS_ENABLED &&
              (userRole === 'professional' || userRole === 'company') &&
              currentUserId ? (
                <ConnectPayoutPanel />
              ) : null}

              <div className="space-y-6">
                <form onSubmit={handleSaveProfile} className="glass-card p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-[#c96d2c]" />
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      {t('settings.profileInfoTitle')}
                    </h2>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('register.fullName')} {t('common.required')}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="input-glass"
                        placeholder={t('register.fullNamePlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('settings.bioLabel')}
                      </label>
                      <textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        rows={5}
                        maxLength={500}
                        className="input-glass min-h-[150px] resize-y"
                        placeholder={t('settings.bioPlaceholder')}
                      />
                      <p className="mt-2 text-xs text-[#7a7168]">{bio.length}/500</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                          <Phone className="mr-1 inline h-4 w-4" />
                          {t('createAd.phone')}
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className="input-glass"
                          placeholder={t('register.phonePlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                          <MapPin className="mr-1 inline h-4 w-4" />
                          {t('createAd.locationLabel')}
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          className="input-glass"
                          placeholder={t('register.locationPlaceholder')}
                        />
                      </div>

                      {isProfessional ? (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('geo.serviceRadiusLabel')}
                          </label>
                          <select
                            className="select-glass"
                            value={serviceRadiusKm}
                            onChange={(event) => setServiceRadiusKm(event.target.value)}
                          >
                            <option value="">{t('geo.serviceRadiusAny')}</option>
                            {[5, 10, 15, 25, 30, 50, 75, 100, 150, 200].map((km) => (
                              <option key={km} value={String(km)}>
                                {km} km
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-[#6f665d]">{t('geo.serviceRadiusHint')}</p>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('settings.websiteLabel')}
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        className="input-glass"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    {isProfessional && (
                      <div className="rounded-none border border-[rgba(99,102,241,0.12)] bg-white/30 p-4">
                        <p className="text-sm font-bold text-[#2f2a24]">
                          {t('settings.workSubcategoriesTitle')}
                        </p>
                        <p className="mt-1 text-xs text-[#6f665d]">
                          {t('settings.workSubcategoriesHint')}
                        </p>
                        <CategorySubcategoryPicker
                          className="mt-4"
                          value={workSubcategories}
                          onChange={setWorkSubcategories}
                          allowMultiple
                        />
                      </div>
                    )}

                    <ProfileMediaPicker
                      userId={currentUserId}
                      label={t('settings.profilePhotoLabel')}
                      hint={t('settings.profilePhotoHint')}
                      single
                      photoUrl={profilePhoto}
                      onPhotoUrlChange={setProfilePhoto}
                    />
                  </div>

                  <div className="mt-8 border-t border-[rgba(190,168,150,0.28)] pt-6">
                    <div className="flex items-center gap-3">
                      <Image className="h-6 w-6 text-[#c96d2c]" />
                      <h3 className="text-lg font-extrabold text-[#2f2a24]">
                        {t('settings.portfolioTitle')}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-[#6f665d]">
                      Unlimited photos, videos, certificates, before/after galleries, categories,
                      likes and share.
                    </p>
                    <div className="mt-4">
                      {currentUserId ? (
                        <PortfolioManager
                          profileId={currentUserId}
                          viewerId={currentUserId}
                          editable
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-8 border-t border-[rgba(190,168,150,0.28)] pt-6">
                    <div className="flex items-center gap-3">
                      <Globe className="h-6 w-6 text-[#c96d2c]" />
                      <h3 className="text-lg font-extrabold text-[#2f2a24]">
                        {t('settings.preferencesTitle')}
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                          {t('header.language')}
                        </label>
                        <select
                          value={preferredLanguage}
                          onChange={(event) =>
                            setPreferredLanguage(event.target.value as LanguageOption['code'])
                          }
                          className="select-glass bg-white/80"
                        >
                          {LANGUAGES.map((item) => (
                            <option key={item.code} value={item.code}>
                              {languageFlagEmoji(item.code)} {item.name} —{' '}
                              {languageDisplayCode(item.code)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                          <DollarSign className="mr-1 inline h-4 w-4" />
                          {t('header.currency')}
                        </label>
                        <select
                          value={preferredCurrency}
                          onChange={(event) =>
                            setPreferredCurrency(event.target.value as CurrencyOption['code'])
                          }
                          className="select-glass bg-white/80"
                        >
                          {CURRENCIES.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.symbol} {item.code} - {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-[rgba(190,168,150,0.28)] pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-[#6f665d]" />
                          <span className="font-semibold text-[#2f2a24]">
                            {t('settings.notificationsTitle')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[#6f665d]">
                          {t('settings.notificationsText')}
                        </p>
                      </div>

                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={notificationsEnabled}
                          onChange={(event) => setNotificationsEnabled(event.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-[#c96d2c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgba(201,109,44,0.18)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>

                    {notificationsEnabled ? (
                      <div className="mt-5 space-y-4 rounded-none border border-[rgba(190,168,150,0.28)] bg-white/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#6f665d]">
                          {t('settings.notifChannels')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {(
                            [
                              ['inapp', 'settings.channel.inapp'],
                              ['push', 'settings.channel.push'],
                              ['email', 'settings.channel.email'],
                            ] as const
                          ).map(([key, labelKey]) => (
                            <label key={key} className="inline-flex items-center gap-2 text-sm text-[#2f2a24]">
                              <input
                                type="checkbox"
                                checked={notificationPrefs[key]}
                                onChange={(e) =>
                                  setNotificationPrefs((p) => ({ ...p, [key]: e.target.checked }))
                                }
                              />
                              {t(labelKey)}
                            </label>
                          ))}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#6f665d]">
                          {t('settings.notifCategories')}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {NOTIFICATION_CATEGORIES.map((c) => (
                            <label
                              key={c.id}
                              className="inline-flex items-center gap-2 text-sm text-[#2f2a24]"
                            >
                              <input
                                type="checkbox"
                                checked={notificationPrefs.categories[c.id] !== false}
                                onChange={(e) =>
                                  setNotificationPrefs((p) => ({
                                    ...p,
                                    categories: {
                                      ...p.categories,
                                      [c.id]: e.target.checked,
                                    },
                                  }))
                                }
                              />
                              {t(c.labelKey as never)}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {isProfessional && currentUserId && (
                      <TelegramLinkPanel
                        userId={currentUserId}
                        telegramChatId={telegramChatId}
                        emailDigestEnabled={emailDigestEnabled}
                        onDigestChange={setEmailDigestEnabled}
                      />
                    )}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="btn-primary w-full justify-center rounded-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {savingProfile ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                </form>

                {canChangePassword ? (
                  <form onSubmit={handleChangePassword} className="glass-card p-5 md:p-6">
                    <div className="flex items-center gap-3">
                      <Lock className="h-6 w-6 text-[#c96d2c]" />
                      <h2 className="text-xl font-extrabold text-[#2f2a24]">
                        {t('settings.changePasswordTitle')}
                      </h2>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#7a7168]">
                      {t('settings.passwordHint')}
                    </p>

                    {passwordNeedsNonce && (
                      <p className="mt-3 rounded-none border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.08)] px-3 py-2 text-xs text-[#4338ca]">
                        {t('settings.reauthEmailSent')}
                      </p>
                    )}

                    <div className="mt-6 space-y-4">
                      {!passwordNeedsNonce && (
                        <PasswordField
                          label={t('settings.currentPasswordLabel')}
                          value={currentPassword}
                          onChange={setCurrentPassword}
                          required
                          autoComplete="current-password"
                        />
                      )}

                      {passwordNeedsNonce && (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('settings.reauthNonceLabel')}
                          </label>
                          <input
                            type="text"
                            value={reauthNonce}
                            onChange={(event) => setReauthNonce(event.target.value)}
                            className="input-glass"
                            placeholder={t('settings.reauthNoncePlaceholder')}
                            autoComplete="one-time-code"
                          />
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <PasswordField
                          label={t('settings.newPasswordLabel')}
                          value={newPassword}
                          onChange={setNewPassword}
                          required
                          minLength={6}
                          hint={t('register.passwordMin')}
                          autoComplete="new-password"
                        />
                        <PasswordField
                          label={t('settings.confirmNewPasswordLabel')}
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          !newPassword ||
                          !confirmPassword ||
                          savingPassword ||
                          (!passwordNeedsNonce && !currentPassword) ||
                          (passwordNeedsNonce && !reauthNonce.trim())
                        }
                        className="btn-secondary w-full justify-center rounded-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingPassword ? t('settings.saving') : t('settings.changePasswordButton')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="glass-card p-5 md:p-6">
                    <div className="flex items-center gap-3">
                      <Lock className="h-6 w-6 text-[#c96d2c]" />
                      <h2 className="text-xl font-extrabold text-[#2f2a24]">
                        {t('settings.changePasswordTitle')}
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#6f665d]">
                      {t('settings.error.oauthPasswordOnly')}
                    </p>
                  </div>
                )}

                <section
                  id="danger"
                  className="scroll-mt-24 glass-card border border-[rgba(221,138,120,0.28)] p-5 md:p-6"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-6 w-6 text-[#b14e37]" />
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      {t('settings.dangerTitle')}
                    </h2>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f665d]">
                    {t('settings.dangerText')}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={!currentUserId}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(185,63,63,0.95),rgba(153,27,27,0.95))] px-6 py-3 font-semibold text-white shadow-[0_18px_35px_rgba(153,27,27,0.22)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('settings.deleteAccountButton')}
                    </button>
                  </div>
                </section>
              </div>
            </section>
      </div>
    </div>
  )
}
