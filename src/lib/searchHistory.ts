const RECENT_KEY = 'dimarket_recent_searches'
const POPULAR_KEY = 'dimarket_popular_searches'
const MAX_RECENT = 10
const MAX_POPULAR = 12

export type SearchHistoryItem = {
  query: string
  at: number
}

export type PopularSearchItem = {
  query: string
  count: number
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getRecentSearches(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return []
  const list = readJson<SearchHistoryItem[]>(RECENT_KEY, [])
  return list
    .filter((i) => i?.query?.trim())
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_RECENT)
}

export function pushRecentSearch(query: string): void {
  if (typeof window === 'undefined') return
  const q = query.trim()
  if (q.length < 2) return
  const next = [
    { query: q, at: Date.now() },
    ...getRecentSearches().filter((i) => i.query.toLowerCase() !== q.toLowerCase()),
  ].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))

  const popular = readJson<PopularSearchItem[]>(POPULAR_KEY, [])
  const idx = popular.findIndex((i) => i.query.toLowerCase() === q.toLowerCase())
  if (idx >= 0) popular[idx].count += 1
  else popular.push({ query: q, count: 1 })
  popular.sort((a, b) => b.count - a.count)
  localStorage.setItem(POPULAR_KEY, JSON.stringify(popular.slice(0, MAX_POPULAR)))
}

export function getPopularSearches(fallback: string[] = []): string[] {
  if (typeof window === 'undefined') return fallback
  const popular = readJson<PopularSearchItem[]>(POPULAR_KEY, [])
    .sort((a, b) => b.count - a.count)
    .map((i) => i.query)
  if (popular.length >= 4) return popular.slice(0, MAX_POPULAR)
  const merged = [...popular]
  for (const f of fallback) {
    if (!merged.some((q) => q.toLowerCase() === f.toLowerCase())) merged.push(f)
  }
  return merged.slice(0, MAX_POPULAR)
}
