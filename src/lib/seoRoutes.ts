import { ALL_TRACKED_MARKETS, type LaunchMarket } from './launchMarkets'
import { CONSTRUCTION_WORK_GROUPS } from './constructionWorkGroups'

export const SEO_LOCALES = ['de', 'es', 'en', 'uk', 'pl', 'ru'] as const
export type SeoLocale = (typeof SEO_LOCALES)[number]

export interface SeoTradeRoute {
  groupSlug: string
  categorySlug: string
  labelKey: string
}

const CITY_SLUG_TO_MARKET: Record<string, string> = {
  darmstadt: 'de-darmstadt',
  alicante: 'es-alicante',
  madrid: 'es-madrid',
  frankfurt: 'de-frankfurt',
  hamburg: 'de-hamburg',
  valencia: 'es-valencia',
  barcelona: 'es-barcelona',
}

const TRADE_ALIASES: Record<string, Record<string, SeoTradeRoute>> = {
  de: {
    elektriker: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.electrician' },
    sanitaer: { groupSlug: 'plumbing', categorySlug: 'construction', labelKey: 'seo.trade.plumber' },
    maler: { groupSlug: 'painting', categorySlug: 'construction', labelKey: 'seo.trade.painter' },
    fliesenleger: { groupSlug: 'tiling', categorySlug: 'construction', labelKey: 'seo.trade.tiler' },
    handwerker: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.handyman' },
  },
  es: {
    electricista: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.electrician' },
    fontanero: { groupSlug: 'plumbing', categorySlug: 'construction', labelKey: 'seo.trade.plumber' },
    pintor: { groupSlug: 'painting', categorySlug: 'construction', labelKey: 'seo.trade.painter' },
    alicatador: { groupSlug: 'tiling', categorySlug: 'construction', labelKey: 'seo.trade.tiler' },
    reformas: { groupSlug: 'tiling', categorySlug: 'construction', labelKey: 'seo.trade.renovation' },
  },
  en: {
    electrician: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.electrician' },
    plumber: { groupSlug: 'plumbing', categorySlug: 'construction', labelKey: 'seo.trade.plumber' },
    painter: { groupSlug: 'painting', categorySlug: 'construction', labelKey: 'seo.trade.painter' },
    tiler: { groupSlug: 'tiling', categorySlug: 'construction', labelKey: 'seo.trade.tiler' },
  },
  uk: {
    elektrik: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.electrician' },
    santekhnik: { groupSlug: 'plumbing', categorySlug: 'construction', labelKey: 'seo.trade.plumber' },
    maliar: { groupSlug: 'painting', categorySlug: 'construction', labelKey: 'seo.trade.painter' },
  },
  pl: {
    elektryk: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.electrician' },
    hydraulik: { groupSlug: 'plumbing', categorySlug: 'construction', labelKey: 'seo.trade.plumber' },
    malarz: { groupSlug: 'painting', categorySlug: 'construction', labelKey: 'seo.trade.painter' },
  },
  ru: {
    elektrik: { groupSlug: 'electro', categorySlug: 'construction', labelKey: 'seo.trade.electrician' },
    santekhnik: { groupSlug: 'plumbing', categorySlug: 'construction', labelKey: 'seo.trade.plumber' },
    malyar: { groupSlug: 'painting', categorySlug: 'construction', labelKey: 'seo.trade.painter' },
  },
}

export interface ParsedSeoRoute {
  locale: SeoLocale
  citySlug: string
  tradeSlug: string
  market: LaunchMarket
  trade: SeoTradeRoute
}

export function isSeoLocale(value: string): value is SeoLocale {
  return (SEO_LOCALES as readonly string[]).includes(value)
}

export function parseSeoPath(parts: string[]): ParsedSeoRoute | null {
  if (parts.length !== 3) return null
  const [localeRaw, citySlug, tradeSlug] = parts
  if (!isSeoLocale(localeRaw)) return null

  const marketId = CITY_SLUG_TO_MARKET[citySlug.toLowerCase()]
  if (!marketId) return null

  const market = ALL_TRACKED_MARKETS.find((m) => m.id === marketId)
  if (!market) return null

  const trade = TRADE_ALIASES[localeRaw]?.[tradeSlug.toLowerCase()]
  if (!trade) return null

  return {
    locale: localeRaw,
    citySlug: citySlug.toLowerCase(),
    tradeSlug: tradeSlug.toLowerCase(),
    market,
    trade,
  }
}

export function subcategorySlugsForGroup(groupSlug: string): string[] {
  const group = CONSTRUCTION_WORK_GROUPS.find((g) => g.slug === groupSlug)
  return group?.subcategories.map((s) => s.slug) ?? []
}

export function seoPath(locale: SeoLocale, citySlug: string, tradeSlug: string): string {
  return `/${locale}/${citySlug.toLowerCase()}/${tradeSlug.toLowerCase()}`
}

export function launchSeoLinks(): Array<{
  path: string
  locale: SeoLocale
  city: string
  trade: string
  labelKey: string
}> {
  const links: Array<{
    path: string
    locale: SeoLocale
    city: string
    trade: string
    labelKey: string
  }> = []
  const launchCities = [
    { slug: 'darmstadt', marketId: 'de-darmstadt' },
    { slug: 'alicante', marketId: 'es-alicante' },
    { slug: 'madrid', marketId: 'es-madrid' },
  ]

  for (const city of launchCities) {
    const market = ALL_TRACKED_MARKETS.find((m) => m.id === city.marketId)
    if (!market) continue
    const locale: SeoLocale = market.countryCode === 'DE' ? 'de' : 'es'
    const trades = TRADE_ALIASES[locale]
    if (!trades) continue
    for (const tradeSlug of Object.keys(trades).slice(0, 4)) {
      links.push({
        path: seoPath(locale, city.slug, tradeSlug),
        locale,
        city: market.city,
        trade: tradeSlug,
        labelKey: trades[tradeSlug].labelKey,
      })
    }
  }
  return links
}
