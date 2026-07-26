export const MAX_COMPARE = 4

export type CompareMetricKey =
  | 'rating'
  | 'reviews'
  | 'projects'
  | 'price'
  | 'experience'
  | 'languages'
  | 'responseTime'
  | 'availability'
  | 'distance'
  | 'certificates'
  | 'portfolio'
  | 'warranty'

export type CompareProfessional = {
  id: string
  fullName: string
  location: string | null
  photo: string | null
  verificationLevel: string | null
  isVerified: boolean
  rating: number
  reviews: number
  projects: number
  /** Display string e.g. "€45–60/h" or "On request" */
  priceLabel: string
  priceMin: number | null
  priceMax: number | null
  experienceYears: number | null
  languages: string[]
  responseRate: number | null
  /** Estimated response hours when available */
  responseHours: number | null
  availability: string
  distanceKm: number | null
  certificates: number
  portfolioCount: number
  warrantyMonths: number | null
  warrantyNote: string | null
  createdAt: string | null
}

export type CompareRow = {
  key: CompareMetricKey
  label: string
  values: Array<string | number>
  /** Index of best value when applicable */
  bestIndex: number | null
}
