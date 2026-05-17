// ============================================================
// Register.tsx — Реєстрація нового користувача
// Додано: окремі поля country, region, city
// ============================================================

import { useState } from 'react'
import { Building2, HardHat, User, UserPlus, ChevronDown } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import type { UserRole } from '../lib/types'

// Список країн з регіонами і містами
const GEO_DATA: Record<string, Record<string, string[]>> = {
  'Україна': {
    'Київська': ['Київ', 'Бориспіль', 'Бровари', 'Біла Церква'],
    'Львівська': ['Львів', 'Дрогобич', 'Стрий', 'Трускавець'],
    'Одеська': ['Одеса', 'Ізмаїл', 'Чорноморськ'],
    'Харківська': ['Харків', 'Суми', 'Полтава'],
    'Дніпропетровська': ['Дніпро', 'Кривий Ріг', 'Нікополь'],
    'Запорізька': ['Запоріжжя', 'Мелітополь'],
    'Вінницька': ['Вінниця', 'Жмеринка'],
    'Житомирська': ['Житомир', 'Бердичів'],
    'Закарпатська': ['Ужгород', 'Мукачево'],
    'Чернівецька': ['Чернівці', 'Хотин'],
  },
  'Польща': {
    'Мазовецьке': ['Варшава', 'Радом'],
    'Малопольське': ['Краків', 'Тарнів'],
    'Сілезьке': ['Катовіце', 'Ченстохова', 'Гливіце'],
    'Великопольське': ['Познань', 'Каліш'],
    'Нижньосілезьке': ['Вроцлав', 'Легниця'],
    'Поморське': ['Гданськ', 'Гдиня', 'Сопот'],
    'Лодзьке': ['Лодзь', 'Петркув-Трибунальський'],
    'Підкарпатське': ['Жешув', 'Перемишль'],
  },
  'Німеччина': {
    'Баварія': ['Мюнхен', 'Нюрнберг', 'Аугсбург'],
    'Берлін': ['Берлін'],
    'Гессен': ['Франкфурт-на-Майні', 'Вісбаден', 'Дармштадт'],
    'Гамбург': ['Гамбург'],
    'Баден-Вюртемберг': ['Штутгарт', 'Карлсруе', 'Фрайбург'],
    'Північний Рейн-Вестфалія': ['Кельн', 'Дюссельдорф', 'Дортмунд', 'Ессен'],
    'Саксонія': ['Дрезден', 'Лейпциг'],
    'Бранденбург': ['Потсдам', 'Котбус'],
  },
  'Іспанія': {
    'Каталонія': ['Барселона', 'Жирона', 'Таррагона'],
    'Валенсія': ['Валенсія', 'Аліканте', 'Торревʼєха'],
    'Мадрид': ['Мадрид'],
    'Андалусія': ['Севілья', 'Малага', 'Гранада'],
    'Країна Басків': ['Більбао', 'Сан-Себастьян'],
    'Балеарські острови': ['Пальма', 'Ібіца'],
    'Канарські острови': ['Лас-Пальмас', 'Санта-Крус-де-Тенерифе'],
  },
  'Чехія': {
    'Прага': ['Прага'],
    'Середньочеський': ['Кладно', 'Младá-Болеслав'],
    'Південночеський': ['Чеські Будейовиці', 'Тàбор'],
    'Пльзенський': ['Пльзень'],
    'Моравськосілезький': ['Острава', 'Опава'],
    'Південноморавський': ['Брно', 'Зноймо'],
  },
  'Словаччина': {
    'Братиславський': ['Братислава', 'Сенець'],
    'Трнавський': ['Трнава', 'Галанта'],
    'Нітранський': ['Нітра', 'Комарно'],
    'Банськобистрицький': ['Банська Бистриця', 'Зволен'],
    'Кошицький': ['Кошиці', 'Спішська Нова Вес'],
  },
  'Угорщина': {
    'Будапешт': ['Будапешт'],
    'Пешт': ['Ердi', 'Гедельле'],
    'Дьєр-Мошон-Шопрон': ['Дьєр', 'Шопрон'],
    'Боршод-Абауй-Земплен': ['Мішкольц'],
    'Хайду-Бігар': ['Дебрецен'],
    'Чонград-Чанад': ['Сегед'],
  },
  'Румунія': {
    'Бухарест': ['Бухарест'],
    'Клуж': ['Клуж-Напока', 'Дей'],
    'Тімішоара': ['Тімішоара', 'Лугож'],
    'Констанца': ['Констанца', 'Мангалія'],
    'Яси': ['Яси', 'Пашкань'],
  },
  'Австрія': {
    'Відень': ['Відень'],
    'Нижня Австрія': ['Санкт-Пельтен', 'Кремс'],
    'Верхня Австрія': ['Лінц', 'Вельс'],
    'Штирія': ['Грац', 'Леобен'],
    'Тіроль': ['Інсбрук', 'Кіцбюель'],
    'Зальцбург': ['Зальцбург'],
  },
  'Великобританія': {
    'Англія': ['Лондон', 'Манчестер', 'Бірмінгем', 'Лідс', 'Ліверпуль'],
    'Шотландія': ['Единбург', 'Глазго', 'Абердин'],
    'Уельс': ['Кардіфф', 'Суонсі'],
    'Північна Ірландія': ['Белфаст', 'Дері'],
  },
  'Франція': {
    'Іль-де-Франс': ['Париж', 'Версаль', 'Булонь-Біянкур'],
    'Прованс': ['Марсель', 'Ніцца', 'Тулон'],
    'Овернь-Рона-Альпи': ['Ліон', 'Гренобль', 'Сент-Етьєн'],
    'Окситанія': ['Тулуза', 'Монпельє', 'Нім'],
    'Нова Аквітанія': ['Бордо', 'Лімож'],
    'Бретань': ['Ренн', 'Брест'],
  },
  'Італія': {
    'Ломбардія': ['Мілан', 'Бергамо', 'Брешія'],
    'Лаціо': ['Рим', 'Латина'],
    'Кампанія': ['Неаполь', 'Салерно'],
    'Сицилія': ['Палермо', 'Катанія'],
    'Венето': ['Венеція', 'Верона', 'Падуя'],
    'Тоскана': ['Флоренція', 'Сієна', 'Пізa'],
    'Емілія-Романья': ['Болонья', 'Модена', 'Парма'],
  },
  'Нідерланди': {
    'Північна Голландія': ['Амстердам', 'Харлем'],
    'Південна Голландія': ['Роттердам', 'Гаага', 'Делфт'],
    'Утрехт': ['Утрехт'],
    'Північний Брабант': ['Ейндговен', 'Тілбург'],
  },
  'Бельгія': {
    'Брюссель': ['Брюссель'],
    'Фландрія': ['Антверпен', 'Гент', 'Брюгге'],
    'Валлонія': ['Льєж', 'Намюр', 'Шарлеруа'],
  },
  'Португалія': {
    'Лісабон': ['Лісабон', 'Сінтра', 'Каскайш'],
    'Порту': ['Порту', 'Вілла-Нова-де-Гайя', 'Брага'],
    'Алгарве': ['Фару', 'Лоуле', 'Портімао'],
  },
  'Греція': {
    'Аттика': ['Афіни', 'Пірей'],
    'Центральна Македонія': ['Салоніки', 'Кавала'],
    'Крит': ['Іракліон', 'Ханья'],
  },
  'Болгарія': {
    'Софія': ['Софія', 'Перник'],
    'Пловдивська': ['Пловдив', 'Асеновград'],
    'Варненська': ['Варна', 'Добрич'],
    'Бургаська': ['Бургас', 'Сонячний берег'],
  },
  'Хорватія': {
    'Загребська': ['Загреб', 'Велика Гориця'],
    'Спліт-Далмація': ['Спліт', 'Дубровник', 'Шибенік'],
    'Рієка': ['Рієка', 'Пула'],
  },
  'Сербія': {
    'Белград': ['Белград', 'Земун'],
    'Южнобачський': ['Новий Сад', 'Суботиця'],
    'Нішавський': ['Ніш', 'Пірот'],
  },
  'Швейцарія': {
    'Цюрих': ['Цюрих', 'Вінтертур'],
    'Женева': ['Женева', 'Каруж'],
    'Берн': ['Берн', 'Тун'],
    'Базель': ['Базель', 'Ріен'],
  },
  'Казахстан': {
    'Астана': ['Астана'],
    'Алмати': ['Алмати', 'Талдикорган'],
    'Шимкент': ['Шимкент', 'Туркестан'],
    'Актобе': ['Актобе'],
    'Карагандинська': ['Караганда', 'Темиртау'],
  },
  'ОАЕ': {
    'Дубай': ['Дубай'],
    'Абу-Дабі': ['Абу-Дабі', 'Аль-Айн'],
    'Шарджа': ['Шарджа'],
  },
}

const ROLE_OPTIONS = [
  { role: 'client' as UserRole, icon: <User className="h-6 w-6" />, title: 'Клієнт', description: 'Шукаю майстра або послугу' },
  { role: 'professional' as UserRole, icon: <HardHat className="h-6 w-6" />, title: 'Майстер', description: 'Надаю послуги як фізична особа' },
  { role: 'company' as UserRole, icon: <Building2 className="h-6 w-6" />, title: 'Компанія', description: 'Реєструю фірму або бізнес' },
]

export function Register() {
  const { t } = useApp()

  const [fullName, setFullName]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [phone, setPhone]             = useState('')
  const [companyName, setCompanyName] = useState('')

  // Географія
  const [country, setCountry] = useState('')
  const [region, setRegion]   = useState('')
  const [city, setCity]       = useState('')

  const [selectedRole, setSelectedRole] = useState<UserRole>('client')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)

  // Доступні регіони для вибраної країни
  const availableRegions = country ? Object.keys(GEO_DATA[country] || {}) : []

  // Доступні міста для вибраного регіону
  const availableCities = country && region
    ? (GEO_DATA[country]?.[region] || [])
    : country
    ? Object.values(GEO_DATA[country] || {}).flat()
    : []

  const handleCountryChange = (val: string) => {
    setCountry(val)
    setRegion('')
    setCity('')
  }

  const handleRegionChange = (val: string) => {
    setRegion(val)
    setCity('')
  }

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
          location:        [city, region, country].filter(Boolean).join(', '),
          country:         country || null,
          region:          region  || null,
          city:            city    || null,
          user_role:       selectedRole,
          is_professional: selectedRole === 'professional' || selectedRole === 'company',
        })

        if (profileError) throw profileError

        setSuccess(true)
        setTimeout(() => {
          navigateTo(selectedRole === 'client' ? '/listings' : '/settings')
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg min-h-screen px-4 py-10 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-lg items-center justify-center">
        <div className="w-full space-y-6">
          <div className="glass-panel p-6 md:p-8">

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
                {selectedRole === 'client' ? 'Акаунт створено! Переходимо...' : 'Акаунт створено! Заповніть профіль...'}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-6 space-y-5 text-left">

              {/* Вибір ролі */}
              <div>
                <label className="mb-3 block text-sm font-bold text-[#2f2a24]">Хто ви?</label>
                <div className="grid grid-cols-3 gap-2">
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
                      <span className="text-[10px] leading-tight" style={{ color: 'var(--ink-500)' }}>{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Назва компанії */}
              {selectedRole === 'company' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">Назва компанії *</label>
                  <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-glass" placeholder="Наприклад: БудСервіс ТОВ" />
                </div>
              )}

              {/* Ім'я */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {selectedRole === 'company' ? "Ім'я представника" : t('register.fullName')} *
                </label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="input-glass" placeholder={t('register.fullNamePlaceholder')} />
              </div>

              {/* Email і пароль */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('login.email')} *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-glass" placeholder={t('login.emailPlaceholder')} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('login.password')} *</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input-glass" placeholder={t('login.passwordPlaceholder')} />
                <p className="mt-1.5 text-xs text-[#7a7168]">{t('register.passwordMin')}</p>
              </div>

              {/* Телефон */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('createAd.phone')}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-glass" placeholder={t('register.phonePlaceholder')} />
              </div>

              {/* ===== Географія ===== */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#2f2a24]">Ваше місцезнаходження</label>

                {/* Країна */}
                <div className="relative">
                  <select
                    value={country}
                    onChange={e => handleCountryChange(e.target.value)}
                    className="input-glass appearance-none pr-10"
                  >
                    <option value="">Оберіть країну</option>
                    {Object.keys(GEO_DATA).sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                </div>

                {/* Регіон */}
                {country && (
                  <div className="relative">
                    <select
                      value={region}
                      onChange={e => handleRegionChange(e.target.value)}
                      className="input-glass appearance-none pr-10"
                    >
                      <option value="">Оберіть регіон (необов'язково)</option>
                      {availableRegions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                  </div>
                )}

                {/* Місто */}
                {country && (
                  <div className="relative">
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="input-glass appearance-none pr-10"
                    >
                      <option value="">Оберіть місто</option>
                      {availableCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                  </div>
                )}

                {/* Якщо міста немає в списку */}
                {country && (
                  <p className="text-xs text-[#7a7168]">
                    Немає вашого міста в списку?{' '}
                    <button type="button" onClick={() => setCity('')} className="underline">
                      Введіть вручну
                    </button>
                  </p>
                )}

                {/* Ручне введення міста */}
                {country && !availableCities.includes(city) && (
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="input-glass"
                    placeholder="Введіть назву міста вручну"
                  />
                )}
              </div>

              {/* Підказка */}
              <div className="rounded-[16px] p-3 text-xs leading-relaxed"
                style={{ background: 'rgba(199,138,96,0.08)', color: 'var(--ink-600)' }}>
                {selectedRole === 'client' && '👤 Як клієнт ви зможете створювати оголошення, знаходити майстрів і залишати відгуки.'}
                {selectedRole === 'professional' && '🔨 Як майстер ви зможете створити профіль, додати портфоліо і отримувати замовлення.'}
                {selectedRole === 'company' && '🏢 Як компанія ви зможете розмістити профіль фірми і залучати клієнтів.'}
              </div>

              <button type="submit" disabled={loading || success} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? t('register.creating') : t('register.createAccount')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#6f665d]">
                {t('register.alreadyHave')}{' '}
                <button onClick={() => navigateTo('/login')} type="button" className="font-semibold text-[#2f2a24] transition hover:text-[#9a5525]">
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