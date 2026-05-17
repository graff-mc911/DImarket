import { useEffect, useState } from 'react'
import { Building2, ChevronDown, Globe, HardHat, Loader, Megaphone, User, UserPlus } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LANGUAGES }  from '../lib/types'
import type { UserRole } from '../lib/types'

// ── Географічні дані ───────────────────────────────────────
const GEO_DATA: Record<string, Record<string, string[]>> = {
  // ЄВРОПА
  'Україна': {
    'Київська':          ['Київ','Бориспіль','Бровари','Біла Церква'],
    'Львівська':         ['Львів','Дрогобич','Стрий','Трускавець'],
    'Одеська':           ['Одеса','Ізмаїл','Чорноморськ'],
    'Харківська':        ['Харків','Суми','Полтава'],
    'Дніпропетровська':  ['Дніпро','Кривий Ріг','Нікополь'],
    'Запорізька':        ['Запоріжжя','Мелітополь'],
    'Вінницька':         ['Вінниця'],
    'Закарпатська':      ['Ужгород','Мукачево'],
    'Чернівецька':       ['Чернівці'],
  },
  'Польща': {
    'Мазовецьке':        ['Варшава','Радом'],
    'Малопольське':      ['Краків','Тарнів'],
    'Сілезьке':          ['Катовіце','Ченстохова','Гливіце'],
    'Великопольське':    ['Познань','Каліш'],
    'Нижньосілезьке':    ['Вроцлав','Легниця'],
    'Поморське':         ['Гданськ','Гдиня','Сопот'],
    'Лодзьке':           ['Лодзь'],
    'Підкарпатське':     ['Жешув','Перемишль'],
  },
  'Німеччина': {
    'Баварія':           ['Мюнхен','Нюрнберг','Аугсбург'],
    'Берлін':            ['Берлін'],
    'Гессен':            ['Франкфурт-на-Майні','Вісбаден','Дармштадт'],
    'Гамбург':           ['Гамбург'],
    'Баден-Вюртемберг':  ['Штутгарт','Карлсруе','Фрайбург'],
    'Пн.Рейн-Вестфалія': ['Кельн','Дюссельдорф','Дортмунд','Ессен'],
    'Саксонія':          ['Дрезден','Лейпциг'],
    'Бранденбург':       ['Потсдам'],
  },
  'Іспанія': {
    'Каталонія':         ['Барселона','Жирона','Таррагона'],
    'Валенсія':          ['Валенсія','Аліканте','Торревєха'],
    'Мадрид':            ['Мадрид'],
    'Андалусія':         ['Севілья','Малага','Гранада'],
    'Країна Басків':     ['Більбао','Сан-Себастьян'],
    'Балеарські о-ви':   ['Пальма','Ібіца'],
    'Канарські о-ви':    ['Лас-Пальмас','Санта-Крус-де-Тенерифе'],
  },
  'Франція': {
    'Іль-де-Франс':      ['Париж','Версаль'],
    'Прованс':           ['Марсель','Ніцца','Тулон'],
    'Овернь-Рона-Альпи': ['Ліон','Гренобль'],
    'Окситанія':         ['Тулуза','Монпельє'],
    'Нова Аквітанія':    ['Бордо','Лімож'],
    'Бретань':           ['Ренн','Брест'],
  },
  'Італія': {
    'Ломбардія':         ['Мілан','Бергамо','Брешія'],
    'Лаціо':             ['Рим','Латина'],
    'Кампанія':          ['Неаполь','Салерно'],
    'Сицилія':           ['Палермо','Катанія'],
    'Венето':            ['Венеція','Верона','Падуя'],
    'Тоскана':           ['Флоренція','Сієна'],
    'Емілія-Романья':    ['Болонья','Модена','Парма'],
  },
  'Чехія': {
    'Прага':             ['Прага'],
    'Середньочеський':   ['Кладно'],
    'Пльзенський':       ['Пльзень'],
    'Моравськосілезький':['Острава','Опава'],
    'Південноморавський':['Брно','Зноймо'],
  },
  'Словаччина': {
    'Братиславський':    ['Братислава'],
    'Трнавський':        ['Трнава'],
    'Нітранський':       ['Нітра','Комарно'],
    'Банськобистрицький':['Банська Бистриця'],
    'Кошицький':         ['Кошиці'],
  },
  'Угорщина': {
    'Будапешт':          ['Будапешт'],
    'Дьєр-Мошон-Шопрон':['Дьєр','Шопрон'],
    'Боршод':            ['Мішкольц'],
    'Хайду-Бігар':       ['Дебрецен'],
    'Чонград-Чанад':     ['Сегед'],
  },
  'Румунія': {
    'Бухарест':          ['Бухарест'],
    'Клуж':              ['Клуж-Напока'],
    'Тімішоара':         ['Тімішоара'],
    'Констанца':         ['Констанца'],
    'Яси':               ['Яси'],
  },
  'Австрія': {
    'Відень':            ['Відень'],
    'Нижня Австрія':     ['Санкт-Пельтен','Кремс'],
    'Верхня Австрія':    ['Лінц','Вельс'],
    'Штирія':            ['Грац'],
    'Тіроль':            ['Інсбрук'],
    'Зальцбург':         ['Зальцбург'],
  },
  'Великобританія': {
    'Англія':            ['Лондон','Манчестер','Бірмінгем','Лідс','Ліверпуль'],
    'Шотландія':         ['Единбург','Глазго','Абердин'],
    'Уельс':             ['Кардіфф','Суонсі'],
    'Північна Ірландія': ['Белфаст'],
  },
  'Нідерланди': {
    'Пн.Голландія':      ['Амстердам','Харлем'],
    'Пд.Голландія':      ['Роттердам','Гаага','Делфт'],
    'Утрехт':            ['Утрехт'],
    'Пн.Брабант':        ['Ейндговен','Тілбург'],
  },
  'Бельгія': {
    'Брюссель':          ['Брюссель'],
    'Фландрія':          ['Антверпен','Гент','Брюгге'],
    'Валлонія':          ['Льєж','Намюр','Шарлеруа'],
  },
  'Португалія': {
    'Лісабон':           ['Лісабон','Сінтра','Каскайш'],
    'Порту':             ['Порту','Брага'],
    'Алгарве':           ['Фару','Портімао'],
  },
  'Греція': {
    'Аттика':            ['Афіни','Пірей'],
    'Центр.Македонія':   ['Салоніки','Кавала'],
    'Крит':              ['Іракліон','Ханья'],
  },
  'Болгарія': {
    'Софія':             ['Софія'],
    'Пловдивська':       ['Пловдив'],
    'Варненська':        ['Варна','Добрич'],
    'Бургаська':         ['Бургас'],
  },
  'Хорватія': {
    'Загребська':        ['Загреб'],
    'Спліт-Далмація':    ['Спліт','Дубровник'],
    'Рієка':             ['Рієка','Пула'],
  },
  'Сербія': {
    'Белград':           ['Белград'],
    'Пд.Бачський':       ['Новий Сад','Суботиця'],
    'Нішавський':        ['Ніш'],
  },
  'Швейцарія': {
    'Цюрих':             ['Цюрих'],
    'Женева':            ['Женева'],
    'Берн':              ['Берн'],
    'Базель':            ['Базель'],
  },
  'Казахстан': {
    'Астана':            ['Астана'],
    'Алмати':            ['Алмати'],
    'Шимкент':           ['Шимкент'],
    'Актобе':            ['Актобе'],
    'Карагандинська':    ['Караганда'],
  },
  'ОАЕ': {
    'Дубай':             ['Дубай'],
    'Абу-Дабі':          ['Абу-Дабі','Аль-Айн'],
    'Шарджа':            ['Шарджа'],
  },
  // АМЕРИКАНСЬКИЙ КОНТИНЕНТ
  'США': {
    'Каліфорнія':        ['Лос-Анджелес','Сан-Франциско','Сан-Дієго','Сан-Хосе','Фресно'],
    'Нью-Йорк':          ['Нью-Йорк','Буффало','Рочестер'],
    'Техас':             ['Хьюстон','Даллас','Остін','Сан-Антоніо'],
    'Флорида':           ['Маямі','Орландо','Тампа','Джексонвілл'],
    'Іллінойс':          ['Чикаго','Аврора','Рокфорд'],
    'Пенсільванія':      ['Філадельфія','Піттсбург'],
    'Огайо':             ['Колумбус','Клівленд','Цинциннаті'],
    'Джорджія':          ['Атланта','Саванна'],
    'Вашингтон':         ['Сіетл','Спокейн','Такома'],
    'Аризона':           ['Фенікс','Тусон','Скоттсдейл'],
    'Массачусетс':       ['Бостон','Спрингфілд'],
    'Невада':            ['Лас-Вегас','Рено'],
    'Мічиган':           ['Детройт','Гранд-Рапідс'],
    'Колорадо':          ['Денвер','Колорадо-Спрінгс'],
    'Північна Кароліна': ['Шарлотт','Роллі'],
    'Мінесота':          ['Міннеаполіс','Сент-Пол'],
    'Нью-Джерсі':        ['Ньюарк','Джерсі-Сіті'],
    'Вірджинія':         ['Вірджинія-Біч','Норфолк'],
    'Теннессі':          ['Нашвілл','Мемфіс'],
    'Міссурі':           ['Сент-Луїс','Канзас-Сіті'],
  },
  'Канада': {
    'Онтаріо':           ['Торонто','Оттава','Міссісога','Гамільтон'],
    'Британська Колумбія':['Ванкувер','Суррей','Бернабі'],
    'Квебек':            ['Монреаль','Квебек-Сіті','Лаваль'],
    'Альберта':          ['Калгарі','Едмонтон'],
    'Манітоба':          ['Вінніпег'],
    'Саскачеван':        ['Саскатун','Реджайна'],
    'Нова Шотландія':    ['Галіфакс'],
  },
  'Мексика': {
    'Мехіко (місто)':    ['Мехіко'],
    'Халіско':           ['Гвадалахара','Сапопан','Тлакепаке'],
    'Нуево-Леон':        ['Монтеррей','Сан-Ніколас'],
    'Пуебла':            ['Пуебла'],
    'Герреро':           ['Акапулько'],
    'Кінтана-Роо':       ['Канкун','Плая-дель-Кармен'],
    'Юкатан':            ['Мерида'],
    'Нижня Каліфорнія':  ['Тіхуана','Мехікалі'],
    'Чіуауа':            ['Чіуауа','Сьюдад-Хуарес'],
    'Тамауліпас':        ['Матаморос','Рейноса'],
  },
  'Бразилія': {
    'Сан-Паулу':         ['Сан-Паулу','Гуарульос','Кампінас','Санту-Андре'],
    'Ріо-де-Жанейро':    ['Ріо-де-Жанейро','Нітерой','Дукі-де-Кашіас'],
    'Мінас-Жерайс':      ['Белу-Оризонті','Уберландія'],
    'Баія':              ['Салвадор','Феїра-де-Сантана'],
    'Паранá':            ['Куритиба','Лондріна'],
    'Ріо-Гранді-ду-Сул': ['Порту-Алегрі','Кашіас-ду-Сул'],
    'Пернамбуку':        ['Ресіфі','Олінда'],
    'Сеара':             ['Форталеза','Кауру'],
    'Амазонас':          ['Манаус'],
    'Пара':              ['Белен'],
  },
  'Аргентина': {
    'Буенос-Айрес':      ['Буенос-Айрес','Ла-Плата','Мар-дель-Плата'],
    'Кордова':           ['Кордова','Рio-Куарто'],
    'Санта-Фе':          ['Росаріо','Санта-Фе'],
    'Мендоса':           ['Мендоса'],
    'Тукуман':           ['Сан-Мігель-де-Тукуман'],
    'Сальта':            ['Сальта'],
  },
  'Колумбія': {
    'Кундінамарка':      ['Богота'],
    'Антіокія':          ['Медельїн','Бельо','Ітагуї'],
    'Валье-дель-Каука':  ['Калі','Пальміра'],
    'Атлантіко':         ['Барранкілья'],
    'Болівар':           ['Картахена'],
  },
  'Чилі': {
    'Метрополітана':     ['Сантьяго','Пуенте-Альто','Макул'],
    'Вальпараісо':       ['Вальпараісо','Вінья-дель-Мар'],
    'Бiобiо':            ['Консепсьон','Талькауано'],
  },
  'Перу': {
    'Ліма':              ['Ліма','Кальяо'],
    'Аррекіпа':          ['Аррекіпа'],
    'Ла-Лібертад':       ['Труйільо'],
    'Ламбаєке':          ['Чиклайо'],
  },
  'Венесуела': {
    'Столичний округ':   ['Каракас'],
    'Міранда':           ['Лос-Текес','Гуатіре'],
    'Сулія':             ['Маракайбо'],
    'Карабобо':          ['Валенсія'],
    'Арагуа':            ['Маракай'],
    'Болівар':           ['Сьюдад-Болівар'],
  },
  'Еквадор': {
    'Гуаяс':             ['Гуаякіль','Самборондон'],
    'Пічінча':           ['Кіто','Сангольки'],
    'Маnабi':            ['Манта','Портовьєхо'],
  },
  'Болівія': {
    'Санта-Крус':        ['Санта-Крус-де-ла-Сьєрра'],
    'Ла-Пас':            ['Ла-Пас','Ель-Альто'],
    'Кочабамба':         ['Кочабамба'],
  },
  'Парагвай': {
    'Центральний':       ['Асунсьон','Ламбаре'],
    'Альто-Парана':      ['Сьюдад-дель-Есте'],
  },
  'Уругвай': {
    'Монтевідео':        ['Монтевідео'],
    'Канелонес':         ['Лас-Педрас'],
    'Мальдонадо':        ['Пунта-дель-Есте'],
  },
  'Панама': {
    'Панама':            ['Панама-Сіті','Сан-Мігеліто'],
    'Колон':             ['Колон'],
  },
  'Коста-Рика': {
    'Сан-Хосе':          ['Сан-Хосе'],
    'Алахуела':          ['Алахуела'],
    'Картаго':           ['Картаго'],
  },
  'Гватемала': {
    'Гватемала':         ['Гватемала-Сіті'],
    'Міксько':           ['Міксько'],
    'Вілья-Нуева':       ['Вілья-Нуева'],
  },
  'Куба': {
    'Гавана':            ['Гавана'],
    'Сантьяго-де-Куба':  ['Сантьяго-де-Куба'],
    'Камагуей':          ['Камагуей'],
  },
  'Домініканська Республіка': {
    'Нац.округ':         ['Санто-Домінго'],
    'Сантьяго':          ['Сантьяго-де-лос-Кабальєрос'],
    'Ла-Альтаграсія':    ['Пунта-Кана','Іслабон'],
  },
  'Пуерто-Рико': {
    'Сан-Хуан':          ['Сан-Хуан','Байямон','Каролiна'],
    'Понсе':             ['Понсе'],
  },
}

// Відповідність коду країни IP → назва в GEO_DATA
const IP_COUNTRY_MAP: Record<string, string> = {
  UA:'Україна', PL:'Польща', DE:'Німеччина', ES:'Іспанія', FR:'Франція',
  IT:'Італія', CZ:'Чехія', SK:'Словаччина', HU:'Угорщина', RO:'Румунія',
  AT:'Австрія', GB:'Великобританія', NL:'Нідерланди', BE:'Бельгія',
  PT:'Португалія', GR:'Греція', BG:'Болгарія', HR:'Хорватія', RS:'Сербія',
  CH:'Швейцарія', KZ:'Казахстан', AE:'ОАЕ',
  US:'США', CA:'Канада', MX:'Мексика', BR:'Бразилія', AR:'Аргентина',
  CO:'Колумбія', CL:'Чилі', PE:'Перу', VE:'Венесуела', EC:'Еквадор',
  BO:'Болівія', PY:'Парагвай', UY:'Уругвай', PA:'Панама', CR:'Коста-Рика',
  GT:'Гватемала', CU:'Куба', DO:'Домініканська Республіка', PR:'Пуерто-Рико',
}

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

  // Географія
  const [country,     setCountry]     = useState('')
  const [region,      setRegion]      = useState('')
  const [city,        setCity]        = useState('')
  const [geoLoading,  setGeoLoading]  = useState(true)
  const [manualCity,  setManualCity]  = useState(false)

  const availableRegions = country ? Object.keys(GEO_DATA[country] || {}) : []
  const availableCities  = country && region ? (GEO_DATA[country]?.[region] || []) : []

  // Визначаємо країну автоматично за IP при завантаженні
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res  = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        const code = data.country_code as string
        const name = IP_COUNTRY_MAP[code]
        if (name && GEO_DATA[name]) {
          setCountry(name)
        }
      } catch {
        // не вдалось — нічого страшного, користувач вибере вручну
      } finally {
        setGeoLoading(false)
      }
    }
    void detectCountry()
  }, [])

  const handleCountryChange = (val: string) => {
    setCountry(val); setRegion(''); setCity(''); setManualCity(false)
  }
  const handleRegionChange = (val: string) => {
    setRegion(val); setCity(''); setManualCity(false)
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
          phone:           phone || null,
          location:        [city, region, country].filter(Boolean).join(', ') || null,
          country:         country || null,
          region:          region  || null,
          city:            city    || null,
          user_role:       selectedRole,
          is_professional: selectedRole === 'professional' || selectedRole === 'company',
        })
        if (profileError) throw profileError
        setSuccess(true)
        setTimeout(() => {
          if (selectedRole === 'client')          navigateTo('/listings')
          else if (selectedRole === 'advertiser') navigateTo('/advertising')
          else                                    navigateTo('/settings')
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
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
                    <button key={option.role} type="button" onClick={() => setSelectedRole(option.role)}
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

              {/* ===== ГЕОГРАФІЯ ===== */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#2f2a24]">
                  {t('register.yourLocation')}
                </label>

                {/* Індикатор автовизначення */}
                {geoLoading && (
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-500)]">
                    <Loader className="h-3 w-3 animate-spin" />
                    Визначаємо вашу країну...
                  </div>
                )}

                {/* Країна */}
                <div className="relative">
                  <select value={country} onChange={e => handleCountryChange(e.target.value)}
                    className="input-glass appearance-none pr-10">
                    <option value="">{t('register.selectCountry')}</option>
                    {Object.keys(GEO_DATA).sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                  {country && !geoLoading && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-green-600 pointer-events-none opacity-0">
                      {/* прапорець */}
                    </span>
                  )}
                </div>

                {/* Якщо країна визначена автоматично — показуємо підказку */}
                {country && !geoLoading && (
                  <p className="text-xs text-[var(--ink-500)]">
                    🌍 Країну визначено автоматично. Змініть якщо потрібно.
                  </p>
                )}

                {/* Регіон */}
                {country && availableRegions.length > 0 && (
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

                {/* Місто */}
                {country && region && !manualCity && (
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

                {/* Ручне введення міста */}
                {country && region && manualCity && (
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="input-glass" placeholder={t('register.cityPlaceholder')} />
                )}

                {/* Посилання "Немає в списку" */}
                {country && region && (
                  <button type="button" onClick={() => { setManualCity(v => !v); setCity('') }}
                    className="text-xs text-[var(--accent-700)] underline">
                    {manualCity ? t('register.selectCity') : t('register.cityNotInList')}
                  </button>
                )}
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