import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile, CURRENCIES, LANGUAGES } from '../lib/types'
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
    // Завантажуємо збережену валюту з localStorage.
    const savedCurrency = localStorage.getItem('buildster_currency')

    // Завантажуємо збережену мову з localStorage.
    const savedLanguage = localStorage.getItem('buildster_language')

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
    // щоб не накручувати статистику через звичайні перерендери.
    void registerVisitOncePerSession()

    // Отримуємо поточну сесію Supabase після старту застосунку.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        void loadProfile(session.user.id)
      }
    })

    // Підписуємось на зміни авторизації,
    // щоб інтерфейс оновлювався одразу після входу або виходу.
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
    // Завантажуємо профіль поточного користувача.
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      setProfile(data)
    }
  }

  const handleSetCurrency = (newCurrency: typeof CURRENCIES[number]) => {
    setCurrency(newCurrency)
    localStorage.setItem('buildster_currency', newCurrency.code)
  }

  const handleSetLanguage = (newLanguage: typeof LANGUAGES[number]) => {
    setLanguage(newLanguage)
    localStorage.setItem('buildster_language', newLanguage.code)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
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
