import { countryFlag } from './homeReviews'
import { supabase } from './supabase'
import type { Profile } from './types'

export type ProWorkingHours = {
  timezone?: string
  days?: Partial<
    Record<
      'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
      Array<[string, string]>
    >
  >
}

export type ProSocialLinks = {
  facebook?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  tiktok?: string
}

export type PremiumProfile = Profile & {
  slug?: string | null
  cover_url?: string | null
  profession?: string | null
  company_name?: string | null
  country_code?: string | null
  country_name?: string | null
  city?: string | null
  years_experience?: number | null
  response_time_hours?: number | null
  travel_radius_km?: number | null
  service_countries?: string[]
  service_cities?: string[]
  working_hours?: ProWorkingHours
  emergency_available?: boolean
  weekend_available?: boolean
  insurance_info?: string | null
  warranty_info?: string | null
  whatsapp?: string | null
  telegram?: string | null
  social_links?: ProSocialLinks
  recommendation_rate?: number | null
  repeat_customers?: number | null
  email_public?: string | null
}

export type ProfessionalService = {
  id: string
  profile_id: string
  category_slug: string | null
  name: string
  description: string | null
  price_from: number | null
  price_to: number | null
  currency: string
  unit: string | null
  sort_order: number
}

export type ProfessionalProject = {
  id: string
  profile_id: string
  title: string
  description: string | null
  category_slug: string | null
  location: string | null
  budget: number | null
  currency: string
  duration_days: number | null
  completed_at: string | null
  customer_review: string | null
  customer_rating: number | null
  image_url: string | null
  sort_order: number
}

export type ProfessionalCredential = {
  id: string
  profile_id: string
  kind: 'certificate' | 'license'
  title: string
  issuer: string | null
  credential_number: string | null
  year: number | null
  expires_at: string | null
  document_url: string | null
  sort_order: number
}

export type PremiumProfileBundle = {
  profile: PremiumProfile
  services: ProfessionalService[]
  projects: ProfessionalProject[]
  certificates: ProfessionalCredential[]
  licenses: ProfessionalCredential[]
  similar: PremiumProfile[]
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isProfileUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function slugifyName(name: string, id: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const short = id.replace(/-/g, '').slice(0, 8)
  return `${base || 'pro'}-${short}`
}

export function proProfilePath(profile: Pick<PremiumProfile, 'id' | 'slug' | 'full_name'>): string {
  const slug = profile.slug || slugifyName(profile.full_name || 'pro', profile.id)
  return `/pro/${slug}`
}

export function formatResponseTime(
  hours: number | null | undefined,
  t: (key: string) => string,
): string {
  if (hours == null || Number.isNaN(Number(hours))) return t('proProfile.responseUnknown')
  const h = Number(hours)
  if (h < 1) return t('proProfile.responseUnder1h')
  if (h <= 24) return t('proProfile.responseHours').replace('{h}', String(Math.round(h)))
  return t('proProfile.responseDays').replace('{d}', String(Math.round(h / 24)))
}

export function formatAvailability(
  status: PremiumProfile['availability_status'] | undefined,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'available':
      return t('proProfile.availAvailable')
    case 'busy':
      return t('proProfile.availBusy')
    case 'limited':
      return t('proProfile.availLimited')
    case 'unavailable':
      return t('proProfile.availUnavailable')
    default:
      return t('proProfile.availAvailable')
  }
}

export function proCountryFlag(code: string | null | undefined): string {
  if (!code) return ''
  return countryFlag(code)
}

function normalizeProfile(row: Record<string, unknown>): PremiumProfile {
  const id = String(row.id)
  const fullName = (row.full_name as string | null) ?? null
  return {
    ...(row as unknown as Profile),
    id,
    full_name: fullName,
    slug: (row.slug as string | null) || slugifyName(fullName || 'pro', id),
    cover_url: (row.cover_url as string | null) ?? null,
    profession: (row.profession as string | null) ?? null,
    company_name: (row.company_name as string | null) ?? null,
    country_code: (row.country_code as string | null) ?? null,
    country_name: (row.country_name as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    years_experience:
      row.years_experience == null ? null : Number(row.years_experience),
    response_time_hours:
      row.response_time_hours == null ? null : Number(row.response_time_hours),
    travel_radius_km:
      row.travel_radius_km == null ? null : Number(row.travel_radius_km),
    service_countries: Array.isArray(row.service_countries)
      ? (row.service_countries as string[])
      : [],
    service_cities: Array.isArray(row.service_cities)
      ? (row.service_cities as string[])
      : [],
    working_hours: (row.working_hours as ProWorkingHours) || {},
    emergency_available: Boolean(row.emergency_available),
    weekend_available: Boolean(row.weekend_available),
    insurance_info: (row.insurance_info as string | null) ?? null,
    warranty_info: (row.warranty_info as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    telegram: (row.telegram as string | null) ?? null,
    social_links: (row.social_links as ProSocialLinks) || {},
    recommendation_rate:
      row.recommendation_rate == null ? null : Number(row.recommendation_rate),
    repeat_customers: Number(row.repeat_customers) || 0,
    email_public: (row.email_public as string | null) ?? null,
    languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
    work_subcategory_slugs: Array.isArray(row.work_subcategory_slugs)
      ? (row.work_subcategory_slugs as string[])
      : [],
  }
}

async function fetchProfileRow(slugOrId: string): Promise<PremiumProfile | null> {
  if (isProfileUuid(slugOrId)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', slugOrId)
      .maybeSingle()
    if (!error && data) return normalizeProfile(data as Record<string, unknown>)
  }

  const bySlug = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slugOrId)
    .maybeSingle()

  if (!bySlug.error && bySlug.data) {
    return normalizeProfile(bySlug.data as Record<string, unknown>)
  }

  // Fallback: match derived slug suffix (last 8 hex of id)
  const suffix = slugOrId.split('-').pop() || ''
  if (suffix.length >= 6) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_professional', true)
      .limit(200)
    const match = ((data ?? []) as Array<Record<string, unknown>>).find((row) => {
      const id = String(row.id).replace(/-/g, '')
      return id.startsWith(suffix) || slugifyName(String(row.full_name || 'pro'), String(row.id)) === slugOrId
    })
    if (match) return normalizeProfile(match)
  }

  return null
}

export async function fetchPremiumProfileBundle(
  slugOrId: string,
): Promise<PremiumProfileBundle | null> {
  const profile = await fetchProfileRow(slugOrId)
  if (!profile) return null

  const id = profile.id
  const [servicesRes, projectsRes, credsRes, similarRes, reviewsRes] = await Promise.all([
    supabase
      .from('professional_services')
      .select('*')
      .eq('profile_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('professional_projects')
      .select('*')
      .eq('profile_id', id)
      .order('completed_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('professional_credentials')
      .select('*')
      .eq('profile_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('profiles')
      .select('*')
      .eq('is_professional', true)
      .neq('id', id)
      .order('rating', { ascending: false })
      .limit(24),
    supabase
      .from('reviews')
      .select('would_recommend')
      .eq('professional_id', id)
      .eq('is_hidden', false)
      .limit(500),
  ])

  const services = (!servicesRes.error && servicesRes.data
    ? servicesRes.data
    : []) as ProfessionalService[]
  const projects = (!projectsRes.error && projectsRes.data
    ? projectsRes.data
    : []) as ProfessionalProject[]
  const credentials = (!credsRes.error && credsRes.data
    ? credsRes.data
    : []) as ProfessionalCredential[]

  // Enrich recommendation rate from reviews when missing
  if (profile.recommendation_rate == null && reviewsRes.data?.length) {
    const rows = reviewsRes.data as Array<{ would_recommend: boolean | null }>
    const scored = rows.filter((r) => typeof r.would_recommend === 'boolean')
    if (scored.length) {
      profile.recommendation_rate = Math.round(
        (1000 * scored.filter((r) => r.would_recommend).length) / scored.length,
      ) / 10
    }
  }

  const similarPool = ((similarRes.data ?? []) as Array<Record<string, unknown>>).map(
    normalizeProfile,
  )
  const myTrades = new Set(profile.work_subcategory_slugs || [])
  const scored = similarPool
    .map((p) => {
      const overlap = (p.work_subcategory_slugs || []).filter((s) => myTrades.has(s)).length
      const sameCity =
        profile.city && p.city && profile.city.toLowerCase() === p.city.toLowerCase() ? 2 : 0
      const sameCountry =
        profile.country_code &&
        p.country_code &&
        profile.country_code === p.country_code
          ? 1
          : 0
      return { p, score: overlap * 3 + sameCity + sameCountry + p.rating }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.p)

  return {
    profile,
    services,
    projects,
    certificates: credentials.filter((c) => c.kind === 'certificate'),
    licenses: credentials.filter((c) => c.kind === 'license'),
    similar: scored.length ? scored : similarPool.slice(0, 6),
  }
}

export async function reportProfessionalProfile(input: {
  profileId: string
  reporterId: string
  reason: string
  details?: string
}): Promise<{ ok: boolean; error?: string }> {
  const reason = input.reason.trim()
  if (!reason) return { ok: false, error: 'empty' }
  const { error } = await supabase.from('profile_reports').insert({
    profile_id: input.profileId,
    reporter_id: input.reporterId,
    reason,
    details: input.details?.trim() || null,
  } as never)
  if (error) {
    if (/relation|schema cache|does not exist/i.test(error.message)) {
      return { ok: false, error: 'unavailable' }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export function groupServicesByCategory(
  services: ProfessionalService[],
): Array<{ category: string; items: ProfessionalService[] }> {
  const map = new Map<string, ProfessionalService[]>()
  for (const s of services) {
    const key = s.category_slug || 'general'
    const list = map.get(key) ?? []
    list.push(s)
    map.set(key, list)
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }))
}

export function formatPriceRange(service: ProfessionalService): string | null {
  if (service.price_from == null && service.price_to == null) return null
  const cur = service.currency || 'EUR'
  const unit = service.unit ? ` / ${service.unit}` : ''
  if (service.price_from != null && service.price_to != null) {
    return `${service.price_from}–${service.price_to} ${cur}${unit}`
  }
  if (service.price_from != null) return `from ${service.price_from} ${cur}${unit}`
  return `up to ${service.price_to} ${cur}${unit}`
}

export function formatWorkingHours(
  hours: ProWorkingHours | null | undefined,
  t: (key: string) => string,
): string[] {
  const days = hours?.days
  if (!days) return [t('proProfile.hoursUnavailable')]
  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const lines: string[] = []
  for (const key of order) {
    const slots = days[key]
    const label = t(`proProfile.day.${key}`)
    if (!slots?.length) {
      lines.push(`${label}: ${t('proProfile.closed')}`)
    } else {
      lines.push(`${label}: ${slots.map(([a, b]) => `${a}–${b}`).join(', ')}`)
    }
  }
  return lines
}

export async function shareProProfile(profile: PremiumProfile): Promise<void> {
  const url = `${window.location.origin}${proProfilePath(profile)}`
  const title = profile.full_name || 'DImarket Professional'
  if (navigator.share) {
    try {
      await navigator.share({ title, url, text: profile.profession || profile.bio || undefined })
      return
    } catch {
      /* fall through */
    }
  }
  await navigator.clipboard.writeText(url)
}
