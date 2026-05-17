import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { type Profile, type UserRole, CURRENCIES, LANGUAGES } from '../lib/types'
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

    void registerVisitOncePerSession()
    void bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        void loadOrCreateProfile(session.user)
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
        await loadOrCreateProfile(activeUser)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Помилка відновлення сесії:', error)
      await supabase.auth.signOut({ scope: 'local' })
      setUser(null)
      setProfile(null)
    }
  }

  const normalizeRole = (value: unknown): UserRole => {
    if (value === 'professional' || value === 'company' || value === 'owner') {
      return value
    }

    return 'client'
  }

  const normalizeText = (value: unknown): string | null => {
    if (typeof value !== 'string') {
      return null
    }

    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  const loadOrCreateProfile = async (activeUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        setProfile(data)
        return
      }

      const metadata = activeUser.user_metadata ?? {}
      const role = normalizeRole(metadata.user_role)

      const profilePayload = {
        id: activeUser.id,
        full_name: normalizeText(metadata.full_name),
        phone: normalizeText(metadata.phone),
        location: normalizeText(metadata.location),
        user_role: role,
        is_professional: role === 'professional' || role === 'company',
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('*')
        .maybeSingle()

      if (createError) {
        throw createError
      }

      setProfile(createdProfile ?? null)
    } catch (error) {
      console.error('Помилка завантаження або створення профілю:', error)
      setProfile(null)
    }
  }

  const handleSetCurrency = (newCurrency: typeof CURRENCIES[number]) => {
    setCurrency(newCurrency)
    localStorage.setItem('dimarket_currency', newCurrency.code)
    localStorage.setItem('buildster_currency', newCurrency.code)
  }

  const handleSetLanguage = (newLanguage: typeof LANGUAGES[number]) => {
    setLanguage(newLanguage)
    localStorage.setItem('dimarket_language', newLanguage.code)
    localStorage.setItem('buildster_language', newLanguage.code)
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Помилка виходу з акаунта:', error)
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
