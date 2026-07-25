import { supabase } from './supabase'
import type { Category, Json, ListingWithImages, Profile } from './types'
import {
  findServiceCategory,
  findServiceSubcategory,
  type ServiceCategory,
  type ServiceSubcategory,
} from '../config/categories'

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
  reviews_count?: number
}

export type MarketplaceCategoryPage = {
  ok: boolean
  error?: string
  category: MarketplaceCategory | null
  services: MarketplaceCategory[]
  professionals: Profile[]
  companies: Profile[]
  projects: ListingWithImages[]
  reviews: CategoryReview[]
  related: MarketplaceCategory[]
  gallery: CategoryGalleryItem[]
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

export type CategoryGalleryItem = {
  id: string
  title: string
  before_url?: string | null
  after_url?: string | null
  image_url?: string | null
  source: 'portfolio' | 'project'
}

const MAIN_SELECT =
  'id, name, slug, icon, icon_key, cover_image_url, description, name_i18n, description_i18n, sort_order, services_count, professionals_count, avg_rating, completed_projects_count, reviews_count, parent_id, is_main, is_service'

const MAIN_SELECT_WITHOUT_REVIEWS =
  'id, name, slug, icon, icon_key, cover_image_url, description, name_i18n, description_i18n, sort_order, services_count, professionals_count, avg_rating, completed_projects_count, parent_id, is_main, is_service'

const MAIN_SELECT_LEGACY =
  'id, name, slug, icon, icon_key, cover_image_url, description, name_i18n, description_i18n, sort_order, services_count, professionals_count, avg_rating, parent_id, is_main, is_service'

function asI18nMap(value: Json | undefined | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

export function marketplaceCategoryLabel(
  category: Pick<MarketplaceCategory, 'name' | 'name_i18n' | 'slug'>,
  lang: string,
): string {
  const map = asI18nMap(category.name_i18n)
  return map[lang] || map.en || category.name || category.slug
}

export function marketplaceCategoryDescription(
  category: Pick<MarketplaceCategory, 'description' | 'description_i18n'>,
  lang: string,
): string {
  const map = asI18nMap(category.description_i18n)
  return map[lang] || map.en || category.description || ''
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

function configCategoryToMarketplaceCategory(category: ServiceCategory): MarketplaceCategory {
  const now = new Date(0).toISOString()
  return {
    id: `config-${category.slug}`,
    name: category.title.en,
    slug: category.slug,
    parent_id: null,
    icon: category.icon,
    description: category.description.en,
    created_at: now,
    updated_at: now,
    cover_image_url: category.image,
    sort_order: 0,
    is_main: true,
    is_service: false,
    icon_key: null,
    name_i18n: category.title,
    description_i18n: category.description,
    services_count: category.serviceCount,
    professionals_count: 0,
    avg_rating: null,
    completed_projects_count: 0,
    reviews_count: 0,
  }
}

function configSubcategoryToMarketplaceCategory(
  subcategory: ServiceSubcategory,
  category: ServiceCategory,
  sortOrder: number,
  requestedSlug = subcategory.slug,
): MarketplaceCategory {
  const now = new Date(0).toISOString()
  return {
    id: `config-${requestedSlug}`,
    name: subcategory.title.en,
    slug: requestedSlug,
    parent_id: `config-${category.slug}`,
    icon: subcategory.icon,
    description: subcategory.description.en,
    created_at: now,
    updated_at: now,
    cover_image_url: subcategory.image || category.image,
    sort_order: sortOrder,
    is_main: false,
    is_service: true,
    icon_key: null,
    name_i18n: subcategory.title,
    description_i18n: subcategory.description,
    services_count: 0,
    professionals_count: 0,
    avg_rating: null,
    completed_projects_count: 0,
    reviews_count: 0,
  }
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

  // Optional stat columns may be missing in older environments — keep UI functional.
  if (error) {
    const { data: withoutReviews, error: withoutReviewsError } = await supabase
      .from('categories')
      .select(MAIN_SELECT_WITHOUT_REVIEWS)
      .eq('is_main', true)
      .order('sort_order', { ascending: true })

    if (!withoutReviewsError && withoutReviews?.length) {
      return (withoutReviews as MarketplaceCategory[]).map((c) => ({
        ...c,
        reviews_count: c.reviews_count ?? 0,
      }))
    }

    const { data: legacy } = await supabase
      .from('categories')
      .select(MAIN_SELECT_LEGACY)
      .eq('is_main', true)
      .order('sort_order', { ascending: true })

    if (legacy?.length) {
      return (legacy as MarketplaceCategory[]).map((c) => ({
        ...c,
        completed_projects_count: c.completed_projects_count ?? 0,
        reviews_count: c.reviews_count ?? 0,
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
      .select(MAIN_SELECT_WITHOUT_REVIEWS)
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (children?.length) {
      return (children as MarketplaceCategory[]).map((c) => ({
        ...c,
        reviews_count: c.reviews_count ?? 0,
      }))
    }
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

  const { data: withoutReviews, error: withoutReviewsError } = await supabase
    .from('categories')
    .select(MAIN_SELECT_WITHOUT_REVIEWS)
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!withoutReviewsError && withoutReviews) {
    return (withoutReviews as MarketplaceCategory[]).map((c) => ({
      ...c,
      reviews_count: c.reviews_count ?? 0,
    }))
  }

  const { data: legacy } = await supabase
    .from('categories')
    .select(MAIN_SELECT_LEGACY)
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!legacy) return []
  return (legacy as MarketplaceCategory[]).map((c) => ({
    ...c,
    completed_projects_count: c.completed_projects_count ?? 0,
    reviews_count: c.reviews_count ?? 0,
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
    companies: [] as Profile[],
    projects: [] as ListingWithImages[],
    reviews: [] as CategoryReview[],
    related: [] as MarketplaceCategory[],
    gallery: [] as CategoryGalleryItem[],
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_marketplace_category_page' as never,
    { p_slug: slug } as never,
  )

  let category: MarketplaceCategory | null = null
  let services: MarketplaceCategory[] = []
  let professionals: Profile[] = []
  let companies: Profile[] = []
  let projects: ListingWithImages[] = []
  let configServices: MarketplaceCategory[] | null = null

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    const payload = rpcData as MarketplaceCategoryPage
    if (payload.ok && payload.category) {
      category = payload.category
      services = payload.services ?? []
      professionals = payload.professionals ?? []
      companies = payload.companies ?? []
      projects = (payload.projects as ListingWithImages[]) ?? []
    }
  }

  if (!category) {
    const { data: catRow, error: catError } = await supabase
      .from('categories')
      .select(MAIN_SELECT)
      .eq('slug', slug)
      .maybeSingle()

    let resolvedCatRow = catRow as MarketplaceCategory | null

    if (catError || !resolvedCatRow) {
      const { data: withoutReviews } = await supabase
        .from('categories')
        .select(MAIN_SELECT_WITHOUT_REVIEWS)
        .eq('slug', slug)
        .maybeSingle()
      resolvedCatRow = withoutReviews as MarketplaceCategory | null
    }

    if (!resolvedCatRow) {
      const { data: legacy } = await supabase
        .from('categories')
        .select(MAIN_SELECT_LEGACY)
        .eq('slug', slug)
        .maybeSingle()
      resolvedCatRow = legacy
        ? ({
            ...(legacy as MarketplaceCategory),
            completed_projects_count: 0,
            reviews_count: 0,
          } satisfies MarketplaceCategory)
        : null
    }

    if (!resolvedCatRow) {
      const configCategory = findServiceCategory(slug)
      const configSubcategory = findServiceSubcategory(slug)

      if (configCategory) {
        resolvedCatRow = configCategoryToMarketplaceCategory(configCategory)
        configServices = configCategory.subcategories.map((item, index) =>
          configSubcategoryToMarketplaceCategory(item, configCategory, index),
        )
      } else if (configSubcategory) {
        resolvedCatRow = configSubcategoryToMarketplaceCategory(
          configSubcategory.subcategory,
          configSubcategory.category,
          0,
          slug,
        )
        configServices = []
      }
    }

    if (!resolvedCatRow) return empty

    category = {
      ...resolvedCatRow,
      reviews_count: resolvedCatRow.reviews_count ?? 0,
    }
    services = configServices ?? await fetchCategoryServices(category.id)

    const { data: pros } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_professional', true)
      .order('rating', { ascending: false })
      .limit(48)

    const matchingProfiles = ((pros as Profile[] | null) ?? [])
      .filter((p) => {
        const works = p.work_subcategory_slugs ?? []
        const serviceSlugs = services.map((s) => s.slug)
        return (
          works.some((w) => w === slug || w.startsWith(`${slug}-`)) ||
          works.some((w) => serviceSlugs.includes(w)) ||
          (configServices != null && works.length === 0)
        )
      })

    professionals = matchingProfiles
      .filter((p) => p.user_role !== 'company')
      .slice(0, 12)

    companies = matchingProfiles
      .filter((p) => p.user_role === 'company')
      .slice(0, 8)

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

  const [reviews, related, gallery] = await Promise.all([
    fetchCategoryReviews(professionals.map((p) => p.id)),
    fetchRelatedMainCategories(category.id, category.slug),
    fetchCategoryGallery(category.slug, professionals, projects),
  ])

  return {
    ok: true,
    category,
    services,
    professionals,
    companies,
    projects,
    reviews,
    related,
    gallery,
  }
}

async function fetchCategoryGallery(
  slug: string,
  professionals: Profile[],
  projects: ListingWithImages[],
): Promise<CategoryGalleryItem[]> {
  const projectItems: CategoryGalleryItem[] = projects.flatMap((project) =>
    (project.images ?? []).slice(0, 2).map((image) => ({
      id: `project-${project.id}-${image.id}`,
      title: project.title,
      image_url: image.image_url,
      source: 'project' as const,
    })),
  )

  const professionalIds = professionals.map((p) => p.id).slice(0, 16)
  if (professionalIds.length === 0) return projectItems.slice(0, 12)

  const { data } = await supabase
    .from('portfolio_items')
    .select('id, title, image_url, before_url, after_url, media_type, category_slug, profile_id')
    .in('profile_id', professionalIds)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(24)

  const portfolioItems = ((data as Array<{
    id: string
    title: string
    image_url: string | null
    before_url: string | null
    after_url: string | null
    media_type: string | null
    category_slug: string | null
  }> | null) ?? [])
    .filter((item) => {
      if (item.media_type === 'video') return false
      return !item.category_slug || item.category_slug === slug
    })
    .map((item) => ({
      id: `portfolio-${item.id}`,
      title: item.title,
      image_url: item.image_url,
      before_url: item.before_url,
      after_url: item.after_url,
      source: 'portfolio' as const,
    }))

  return [...portfolioItems, ...projectItems]
    .filter((item) => item.before_url || item.after_url || item.image_url)
    .slice(0, 12)
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
