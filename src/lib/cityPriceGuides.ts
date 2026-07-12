/**
 * Орієнтовні діапазони цін (EUR) для launch-міст DE/ES.
 * Для SEO-гайдів і блоку «типові ціни» на сторінках міст.
 */

export interface CityTradePriceGuide {
  marketId: string
  groupSlug: string
  minEur: number
  maxEur: number
  unitKey: string
  noteKey: string
}

export const CITY_TRADE_PRICE_GUIDES: CityTradePriceGuide[] = [
  {
    marketId: 'de-darmstadt',
    groupSlug: 'electro',
    minEur: 55,
    maxEur: 95,
    unitKey: 'priceGuide.unit.hour',
    noteKey: 'priceGuide.note.electro',
  },
  {
    marketId: 'de-darmstadt',
    groupSlug: 'plumbing',
    minEur: 50,
    maxEur: 85,
    unitKey: 'priceGuide.unit.hour',
    noteKey: 'priceGuide.note.plumbing',
  },
  {
    marketId: 'de-darmstadt',
    groupSlug: 'painting',
    minEur: 12,
    maxEur: 22,
    unitKey: 'priceGuide.unit.sqm',
    noteKey: 'priceGuide.note.painting',
  },
  {
    marketId: 'es-alicante',
    groupSlug: 'electro',
    minEur: 40,
    maxEur: 70,
    unitKey: 'priceGuide.unit.hour',
    noteKey: 'priceGuide.note.electro',
  },
  {
    marketId: 'es-alicante',
    groupSlug: 'plumbing',
    minEur: 38,
    maxEur: 65,
    unitKey: 'priceGuide.unit.hour',
    noteKey: 'priceGuide.note.plumbing',
  },
  {
    marketId: 'es-alicante',
    groupSlug: 'painting',
    minEur: 10,
    maxEur: 18,
    unitKey: 'priceGuide.unit.sqm',
    noteKey: 'priceGuide.note.painting',
  },
  {
    marketId: 'es-madrid',
    groupSlug: 'electro',
    minEur: 48,
    maxEur: 85,
    unitKey: 'priceGuide.unit.hour',
    noteKey: 'priceGuide.note.electro',
  },
  {
    marketId: 'es-madrid',
    groupSlug: 'plumbing',
    minEur: 45,
    maxEur: 78,
    unitKey: 'priceGuide.unit.hour',
    noteKey: 'priceGuide.note.plumbing',
  },
  {
    marketId: 'es-madrid',
    groupSlug: 'tiling',
    minEur: 28,
    maxEur: 45,
    unitKey: 'priceGuide.unit.sqm',
    noteKey: 'priceGuide.note.tiling',
  },
]

export function priceGuideForMarketTrade(
  marketId: string,
  groupSlug: string,
): CityTradePriceGuide | undefined {
  return CITY_TRADE_PRICE_GUIDES.find(
    (g) => g.marketId === marketId && g.groupSlug === groupSlug,
  )
}
