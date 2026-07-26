import type { CompanyCategorySlug } from './categories'

export type CompanyOpeningHours = {
  timezone?: string
  days?: Partial<
    Record<
      'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
      Array<[string, string]>
    >
  >
}

export type CompanySocial = {
  facebook?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  twitter?: string
  website?: string
}

export type Company = {
  id: string
  owner_id: string | null
  slug: string
  name: string
  logo_url: string | null
  cover_url: string | null
  short_description: string | null
  about: string | null
  category_slug: CompanyCategorySlug | string
  is_verified: boolean
  is_premium: boolean
  is_featured: boolean
  rating: number
  reviews_count: number
  completed_projects: number
  employees_count: number | null
  founded_year: number | null
  country_code: string | null
  country_name: string | null
  city: string | null
  address: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  languages: string[]
  website: string | null
  phone: string | null
  email: string | null
  opening_hours: CompanyOpeningHours
  social: CompanySocial
  status: 'draft' | 'published' | 'hidden'
  created_at: string
  updated_at: string
}

export type CompanyService = {
  id: string
  company_id: string
  name: string
  description: string | null
  category_slug: string | null
  sort_order: number
}

export type CompanyGalleryItem = {
  id: string
  company_id: string
  url: string
  caption: string | null
  media_type: 'image' | 'video'
  sort_order: number
}

export type CompanyReview = {
  id: string
  company_id: string
  reviewer_id: string | null
  reviewer_name: string
  rating: number
  comment: string | null
  is_verified: boolean
  created_at: string
}

export type CompanyBrand = {
  id: string
  company_id: string
  name: string
  logo_url: string | null
  sort_order: number
}

export type CompanyTeamMember = {
  id: string
  company_id: string
  name: string
  role_title: string | null
  avatar_url: string | null
  sort_order: number
}

export type CompanyCertificate = {
  id: string
  company_id: string
  title: string
  issuer: string | null
  year: number | null
  document_url: string | null
  sort_order: number
}

export type CompanyLicense = {
  id: string
  company_id: string
  title: string
  license_number: string | null
  issuer: string | null
  expires_at: string | null
  sort_order: number
}

export type CompanyPortfolioItem = {
  id: string
  company_id: string
  title: string
  description: string | null
  image_url: string | null
  category_slug: string | null
  completed_at: string | null
  sort_order: number
}

export type CompanyDetail = Company & {
  services: CompanyService[]
  gallery: CompanyGalleryItem[]
  reviews: CompanyReview[]
  brands: CompanyBrand[]
  team: CompanyTeamMember[]
  certificates: CompanyCertificate[]
  licenses: CompanyLicense[]
  portfolio: CompanyPortfolioItem[]
}

export type CompanySort =
  | 'highest_rated'
  | 'newest'
  | 'most_projects'
  | 'alphabetically'

export type CompanyFilters = {
  q: string
  category: string
  city: string
  country: string
  language: string
  verifiedOnly: boolean
  premiumOnly: boolean
  openNow: boolean
  minRating: number
  sort: CompanySort
}

export const EMPTY_COMPANY_FILTERS: CompanyFilters = {
  q: '',
  category: '',
  city: '',
  country: '',
  language: '',
  verifiedOnly: false,
  premiumOnly: false,
  openNow: false,
  minRating: 0,
  sort: 'highest_rated',
}

export type CompanyMapPoint = {
  id: string
  slug: string
  name: string
  lat: number
  lng: number
  category_slug: string
  is_verified: boolean
  rating: number
  city: string | null
  country_code: string | null
}

export const COMPANY_PAGE_SIZE = 12
