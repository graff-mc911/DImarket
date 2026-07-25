const STORAGE_KEY = 'dimarket_recent_categories'
const MAX_RECENT = 8

export type RecentCategoryView = {
  id: string
  slug: string
  name: string
  icon_key?: string | null
  viewedAt: number
}

function readAll(): RecentCategoryView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentCategoryView =>
        Boolean(item && typeof item === 'object' && typeof (item as RecentCategoryView).slug === 'string'),
    )
  } catch {
    return []
  }
}

export function getRecentCategories(): RecentCategoryView[] {
  if (typeof window === 'undefined') return []
  return readAll().sort((a, b) => b.viewedAt - a.viewedAt).slice(0, MAX_RECENT)
}

export function pushRecentCategory(entry: Omit<RecentCategoryView, 'viewedAt'>): void {
  if (typeof window === 'undefined') return
  const next: RecentCategoryView[] = [
    { ...entry, viewedAt: Date.now() },
    ...readAll().filter((item) => item.slug !== entry.slug && item.id !== entry.id),
  ].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota
  }
}
