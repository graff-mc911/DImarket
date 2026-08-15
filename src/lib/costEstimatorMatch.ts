/**
 * Match professionals, companies, and material listings for a cost estimate.
 */
import { supabase } from './supabase'
import type { FullCostEstimate } from './costEstimatorTypes'
import type { EstimatorLocation } from './costEstimatorTypes'
import { haversineKm } from './projectFeed'
import { filterPublicProfiles } from './publicProfileVisibility'

export type EstimatorMatchProfile = {
  id: string
  full_name: string | null
  location: string | null
  rating: number | null
  is_verified: boolean | null
  user_role: string | null
  avatar_url: string | null
  profile_photo: string | null
  service_latitude: number | null
  service_longitude: number | null
  work_subcategory_slugs: string[] | null
  distanceKm: number | null
  kind: 'professional' | 'company'
}

export type EstimatorMaterialListing = {
  id: string
  title: string
  price: number | null
  currency: string | null
  city_name: string | null
  location: string | null
  listing_type: string | null
}

export type EstimatorMarketplaceMatches = {
  professionals: EstimatorMatchProfile[]
  companies: EstimatorMatchProfile[]
  materialListings: EstimatorMaterialListing[]
  specialistCounts: Record<string, { pros: number; companies: number }>
}

function locHaystack(p: { location?: string | null }) {
  return (p.location || '').toLowerCase()
}

function matchesLocation(hay: string, loc: EstimatorLocation): boolean {
  const city = loc.city.trim().toLowerCase()
  const country = loc.country.trim().toLowerCase()
  const region = loc.region.trim().toLowerCase()
  if (city && hay.includes(city)) return true
  if (region && hay.includes(region)) return true
  if (country && hay.includes(country)) return true
  if (!city && !country && !region) return true
  return false
}

export async function fetchEstimatorMatches(
  estimate: FullCostEstimate,
  location: EstimatorLocation,
): Promise<EstimatorMarketplaceMatches> {
  const slugs = [
    ...new Set(estimate.specialists.map((s) => s.subcategorySlug).filter(Boolean)),
  ]
  const groups = [...new Set(slugs.map((s) => s.split('-')[0]).filter(Boolean))]
  const radiusKm = location.radiusKm && location.radiusKm > 0 ? location.radiusKm : 50

  const { data: profiles } = await supabase
    .from('profiles')
    .select(
      'id, full_name, location, rating, is_verified, user_role, avatar_url, profile_photo, service_latitude, service_longitude, work_subcategory_slugs',
    )
    .eq('is_professional', true)
    .in('user_role', ['professional', 'company'])
    .order('rating', { ascending: false })
    .limit(120)

  const origin =
    location.latitude != null && location.longitude != null
      ? { lat: location.latitude, lon: location.longitude }
      : null

  const scored: EstimatorMatchProfile[] = filterPublicProfiles(
    (profiles as Array<Omit<EstimatorMatchProfile, 'distanceKm' | 'kind'> & { is_professional?: boolean }> | null) ?? [],
  )
    .map((p) => {
      const subs = p.work_subcategory_slugs || []
      const tradeHit =
        !slugs.length ||
        subs.some((s) => slugs.includes(s) || groups.some((g) => s.startsWith(`${g}-`)))
      if (!tradeHit && slugs.length) return null
      if (!matchesLocation(locHaystack(p), location) && location.city) {
        if (!origin || p.service_latitude == null || p.service_longitude == null) return null
      }
      let distanceKm: number | null = null
      if (origin && p.service_latitude != null && p.service_longitude != null) {
        distanceKm = haversineKm(origin, {
          lat: Number(p.service_latitude),
          lon: Number(p.service_longitude),
        })
        if (distanceKm != null && distanceKm > radiusKm) return null
      }
      return {
        ...p,
        distanceKm,
        kind: (p.user_role === 'company' ? 'company' : 'professional') as 'professional' | 'company',
      }
    })
    .filter(Boolean) as EstimatorMatchProfile[]

  scored.sort((a, b) => {
    const va = a.is_verified ? 1 : 0
    const vb = b.is_verified ? 1 : 0
    if (vb !== va) return vb - va
    const ra = a.rating ?? 0
    const rb = b.rating ?? 0
    if (rb !== ra) return rb - ra
    const da = a.distanceKm ?? 9999
    const db = b.distanceKm ?? 9999
    return da - db
  })

  const professionals = scored.filter((p) => p.kind === 'professional').slice(0, 8)
  const companies = scored.filter((p) => p.kind === 'company').slice(0, 6)

  const specialistCounts: EstimatorMarketplaceMatches['specialistCounts'] = {}
  for (const sp of estimate.specialists) {
    const g = sp.subcategorySlug.split('-')[0]
    const pool = scored.filter((p) =>
      (p.work_subcategory_slugs || []).some(
        (s) => s === sp.subcategorySlug || s.startsWith(`${g}-`),
      ),
    )
    specialistCounts[sp.id] = {
      pros: pool.filter((p) => p.kind === 'professional').length,
      companies: pool.filter((p) => p.kind === 'company').length,
    }
  }

  const queries = estimate.materials.slice(0, 4).map((m) => m.searchQuery)
  const materialListings: EstimatorMaterialListing[] = []
  for (const q of queries) {
    const like = `%${q.replace(/[%_]/g, '').slice(0, 40)}%`
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, currency, city_name, location, listing_type')
      .eq('status', 'active')
      .neq('listing_type', 'service_request')
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(3)
    for (const row of (data as EstimatorMaterialListing[] | null) ?? []) {
      if (!materialListings.some((x) => x.id === row.id)) materialListings.push(row)
    }
    if (materialListings.length >= 8) break
  }

  return { professionals, companies, materialListings, specialistCounts }
}
