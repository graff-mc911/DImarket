/** Curated fallback reviews for homepage carousel when Supabase returns few rows. */
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

export const FALLBACK_HOME_REVIEWS: DisplayHomeReview[] = [
  {
    id: 'fb-1',
    reviewer_name: 'Anna Müller',
    rating: 5,
    comment:
      'Found a verified electrician in two days. Clear quotes, on-time arrival, and excellent finish on our apartment rewiring.',
    created_at: '2026-05-12T10:00:00Z',
    is_verified_customer: true,
    professional_id: '',
    country_code: 'DE',
    country_name: 'Germany',
    category: 'Electrical',
  },
  {
    id: 'fb-2',
    reviewer_name: 'Carlos Ruiz',
    rating: 5,
    comment:
      'The painter we hired through DImarket was careful with details. Great communication and fair pricing for a full interior refresh.',
    created_at: '2026-04-28T10:00:00Z',
    is_verified_customer: true,
    professional_id: '',
    country_code: 'ES',
    country_name: 'Spain',
    category: 'Painting',
  },
  {
    id: 'fb-3',
    reviewer_name: 'Olena Koval',
    rating: 5,
    comment:
      'Bathroom renovation completed on schedule. The plumber and tiler coordinated perfectly — highly recommend the matching flow.',
    created_at: '2026-06-03T10:00:00Z',
    is_verified_customer: true,
    professional_id: '',
    country_code: 'UA',
    country_name: 'Ukraine',
    category: 'Plumbing',
  },
  {
    id: 'fb-4',
    reviewer_name: 'Pierre Dupont',
    rating: 4,
    comment:
      'Roof repair after storm damage. Professional showed credentials, explained options, and left the site clean.',
    created_at: '2026-03-19T10:00:00Z',
    is_verified_customer: true,
    professional_id: '',
    country_code: 'FR',
    country_name: 'France',
    category: 'Roofing',
  },
  {
    id: 'fb-5',
    reviewer_name: 'Marta Kowalska',
    rating: 5,
    comment:
      'Kitchen renovation quotes arrived quickly. We chose a verified company and the result looks premium.',
    created_at: '2026-05-30T10:00:00Z',
    is_verified_customer: true,
    professional_id: '',
    country_code: 'PL',
    country_name: 'Poland',
    category: 'Renovation',
  },
  {
    id: 'fb-6',
    reviewer_name: 'Luca Bianchi',
    rating: 5,
    comment:
      'HVAC installers were punctual and tidy. Transparent budget and clear timeline from day one.',
    created_at: '2026-04-08T10:00:00Z',
    is_verified_customer: true,
    professional_id: '',
    country_code: 'IT',
    country_name: 'Italy',
    category: 'HVAC',
  },
]

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
  const mapped: DisplayHomeReview[] = live
    .filter((r) => (r.comment ?? '').trim().length > 12)
    .map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      is_verified_customer: r.is_verified_customer,
      professional_id: r.professional_id,
      country_code: (r.country_code || 'DE').toUpperCase(),
      country_name: r.country_name || 'Europe',
      category: r.category || 'Construction',
      avatar_url: r.avatar_url,
    }))

  const out = [...mapped]
  for (const fb of FALLBACK_HOME_REVIEWS) {
    if (out.length >= limit) break
    if (!out.some((r) => r.id === fb.id)) out.push(fb)
  }
  return out.slice(0, limit)
}
