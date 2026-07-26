export type FavoriteType =
  | 'professional'
  | 'company'
  | 'project'
  | 'category'
  | 'search'
  /** Legacy */
  | 'listing'
  | 'profile'

export type FavoriteTab =
  | 'professionals'
  | 'companies'
  | 'projects'
  | 'categories'
  | 'searches'

export type SavedSearchMeta = {
  search_key: string
  query?: string
  path?: string
  city?: string
  country?: string
  categorySlug?: string
  filters?: Record<string, unknown>
}

export type FavoriteMeta = SavedSearchMeta & Record<string, unknown>

export type SavedFavoriteRow = {
  id: string
  user_id: string
  item_type: FavoriteType
  item_id: string
  title: string | null
  meta: FavoriteMeta
  created_at: string
  updated_at?: string
}

export type FavoriteProfessional = {
  kind: 'professional' | 'company'
  savedId: string
  itemId: string
  createdAt: string
  fullName: string
  location: string | null
  rating: number
  totalReviews: number
  photo: string | null
  verificationLevel: string | null
  isVerified: boolean
  bio: string | null
}

export type FavoriteProject = {
  kind: 'project'
  savedId: string
  itemId: string
  createdAt: string
  title: string
  description: string | null
  location: string | null
  price: number | null
  currency: string | null
  status: string | null
}

export type FavoriteCategory = {
  kind: 'category'
  savedId: string
  itemId: string
  createdAt: string
  name: string
  slug: string
  description: string | null
  professionalsCount: number
  avgRating: number | null
}

export type FavoriteSearch = {
  kind: 'search'
  savedId: string
  itemId: string
  createdAt: string
  title: string
  query: string
  path: string
  city?: string
  country?: string
  categorySlug?: string
}

export type FavoritesBundle = {
  professionals: FavoriteProfessional[]
  companies: FavoriteProfessional[]
  projects: FavoriteProject[]
  categories: FavoriteCategory[]
  searches: FavoriteSearch[]
}
