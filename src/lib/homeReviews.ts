/** Live homepage reviews only — never pad with invented testimonials. */
export type DisplayHomeReview = {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
  is_verified_customer: boolean
  professional_id: string
  country_code: string
  country_name: string
  category: string
  avatar_url?: string | null
}

const FLAG: Record<string, string> = {
  DE: '🇩🇪',
  ES: '🇪🇸',
  UA: '🇺🇦',
  FR: '🇫🇷',
  PL: '🇵🇱',
  IT: '🇮🇹',
  GB: '🇬🇧',
  NL: '🇳🇱',
  PT: '🇵🇹',
  RO: '🇷🇴',
  CZ: '🇨🇿',
  AT: '🇦🇹',
  BE: '🇧🇪',
  CH: '🇨🇭',
  US: '🇺🇸',
}

export function countryFlag(code: string): string {
  return FLAG[code.toUpperCase()] || '🇪🇺'
}

export function mergeHomeReviews(
  live: Array<{
    id: string
    reviewer_name: string
    rating: number
    comment: string
    created_at: string
    is_verified_customer: boolean
    professional_id: string
    country_code?: string | null
    country_name?: string | null
    category?: string | null
    avatar_url?: string | null
  }>,
  limit = 6,
): DisplayHomeReview[] {
  return live
    .filter((r) => (r.comment ?? '').trim().length > 12)
    .map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      is_verified_customer: r.is_verified_customer,
      professional_id: r.professional_id,
      country_code: (r.country_code || '').toUpperCase(),
      country_name: r.country_name || '',
      category: r.category || '',
      avatar_url: r.avatar_url,
    }))
    .slice(0, limit)
}
