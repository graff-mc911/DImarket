import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type GeoTree = Map<string, Map<string, string[]>>

const POPULAR_COUNTRIES = [
  'Ukraine',
  'Poland',
  'Germany',
  'Czech Republic',
  'Slovakia',
  'Romania',
  'Hungary',
  'Spain',
  'Italy',
  'France',
]

/** Мінімальний довідник (якщо geo_catalog недоступний). */
const FALLBACK_UA: Record<string, string[]> = {
  'Вінницька': ['Вінниця', 'Жмеринка', 'Гайсин', 'Бар'],
  'Волинська': ['Луцьк', 'Ковель', 'Володимир', 'Нововолинськ'],
  'Дніпропетровська': ['Дніпро', 'Кривий Ріг', "Кам'янське", 'Нікополь', 'Павлоград'],
  'Донецька': ['Донецьк', 'Маріуполь', 'Краматорськ', 'Словʼянськ'],
  'Житомирська': ['Житомир', 'Бердичів', 'Коростень', 'Малин'],
  'Закарпатська': ['Ужгород', 'Мукачеве', 'Хуст', 'Берегове'],
  'Запорізька': ['Запоріжжя', 'Мелітополь', 'Бердянськ', 'Енергодар'],
  'Івано-Франківська': ['Івано-Франківськ', 'Коломия', 'Калуш', 'Яремче'],
  'Київська': ['Київ', 'Бровари', 'Бориспіль', 'Ірпінь', 'Біла Церква', 'Фастів', 'Вишгород'],
  'Кіровоградська': ['Кропивницький', 'Олександрія', 'Світловодськ'],
  'Луганська': ['Луганськ', 'Сєвєродонецьк', 'Лисичанськ'],
  'Львівська': ['Львів', 'Дрогобич', 'Стрий', 'Самбір', 'Червоноград'],
  'Миколаївська': ['Миколаїв', 'Первомайськ', 'Очаків'],
  'Одеська': ['Одеса', 'Ізмаїл', 'Чорноморськ', 'Южне', 'Білгород-Дністровський'],
  'Полтавська': ['Полтава', 'Кременчук', 'Лубни'],
  'Рівненська': ['Рівне', 'Дубно', 'Костопіль'],
  'Сумська': ['Суми', 'Конотоп', 'Шостка'],
  'Тернопільська': ['Тернопіль', 'Чортків', 'Кременець'],
  'Харківська': ['Харків', 'Ізюм', 'Лозова', 'Купʼянськ'],
  'Херсонська': ['Херсон', 'Нова Каховка'],
  'Хмельницька': ['Хмельницький', "Кам'янець-Подільський", 'Шепетівка'],
  'Черкаська': ['Черкаси', 'Умань', 'Сміла'],
  'Чернівецька': ['Чернівці', 'Хотин'],
  'Чернігівська': ['Чернігів', 'Ніжин', 'Прилуки'],
}

let cachedTree: GeoTree | null = null
let cacheAt = 0
const CACHE_MS = 10 * 60 * 1000

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ')
}

export function formatListingLocation(city: string, region: string, country: string): string {
  return [city.trim(), region.trim() || 'Інші', country.trim()].join(', ')
}

function addToTree(tree: GeoTree, country: string, region: string, city: string) {
  if (!country || !city) return
  const r = region?.trim() || 'Інші'
  if (!tree.has(country)) tree.set(country, new Map())
  const regions = tree.get(country)!
  if (!regions.has(r)) regions.set(r, [])
  const list = regions.get(r)!
  if (!list.includes(city)) list.push(city)
}

export async function loadGeoTree(admin: SupabaseClient): Promise<GeoTree> {
  const now = Date.now()
  if (cachedTree && now - cacheAt < CACHE_MS) return cachedTree

  const tree: GeoTree = new Map()

  for (const [region, cities] of Object.entries(FALLBACK_UA)) {
    for (const city of cities) addToTree(tree, 'Ukraine', region, city)
  }

  try {
    const { data } = await admin
      .from('geo_catalog')
      .select('country, region, city')
      .limit(80000)

    for (const row of data ?? []) {
      if (!row.country || !row.city) continue
      addToTree(tree, String(row.country).trim(), String(row.region || 'Інші'), String(row.city).trim())
    }
  } catch (e) {
    console.warn('geo_catalog load:', e)
  }

  for (const [, regions] of tree) {
    for (const [region, cities] of regions) {
      cities.sort((a, b) => a.localeCompare(b, 'uk'))
      regions.set(region, cities)
    }
  }

  cachedTree = tree
  cacheAt = now
  return tree
}

export function listCountries(tree: GeoTree): string[] {
  const fromTree = [...tree.keys()].sort((a, b) => a.localeCompare(b, 'uk'))
  const popular = POPULAR_COUNTRIES.filter((c) => tree.has(c))
  const rest = fromTree.filter((c) => !popular.includes(c))
  return [...popular, ...rest]
}

export function listRegions(tree: GeoTree, country: string): string[] {
  const regions = tree.get(country)
  if (!regions) return []
  return [...regions.keys()].sort((a, b) => a.localeCompare(b, 'uk'))
}

export function listCities(tree: GeoTree, country: string, region: string): string[] {
  return tree.get(country)?.get(region) ?? []
}

export function matchCityInRegion(
  input: string,
  tree: GeoTree,
  country: string,
  region: string,
): string | null {
  const q = norm(input)
  if (q.length < 2) return null
  const cities = listCities(tree, country, region)
  const exact = cities.find((c) => norm(c) === q)
  if (exact) return exact
  const partial = cities.find((c) => norm(c).includes(q) || q.includes(norm(c)))
  return partial ?? null
}

export const GEO_PAGE_SIZE = 8
