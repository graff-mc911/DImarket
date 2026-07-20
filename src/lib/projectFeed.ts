import { supabase } from './supabase'
import type { Listing, ProjectApplication, ProjectFile } from './types'
import { PROJECT_TRADES } from './projectWizard'

export type ProjectFeedItem = Listing & {
  project_files?: ProjectFile[] | null
  category?: { name: string; slug: string } | null
  distanceKm?: number | null
  tradeLabel?: string
}

export type ProjectFeedSort = 'newest' | 'budget_desc' | 'closest'
export type ProjectFeedUrgency = '' | 'low' | 'normal' | 'high' | 'urgent'

export type ProjectFeedFilters = {
  country: string
  category: string
  budgetMin: string
  budgetMax: string
  distanceKm: string
  urgency: ProjectFeedUrgency
  sort: ProjectFeedSort
}

export const EMPTY_PROJECT_FEED_FILTERS: ProjectFeedFilters = {
  country: '',
  category: '',
  budgetMin: '',
  budgetMax: '',
  distanceKm: '',
  urgency: '',
  sort: 'newest',
}

export const PAGE_SIZE = 20

export type GeoPoint = { lat: number; lon: number }

/** Haversine distance in km */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

export function formatBudget(
  item: Pick<Listing, 'budget_min' | 'budget_max' | 'price' | 'currency'>,
): string {
  const cur = item.currency === 'EUR' || !item.currency ? '€' : `${item.currency} `
  if (item.budget_min != null || item.budget_max != null) {
    const min =
      item.budget_min != null ? `${cur}${Math.round(item.budget_min).toLocaleString()}` : '—'
    const max =
      item.budget_max != null ? `${cur}${Math.round(item.budget_max).toLocaleString()}` : '—'
    return `${min} – ${max}`
  }
  if (item.price != null) return `${cur}${Math.round(item.price).toLocaleString()}`
  return 'Budget TBD'
}

export function resolveTradeLabel(item: ProjectFeedItem): string {
  const slug = (item.subcategory_slugs || [])[0]
  if (slug) {
    const trade = PROJECT_TRADES.find((t) => t.subcategorySlug === slug || slug.includes(t.id))
    if (trade) return trade.labelEn
  }
  return item.category?.name || 'Project'
}

function withDistance(rows: ProjectFeedItem[], origin: GeoPoint | null): ProjectFeedItem[] {
  return rows.map((row) => {
    const lat = row.latitude
    const lon = row.longitude
    let distanceKm: number | null = null
    if (origin && lat != null && lon != null) {
      distanceKm = haversineKm(origin, { lat, lon })
    }
    return {
      ...row,
      distanceKm,
      tradeLabel: resolveTradeLabel(row),
    }
  })
}

export async function fetchProjectFeedPage(opts: {
  offset: number
  limit?: number
  filters: ProjectFeedFilters
  origin: GeoPoint | null
  hiddenListingIds: Set<string>
}): Promise<{ items: ProjectFeedItem[]; hasMore: boolean }> {
  const limit = opts.limit ?? PAGE_SIZE
  let q = supabase
    .from('listings')
    .select('*, project_files(*), category:categories(name, slug)')
    .eq('listing_type', 'service_request')
    .eq('status', 'active')

  if (opts.filters.country.trim()) {
    q = q.ilike('country_name', `%${opts.filters.country.trim()}%`)
  }
  if (opts.filters.urgency) {
    q = q.eq('urgency', opts.filters.urgency)
  }
  if (opts.filters.budgetMin) {
    const min = Number(opts.filters.budgetMin)
    if (!Number.isNaN(min)) q = q.gte('budget_max', min)
  }
  if (opts.filters.budgetMax) {
    const max = Number(opts.filters.budgetMax)
    if (!Number.isNaN(max)) q = q.lte('budget_min', max)
  }
  if (opts.filters.category) {
    const trade = PROJECT_TRADES.find((t) => t.id === opts.filters.category)
    if (trade) {
      q = q.contains('subcategory_slugs', [trade.subcategorySlug])
    }
  }

  if (opts.filters.sort === 'budget_desc') {
    q = q.order('budget_max', { ascending: false, nullsFirst: false })
  } else {
    q = q.order('created_at', { ascending: false })
  }

  const needsClientGeo =
    opts.filters.sort === 'closest' || Boolean(opts.filters.distanceKm)
  const fetchLimit = needsClientGeo ? Math.min(limit * 3, 60) : limit

  const { data, error } = await q.range(opts.offset, opts.offset + fetchLimit - 1)
  if (error) {
    console.error('fetchProjectFeedPage:', error)
    return { items: [], hasMore: false }
  }

  let items = withDistance((data as ProjectFeedItem[]) ?? [], opts.origin).filter(
    (item) => !opts.hiddenListingIds.has(item.id),
  )

  const maxDist = opts.filters.distanceKm ? Number(opts.filters.distanceKm) : null
  if (maxDist != null && !Number.isNaN(maxDist)) {
    items = items.filter((item) => item.distanceKm != null && item.distanceKm <= maxDist)
  }

  if (opts.filters.sort === 'closest') {
    items = [...items].sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY
      return da - db
    })
  }

  const page = items.slice(0, limit)
  const hasMore = ((data as unknown[])?.length ?? 0) >= fetchLimit || items.length > limit
  return { items: page, hasMore }
}

export async function fetchProjectById(
  id: string,
  origin: GeoPoint | null,
): Promise<ProjectFeedItem | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, project_files(*), category:categories(name, slug)')
    .eq('id', id)
    .eq('listing_type', 'service_request')
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return null
  return withDistance([data as ProjectFeedItem], origin)[0] ?? null
}

export function getBrowserLocation(): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 300_000 },
    )
  })
}

export function urgencyTone(urgency: string | null | undefined): string {
  switch (urgency) {
    case 'urgent':
      return 'bg-[#fff1f0] text-[#c41e3a] border-[#ffd4d0]'
    case 'high':
      return 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'
    case 'low':
      return 'bg-[#f5f5f7] text-[#86868b] border-[#e8e8ed]'
    default:
      return 'bg-[#f0f7ff] text-[#0066cc] border-[#cce0ff]'
  }
}

export type { ProjectApplication }
