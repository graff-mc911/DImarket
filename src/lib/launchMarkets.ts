import type { LanguageCode } from './locales'

export interface LaunchMarket {
  id: string
  countryCode: string
  countryName: string
  region: string
  city: string
  /** Пріоритетні мови: локальна + EN + діаспора (UA/PL/RU) */
  languages: LanguageCode[]
  isLaunchMarket: boolean
  seedTargets: {
    professionals: number
    companies: number
    requests: number
  }
}

/** Активні пілотні ринки — фокус залучення, без обмеження інших міст */
export const LAUNCH_MARKETS: LaunchMarket[] = [
  {
    id: 'de-darmstadt',
    countryCode: 'DE',
    countryName: 'Germany',
    region: 'Hessen',
    city: 'Darmstadt',
    languages: ['de', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: true,
    seedTargets: { professionals: 30, companies: 8, requests: 15 },
  },
  {
    id: 'es-alicante',
    countryCode: 'ES',
    countryName: 'Spain',
    region: 'Valencia',
    city: 'Alicante',
    languages: ['es', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: true,
    seedTargets: { professionals: 30, companies: 8, requests: 15 },
  },
  {
    id: 'es-madrid',
    countryCode: 'ES',
    countryName: 'Spain',
    region: 'Madrid',
    city: 'Madrid',
    languages: ['es', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: true,
    seedTargets: { professionals: 50, companies: 12, requests: 20 },
  },
]

/** Наступна хвиля після досягнення KPI пілотів */
export const EXPANSION_MARKETS: LaunchMarket[] = [
  {
    id: 'de-frankfurt',
    countryCode: 'DE',
    countryName: 'Germany',
    region: 'Hessen',
    city: 'Frankfurt',
    languages: ['de', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: false,
    seedTargets: { professionals: 40, companies: 10, requests: 20 },
  },
  {
    id: 'de-hamburg',
    countryCode: 'DE',
    countryName: 'Germany',
    region: 'Hamburg',
    city: 'Hamburg',
    languages: ['de', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: false,
    seedTargets: { professionals: 40, companies: 10, requests: 20 },
  },
  {
    id: 'es-valencia',
    countryCode: 'ES',
    countryName: 'Spain',
    region: 'Valencia',
    city: 'Valencia',
    languages: ['es', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: false,
    seedTargets: { professionals: 35, companies: 8, requests: 18 },
  },
  {
    id: 'es-barcelona',
    countryCode: 'ES',
    countryName: 'Spain',
    region: 'Catalonia',
    city: 'Barcelona',
    languages: ['es', 'en', 'uk', 'pl', 'ru'],
    isLaunchMarket: false,
    seedTargets: { professionals: 45, companies: 12, requests: 22 },
  },
]

export const ALL_TRACKED_MARKETS: LaunchMarket[] = [
  ...LAUNCH_MARKETS,
  ...EXPANSION_MARKETS,
]

export function locationMatchesMarket(
  location: string | null | undefined,
  market: LaunchMarket,
): boolean {
  const normalized = (location || '').trim().toLowerCase()
  if (!normalized) return false
  const city = market.city.toLowerCase()
  const region = market.region.toLowerCase()
  const country = market.countryName.toLowerCase()
  const countryCode = market.countryCode.toLowerCase()
  return (
    normalized.includes(city) ||
    normalized.includes(`${city},`) ||
    normalized.includes(`${city} `) ||
    (normalized.includes(region) && normalized.includes(country)) ||
    normalized.includes(countryCode)
  )
}

export function findLaunchMarketByCity(city: string): LaunchMarket | undefined {
  const needle = city.trim().toLowerCase()
  return ALL_TRACKED_MARKETS.find((m) => m.city.toLowerCase() === needle)
}
