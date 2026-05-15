import { useEffect, useState } from 'react'
import {
  Bell,
  Briefcase,
  DollarSign,
  Globe,
  Image,
  Lock,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
} from 'lucide-react'
import { AdBanner } from '../components/AdBanner'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { CURRENCIES, LANGUAGES } from '../lib/types'

type FeedbackState = {
  type: 'success' | 'error'
  text: string
}

export function Settings() {
  const { user, language, currency, setLanguage, setCurrency, t } = useApp()

  // Зберігаємо id окремо, щоб сторінка не втрачала контекст між перерендереннями.
  const [currentUserId, setCurrentUserId] = useState<string | null>(user?.id ?? null)

  // Базові стани сторінки та збереження форм.
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  // Поля профілю.
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [profilePhoto, setProfilePhoto] = useState('')
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])

  // Налаштування користувача.
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [preferredLanguage, setPreferredLanguage] = useState(language.code)
  const [preferredCurrency, setPreferredCurrency] = useState(currency.code)

  // Поля зміни пароля.
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    void bootstrapSettings()
  }, [user])

  const bootstrapSettings = async () => {
    setLoading(true)

    try {
      const activeUser = user ?? (await supabase.auth.getUser()).data.user ?? null

      if (!activeUser) {
        navigateTo('/login')
        return
      }

      setCurrentUserId(activeUser.id)
      await loadProfile(activeUser.id)
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
        return
      }

      setFullName(data.full_name || '')
      setBio(data.bio || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
      setWebsite(data.website || '')
      setProfilePhoto(data.profile_photo || '')
      setPortfolioImages(Array.isArray(data.portfolio_images) ? data.portfolio_images : [])
      setNotificationsEnabled(data.notifications_enabled !== false)
      setPreferredLanguage(data.preferred_language || language.code)
      setPreferredCurrency(data.preferred_currency || currency.code)
    } catch (error) {
      console.error('Помилка завантаження профілю:', error)
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

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          phone,
          location,
          website,
          profile_photo: profilePhoto,
          portfolio_images: portfolioImages,
          notifications_enabled: notificationsEnabled,
          preferred_language: preferredLanguage,
          preferred_currency: preferredCurrency,
        })
        .eq('id', currentUserId)

      if (error) {
        throw error
      }

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
      console.error('Помилка оновлення профілю:', error)
      setFeedback({
        type: 'error',
        text: t('settings.error.saveProfile'),
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        text: t('settings.error.passwordMismatch'),
      })
      return
    }

    setSavingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setFeedback({
        type: 'success',
        text: t('settings.success.passwordChanged'),
      })

      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Помилка зміни пароля:', error)
      setFeedback({
        type: 'error',
        text: t('settings.error.changePassword'),
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
      const { error } = await supabase.auth.admin.deleteUser(currentUserId)

      if (error) {
        throw error
      }

      navigateTo('/')
    } catch (error) {
      console.error('Помилка видалення акаунта:', error)
      setFeedback({
        type: 'error',
        text: t('settings.error.deleteAccount'),
      })
    }
  }

  const addPortfolioImage = () => {
    setPortfolioImages((current) => [...current, ''])
  }

  const updatePortfolioImage = (index: number, value: string) => {
    setPortfolioImages((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  const removePortfolioImage = (index: number) => {
    setPortfolioImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  if (loading) {
    return (
      <div className="page-bg min-h-screen py-10">
        <div className="mx-auto max-w-4xl px-4 md:px-6 xl:px-8 2xl:px-10">
          <div className="glass-panel p-10 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(201,109,44,0.18)] border-t-[#c96d2c]" />
            <p className="mt-4 text-sm text-[#6f665d]">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg min-h-screen py-8">
      <div className="w-full px-4 md:px-6 xl:px-8 2xl:px-10">
        <div className="flex gap-6">
          <aside className="hidden w-[220px] flex-shrink-0 xl:block 2xl:w-[260px]">
            <AdBanner position="left" sticky={true} />
          </aside>

          <main className="min-w-0 flex-1">
            <section className="glass-panel p-5 md:p-6 xl:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(233,202,177,0.7)] bg-[rgba(255,247,239,0.88)] px-4 py-2 text-sm font-semibold text-[#a26233]">
                  <User className="h-4 w-4" />
                  <span>{t('header.myProfile')}</span>
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#2f2a24] md:text-4xl">
                  {t('header.myProfile')}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f665d] md:text-base">
                  {t('settings.description')}
                </p>
              </div>

              {feedback && (
                <div
                  className={`mb-6 rounded-[22px] px-4 py-3 text-sm ${
                    feedback.type === 'error'
                      ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
                      : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

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
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        <Briefcase className="mr-1 inline h-4 w-4" />
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('settings.profilePhotoLabel')}
                      </label>
                      <input
                        type="url"
                        value={profilePhoto}
                        onChange={(event) => setProfilePhoto(event.target.value)}
                        className="input-glass"
                        placeholder="https://example.com/photo.jpg"
                      />

                      {profilePhoto && (
                        <div className="mt-3">
                          <img
                            src={profilePhoto}
                            alt={t('settings.profilePhotoAlt')}
                            className="h-24 w-24 rounded-full object-cover ring-4 ring-white/70"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 border-t border-[rgba(190,168,150,0.28)] pt-6">
                    <div className="flex items-center gap-3">
                      <Image className="h-6 w-6 text-[#c96d2c]" />
                      <h3 className="text-lg font-extrabold text-[#2f2a24]">
                        {t('settings.portfolioTitle')}
                      </h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      {portfolioImages.map((url, index) => (
                        <div key={index} className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="url"
                            value={url}
                            onChange={(event) => updatePortfolioImage(index, event.target.value)}
                            className="input-glass flex-1"
                            placeholder="https://example.com/work-image.jpg"
                          />

                          <button
                            type="button"
                            onClick={() => removePortfolioImage(index)}
                            aria-label={t('settings.removePortfolioImage')}
                            className="flex h-12 w-full items-center justify-center rounded-[18px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a] transition hover:bg-[rgba(255,230,223,0.96)] sm:w-12"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addPortfolioImage}
                        className="btn-ghost justify-start rounded-full px-0"
                      >
                        + {t('settings.addPortfolioImage')}
                      </button>
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
                          onChange={(event) => setPreferredLanguage(event.target.value)}
                          className="select-glass bg-white/80"
                        >
                          {LANGUAGES.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.name}
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
                          onChange={(event) => setPreferredCurrency(event.target.value)}
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

                <form onSubmit={handleChangePassword} className="glass-card p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-[#c96d2c]" />
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      {t('settings.changePasswordTitle')}
                    </h2>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('settings.newPasswordLabel')}
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="input-glass"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('settings.confirmNewPasswordLabel')}
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="input-glass"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={!newPassword || !confirmPassword || savingPassword}
                      className="btn-secondary w-full justify-center rounded-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingPassword ? t('settings.saving') : t('settings.changePasswordButton')}
                    </button>
                  </div>
                </form>

                <section className="glass-card border border-[rgba(221,138,120,0.28)] p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-6 w-6 text-[#b14e37]" />
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      {t('settings.dangerTitle')}
                    </h2>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f665d]">
                    {t('settings.dangerText')}
                  </p>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(185,63,63,0.95),rgba(153,27,27,0.95))] px-6 py-3 font-semibold text-white shadow-[0_18px_35px_rgba(153,27,27,0.22)] transition hover:scale-[1.01] active:scale-[0.99] sm:w-auto"
                  >
                    {t('settings.deleteAccountButton')}
                  </button>
                </section>
              </div>
            </section>
          </main>

          <aside className="hidden w-[220px] flex-shrink-0 xl:block 2xl:w-[260px]">
            <AdBanner position="right" sticky={true} />
          </aside>
        </div>
      </div>
    </div>
  )
}
