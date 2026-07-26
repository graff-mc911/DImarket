import { supabase } from '../supabase'
import { haversineKm, type GeoPoint } from '../projectFeed'
import type { CompareProfessional } from './types'

type Origin = GeoPoint | null

function yearsFromCreated(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null
  const ms = Date.now() - new Date(createdAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  return Math.max(0, Math.floor(ms / (365.25 * 86_400_000)))
}

function formatPrice(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'On request'
  if (min != null && max != null && min !== max) {
    return `€${Math.round(min)}–${Math.round(max)}/h`
  }
  const v = min ?? max
  return v != null ? `€${Math.round(v)}/h` : 'On request'
}

async function resolveOrigin(): Promise<Origin> {
  try {
    const raw = localStorage.getItem('dimarket_user_geo')
    if (raw) {
      const parsed = JSON.parse(raw) as { lat?: number; lon?: number; lng?: number }
      const lat = parsed.lat
      const lon = parsed.lon ?? parsed.lng
      if (lat != null && lon != null) return { lat, lon }
    }
  } catch {
    /* ignore */
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        try {
          localStorage.setItem('dimarket_user_geo', JSON.stringify(origin))
        } catch {
          /* ignore */
        }
        resolve(origin)
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 600_000 },
    )
  })
}

export async function fetchCompareProfessionals(
  ids: string[],
): Promise<CompareProfessional[]> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 4)
  if (!unique.length) return []

  const origin = await resolveOrigin()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(
      `
      id, full_name, location, rating, total_reviews, completed_jobs,
      languages, preferred_language, response_rate, availability_status,
      verification_level, is_verified, profile_photo, avatar_url,
      portfolio_images, service_latitude, service_longitude, created_at,
      experience_years, hourly_rate_min, hourly_rate_max, warranty_months, warranty_note
    `,
    )
    .in('id', unique)

  if (error || !profiles?.length) {
    // Fallback without new columns
    const fallback = await supabase
      .from('profiles')
      .select(
        `
        id, full_name, location, rating, total_reviews, completed_jobs,
        languages, preferred_language, response_rate, availability_status,
        verification_level, is_verified, profile_photo, avatar_url,
        portfolio_images, service_latitude, service_longitude, created_at
      `,
      )
      .in('id', unique)
    if (fallback.error || !fallback.data?.length) return []
    return hydrate(fallback.data as Record<string, unknown>[], unique, origin, {}, {})
  }

  const { data: portfolioRows } = await supabase
    .from('portfolio_items')
    .select('id, professional_id, media_type, category_slug')
    .in('professional_id', unique)
    .limit(500)

  const certByPro = new Map<string, number>()
  const portByPro = new Map<string, number>()
  for (const row of (portfolioRows || []) as Array<{
    professional_id: string
    media_type?: string | null
    category_slug?: string | null
  }>) {
    portByPro.set(row.professional_id, (portByPro.get(row.professional_id) || 0) + 1)
    if (row.media_type === 'certificate' || row.category_slug === 'certificate') {
      certByPro.set(row.professional_id, (certByPro.get(row.professional_id) || 0) + 1)
    }
  }

  return hydrate(
    profiles as Record<string, unknown>[],
    unique,
    origin,
    Object.fromEntries(certByPro),
    Object.fromEntries(portByPro),
  )
}

function hydrate(
  rows: Record<string, unknown>[],
  order: string[],
  origin: Origin,
  certMap: Record<string, number>,
  portMap: Record<string, number>,
): CompareProfessional[] {
  const byId = new Map(rows.map((r) => [String(r.id), r]))

  return order
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => {
      const row = p as Record<string, unknown>
      const id = String(row.id)
      const langs = Array.isArray(row.languages)
        ? (row.languages as string[]).filter(Boolean)
        : row.preferred_language
          ? [String(row.preferred_language)]
          : []

      const priceMin =
        row.hourly_rate_min != null ? Number(row.hourly_rate_min) : null
      const priceMax =
        row.hourly_rate_max != null ? Number(row.hourly_rate_max) : null

      const lat = row.service_latitude != null ? Number(row.service_latitude) : null
      const lon = row.service_longitude != null ? Number(row.service_longitude) : null
      let distanceKm: number | null = null
      if (origin && lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
        distanceKm = Math.round(haversineKm(origin, { lat, lon }) * 10) / 10
      }

      const images = Array.isArray(row.portfolio_images)
        ? (row.portfolio_images as string[]).length
        : 0
      const portfolioItems = portMap[id] || 0
      const experience =
        row.experience_years != null
          ? Number(row.experience_years)
          : yearsFromCreated(row.created_at as string | null)

      const responseRate =
        row.response_rate != null ? Number(row.response_rate) : null
      // Heuristic: high response rate ≈ faster replies
      const responseHours =
        responseRate == null
          ? null
          : responseRate >= 90
            ? 1
            : responseRate >= 70
              ? 4
              : responseRate >= 50
                ? 12
                : 24

      return {
        id,
        fullName: String(row.full_name || 'Professional'),
        location: (row.location as string | null) ?? null,
        photo:
          (row.profile_photo as string | null) ||
          (row.avatar_url as string | null) ||
          null,
        verificationLevel: (row.verification_level as string | null) ?? null,
        isVerified: Boolean(row.is_verified),
        rating: Number(row.rating || 0),
        reviews: Number(row.total_reviews || 0),
        projects: Number(row.completed_jobs || row.total_reviews || 0),
        priceLabel: formatPrice(priceMin, priceMax),
        priceMin,
        priceMax,
        experienceYears: experience,
        languages: langs,
        responseRate,
        responseHours,
        availability: String(row.availability_status || 'available'),
        distanceKm,
        certificates: certMap[id] || 0,
        portfolioCount: portfolioItems + images,
        warrantyMonths:
          row.warranty_months != null ? Number(row.warranty_months) : null,
        warrantyNote: (row.warranty_note as string | null) ?? null,
        createdAt: (row.created_at as string | null) ?? null,
      } satisfies CompareProfessional
    })
}

export function buildCompareRows(pros: CompareProfessional[]) {
  const bestMax = (vals: number[]) => {
    let best = -Infinity
    let idx: number | null = null
    vals.forEach((v, i) => {
      if (Number.isFinite(v) && v > best) {
        best = v
        idx = i
      }
    })
    return idx
  }
  const bestMin = (vals: Array<number | null>) => {
    let best = Infinity
    let idx: number | null = null
    vals.forEach((v, i) => {
      if (v != null && Number.isFinite(v) && v < best) {
        best = v
        idx = i
      }
    })
    return idx
  }

  const rating = pros.map((p) => p.rating)
  const reviews = pros.map((p) => p.reviews)
  const projects = pros.map((p) => p.projects)
  const experience = pros.map((p) => p.experienceYears ?? 0)
  const response = pros.map((p) => p.responseRate ?? 0)
  const distance = pros.map((p) => p.distanceKm)
  const certs = pros.map((p) => p.certificates)
  const portfolio = pros.map((p) => p.portfolioCount)
  const warranty = pros.map((p) => p.warrantyMonths ?? 0)
  const priceScore = pros.map((p) => p.priceMin ?? p.priceMax)

  return [
    {
      key: 'rating' as const,
      label: 'Rating',
      values: pros.map((p) => (p.rating > 0 ? `${p.rating.toFixed(1)}★` : '—')),
      bestIndex: bestMax(rating),
    },
    {
      key: 'reviews' as const,
      label: 'Reviews',
      values: reviews,
      bestIndex: bestMax(reviews),
    },
    {
      key: 'projects' as const,
      label: 'Projects',
      values: projects,
      bestIndex: bestMax(projects),
    },
    {
      key: 'price' as const,
      label: 'Price',
      values: pros.map((p) => p.priceLabel),
      bestIndex: bestMin(priceScore),
    },
    {
      key: 'experience' as const,
      label: 'Experience',
      values: pros.map((p) =>
        p.experienceYears != null ? `${p.experienceYears} yr` : '—',
      ),
      bestIndex: bestMax(experience),
    },
    {
      key: 'languages' as const,
      label: 'Languages',
      values: pros.map((p) => (p.languages.length ? p.languages.join(', ') : '—')),
      bestIndex: bestMax(pros.map((p) => p.languages.length)),
    },
    {
      key: 'responseTime' as const,
      label: 'Response time',
      values: pros.map((p) => {
        if (p.responseHours != null) {
          return p.responseHours < 2
            ? `~${Math.round(p.responseHours * 60)}m · ${p.responseRate ?? '—'}%`
            : `~${p.responseHours}h · ${p.responseRate ?? '—'}%`
        }
        return p.responseRate != null ? `${p.responseRate}%` : '—'
      }),
      bestIndex: bestMax(response),
    },
    {
      key: 'availability' as const,
      label: 'Availability',
      values: pros.map((p) => p.availability),
      bestIndex: (() => {
        const rank: Record<string, number> = {
          available: 3,
          limited: 2,
          busy: 1,
          unavailable: 0,
        }
        return bestMax(pros.map((p) => rank[p.availability] ?? 0))
      })(),
    },
    {
      key: 'distance' as const,
      label: 'Distance',
      values: pros.map((p) =>
        p.distanceKm != null ? `${p.distanceKm} km` : '—',
      ),
      bestIndex: bestMin(distance),
    },
    {
      key: 'certificates' as const,
      label: 'Certificates',
      values: certs,
      bestIndex: bestMax(certs),
    },
    {
      key: 'portfolio' as const,
      label: 'Portfolio',
      values: portfolio,
      bestIndex: bestMax(portfolio),
    },
    {
      key: 'warranty' as const,
      label: 'Warranty',
      values: pros.map((p) => {
        if (p.warrantyMonths != null && p.warrantyMonths > 0) {
          return p.warrantyNote
            ? `${p.warrantyMonths} mo · ${p.warrantyNote}`
            : `${p.warrantyMonths} months`
        }
        return p.warrantyNote || '—'
      }),
      bestIndex: bestMax(warranty),
    },
  ]
}
