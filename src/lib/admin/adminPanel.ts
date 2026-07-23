import { supabase } from '../supabase'

export type AdminStats = {
  users: number
  professionals: number
  listings: number
  active_listings: number
  reviews: number
  hidden_reviews: number
  open_reports: number
  pending_ads: number
  active_ads: number
  payments: number
  premium_users: number
  pending_verifications: number
}

export type AdminProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  user_role: string | null
  is_professional: boolean | null
  is_verified: boolean | null
  verification_level: string | null
  is_premium: boolean | null
  is_featured: boolean | null
  is_site_owner: boolean | null
  rating: number | null
  total_reviews: number | null
  created_at: string
  availability_status?: string | null
}

export type AdminListing = {
  id: string
  title: string
  status: string
  location: string | null
  author_id: string | null
  category_id: string | null
  created_at: string
  budget_max?: number | null
}

export type AdminReview = {
  id: string
  professional_id: string
  reviewer_name: string
  rating: number
  comment: string | null
  is_hidden: boolean | null
  is_approved: boolean | null
  created_at: string
}

export type AdminReport = {
  id: string
  review_id: string
  reporter_id: string
  reason: string
  status: string
  created_at: string
  details?: string | null
}

export type AdminPayment = {
  id: string
  user_id: string
  payment_type: string
  amount: number | null
  currency: string | null
  status: string | null
  created_at: string
}

export type AdminCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  created_at: string
}

export async function fetchAdminStats(): Promise<AdminStats | null> {
  const { data, error } = await supabase.rpc('admin_panel_stats')
  if (error) {
    console.error('admin_panel_stats:', error)
    return null
  }
  return data as AdminStats
}

export async function searchAdminProfiles(
  query = '',
  filter: 'all' | 'professional' | 'client' | 'premium' | 'verified' = 'all',
): Promise<AdminProfile[]> {
  const { data, error } = await supabase.rpc('admin_search_profiles', {
    p_query: query,
    p_filter: filter,
    p_limit: 100,
  })
  if (error) {
    console.error('admin_search_profiles:', error)
    return []
  }
  return (Array.isArray(data) ? data : []) as AdminProfile[]
}

export async function updateAdminProfileFlags(
  profileId: string,
  flags: {
    is_verified?: boolean
    is_premium?: boolean
    is_featured?: boolean
    is_professional?: boolean
    user_role?: string
    verification_level?: string
  },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_update_profile_flags', {
    p_profile_id: profileId,
    p_is_verified: flags.is_verified ?? null,
    p_is_premium: flags.is_premium ?? null,
    p_is_featured: flags.is_featured ?? null,
    p_is_professional: flags.is_professional ?? null,
    p_user_role: flags.user_role ?? null,
    p_verification_level: flags.verification_level ?? null,
  })
  if (error) return { ok: false, error: error.message }
  const payload = data as { ok?: boolean; error?: string }
  if (payload?.ok === false) return { ok: false, error: payload.error }
  return { ok: true }
}

export async function fetchAdminListings(limit = 80): Promise<AdminListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, status, location, author_id, category_id, created_at, budget_max')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchAdminListings:', error)
    return []
  }
  return (data ?? []) as AdminListing[]
}

export async function setListingStatus(
  listingId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_set_listing_status', {
    p_listing_id: listingId,
    p_status: status,
  })
  if (error) return { ok: false, error: error.message }
  const payload = data as { ok?: boolean; error?: string }
  if (payload?.ok === false) return { ok: false, error: payload.error }
  return { ok: true }
}

export async function fetchAdminReviews(limit = 80): Promise<AdminReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, professional_id, reviewer_name, rating, comment, is_hidden, is_approved, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchAdminReviews:', error)
    return []
  }
  return (data ?? []) as AdminReview[]
}

export async function moderateReview(
  reviewId: string,
  opts: { is_hidden?: boolean; is_approved?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_moderate_review', {
    p_review_id: reviewId,
    p_is_hidden: opts.is_hidden ?? null,
    p_is_approved: opts.is_approved ?? null,
  })
  if (error) return { ok: false, error: error.message }
  const payload = data as { ok?: boolean; error?: string }
  if (payload?.ok === false) return { ok: false, error: payload.error }
  return { ok: true }
}

export async function fetchReviewReports(limit = 50): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from('review_reports')
    .select('id, review_id, reporter_id, reason, status, created_at, details')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchReviewReports:', error)
    return []
  }
  return (data ?? []) as AdminReport[]
}

export async function setReviewReportStatus(
  reportId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_set_review_report_status', {
    p_report_id: reportId,
    p_status: status,
  })
  if (error) return { ok: false, error: error.message }
  const payload = data as { ok?: boolean; error?: string }
  if (payload?.ok === false) return { ok: false, error: payload.error }
  return { ok: true }
}

export async function fetchAdminPayments(limit = 80): Promise<AdminPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, payment_type, amount, currency, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchAdminPayments:', error)
    return []
  }
  return (data ?? []) as AdminPayment[]
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon, parent_id, created_at')
    .order('name', { ascending: true })
  if (error) {
    console.error('fetchAdminCategories:', error)
    return []
  }
  return (data ?? []) as AdminCategory[]
}

export async function createAdminCategory(input: {
  name: string
  slug: string
  description?: string
  icon?: string
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('categories').insert({
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    description: input.description?.trim() || null,
    icon: input.icon?.trim() || null,
  } as never)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteAdminCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchFraudReports(limit = 40): Promise<
  Array<{ id: string; status: string | null; created_at: string; summary?: string | null }>
> {
  const { data, error } = await supabase
    .from('ai_fraud_reports')
    .select('id, moderation_status, created_at, flags, target_type')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    return []
  }
  return ((data ?? []) as Array<{
    id: string
    moderation_status?: string | null
    created_at: string
    flags?: string[] | null
    target_type?: string | null
  }>).map((r) => ({
    id: r.id,
    status: r.moderation_status ?? null,
    created_at: r.created_at,
    summary: `${r.target_type || 'target'}${r.flags?.length ? ` · ${r.flags.join(', ')}` : ''}`,
  }))
}
