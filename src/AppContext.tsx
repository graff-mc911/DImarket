import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { type Profile, CURRENCIES, LANGUAGES } from '../lib/types'
import { getTranslation, type LanguageCode } from '../lib/i18n'

interface AppContextType {
  user: User | null
  profile: Profile | null
  currency: typeof CURRENCIES[number]
  language: typeof LANGUAGES[number]
  setCurrency: (currency: typeof CURRENCIES[number]) => void
  setLanguage: (language: typeof LANGUAGES[number]) => void
  signOut: () => Promise<void>
  t: (key: string) => string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currency, setCurrency] = useState<typeof CURRENCIES[number]>(CURRENCIES[0])
  const [language, setLanguage] = useState<typeof LANGUAGES[number]>(LANGUAGES[0])

  useEffect(() => {
    // Підтримуємо і нові, і старі ключі localStorage,
    // щоб не втратити налаштування після перейменування проєкту.
    const savedCurrency =
      localStorage.getItem('dimarket_currency') ?? localStorage.getItem('buildster_currency')

    const savedLanguage =
      localStorage.getItem('dimarket_language') ?? localStorage.getItem('buildster_language')

    if (savedCurrency) {
      const foundCurrency = CURRENCIES.find((item) => item.code === savedCurrency)

      if (foundCurrency) {
        setCurrency(foundCurrency)
      }
    }

    if (savedLanguage) {
      const foundLanguage = LANGUAGES.find((item) => item.code === savedLanguage)

      if (foundLanguage) {
        setLanguage(foundLanguage)
      }
    }

    // Реєструємо візит лише один раз за поточну сесію вкладки,
    // щоб не накручувати статистику через перерендери.
    void registerVisitOncePerSession()

    // Важливо: використовуємо getUser(), а не getSession().
    // getSession() може повернути кешовану сесію навіть якщо акаунт уже видалений,
    // а getUser() перевіряє користувача через Supabase Auth.
    void bootstrapAuth()

    // Оновлюємо стан після входу / виходу.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        void loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const bootstrapAuth = async () => {
    try {
      const {
        data: { user: activeUser },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      setUser(activeUser ?? null)

      if (activeUser) {
        await loadProfile(activeUser.id)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Помилка відновлення сесії:', error)

      // Якщо токен битий або користувача вже видалено,
      // очищаємо локальну авторизацію, щоб застосунок не показував "привида" акаунта.
      await supabase.auth.signOut({ scope: 'local' })
      setUser(null)
      setProfile(null)
    }
  }

  const registerVisitOncePerSession = async () => {
    try {
      const alreadyTracked = sessionStorage.getItem('dimarket_visit_tracked')

      if (alreadyTracked === '1') {
        return
      }

      // Викликаємо SQL-функцію, яка збільшує total_visits.
      const { error } = await supabase.rpc('register_app_visit')

      if (!error) {
        sessionStorage.setItem('dimarket_visit_tracked', '1')
      } else {
        console.error('Помилка реєстрації візиту:', error)
      }
    } catch (error) {
      console.error('Непередбачена помилка реєстрації візиту:', error)
    }
  }

  const loadProfile = async (userId: string) => {
    try {
      // Завантажуємо профіль поточного користувача.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      // Якщо профілю вже немає, явно очищаємо стан.
      setProfile(data ?? null)
    } catch (error) {
      console.error('Помилка завантаження профілю:', error)
      setProfile(null)
    }
  }

  const handleSetCurrency = (newCurrency: typeof CURRENCIES[number]) => {
    setCurrency(newCurrency)

    // Пишемо одразу в обидва ключі для сумісності.
    localStorage.setItem('dimarket_currency', newCurrency.code)
    localStorage.setItem('buildster_currency', newCurrency.code)
  }

  const handleSetLanguage = (newLanguage: typeof LANGUAGES[number]) => {
    setLanguage(newLanguage)

    // Пишемо одразу в обидва ключі для сумісності.
    localStorage.setItem('dimarket_language', newLanguage.code)
    localStorage.setItem('buildster_language', newLanguage.code)
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Помилка виходу з акаунта:', error)

      // Якщо серверний signOut не вдався, все одно прибираємо локальну сесію.
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  const t = (key: string): string => {
    return getTranslation(language.code as LanguageCode, key as never)
  }

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        currency,
        language,
        setCurrency: handleSetCurrency,
        setLanguage: handleSetLanguage,
        signOut,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }

  return context
}
