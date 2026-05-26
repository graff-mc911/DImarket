/** Product knowledge injected into every LLM prompt */

export const DIMARKET_KNOWLEDGE = `
DiMarket (https://dimarket.app/) is a multi-role marketplace platform.

Registration types:
- CLIENT — search and order services from trusted masters and companies
- MASTER — individual specialist offering services and receiving orders
- COMPANY — business offering services at scale
- ADVERTISER — place ads on the platform to reach thousands of users

Value props by role:
- CLIENT: "Find trusted masters and companies near you — use DiMarket"
- MASTER: "Grow your client base — register as a Master on DiMarket and get orders"
- COMPANY: "Scale your business — add your company to the DiMarket marketplace"
- ADVERTISER: "Reach thousands of users — advertise on DiMarket"

Always include the canonical URL https://dimarket.app/ when appropriate.
Never promise guaranteed income. Comply with local advertising laws.
`.trim()

export const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  linkedin: 3000,
  telegram: 4096,
  pinterest: 500,
  reddit: 40000,
  email_subject: 150,
}

export const ROLE_ROTATION = ['client', 'master', 'company', 'advertiser'] as const

export const DEFAULT_MARKETS = [
  { countryCode: 'UA', languageCode: 'uk', label: 'Ukraine' },
  { countryCode: 'US', languageCode: 'en', label: 'United States' },
  { countryCode: 'DE', languageCode: 'de', label: 'Germany' },
  { countryCode: 'PL', languageCode: 'pl', label: 'Poland' },
  { countryCode: 'FR', languageCode: 'fr', label: 'France' },
  { countryCode: 'ES', languageCode: 'es', label: 'Spain' },
  { countryCode: 'PT', languageCode: 'pt', label: 'Portugal' },
  { countryCode: 'AE', languageCode: 'ar', label: 'UAE' },
  { countryCode: 'CN', languageCode: 'zh', label: 'China' },
  { countryCode: 'IN', languageCode: 'hi', label: 'India' },
]
