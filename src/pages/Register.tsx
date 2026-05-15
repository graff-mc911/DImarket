// ============================================================
// Register.tsx — Сторінка реєстрації нового користувача
//
// Додано порівняно з оригіналом:
// - Вибір ролі: Клієнт / Майстер / Компанія
// - Поле "Назва компанії" для ролі company
// - Збереження user_role в profiles
// - is_professional = true для майстра і компанії
// - Після реєстрації клієнт іде на /listings,
//   майстер і компанія — на /settings
// ============================================================

import { useState } from 'react'
import { Building2, HardHat, User, UserPlus } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import type { UserRole } from '../lib/types'

// Описуємо варіанти ролей для UI
const ROLE_OPTIONS: {
  role:        UserRole
  icon:        React.ReactNode
  title:       string
  description: string
}[] = [
  {
    role:        'client',
    icon:        <User className="h-6 w-6" />,
    title:       'Клієнт',
    description: 'Шукаю майстра або послугу',
  },
  {
    role:        'professional',
    icon:        <HardHat className="h-6 w-6" />,
    title:       'Майстер',
    description: 'Надаю послуги як фізична особа',
  },
  {
    role:        'company',
    icon:        <Building2 className="h-6 w-6" />,
    title:       'Компанія',
    description: 'Реєструю фірму або бізнес',
  },
]

export function Register() {
  const { t } = useApp()

  // --- Поля форми ---
  const [fullName, setFullName]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [phone, setPhone]             = useState('')
  const [location, setLocation]       = useState('')
  const [companyName, setCompanyName] = useState('')

  // --- Вибрана роль (за замовчуванням — клієнт) ---
  const [selectedRole, setSelectedRole] = useState<UserRole>('client')

  // --- Стани UI ---
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Крок 1: Створюємо користувача в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Крок 2: Створюємо профіль в таблиці profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,

            // Для компанії показуємо назву компанії, для решти — ім'я
            full_name: selectedRole === 'company'
              ? (companyName || fullName)
              : fullName,

            phone,
            location,

            // Роль користувача — нове поле
            user_role: selectedRole,

            // Майстер і компанія є professionals
            is_professional: selectedRole === 'professional' || selectedRole === 'company',
          })

        if (profileError) throw profileError

        setSuccess(true)

        // Клієнт іде на головну, майстер і компанія — заповнювати профіль
        setTimeout(() => {
          if (selectedRole === 'client') {
            navigateTo('/listings')
          } else {
            navigateTo('/settings')
          }
        }, 1500)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('common.error')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg min-h-screen px-4 py-10 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-lg items-center justify-center">
        <div className="w-full space-y-6">

          {/* Основна картка */}
          <div className="glass-panel p-6 md:p-8">

            {/* Іконка і заголовок */}
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

            {/* Помилка */}
            {error && (
              <div className="mt-5 rounded-[20px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-4 py-3 text-sm text-[#a44a3a]">
                {error}
              </div>
            )}

            {/* Успіх */}
            {success && (
              <div className="mt-5 rounded-[20px] border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] px-4 py-3 text-sm text-[#3d7a52]">
                {selectedRole === 'client'
                  ? 'Акаунт створено! Переходимо до оголошень...'
                  : 'Акаунт створено! Заповніть ваш профіль...'}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-6 space-y-5 text-left">

              {/* ===== ВИБІР РОЛІ ===== */}
              <div>
                <label className="mb-3 block text-sm font-bold text-[#2f2a24]">
                  Хто ви?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(option => (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setSelectedRole(option.role)}
                      className="flex flex-col items-center gap-2 rounded-[20px] border p-3 text-center transition-all"
                      style={{
                        borderColor: selectedRole === option.role
                          ? 'var(--accent-700)'
                          : 'var(--glass-border)',
                        background: selectedRole === option.role
                          ? 'rgba(199,138,96,0.12)'
                          : 'rgba(255,255,255,0.4)',
                        color: selectedRole === option.role
                          ? 'var(--accent-700)'
                          : 'var(--ink-600)',
                      }}
                    >
                      {/* Іконка ролі */}
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-[14px]"
                        style={{
                          background: selectedRole === option.role
                            ? 'rgba(199,138,96,0.18)'
                            : 'rgba(148,163,184,0.12)',
                        }}
                      >
                        {option.icon}
                      </div>
                      {/* Назва ролі */}
                      <span className="text-xs font-bold leading-tight">
                        {option.title}
                      </span>
                      {/* Опис ролі */}
                      <span
                        className="text-[10px] leading-tight"
                        style={{ color: 'var(--ink-500)' }}
                      >
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Назва компанії — тільки для ролі company */}
              {selectedRole === 'company' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                    Назва компанії *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="input-glass"
                    placeholder="Наприклад: БудСервіс ТОВ"
                  />
                </div>
              )}

              {/* Повне ім'я */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {selectedRole === 'company'
                    ? 'Ім\'я представника'
                    : t('register.fullName')}
                  {' '}*
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input-glass"
                  placeholder={t('register.fullNamePlaceholder')}
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {t('login.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-glass"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>

              {/* Пароль */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {t('login.password')} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-glass"
                  placeholder={t('login.passwordPlaceholder')}
                />
                <p className="mt-1.5 text-xs text-[#7a7168]">
                  {t('register.passwordMin')}
                </p>
              </div>

              {/* Телефон і локація — два поля в рядок */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                    {t('createAd.phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input-glass"
                    placeholder={t('register.phonePlaceholder')}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                    {t('createAd.locationLabel')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="input-glass"
                    placeholder={t('register.locationPlaceholder')}
                  />
                </div>
              </div>

              {/* Підказка залежно від ролі */}
              <div
                className="rounded-[16px] p-3 text-xs leading-relaxed"
                style={{
                  background: 'rgba(199,138,96,0.08)',
                  color:      'var(--ink-600)',
                }}
              >
                {selectedRole === 'client' && (
                  '👤 Як клієнт ви зможете створювати оголошення, знаходити майстрів і залишати відгуки.'
                )}
                {selectedRole === 'professional' && (
                  '🔨 Як майстер ви зможете створити профіль, додати портфоліо і отримувати замовлення.'
                )}
                {selectedRole === 'company' && (
                  '🏢 Як компанія ви зможете розмістити профіль фірми, додати команду і залучати клієнтів.'
                )}
              </div>

              {/* Кнопка реєстрації */}
              <button
                type="submit"
                disabled={loading || success}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? t('register.creating')
                  : t('register.createAccount')}
              </button>
            </form>

            {/* Посилання на логін */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#6f665d]">
                {t('register.alreadyHave')}{' '}
                <button
                  onClick={() => navigateTo('/login')}
                  type="button"
                  className="font-semibold text-[#2f2a24] transition hover:text-[#9a5525]"
                >
                  {t('footer.signIn')}
                </button>
              </p>
            </div>
          </div>

          {/* Картка переваг — змінюється залежно від ролі */}
          <div className="glass-card p-5">
            <p className="text-sm font-bold text-[#2f2a24]">
              {selectedRole === 'client'
                ? 'Що ви отримаєте як клієнт:'
                : selectedRole === 'professional'
                ? 'Що ви отримаєте як майстер:'
                : 'Що ви отримаєте як компанія:'}
            </p>
            <div className="mt-4 space-y-2.5 text-sm text-[#6f665d]">
              {selectedRole === 'client' && (
                <>
                  <BenefitRow text="Доступ до каталогу перевірених майстрів" />
                  <BenefitRow text="Можливість розміщувати оголошення безкоштовно" />
                  <BenefitRow text="Прямий зв'язок без посередників" />
                  <BenefitRow text="Система відгуків для захисту від шахрайства" />
                </>
              )}
              {selectedRole === 'professional' && (
                <>
                  <BenefitRow text="Власний профіль з портфоліо і відгуками" />
                  <BenefitRow text="Прямі замовлення від клієнтів" />
                  <BenefitRow text="Рейтингова система для зростання репутації" />
                  <BenefitRow text="Можливість платного просування профілю" />
                </>
              )}
              {selectedRole === 'company' && (
                <>
                  <BenefitRow text="Профіль компанії з логотипом і описом" />
                  <BenefitRow text="Необмежена кількість оголошень" />
                  <BenefitRow text="Рекламні інструменти для залучення клієнтів" />
                  <BenefitRow text="Аналітика переглядів і звернень" />
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Рядок переваги з декоративною крапкою
function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[rgba(242,171,116,0.72)]" />
      <span>{text}</span>
    </div>
  )
}