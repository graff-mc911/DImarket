import {
  formatListingLocation,
  GEO_PAGE_SIZE,
  listCities,
  listCountries,
  listRegions,
  matchCityInRegion,
  type GeoTree,
} from './geo.ts'
import type { BotStep, FlowReply, ListingDraft } from './flow.ts'
import { t, type BotLocale } from './i18n.ts'

export type InlineKeyboard = {
  reply_markup: { inline_keyboard: { text: string; callback_data: string }[][] }
}

export function startCountryStep(draft: ListingDraft, locale: BotLocale): FlowReply {
  const next = { ...draft, imageUrls: [...(draft.imageUrls ?? [])] }
  return { text: t(locale, 'askCountry'), step: 'country', draft: next }
}

export function applyCountry(
  draft: ListingDraft,
  country: string,
  tree: GeoTree,
  locale: BotLocale,
): FlowReply {
  const next = { ...draft, imageUrls: [...(draft.imageUrls ?? [])] }
  next.locationCountry = country
  next.locationRegion = undefined
  next.locationCity = undefined
  next.location = undefined
  const regions = listRegions(tree, country)
  next.geoRegionList = regions
  next.geoRegionPage = 0
  if (!regions.length) {
    return { text: t(locale, 'regionEmpty'), step: 'country', draft: next }
  }
  return { text: t(locale, 'askRegion'), step: 'region', draft: next }
}

export function applyRegion(
  draft: ListingDraft,
  region: string,
  tree: GeoTree,
  locale: BotLocale,
): FlowReply {
  const next = { ...draft, imageUrls: [...(draft.imageUrls ?? [])] }
  const country = next.locationCountry
  if (!country) return startCountryStep(next, locale)
  next.locationRegion = region
  next.locationCity = undefined
  next.location = undefined
  const cities = listCities(tree, country, region)
  next.geoCityList = cities
  next.geoCityPage = 0
  if (!cities.length) {
    return { text: t(locale, 'cityEmpty'), step: 'region', draft: next }
  }
  return { text: t(locale, 'askCityPick'), step: 'city', draft: next }
}

export function applyCity(
  draft: ListingDraft,
  city: string,
  locale: BotLocale,
): FlowReply {
  const next = { ...draft, imageUrls: [...(draft.imageUrls ?? [])] }
  const country = next.locationCountry
  const region = next.locationRegion
  if (!country || !region) {
    return { text: t(locale, 'askCountry'), step: 'country', draft: next }
  }
  next.locationCity = city
  next.location = formatListingLocation(city, region, country)
  return { text: t(locale, 'askBudget'), step: 'budget', draft: next }
}

export function buildCountryKeyboard(tree: GeoTree): InlineKeyboard {
  const countries = listCountries(tree).slice(0, 12)
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < countries.length; i += 2) {
    const row: { text: string; callback_data: string }[] = []
    for (let j = i; j < Math.min(i + 2, countries.length); j++) {
      const c = countries[j]
      const label = c === 'Ukraine' ? '🇺🇦 Україна' : c.slice(0, 28)
      row.push({ text: label, callback_data: `geo:c:${j}` })
    }
    rows.push(row)
  }
  return { reply_markup: { inline_keyboard: rows } }
}

export function buildRegionKeyboard(draft: ListingDraft): InlineKeyboard | null {
  const regions = draft.geoRegionList ?? []
  const page = draft.geoRegionPage ?? 0
  const start = page * GEO_PAGE_SIZE
  const slice = regions.slice(start, start + GEO_PAGE_SIZE)
  if (!slice.length) return null

  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < slice.length; i += 2) {
    const row: { text: string; callback_data: string }[] = []
    for (let j = i; j < Math.min(i + 2, slice.length); j++) {
      const globalIdx = start + j
      row.push({
        text: slice[j].slice(0, 32),
        callback_data: `geo:r:${globalIdx}`,
      })
    }
    rows.push(row)
  }

  const nav: { text: string; callback_data: string }[] = []
  if (page > 0) nav.push({ text: '◀', callback_data: `geo:rp:${page - 1}` })
  if (start + GEO_PAGE_SIZE < regions.length) {
    nav.push({ text: '▶', callback_data: `geo:rp:${page + 1}` })
  }
  if (nav.length) rows.push(nav)

  return { reply_markup: { inline_keyboard: rows } }
}

export function buildCityKeyboard(draft: ListingDraft): InlineKeyboard | null {
  const cities = draft.geoCityList ?? []
  const page = draft.geoCityPage ?? 0
  const start = page * GEO_PAGE_SIZE
  const slice = cities.slice(start, start + GEO_PAGE_SIZE)
  if (!slice.length) return null

  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < slice.length; i += 2) {
    const row: { text: string; callback_data: string }[] = []
    for (let j = i; j < Math.min(i + 2, slice.length); j++) {
      const globalIdx = start + j
      row.push({
        text: slice[j].slice(0, 32),
        callback_data: `geo:city:${globalIdx}`,
      })
    }
    rows.push(row)
  }

  const nav: { text: string; callback_data: string }[] = []
  if (page > 0) nav.push({ text: '◀', callback_data: `geo:cp:${page - 1}` })
  if (start + GEO_PAGE_SIZE < cities.length) {
    nav.push({ text: '▶', callback_data: `geo:cp:${page + 1}` })
  }
  if (nav.length) rows.push(nav)

  return { reply_markup: { inline_keyboard: rows } }
}

export function keyboardForGeoStep(
  step: BotStep,
  draft: ListingDraft,
  tree: GeoTree,
): InlineKeyboard | null {
  if (step === 'country') return buildCountryKeyboard(tree)
  if (step === 'region') return buildRegionKeyboard(draft)
  if (step === 'city') return buildCityKeyboard(draft)
  return null
}

export function resolveCountryByIndex(tree: GeoTree, index: number): string | null {
  const countries = listCountries(tree)
  return countries[index] ?? null
}
