import { supabase } from '../supabase'
import type {
  FavoriteCategory,
  FavoriteMeta,
  FavoriteProfessional,
  FavoriteProject,
  FavoriteSearch,
  FavoriteTab,
  FavoriteType,
  FavoritesBundle,
  SavedFavoriteRow,
  SavedSearchMeta,
} from './types'

const TAB_TYPES: Record<FavoriteTab, FavoriteType[]> = {
  professionals: ['professional', 'profile'],
  companies: ['company'],
  projects: ['project', 'listing'],
  categories: ['category'],
  searches: ['search'],
}

function asMeta(raw: unknown): FavoriteMeta {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as FavoriteMeta
  }
  return {} as FavoriteMeta
}

/** Deterministic uuid-like key for search uniqueness (not a real UUID). */
export function searchKeyFrom(input: {
  query?: string | null
  path?: string | null
  city?: string | null
  country?: string | null
  categorySlug?: string | null
}): string {
  const parts = [
    (input.query || '').trim().toLowerCase(),
    (input.path || '').trim(),
    (input.city || '').trim().toLowerCase(),
    (input.country || '').trim().toLowerCase(),
    (input.categorySlug || '').trim().toLowerCase(),
  ]
  return parts.join('|').slice(0, 400) || 'empty'
}

function newSearchItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`
}

export async function isFavorite(
  itemType: FavoriteType,
  itemId: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const types =
    itemType === 'professional'
      ? ['professional', 'profile']
      : itemType === 'project'
        ? ['project', 'listing']
        : [itemType]

  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .in('item_type', types)
    .eq('item_id', itemId)
    .limit(1)

  return Boolean((data as { id: string }[] | null)?.length)
}

export async function isSearchFavorite(searchKey: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !searchKey) return false

  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_type', 'search')
    .contains('meta', { search_key: searchKey } as never)
    .maybeSingle()

  return Boolean((data as { id?: string } | null)?.id)
}

export async function toggleFavorite(input: {
  itemType: FavoriteType
  itemId: string
  title?: string | null
  meta?: FavoriteMeta
}): Promise<{ saved: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { saved: false, error: 'auth_required' }

  const types =
    input.itemType === 'professional'
      ? ['professional', 'profile']
      : input.itemType === 'project'
        ? ['project', 'listing']
        : [input.itemType]

  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .in('item_type', types)
    .eq('item_id', input.itemId)
    .limit(1)

  const row = (existing as { id: string }[] | null)?.[0]
  if (row?.id) {
    const { error } = await supabase.from('saved_items').delete().eq('id', row.id)
    if (error) return { saved: true, error: error.message }
    return { saved: false }
  }

  const { error } = await supabase.from('saved_items').insert({
    user_id: user.id,
    item_type: input.itemType,
    item_id: input.itemId,
    title: input.title ?? null,
    meta: input.meta ?? {},
  } as never)

  if (error) {
    // Fallback without new columns
    const retry = await supabase.from('saved_items').insert({
      user_id: user.id,
      item_type:
        input.itemType === 'professional' || input.itemType === 'company'
          ? 'profile'
          : input.itemType === 'project'
            ? 'listing'
            : input.itemType,
      item_id: input.itemId,
    } as never)
    if (retry.error) return { saved: false, error: retry.error.message }
  }
  return { saved: true }
}

export async function saveSearchFavorite(
  meta: SavedSearchMeta,
  title?: string,
): Promise<{ saved: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { saved: false, error: 'auth_required' }

  const search_key = meta.search_key || searchKeyFrom(meta)
  const already = await isSearchFavorite(search_key)
  if (already) {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'search')
      .contains('meta', { search_key } as never)
      .maybeSingle()
    const id = (data as { id?: string } | null)?.id
    if (id) await supabase.from('saved_items').delete().eq('id', id)
    return { saved: false }
  }

  const display =
    title ||
    meta.query?.trim() ||
    [meta.city, meta.categorySlug].filter(Boolean).join(' · ') ||
    'Saved search'

  const { error } = await supabase.from('saved_items').insert({
    user_id: user.id,
    item_type: 'search',
    item_id: newSearchItemId(),
    title: display,
    meta: { ...meta, search_key },
  } as never)

  if (error) return { saved: false, error: error.message }
  return { saved: true }
}

export async function removeFavorite(savedId: string): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'auth_required' }

  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('id', savedId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchFavoritesBundle(userId: string): Promise<FavoritesBundle> {
  const empty: FavoritesBundle = {
    professionals: [],
    companies: [],
    projects: [],
    categories: [],
    searches: [],
  }

  const { data, error } = await supabase
    .from('saved_items')
    .select('id, user_id, item_type, item_id, title, meta, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    // Legacy select without meta/title
    const legacy = await supabase
      .from('saved_items')
      .select('id, user_id, item_type, item_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)
    if (legacy.error || !legacy.data) return empty
    return hydrateFavorites(
      (legacy.data as SavedFavoriteRow[]).map((r) => ({
        ...r,
        title: null,
        meta: {} as FavoriteMeta,
      })),
    )
  }

  return hydrateFavorites((data || []) as SavedFavoriteRow[])
}

async function hydrateFavorites(rows: SavedFavoriteRow[]): Promise<FavoritesBundle> {
  const bundle: FavoritesBundle = {
    professionals: [],
    companies: [],
    projects: [],
    categories: [],
    searches: [],
  }

  const profileIds = rows
    .filter((r) => ['professional', 'company', 'profile'].includes(r.item_type))
    .map((r) => r.item_id)
  const projectIds = rows
    .filter((r) => ['project', 'listing'].includes(r.item_type))
    .map((r) => r.item_id)
  const categoryIds = rows.filter((r) => r.item_type === 'category').map((r) => r.item_id)

  const [profilesRes, projectsRes, catsRes] = await Promise.all([
    profileIds.length
      ? supabase
          .from('profiles')
          .select(
            'id, full_name, location, rating, total_reviews, profile_photo, avatar_url, verification_level, is_verified, bio, user_role, is_professional',
          )
          .in('id', profileIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    projectIds.length
      ? supabase
          .from('listings')
          .select('id, title, description, location, price, currency, status, listing_type')
          .in('id', projectIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    categoryIds.length
      ? supabase
          .from('categories')
          .select('id, name, slug, description, professionals_count, avg_rating')
          .in('id', categoryIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const profiles = new Map(
    ((profilesRes.data || []) as Record<string, unknown>[]).map((p) => [String(p.id), p]),
  )
  const projects = new Map(
    ((projectsRes.data || []) as Record<string, unknown>[]).map((p) => [String(p.id), p]),
  )
  const cats = new Map(
    ((catsRes.data || []) as Record<string, unknown>[]).map((c) => [String(c.id), c]),
  )

  for (const row of rows) {
    const meta = asMeta(row.meta)
    if (row.item_type === 'search') {
      bundle.searches.push({
        kind: 'search',
        savedId: row.id,
        itemId: row.item_id,
        createdAt: row.created_at,
        title: row.title || String(meta.query || 'Saved search'),
        query: String(meta.query || row.title || ''),
        path: String(meta.path || '/search'),
        city: meta.city ? String(meta.city) : undefined,
        country: meta.country ? String(meta.country) : undefined,
        categorySlug: meta.categorySlug ? String(meta.categorySlug) : undefined,
      })
      continue
    }

    if (row.item_type === 'category') {
      const c = cats.get(row.item_id)
      if (!c) continue
      bundle.categories.push({
        kind: 'category',
        savedId: row.id,
        itemId: row.item_id,
        createdAt: row.created_at,
        name: String(c.name || 'Category'),
        slug: String(c.slug || ''),
        description: (c.description as string | null) ?? null,
        professionalsCount: Number(c.professionals_count || 0),
        avgRating: c.avg_rating != null ? Number(c.avg_rating) : null,
      })
      continue
    }

    if (row.item_type === 'project' || row.item_type === 'listing') {
      const l = projects.get(row.item_id)
      if (!l) continue
      bundle.projects.push({
        kind: 'project',
        savedId: row.id,
        itemId: row.item_id,
        createdAt: row.created_at,
        title: String(l.title || 'Project'),
        description: (l.description as string | null) ?? null,
        location: (l.location as string | null) ?? null,
        price: l.price != null ? Number(l.price) : null,
        currency: (l.currency as string | null) ?? null,
        status: (l.status as string | null) ?? null,
      })
      continue
    }

    const p = profiles.get(row.item_id)
    if (!p) continue
    const isCompany =
      row.item_type === 'company' || String(p.user_role) === 'company'
    const item: FavoriteProfessional = {
      kind: isCompany ? 'company' : 'professional',
      savedId: row.id,
      itemId: row.item_id,
      createdAt: row.created_at,
      fullName: String(p.full_name || (isCompany ? 'Company' : 'Professional')),
      location: (p.location as string | null) ?? null,
      rating: Number(p.rating || 0),
      totalReviews: Number(p.total_reviews || 0),
      photo: (p.profile_photo as string | null) || (p.avatar_url as string | null) || null,
      verificationLevel: (p.verification_level as string | null) ?? null,
      isVerified: Boolean(p.is_verified),
      bio: (p.bio as string | null) ?? null,
    }
    if (isCompany) bundle.companies.push(item)
    else bundle.professionals.push(item)
  }

  return bundle
}

export function tabCounts(bundle: FavoritesBundle): Record<FavoriteTab, number> {
  return {
    professionals: bundle.professionals.length,
    companies: bundle.companies.length,
    projects: bundle.projects.length,
    categories: bundle.categories.length,
    searches: bundle.searches.length,
  }
}

export function shareUrlForFavorite(input: {
  type: FavoriteType | FavoriteTab
  itemId: string
  path?: string
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dimarket.app'
  if (input.path) return input.path.startsWith('http') ? input.path : `${origin}${input.path}`
  if (input.type === 'professional' || input.type === 'professionals' || input.type === 'profile') {
    return `${origin}/professional/${input.itemId}`
  }
  if (input.type === 'company' || input.type === 'companies') {
    return `${origin}/professional/${input.itemId}`
  }
  if (input.type === 'project' || input.type === 'projects' || input.type === 'listing') {
    return `${origin}/listing/${input.itemId}`
  }
  if (input.type === 'category' || input.type === 'categories') {
    return `${origin}/category/${input.itemId}`
  }
  return `${origin}/favorites`
}

export async function shareFavorite(input: {
  title: string
  url: string
  text?: string
}): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: input.title,
        text: input.text || input.title,
        url: input.url,
      })
      return 'shared'
    }
  } catch {
    /* fall through to clipboard */
  }
  try {
    await navigator.clipboard.writeText(input.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export { TAB_TYPES }
