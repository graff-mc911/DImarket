import { useEffect, useState } from 'react'
import { Building2, ChevronDown, Globe, HardHat, Loader, Megaphone, User, UserPlus } from 'lucide-react'
import { supabase }   from '../lib/supabase'
import { useApp }     from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LANGUAGES }  from '../lib/types'
import type { UserRole } from '../lib/types'

// ── Географічні дані (ключі англійською) ──────────────────
const GEO_DATA: Record<string, Record<string, string[]>> = {
  // EUROPE
  'Ukraine': {
    'Kyiv Oblast':         ['Kyiv','Boryspil','Brovary','Bila Tserkva'],
    'Lviv Oblast':         ['Lviv','Drohobych','Stryi','Truskavets'],
    'Odesa Oblast':        ['Odesa','Izmail','Chornomorsk'],
    'Kharkiv Oblast':      ['Kharkiv','Sumy','Poltava'],
    'Dnipro Oblast':       ['Dnipro','Kryvyi Rih','Nikopol'],
    'Zaporizhzhia Oblast': ['Zaporizhzhia','Melitopol'],
    'Vinnytsia Oblast':    ['Vinnytsia'],
    'Zakarpattia Oblast':  ['Uzhhorod','Mukachevo'],
    'Chernivtsi Oblast':   ['Chernivtsi'],
  },
  'Poland': {
    'Masovian':            ['Warsaw','Radom'],
    'Lesser Poland':       ['Krakow','Tarnow'],
    'Silesian':            ['Katowice','Czestochowa','Gliwice'],
    'Greater Poland':      ['Poznan','Kalisz'],
    'Lower Silesian':      ['Wroclaw','Legnica'],
    'Pomeranian':          ['Gdansk','Gdynia','Sopot'],
    'Lodz':                ['Lodz'],
    'Subcarpathian':       ['Rzeszow','Przemysl'],
  },
  'Germany': {
    'Bavaria':             ['Munich','Nuremberg','Augsburg'],
    'Berlin':              ['Berlin'],
    'Hesse':               ['Frankfurt','Wiesbaden','Darmstadt'],
    'Hamburg':             ['Hamburg'],
    'Baden-Württemberg':   ['Stuttgart','Karlsruhe','Freiburg'],
    'North Rhine-Westphalia':['Cologne','Düsseldorf','Dortmund','Essen'],
    'Saxony':              ['Dresden','Leipzig'],
    'Brandenburg':         ['Potsdam'],
  },
  'Spain': {
    'Catalonia':           ['Barcelona','Girona','Tarragona'],
    'Valencia':            ['Valencia','Alicante','Torrevieja'],
    'Madrid':              ['Madrid'],
    'Andalusia':           ['Seville','Malaga','Granada'],
    'Basque Country':      ['Bilbao','San Sebastian'],
    'Balearic Islands':    ['Palma','Ibiza'],
    'Canary Islands':      ['Las Palmas','Santa Cruz de Tenerife'],
  },
  'France': {
    'Île-de-France':       ['Paris','Versailles'],
    'Provence':            ['Marseille','Nice','Toulon'],
    'Auvergne-Rhône-Alpes':['Lyon','Grenoble'],
    'Occitanie':           ['Toulouse','Montpellier'],
    'New Aquitaine':       ['Bordeaux','Limoges'],
    'Brittany':            ['Rennes','Brest'],
  },
  'Italy': {
    'Lombardy':            ['Milan','Bergamo','Brescia'],
    'Lazio':               ['Rome','Latina'],
    'Campania':            ['Naples','Salerno'],
    'Sicily':              ['Palermo','Catania'],
    'Veneto':              ['Venice','Verona','Padua'],
    'Tuscany':             ['Florence','Siena'],
    'Emilia-Romagna':      ['Bologna','Modena','Parma'],
  },
  'Czech Republic': {
    'Prague':              ['Prague'],
    'Central Bohemia':     ['Kladno'],
    'Pilsen':              ['Pilsen'],
    'Moravia-Silesia':     ['Ostrava','Opava'],
    'South Moravia':       ['Brno','Znojmo'],
  },
  'Slovakia': {
    'Bratislava':          ['Bratislava'],
    'Trnava':              ['Trnava'],
    'Nitra':               ['Nitra','Komarno'],
    'Banska Bystrica':     ['Banska Bystrica'],
    'Kosice':              ['Kosice'],
  },
  'Hungary': {
    'Budapest':            ['Budapest'],
    'Gyor-Moson-Sopron':   ['Gyor','Sopron'],
    'Borsod':              ['Miskolc'],
    'Hajdu-Bihar':         ['Debrecen'],
    'Csongrad-Csanad':     ['Szeged'],
  },
  'Romania': {
    'Bucharest':           ['Bucharest'],
    'Cluj':                ['Cluj-Napoca'],
    'Timis':               ['Timisoara'],
    'Constanta':           ['Constanta'],
    'Iasi':                ['Iasi'],
  },
  'Austria': {
    'Vienna':              ['Vienna'],
    'Lower Austria':       ['St. Pölten','Krems'],
    'Upper Austria':       ['Linz','Wels'],
    'Styria':              ['Graz'],
    'Tyrol':               ['Innsbruck'],
    'Salzburg':            ['Salzburg'],
  },
  'United Kingdom': {
    'England':             ['London','Manchester','Birmingham','Leeds','Liverpool'],
    'Scotland':            ['Edinburgh','Glasgow','Aberdeen'],
    'Wales':               ['Cardiff','Swansea'],
    'Northern Ireland':    ['Belfast'],
  },
  'Netherlands': {
    'North Holland':       ['Amsterdam','Haarlem'],
    'South Holland':       ['Rotterdam','The Hague','Delft'],
    'Utrecht':             ['Utrecht'],
    'North Brabant':       ['Eindhoven','Tilburg'],
  },
  'Belgium': {
    'Brussels':            ['Brussels'],
    'Flanders':            ['Antwerp','Ghent','Bruges'],
    'Wallonia':            ['Liège','Namur','Charleroi'],
  },
  'Portugal': {
    'Lisbon':              ['Lisbon','Sintra','Cascais'],
    'Porto':               ['Porto','Braga'],
    'Algarve':             ['Faro','Portimao'],
  },
  'Greece': {
    'Attica':              ['Athens','Piraeus'],
    'Central Macedonia':   ['Thessaloniki','Kavala'],
    'Crete':               ['Heraklion','Chania'],
  },
  'Bulgaria': {
    'Sofia':               ['Sofia'],
    'Plovdiv':             ['Plovdiv'],
    'Varna':               ['Varna','Dobrich'],
    'Burgas':              ['Burgas'],
  },
  'Croatia': {
    'Zagreb':              ['Zagreb'],
    'Split-Dalmatia':      ['Split','Dubrovnik'],
    'Rijeka':              ['Rijeka','Pula'],
  },
  'Serbia': {
    'Belgrade':            ['Belgrade'],
    'South Backa':         ['Novi Sad','Subotica'],
    'Nisava':              ['Nis'],
  },
  'Switzerland': {
    'Zurich':              ['Zurich'],
    'Geneva':              ['Geneva'],
    'Bern':                ['Bern'],
    'Basel':               ['Basel'],
  },
  'Kazakhstan': {
    'Astana':              ['Astana'],
    'Almaty':              ['Almaty'],
    'Shymkent':            ['Shymkent'],
    'Aktobe':              ['Aktobe'],
    'Karaganda':           ['Karaganda'],
  },
  'UAE': {
    'Dubai':               ['Dubai'],
    'Abu Dhabi':           ['Abu Dhabi','Al Ain'],
    'Sharjah':             ['Sharjah'],
  },
  // AMERICAS
  'USA': {
    'California':          ['Los Angeles','San Francisco','San Diego','San Jose','Fresno'],
    'New York':            ['New York','Buffalo','Rochester'],
    'Texas':               ['Houston','Dallas','Austin','San Antonio'],
    'Florida':             ['Miami','Orlando','Tampa','Jacksonville'],
    'Illinois':            ['Chicago','Aurora','Rockford'],
    'Pennsylvania':        ['Philadelphia','Pittsburgh'],
    'Ohio':                ['Columbus','Cleveland','Cincinnati'],
    'Georgia':             ['Atlanta','Savannah'],
    'Washington':          ['Seattle','Spokane','Tacoma'],
    'Arizona':             ['Phoenix','Tucson','Scottsdale'],
    'Massachusetts':       ['Boston','Springfield'],
    'Nevada':              ['Las Vegas','Reno'],
    'Michigan':            ['Detroit','Grand Rapids'],
    'Colorado':            ['Denver','Colorado Springs'],
    'North Carolina':      ['Charlotte','Raleigh'],
    'Minnesota':           ['Minneapolis','Saint Paul'],
    'New Jersey':          ['Newark','Jersey City'],
    'Virginia':            ['Virginia Beach','Norfolk'],
    'Tennessee':           ['Nashville','Memphis'],
    'Missouri':            ['Saint Louis','Kansas City'],
  },
  'Canada': {
    'Ontario':             ['Toronto','Ottawa','Mississauga','Hamilton'],
    'British Columbia':    ['Vancouver','Surrey','Burnaby'],
    'Quebec':              ['Montreal','Quebec City','Laval'],
    'Alberta':             ['Calgary','Edmonton'],
    'Manitoba':            ['Winnipeg'],
    'Saskatchewan':        ['Saskatoon','Regina'],
    'Nova Scotia':         ['Halifax'],
  },
  'Mexico': {
    'Mexico City':         ['Mexico City'],
    'Jalisco':             ['Guadalajara','Zapopan','Tlaquepaque'],
    'Nuevo León':          ['Monterrey','San Nicolas'],
    'Puebla':              ['Puebla'],
    'Guerrero':            ['Acapulco'],
    'Quintana Roo':        ['Cancun','Playa del Carmen'],
    'Yucatan':             ['Merida'],
    'Baja California':     ['Tijuana','Mexicali'],
    'Chihuahua':           ['Chihuahua','Ciudad Juarez'],
    'Tamaulipas':          ['Matamoros','Reynosa'],
  },
  'Brazil': {
    'São Paulo':           ['São Paulo','Guarulhos','Campinas','Santo André'],
    'Rio de Janeiro':      ['Rio de Janeiro','Niterói','Duque de Caxias'],
    'Minas Gerais':        ['Belo Horizonte','Uberlândia'],
    'Bahia':               ['Salvador','Feira de Santana'],
    'Paraná':              ['Curitiba','Londrina'],
    'Rio Grande do Sul':   ['Porto Alegre','Caxias do Sul'],
    'Pernambuco':          ['Recife','Olinda'],
    'Ceará':               ['Fortaleza'],
    'Amazonas':            ['Manaus'],
    'Pará':                ['Belém'],
  },
  'Argentina': {
    'Buenos Aires':        ['Buenos Aires','La Plata','Mar del Plata'],
    'Córdoba':             ['Córdoba'],
    'Santa Fe':            ['Rosario','Santa Fe'],
    'Mendoza':             ['Mendoza'],
    'Tucumán':             ['San Miguel de Tucumán'],
    'Salta':               ['Salta'],
  },
  'Colombia': {
    'Cundinamarca':        ['Bogotá'],
    'Antioquia':           ['Medellín','Bello','Itagüí'],
    'Valle del Cauca':     ['Cali','Palmira'],
    'Atlántico':           ['Barranquilla'],
    'Bolívar':             ['Cartagena'],
  },
  'Chile': {
    'Metropolitan':        ['Santiago','Puente Alto','Maipú'],
    'Valparaíso':          ['Valparaíso','Viña del Mar'],
    'Biobío':              ['Concepción','Talcahuano'],
  },
  'Peru': {
    'Lima':                ['Lima','Callao'],
    'Arequipa':            ['Arequipa'],
    'La Libertad':         ['Trujillo'],
    'Lambayeque':          ['Chiclayo'],
  },
  'Venezuela': {
    'Capital District':    ['Caracas'],
    'Miranda':             ['Los Teques','Guatire'],
    'Zulia':               ['Maracaibo'],
    'Carabobo':            ['Valencia'],
    'Aragua':              ['Maracay'],
    'Bolívar':             ['Ciudad Bolívar'],
  },
  'Ecuador': {
    'Guayas':              ['Guayaquil','Samborondón'],
    'Pichincha':           ['Quito','Sangolquí'],
    'Manabí':              ['Manta','Portoviejo'],
  },
  'Bolivia': {
    'Santa Cruz':          ['Santa Cruz de la Sierra'],
    'La Paz':              ['La Paz','El Alto'],
    'Cochabamba':          ['Cochabamba'],
  },
  'Paraguay': {
    'Central':             ['Asunción','Lambaré'],
    'Alto Paraná':         ['Ciudad del Este'],
  },
  'Uruguay': {
    'Montevideo':          ['Montevideo'],
    'Canelones':           ['Las Piedras'],
    'Maldonado':           ['Punta del Este'],
  },
  'Panama': {
    'Panama':              ['Panama City','San Miguelito'],
    'Colón':               ['Colón'],
  },
  'Costa Rica': {
    'San José':            ['San José'],
    'Alajuela':            ['Alajuela'],
    'Cartago':             ['Cartago'],
  },
  'Guatemala': {
    'Guatemala':           ['Guatemala City'],
    'Mixco':               ['Mixco'],
    'Villa Nueva':         ['Villa Nueva'],
  },
  'Cuba': {
    'Havana':              ['Havana'],
    'Santiago de Cuba':    ['Santiago de Cuba'],
    'Camagüey':            ['Camagüey'],
  },
  'Dominican Republic': {
    'National District':   ['Santo Domingo'],
    'Santiago':            ['Santiago de los Caballeros'],
    'La Altagracia':       ['Punta Cana'],
  },
  'Puerto Rico': {
    'San Juan':            ['San Juan','Bayamón','Carolina'],
    'Ponce':               ['Ponce'],
  },
}

// Відповідність коду країни IP → ключ в GEO_DATA
const IP_COUNTRY_MAP: Record<string, string> = {
  UA:'Ukraine', PL:'Poland', DE:'Germany', ES:'Spain', FR:'France',
  IT:'Italy', CZ:'Czech Republic', SK:'Slovakia', HU:'Hungary', RO:'Romania',
  AT:'Austria', GB:'United Kingdom', NL:'Netherlands', BE:'Belgium',
  PT:'Portugal', GR:'Greece', BG:'Bulgaria', HR:'Croatia', RS:'Serbia',
  CH:'Switzerland', KZ:'Kazakhstan', AE:'UAE',
  US:'USA', CA:'Canada', MX:'Mexico', BR:'Brazil', AR:'Argentina',
  CO:'Colombia', CL:'Chile', PE:'Peru', VE:'Venezuela', EC:'Ecuador',
  BO:'Bolivia', PY:'Paraguay', UY:'Uruguay', PA:'Panama', CR:'Costa Rica',
  GT:'Guatemala', CU:'Cuba', DO:'Dominican Republic', PR:'Puerto Rico',
}

export function Register() {
  const { t, language, setLanguage } = useApp()

  const ROLE_OPTIONS = [
    { role: 'client'      as UserRole, icon: <User      className="h-6 w-6" />, title: t('register.roleClient'),       description: t('register.roleClientDesc') },
    { role: 'professional'as UserRole, icon: <HardHat   className="h-6 w-6" />, title: t('register.roleProfessional'), description: t('register.roleProfessionalDesc') },
    { role: 'company'     as UserRole, icon: <Building2 className="h-6 w-6" />, title: t('register.roleCompany'),      description: t('register.roleCompanyDesc') },
    { role: 'advertiser'  as UserRole, icon: <Megaphone className="h-6 w-6" />, title: t('register.roleAdvertiser'),   description: t('register.roleAdvertiserDesc') },
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

  const [country,    setCountry]    = useState('')
  const [region,     setRegion]     = useState('')
  const [city,       setCity]       = useState('')
  const [geoLoading, setGeoLoading] = useState(true)
  const [autoDetected, setAutoDetected] = useState(false)
  const [manualCity, setManualCity] = useState(false)

  const availableRegions = country ? Object.keys(GEO_DATA[country] || {}) : []
  const availableCities  = country && region ? (GEO_DATA[country]?.[region] || []) : []
  const sortedCountries  = Object.keys(GEO_DATA).sort()

  // Визначаємо країну за IP
  useEffect(() => {
    const detect = async () => {
      try {
        const res  = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        const name = IP_COUNTRY_MAP[data.country_code as string]
        if (name && GEO_DATA[name]) {
          setCountry(name)
          setAutoDetected(true)
        }
      } catch { /* нічого */ }
      finally { setGeoLoading(false) }
    }
    void detect()
  }, [])

  const handleCountryChange = (val: string) => {
    setCountry(val); setRegion(''); setCity(''); setManualCity(false); setAutoDetected(false)
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
                {country && region && !manualCity && availableCities.length > 0 && (
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

                {/* Ручне місто */}
                {(manualCity || (country && region && availableCities.length === 0)) && (
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="input-glass" placeholder={t('register.cityPlaceholder')} />
                )}

                {country && region && availableCities.length > 0 && (
                  <button type="button"
                    onClick={() => { setManualCity(v => !v); setCity('') }}
                    className="text-xs underline"
                    style={{ color: 'var(--accent-700)' }}>
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