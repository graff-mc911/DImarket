import { supabase } from './supabase'
import type { Category, Json, ListingWithImages, Profile } from './types'
import { SERVIYA_CATEGORY_I18N } from '../config/categoriesI18n'
import { CATEGORY_LABEL_I18N } from './categoryLabelI18n'
import { getTranslation, type LanguageCode, type TranslationKey } from './i18n'

export type MarketplaceCategory = Category & {
  cover_image_url?: string | null
  sort_order?: number
  is_main?: boolean
  is_service?: boolean
  icon_key?: string | null
  name_i18n?: Json
  description_i18n?: Json
  services_count?: number
  professionals_count?: number
  avg_rating?: number | null
  completed_projects_count?: number
}

export type MarketplaceCategoryPage = {
  ok: boolean
  error?: string
  category: MarketplaceCategory | null
  services: MarketplaceCategory[]
  professionals: Profile[]
  projects: ListingWithImages[]
  reviews: CategoryReview[]
  related: MarketplaceCategory[]
}

export type CategoryReview = {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
  is_verified_customer: boolean
  professional_id: string
}

const MAIN_SELECT =
  'id, name, slug, icon, icon_key, cover_image_url, description, name_i18n, description_i18n, sort_order, services_count, professionals_count, avg_rating, completed_projects_count, parent_id, is_main, is_service'

function asI18nMap(value: Json | undefined | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string' && v.trim()) out[k] = v
  }
  return out
}

function localeCandidates(lang: string): string[] {
  const normalized = lang.toLowerCase()
  const base = normalized.split('-')[0]
  return normalized === base ? [normalized] : [normalized, base]
}

/** Static UI maps (Serviya + work-type catalog) — used when DB name_i18n lacks the locale. */
function labelFromStaticMaps(slug: string | undefined | null, lang: string): string | null {
  if (!slug) return null
  const maps = [SERVIYA_CATEGORY_I18N[slug], CATEGORY_LABEL_I18N[slug]]
  for (const map of maps) {
    if (!map) continue
    for (const code of localeCandidates(lang)) {
      const hit = (map as Record<string, string>)[code]
      if (hit?.trim()) return hit
    }
  }
  // Dictionary keys used by site chrome: category.name.<slug> / category.<slug>
  for (const code of localeCandidates(lang)) {
    for (const prefix of ['category.name.', 'category.'] as const) {
      const key = `${prefix}${slug}` as TranslationKey
      try {
        const text = getTranslation(code as LanguageCode, key)
        if (text && text !== key) return text
      } catch {
        /* unknown locale code — skip */
      }
    }
  }
  return null
}

function pickLocalized(
  map: Record<string, string>,
  lang: string,
  slug?: string | null,
): string | null {
  for (const code of localeCandidates(lang)) {
    if (map[code]?.trim()) return map[code]
  }
  const fromStatic = labelFromStaticMaps(slug, lang)
  if (fromStatic) return fromStatic
  if (map.en?.trim()) return map.en
  return null
}

export function marketplaceCategoryLabel(
  category: Pick<MarketplaceCategory, 'name' | 'name_i18n' | 'slug'>,
  lang: string,
): string {
  const map = asI18nMap(category.name_i18n)
  return (
    pickLocalized(map, lang, category.slug) ||
    category.name ||
    category.slug
  )
}

export function marketplaceCategoryDescription(
  category: Pick<MarketplaceCategory, 'description' | 'description_i18n' | 'slug'>,
  lang: string,
): string {
  const map = asI18nMap(category.description_i18n)
  // Prefer DB locale; do not jump to English before static title maps (no desc maps yet).
  for (const code of localeCandidates(lang)) {
    if (map[code]?.trim()) return map[code]
  }
  if (map.en?.trim()) return map.en
  return category.description || ''
}

export function marketplaceCategoryPath(slug: string): string {
  return `/category/${encodeURIComponent(slug)}`
}

export function marketplaceServiceProsPath(serviceSlug: string, categorySlug?: string): string {
  const params = new URLSearchParams()
  params.set('work', serviceSlug)
  if (categorySlug) params.set('category', categorySlug)
  return `/professionals?${params.toString()}`
}

export async function fetchMainMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_marketplace_main_categories' as never,
  )

  if (!rpcError && rpcData) {
    const list = Array.isArray(rpcData) ? rpcData : []
    if (list.length > 0) return list as MarketplaceCategory[]
  }

  const { data, error } = await supabase
    .from('categories')
    .select(MAIN_SELECT)
    .eq('is_main', true)
    .order('sort_order', { ascending: true })

  if (!error && data?.length) return data as MarketplaceCategory[]

  // Column may be missing before migration — retry without completed_projects_count
  if (error) {
    const { data: fallback } = await supabase
      .from('categories')
      .select(
        'id, name, slug, icon, icon_key, cover_image_url, description, name_i18n, description_i18n, sort_order, services_count, professionals_count, avg_rating, parent_id, is_main, is_service',
      )
      .eq('is_main', true)
      .order('sort_order', { ascending: true })

    if (fallback?.length) {
      return (fallback as MarketplaceCategory[]).map((c) => ({
        ...c,
        completed_projects_count: c.completed_projects_count ?? 0,
      }))
    }
  }

  // Soft fallback: construction children that look like trade groups
  const { data: construction } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'construction')
    .maybeSingle()

  if (construction && typeof construction === 'object' && 'id' in construction) {
    const parentId = String((construction as { id: string }).id)
    const { data: children } = await supabase
      .from('categories')
      .select(MAIN_SELECT)
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (children?.length) return children as MarketplaceCategory[]
  }

  return []
}

export async function fetchCategoryServices(
  parentId: string,
): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(MAIN_SELECT)
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!error && data) return data as MarketplaceCategory[]

  // Older prod schemas may lack completed_projects_count — retry lean select
  const { data: fallback } = await supabase
    .from('categories')
    .select(
      'id, name, slug, icon, icon_key, cover_image_url, description, name_i18n, description_i18n, sort_order, services_count, professionals_count, avg_rating, parent_id, is_main, is_service',
    )
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!fallback?.length) return []
  return (fallback as MarketplaceCategory[]).map((c) => ({
    ...c,
    completed_projects_count: c.completed_projects_count ?? 0,
  }))
}

export async function fetchMarketplaceCategoryPage(
  slug: string,
): Promise<MarketplaceCategoryPage> {
  const empty = {
    ok: false as const,
    error: 'not_found',
    category: null,
    services: [] as MarketplaceCategory[],
    professionals: [] as Profile[],
    projects: [] as ListingWithImages[],
    reviews: [] as CategoryReview[],
    related: [] as MarketplaceCategory[],
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_marketplace_category_page' as never,
    { p_slug: slug } as never,
  )

  let category: MarketplaceCategory | null = null
  let services: MarketplaceCategory[] = []
  let professionals: Profile[] = []
  let projects: ListingWithImages[] = []

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    const payload = rpcData as MarketplaceCategoryPage
    if (payload.ok && payload.category) {
      category = payload.category
      services = payload.services ?? []
      professionals = payload.professionals ?? []
      projects = (payload.projects as ListingWithImages[]) ?? []
    }
  }

  if (!category) {
    const { data: catRow } = await supabase
      .from('categories')
      .select(MAIN_SELECT)
      .eq('slug', slug)
      .maybeSingle()

    if (!catRow) return empty

    category = catRow as MarketplaceCategory
    services = await fetchCategoryServices(category.id)

    const { data: pros } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_professional', true)
      .eq('user_role', 'professional')
      .order('rating', { ascending: false })
      .limit(24)

    professionals = ((pros as Profile[] | null) ?? [])
      .filter((p) => {
        const works = p.work_subcategory_slugs ?? []
        return (
          works.some((w) => w === slug || w.startsWith(`${slug}-`)) ||
          services.some((s) => works.includes(s.slug))
        )
      })
      .slice(0, 12)

    const { data: projectRows } = await supabase
      .from('listings')
      .select('*, images:listing_images(*), category:categories(*)')
      .eq('listing_type', 'service_request')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(24)

    projects = ((projectRows as ListingWithImages[] | null) ?? [])
      .filter((l) => {
        const works = l.subcategory_slugs ?? []
        if (works.some((w) => w === slug || w.startsWith(`${slug}-`))) return true
        if (l.category_id === category!.id) return true
        if (l.category && (l.category.slug === slug || l.category.parent_id === category!.id)) {
          return true
        }
        return false
      })
      .slice(0, 8)
  }

  const [reviews, related] = await Promise.all([
    fetchCategoryReviews(professionals.map((p) => p.id)),
    fetchRelatedMainCategories(category.id, category.slug),
  ])

  return {
    ok: true,
    category,
    services,
    professionals,
    projects,
    reviews,
    related,
  }
}

async function fetchCategoryReviews(professionalIds: string[]): Promise<CategoryReview[]> {
  if (professionalIds.length === 0) return []

  const { data } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, comment, created_at, is_verified_customer, professional_id')
    .in('professional_id', professionalIds.slice(0, 40))
    .eq('is_approved', true)
    .or('is_hidden.is.null,is_hidden.eq.false')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12)

  return ((data as CategoryReview[] | null) ?? []).filter(
    (r) => (r.comment ?? '').trim().length > 12,
  )
}

async function fetchRelatedMainCategories(
  currentId: string,
  _slug: string,
): Promise<MarketplaceCategory[]> {
  const mains = await fetchMainMarketplaceCategories()
  return mains.filter((c) => c.id !== currentId).slice(0, 8)
}

export function filterCategoriesByQuery(
  categories: MarketplaceCategory[],
  query: string,
  lang: string,
): MarketplaceCategory[] {
  const q = query.trim().toLowerCase()
  if (!q) return categories
  return categories.filter((c) => {
    const label = marketplaceCategoryLabel(c, lang).toLowerCase()
    const desc = marketplaceCategoryDescription(c, lang).toLowerCase()
    return label.includes(q) || desc.includes(q) || c.slug.includes(q)
  })
}
