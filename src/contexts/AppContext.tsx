/**
 * Глобальний стан застосунку: сесія Supabase, профіль, валюта, мова та локація пошуку.
 * Валюта, мова й локація зберігаються в localStorage через ключі dimarket_*.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile, CURRENCIES, LANGUAGES } from '../lib/types'
import { getTranslation, ensureLanguageLoaded, resolveUiLanguageCode, TranslationKey, LanguageCode } from '../lib/i18n'
import { getPostLoginPath } from '../lib/authMessages'
import { ensureUserProfile, getIntendedRole } from '../lib/profileSync'
import { isSiteOwner } from '../lib/siteOwner'
import { isOAuthCallbackUrl } from '../lib/oauth'
import { navigateTo } from '../lib/navigation'
import { EMPTY_GEO_SEARCH, geoSearchEqual, type GeoSearchState } from '../lib/geoSearch'
import {
  initializeGlobalLocation,
  saveGlobalLocation,
  syncLocationToCurrentUrl,
} from '../lib/globalLocation'

interface AppContextType {
  user: User | null
  profile: Profile | null
  /** True after first getSession + profile sync attempt finishes */
  authReady: boolean
  currency: typeof CURRENCIES[number]
  language: typeof LANGUAGES[number]
  /** Single source of truth for search location across the app */
  location: GeoSearchState
  setCurrency: (currency: typeof CURRENCIES[number]) => void
  setLanguage: (language: typeof LANGUAGES[number]) => void
  setLocation: (next: GeoSearchState) => void
  patchLocation: (partial: Partial<GeoSearchState>) => void
  clearLocation: () => void
  refreshProfile: () => Promise<Profile | null>
  signOut: () => Promise<void>
  t: (key: TranslationKey) => string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [currency, setCurrency] = useState<typeof CURRENCIES[number]>(() => {
    const saved = localStorage.getItem('dimarket_currency')
    return CURRENCIES.find((c) => c.code === saved) ?? CURRENCIES[0]
  })
  const [language, setLanguage] = useState<typeof LANGUAGES[number]>(() => {
    const code = resolveUiLanguageCode(localStorage.getItem('dimarket_language'))
    return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES.find((l) => l.code === 'uk') ?? LANGUAGES[0]
  })
  const [location, setLocationState] = useState<GeoSearchState>(() => initializeGlobalLocation())
  /** Bumps when a locale pack finishes loading so `t()` re-renders with real strings. */
  const [i18nTick, setI18nTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    void ensureLanguageLoaded(language.code).then(() => {
      if (!cancelled) setI18nTick((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [language.code])

  const syncProfile = useCallback(async (authUser: User, redirectAfterOAuth: boolean) => {
    let resolved = await ensureUserProfile(authUser)

    if (!resolved) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()
      resolved = data ?? null
    }

    // Fallback display profile so Header never looks logged-out while row is missing
    if (!resolved) {
      const meta = authUser.user_metadata ?? {}
      const fallbackName =
        (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
        authUser.email?.split('@')[0] ||
        'User'
      resolved = {
        id: authUser.id,
        full_name: fallbackName,
        bio: null,
        phone: typeof meta.phone === 'string' ? meta.phone : null,
        location: typeof meta.location === 'string' ? meta.location : null,
        avatar_url: null,
        profile_photo: null,
        website: null,
        user_role: 'client',
        is_professional: false,
        is_site_owner: false,
        rating: 0,
        total_reviews: 0,
        client_rating: null,
        client_total_reviews: null,
        is_verified: false,
        verified_at: null,
        verification_level: 'none',
        email_verified_at: null,
        phone_verified_at: null,
        is_premium: false,
        premium_expires_at: null,
        is_featured: false,
        featured_expires_at: null,
        plan_id: null,
        stripe_customer_id: null,
        stripe_account_id: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_details_submitted: false,
        stripe_connect_onboarded_at: null,
        stripe_subscription_id: null,
        subscription_status: null,
        subscription_period_end: null,
        lead_credits: null,
        support_tier: null,
        profile_views: null,
        response_rate: null,
        portfolio_images: null,
        notifications_enabled: null,
        preferred_language: null,
        preferred_currency: null,
        work_subcategory_slugs: [],
        completed_jobs: 0,
        languages: [],
        availability_status: 'available',
        service_latitude: null,
        service_longitude: null,
        service_radius_km: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Profile
    }

    resolved = {
      ...resolved,
      is_site_owner: isSiteOwner(resolved, authUser.email),
      user_role: isSiteOwner(resolved, authUser.email) ? 'owner' : resolved.user_role,
    }

    setProfile(resolved)

    if (redirectAfterOAuth && resolved) {
      const path = getPostLoginPath(resolved, {
        intendedRole: getIntendedRole(resolved, authUser),
        email: authUser.email,
      })
      window.history.replaceState({}, '', path)
      navigateTo(path)
    }

    return resolved
  }, [])

  useEffect(() => {
    const savedCurrency = localStorage.getItem('dimarket_currency')
    const savedLanguage = localStorage.getItem('dimarket_language')

    if (savedCurrency) {
      const found = CURRENCIES.find((c) => c.code === savedCurrency)
      if (found) setCurrency(found)
    }

    if (savedLanguage) {
      const code = resolveUiLanguageCode(savedLanguage)
      const found = LANGUAGES.find((l) => l.code === code)
      if (found) setLanguage(found)
    }

    registerVisitOncePerSession()

    let cancelled = false

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      setUser(session?.user ?? null)

      if (session?.user) {
        await syncProfile(session.user, false)
      } else {
        setProfile(null)
      }

      if (!cancelled) setAuthReady(true)
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer Supabase client calls — sync work inside the callback deadlocks auth.
      setTimeout(() => {
        if (cancelled) return
        setUser(session?.user ?? null)

        if (session?.user) {
          void syncProfile(session.user, event === 'SIGNED_IN' && isOAuthCallbackUrl()).finally(
            () => {
              if (!cancelled) setAuthReady(true)
            },
          )
        } else {
          setProfile(null)
          setAuthReady(true)
        }
      }, 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [syncProfile])

  useEffect(() => {
    document.documentElement.lang = language.code
    document.documentElement.dir = language.code === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('translate', 'no')
    document.documentElement.classList.add('notranslate')
    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale) {
      ogLocale.setAttribute('content', language.code.replace('-', '_'))
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:locale')
      meta.setAttribute('content', language.code.replace('-', '_'))
      document.head.appendChild(meta)
    }
  }, [language.code])

  // Persist + mirror into URL on location-aware routes
  useEffect(() => {
    saveGlobalLocation(location)
    syncLocationToCurrentUrl(location)
  }, [location])

  // Keep state in sync when user navigates via browser back/forward
  useEffect(() => {
    const onPop = () => {
      const next = initializeGlobalLocation()
      setLocationState((prev) => (geoSearchEqual(prev, next) ? prev : next))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
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
    } catch (err) {
      console.error('Непередбачена помилка реєстрації візиту:', err)
    }
  }

  const refreshProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      setProfile(null)
      return null
    }
    setUser(authUser)
    return syncProfile(authUser, false)
  }, [syncProfile])

  const handleSetCurrency = (newCurrency: typeof CURRENCIES[number]) => {
    setCurrency(newCurrency)
    localStorage.setItem('dimarket_currency', newCurrency.code)
  }

  const handleSetLanguage = (newLanguage: typeof LANGUAGES[number]) => {
    const code = resolveUiLanguageCode(newLanguage.code)
    const resolved = LANGUAGES.find((l) => l.code === code) ?? newLanguage
    setLanguage(resolved)
    localStorage.setItem('dimarket_language', resolved.code)
    void ensureLanguageLoaded(resolved.code).then(() => setI18nTick((n) => n + 1))
  }

  const setLocation = useCallback((next: GeoSearchState) => {
    setLocationState(next)
  }, [])

  const patchLocation = useCallback((partial: Partial<GeoSearchState>) => {
    setLocationState((prev) => ({ ...prev, ...partial }))
  }, [])

  const clearLocation = useCallback(() => {
    setLocationState({ ...EMPTY_GEO_SEARCH })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const t = useCallback((key: TranslationKey): string => {
    return getTranslation(language.code as LanguageCode, key)
  }, [language.code, i18nTick])

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        authReady,
        currency,
        language,
        location,
        setCurrency: handleSetCurrency,
        setLanguage: handleSetLanguage,
        setLocation,
        patchLocation,
        clearLocation,
        refreshProfile,
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
