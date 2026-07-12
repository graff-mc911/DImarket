import { IP_COUNTRY_MAP, isRegistrationCountry, parseRegistrationLocation } from './registrationGeoData'
import type { Profile } from './types'

const VIEWER_COUNTRY_KEY = 'dimarket_viewer_country'

export function storeViewerCountry(country: string) {
  if (!country.trim()) return
  try {
    sessionStorage.setItem(VIEWER_COUNTRY_KEY, country.trim())
  } catch {
    /* ignore */
  }
}

export function getViewerGeo(profile: Profile | null | undefined): {
  city: string | null
  country: string | null
} {
  if (profile?.location) {
    const parsed = parseRegistrationLocation(profile.location)
    if (parsed) {
      return { city: parsed.city, country: parsed.country }
    }
  }

  try {
    const stored = sessionStorage.getItem(VIEWER_COUNTRY_KEY)
    if (stored) return { city: null, country: stored }
  } catch {
    /* ignore */
  }

  return { city: null, country: null }
}

let ipDetectStarted = false

/** Одноразово визначає країну відвідувача для гео-таргетингу реклами (анонімні користувачі). */
export function detectViewerCountryOnce(): void {
  if (ipDetectStarted) return
  ipDetectStarted = true

  try {
    if (sessionStorage.getItem(VIEWER_COUNTRY_KEY)) return
  } catch {
    return
  }

  void fetch('https://ipapi.co/json/')
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { country_code?: string } | null) => {
      if (!data?.country_code) return
      const name = IP_COUNTRY_MAP[data.country_code]
      if (name && isRegistrationCountry(name)) storeViewerCountry(name)
    })
    .catch(() => {
      /* optional */
    })
}
