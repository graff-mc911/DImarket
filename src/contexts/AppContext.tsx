/**
 * Глобальний стан застосунку: сесія Supabase, профіль, валюта та мова інтерфейсу.
 * Валюта й мова зберігаються в localStorage через ключі dimarket_*.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile, CURRENCIES, LANGUAGES } from '../lib/types'
import { getTranslation, TranslationKey, LanguageCode } from '../lib/i18n'

interface AppContextType {
  user: User | null
  profile: Profile | null
  currency: typeof CURRENCIES[number]
  language: typeof LANGUAGES[number]
  setCurrency: (currency: typeof CURRENCIES[number]) => void
  setLanguage: (language: typeof LANGUAGES[number]) => void
  signOut: () => Promise<void>
  t: (key: TranslationKey) => string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currency, setCurrency] = useState<typeof CURRENCIES[number]>(CURRENCIES[0])
  const [language, setLanguage] = useState<typeof LANGUAGES[number]>(LANGUAGES[0])

  useEffect(() => {
    // Читаємо лише нові ключі бренду DImarket
    const savedCurrency = localStorage.getItem('dimarket_currency')
    const savedLanguage = localStorage.getItem('dimarket_language')

    if (savedCurrency) {
      const found = CURRENCIES.find((c) => c.code === savedCurrency)
      if (found) setCurrency(found)
    }

    if (savedLanguage) {
      const found = LANGUAGES.find((l) => l.code === savedLanguage)
      if (found) setLanguage(found)
    }

    // Реєструємо відвідування лише один раз за поточну сесію вкладки.
    registerVisitOncePerSession()

    // Отримуємо активну сесію Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        void loadProfile(session.user.id)
      }
    })

    // Слухаємо зміни авторизації
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

    return () => subscription.unsubscribe()
  }, [])

  const registerVisitOncePerSession = async () => {
    try {
      // Якщо візит уже зареєстрований у цій вкладці — повторно не рахуємо
      const alreadyTracked = sessionStorage.getItem('dimarket_visit_tracked')
      if (alreadyTracked === '1') {
        return
      }

      // SQL-функція збільшує total_visits
      const { error } = await supabase.rpc('register_app_visit')

      if (!error) {
        sessionStorage.setItem('dimarket_visit_tracked', '1')
      } else {
        console.error('Помилка реєстрації візиту:', error)
      }
    } catch (err) {
      console.error('Непередбачена помилка реєстрації візиту:', err)
    }
  }

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) setProfile(data)
  }

  const handleSetCurrency = (newCurrency: typeof CURRENCIES[number]) => {
    setCurrency(newCurrency)
    localStorage.setItem('dimarket_currency', newCurrency.code)
  }

  const handleSetLanguage = (newLanguage: typeof LANGUAGES[number]) => {
    setLanguage(newLanguage)
    localStorage.setItem('dimarket_language', newLanguage.code)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const t = (key: TranslationKey): string => {
    return getTranslation(language.code as LanguageCode, key)
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