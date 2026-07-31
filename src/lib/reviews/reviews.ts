import { createNotification } from '../notifications/notifications'
import { countryFlag } from '../homeReviews'
import { supabase } from '../supabase'
import {
  normalizeMediaUrls,
  type ReviewMediaItem,
} from '../reviewMediaUpload'

export type ReviewV2Input = {
  professional_id: string
  reviewer_id: string
  reviewer_name: string
  reviewer_email?: string | null
  reviewer_role: 'client' | 'professional' | 'company'
  reviewer_avatar_url?: string | null
  reviewer_country_code?: string | null
  listing_id?: string | null
  booking_id?: string | null
  project_category?: string | null
  project_completed_at?: string | null
  rating: number
  comment?: string | null
  work_quality: number
  communication: number
  speed: number
  reliability: number
  would_recommend: boolean
  media_urls?: ReviewMediaItem[]
  before_media_urls?: ReviewMediaItem[]
  after_media_urls?: ReviewMediaItem[]
}

export type ReviewSort = 'newest' | 'highest' | 'lowest' | 'most_helpful'
export type ReviewVote = 'helpful' | 'not_helpful'

export type ReviewReplyRow = {
  id: string
  review_id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}

export type ReviewableProject = {
  source: 'booking' | 'listing'
  listing_id: string | null
  booking_id: string | null
  project_title: string
  project_category: string | null
  project_completed_at: string | null
  country_name: string | null
  country_code: string | null
}

export type ReviewFeedItem = {
  id: string
  professional_id: string
  reviewer_id: string | null
  reviewer_name: string
  reviewer_role: string | null
  reviewer_avatar_url: string | null
  reviewer_country_code: string | null
  project_category: string | null
  project_completed_at: string | null
  rating: number
  comment: string | null
  listing_id: string | null
  booking_id: string | null
  work_quality: number | null
  communication: number | null
  speed: number | null
  reliability: number | null
  would_recommend: boolean | null
  media_urls: ReviewMediaItem[]
  before_media_urls: ReviewMediaItem[]
  after_media_urls: ReviewMediaItem[]
  like_count: number
  helpful_count: number
  not_helpful_count: number
  is_verified_customer: boolean
  is_verified_project: boolean
  created_at: string
  liked_by_me: boolean
  my_vote: ReviewVote | null
  replies: ReviewReplyRow[]
}

export type RatingStats = {
  average: number
  count: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  recommendPct: number | null
}

const COUNTRY_NAME_TO_CODE: Array<[string, string]> = [
  ['german', 'DE'],
  ['deutschland', 'DE'],
  ['spain', 'ES'],
  ['espa', 'ES'],
  ['ukrain', 'UA'],
  ['france', 'FR'],
  ['frankreich', 'FR'],
  ['poland', 'PL'],
  ['polska', 'PL'],
  ['ital', 'IT'],
  ['portug', 'PT'],
  ['nether', 'NL'],
  ['holland', 'NL'],
  ['austria', 'AT'],
  ['öster', 'AT'],
  ['swiss', 'CH'],
  ['schweiz', 'CH'],
  ['romania', 'RO'],
  ['românia', 'RO'],
  ['czech', 'CZ'],
  ['united kingdom', 'GB'],
  ['england', 'GB'],
  ['belgium', 'BE'],
  ['united states', 'US'],
]

export function guessCountryCode(name: string | null | undefined): string | null {
  if (!name) return null
  const trimmed = name.trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  const n = trimmed.toLowerCase()
  for (const [needle, code] of COUNTRY_NAME_TO_CODE) {
    if (n.includes(needle)) return code
  }
  return null
}

export function reviewCountryFlag(code: string | null | undefined): string {
  if (!code) return ''
  return countryFlag(code)
}

function detectSuspiciousReview(input: ReviewV2Input): boolean {
  const text = (input.comment || '').toLowerCase()
  if (!text.trim() && input.rating === 5 && input.work_quality === 5) return true
  const spam = ['http://', 'https://', 'telegram', 'whatsapp me', 'crypto', 'free money']
  return spam.some((s) => text.includes(s))
}

async function fetchReviewableProjectsFallback(
  customerId: string,
  professionalId: string,
): Promise<ReviewableProject[]> {
  const out: ReviewableProject[] = []

  const { data: existing } = await supabase
    .from('reviews')
    .select('listing_id, booking_id')
    .eq('reviewer_id', customerId)
    .eq('professional_id', professionalId)

  const reviewedListings = new Set(
    (existing ?? [])
      .map((r) => (r as { listing_id?: string | null }).listing_id)
      .filter(Boolean) as string[],
  )
  const reviewedBookings = new Set(
    (existing ?? [])
      .map((r) => (r as { booking_id?: string | null }).booking_id)
      .filter(Boolean) as string[],
  )

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, notes, updated_at, ends_at, created_at, status')
    .eq('customer_id', customerId)
    .eq('professional_id', professionalId)
    .eq('status', 'completed')

  for (const b of bookings ?? []) {
    const row = b as {
      id: string
      notes: string | null
      updated_at: string | null
      ends_at: string | null
      created_at: string
    }
    if (reviewedBookings.has(row.id)) continue
    out.push({
      source: 'booking',
      listing_id: null,
      booking_id: row.id,
      project_title: row.notes?.trim() || 'Completed booking',
      project_category: null,
      project_completed_at: row.updated_at || row.ends_at || row.created_at,
      country_name: null,
      country_code: null,
    })
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, status, updated_at, created_at, country_name, subcategory_slugs, category_id')
    .eq('author_id', customerId)
    .eq('status', 'sold')
    .order('updated_at', { ascending: false })
    .limit(40)

  const listingRows = (listings ?? []) as Array<{
    id: string
    title: string
    status: string
    updated_at: string
    created_at: string
    country_name: string | null
    subcategory_slugs: string[] | null
    category_id: string | null
  }>

  if (!listingRows.length) return out

  const listingIds = listingRows.map((l) => l.id)
  const [{ data: apps }, { data: quotes }, { data: categories }] = await Promise.all([
    supabase
      .from('project_applications')
      .select('listing_id, status')
      .eq('professional_id', professionalId)
      .eq('status', 'accepted')
      .in('listing_id', listingIds),
    supabase
      .from('quotes')
      .select('listing_id, status')
      .eq('professional_id', professionalId)
      .eq('status', 'accepted')
      .in('listing_id', listingIds),
    supabase.from('categories').select('id, name'),
  ])

  const acceptedListingIds = new Set<string>()
  for (const a of apps ?? []) {
    acceptedListingIds.add(String((a as { listing_id: string }).listing_id))
  }
  for (const q of quotes ?? []) {
    acceptedListingIds.add(String((q as { listing_id: string }).listing_id))
  }

  const catMap = new Map(
    ((categories ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]),
  )

  for (const l of listingRows) {
    if (reviewedListings.has(l.id)) continue
    if (!acceptedListingIds.has(l.id)) continue
    const category =
      (l.category_id && catMap.get(l.category_id)) ||
      l.subcategory_slugs?.[0] ||
      'Project'
    out.push({
      source: 'listing',
      listing_id: l.id,
      booking_id: null,
      project_title: l.title,
      project_category: category,
      project_completed_at: l.updated_at || l.created_at,
      country_name: l.country_name,
      country_code: guessCountryCode(l.country_name),
    })
  }

  return out
}

export async function fetchReviewableProjects(
  customerId: string,
  professionalId: string,
): Promise<ReviewableProject[]> {
  if (!customerId || !professionalId || customerId === professionalId) return []

  const { data, error } = await supabase.rpc('get_reviewable_projects', {
    p_customer_id: customerId,
    p_professional_id: professionalId,
  })

  if (!error && Array.isArray(data)) {
    return (data as Array<Record<string, unknown>>).map((row) => {
      const countryName = (row.country_name as string | null) ?? null
      return {
        source: (row.source as 'booking' | 'listing') || 'listing',
        listing_id: (row.listing_id as string | null) ?? null,
        booking_id: (row.booking_id as string | null) ?? null,
        project_title: String(row.project_title || 'Completed project'),
        project_category: (row.project_category as string | null) ?? null,
        project_completed_at: (row.project_completed_at as string | null) ?? null,
        country_name: countryName,
        country_code: guessCountryCode(countryName),
      }
    })
  }

  return fetchReviewableProjectsFallback(customerId, professionalId)
}

export async function canCustomerReviewProfessional(
  customerId: string,
  professionalId: string,
): Promise<boolean> {
  const projects = await fetchReviewableProjects(customerId, professionalId)
  return projects.length > 0
}

export async function submitReviewV2(
  input: ReviewV2Input,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (input.reviewer_id === input.professional_id) {
    return { ok: false, error: 'self' }
  }

  const projects = await fetchReviewableProjects(input.reviewer_id, input.professional_id)
  if (!projects.length) return { ok: false, error: 'not_eligible' }

  const selected =
    projects.find(
      (p) =>
        (input.listing_id && p.listing_id === input.listing_id) ||
        (input.booking_id && p.booking_id === input.booking_id),
    ) || projects[0]

  if (selected.listing_id) {
    const { data: dup } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', selected.listing_id)
      .eq('reviewer_id', input.reviewer_id)
      .maybeSingle()
    if (dup) return { ok: false, error: 'duplicate' }
  }

  if (selected.booking_id) {
    const { data: dup } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', selected.booking_id)
      .eq('reviewer_id', input.reviewer_id)
      .maybeSingle()
    if (dup) return { ok: false, error: 'duplicate' }
  }

  const media = input.media_urls ?? []
  const before = input.before_media_urls ?? []
  const after = input.after_media_urls ?? []
  if (!input.comment?.trim() && media.length === 0 && before.length === 0 && after.length === 0) {
    return { ok: false, error: 'empty' }
  }

  const avg = Math.round(
    (input.work_quality + input.communication + input.speed + input.reliability) / 4,
  )
  const rating = Math.min(5, Math.max(1, Math.round((input.rating + avg) / 2)))

  const payload = {
    professional_id: input.professional_id,
    reviewer_id: input.reviewer_id,
    reviewer_name: input.reviewer_name,
    reviewer_email: input.reviewer_email,
    reviewer_role: input.reviewer_role,
    reviewer_avatar_url: input.reviewer_avatar_url ?? null,
    reviewer_country_code:
      input.reviewer_country_code || selected.country_code || guessCountryCode(selected.country_name),
    listing_id: selected.listing_id,
    booking_id: selected.booking_id,
    project_category: input.project_category || selected.project_category,
    project_completed_at: input.project_completed_at || selected.project_completed_at,
    rating,
    comment: input.comment?.trim() || (media.length || before.length || after.length ? ' ' : null),
    work_quality: input.work_quality,
    communication: input.communication,
    speed: input.speed,
    reliability: input.reliability,
    would_recommend: input.would_recommend,
    is_approved: true,
    is_hidden: false,
    moderation_flag: detectSuspiciousReview(input),
    media_urls: media,
    before_media_urls: before,
    after_media_urls: after,
    like_count: 0,
    helpful_count: 0,
    not_helpful_count: 0,
    is_verified_customer: true,
    is_verified_project: true,
  }

  const { data, error } = await supabase.from('reviews').insert(payload as never).select('id').single()

  if (error) {
    // Fallback without newer columns if migration not applied yet
    if (/column|schema cache|does not exist/i.test(error.message)) {
      const legacy = {
        professional_id: payload.professional_id,
        reviewer_id: payload.reviewer_id,
        reviewer_name: payload.reviewer_name,
        reviewer_email: payload.reviewer_email,
        reviewer_role: payload.reviewer_role,
        listing_id: payload.listing_id,
        rating: payload.rating,
        comment: payload.comment,
        work_quality: payload.work_quality,
        communication: payload.communication,
        speed: payload.speed,
        reliability: payload.reliability,
        would_recommend: payload.would_recommend,
        is_approved: true,
        is_hidden: false,
        moderation_flag: payload.moderation_flag,
        media_urls: [...before, ...media, ...after],
        like_count: 0,
        is_verified_customer: true,
      }
      const retry = await supabase.from('reviews').insert(legacy as never).select('id').single()
      if (retry.error) return { ok: false, error: retry.error.message }
      await afterReviewSaved(input, rating, (retry.data as { id: string } | null)?.id)
      return { ok: true, id: (retry.data as { id: string } | null)?.id }
    }
    if (/customer_can_review|policy|row-level security/i.test(error.message)) {
      return { ok: false, error: 'not_eligible' }
    }
    return { ok: false, error: error.message }
  }

  await afterReviewSaved(input, rating, (data as { id: string } | null)?.id)
  return { ok: true, id: (data as { id: string } | null)?.id }
}

async function afterReviewSaved(
  input: ReviewV2Input,
  rating: number,
  id?: string,
): Promise<void> {
  const { error: rpcErr } = await supabase.rpc('refresh_profile_rating', {
    p_profile_id: input.professional_id,
  })
  if (rpcErr) {
    await supabase
      .from('profiles')
      .update({ rating } as never)
      .eq('id', input.professional_id)
  }

  await createNotification({
    userId: input.professional_id,
    type: 'review',
    title: 'New review',
    body: `${input.reviewer_name} left a ${rating}-star review`,
    linkPath: `/professional/${input.professional_id}`,
  })

  void id
}

export async function reportReview(
  reviewId: string,
  reporterId: string,
  reason: string,
  details?: string,
): Promise<boolean> {
  const { error } = await supabase.from('review_reports').insert({
    review_id: reviewId,
    reporter_id: reporterId,
    reason,
    details,
  } as never)
  if (!error) {
    await supabase
      .from('reviews')
      .update({ moderation_flag: true } as never)
      .eq('id', reviewId)
  }
  return !error
}

export function reviewSummary(reviews: Array<{ rating: number }>) {
  return computeRatingStats(reviews)
}

export function computeRatingStats(
  reviews: Array<{ rating: number; would_recommend?: boolean | null }>,
): RatingStats {
  const distribution: RatingStats['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  if (!reviews.length) {
    return { average: 0, count: 0, distribution, recommendPct: null }
  }
  let sum = 0
  let recommendYes = 0
  let recommendTotal = 0
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
    distribution[star] += 1
    sum += r.rating
    if (typeof r.would_recommend === 'boolean') {
      recommendTotal += 1
      if (r.would_recommend) recommendYes += 1
    }
  }
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
    recommendPct:
      recommendTotal > 0 ? Math.round((recommendYes / recommendTotal) * 100) : null,
  }
}

export function sortReviews<
  T extends { rating: number; created_at: string; helpful_count?: number; like_count?: number },
>(items: T[], sort: ReviewSort): T[] {
  const copy = [...items]
  if (sort === 'highest') {
    copy.sort((a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at))
  } else if (sort === 'lowest') {
    copy.sort((a, b) => a.rating - b.rating || b.created_at.localeCompare(a.created_at))
  } else if (sort === 'most_helpful') {
    copy.sort((a, b) => {
      const ah = a.helpful_count ?? a.like_count ?? 0
      const bh = b.helpful_count ?? b.like_count ?? 0
      return bh - ah || b.created_at.localeCompare(a.created_at)
    })
  } else {
    copy.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  return copy
}

function mapReviewRow(
  r: Record<string, unknown>,
  votes: Map<string, ReviewVote>,
  repliesByReview: Map<string, ReviewReplyRow[]>,
  avatars: Map<string, string | null>,
): ReviewFeedItem {
  const id = String(r.id)
  const reviewerId = (r.reviewer_id as string | null) ?? null
  const helpful = Number(r.helpful_count ?? r.like_count) || 0
  const notHelpful = Number(r.not_helpful_count) || 0
  const myVote = votes.get(id) ?? null
  return {
    id,
    professional_id: String(r.professional_id),
    reviewer_id: reviewerId,
    reviewer_name: String(r.reviewer_name || 'Customer'),
    reviewer_role: (r.reviewer_role as string | null) ?? null,
    reviewer_avatar_url:
      (r.reviewer_avatar_url as string | null) ||
      (reviewerId ? avatars.get(reviewerId) ?? null : null),
    reviewer_country_code: (r.reviewer_country_code as string | null) ?? null,
    project_category: (r.project_category as string | null) ?? null,
    project_completed_at: (r.project_completed_at as string | null) ?? null,
    rating: Number(r.rating) || 0,
    comment: (r.comment as string | null) ?? null,
    listing_id: (r.listing_id as string | null) ?? null,
    booking_id: (r.booking_id as string | null) ?? null,
    work_quality: (r.work_quality as number | null) ?? null,
    communication: (r.communication as number | null) ?? null,
    speed: (r.speed as number | null) ?? null,
    reliability: (r.reliability as number | null) ?? null,
    would_recommend: (r.would_recommend as boolean | null) ?? null,
    media_urls: normalizeMediaUrls(r.media_urls),
    before_media_urls: normalizeMediaUrls(r.before_media_urls),
    after_media_urls: normalizeMediaUrls(r.after_media_urls),
    like_count: helpful,
    helpful_count: helpful,
    not_helpful_count: notHelpful,
    is_verified_customer: Boolean(r.is_verified_customer) || Boolean(r.listing_id),
    is_verified_project:
      Boolean(r.is_verified_project) ||
      Boolean(r.listing_id) ||
      Boolean(r.booking_id) ||
      Boolean(r.is_verified_customer),
    created_at: String(r.created_at),
    liked_by_me: myVote === 'helpful',
    my_vote: myVote,
    replies: repliesByReview.get(id) ?? [],
  }
}

export async function fetchReviewFeed(
  professionalId: string,
  viewerId?: string | null,
  sort: ReviewSort = 'newest',
): Promise<ReviewFeedItem[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchReviewFeed:', error)
    return []
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const ids = rows.map((r) => String(r.id))
  const reviewerIds = [
    ...new Set(
      rows
        .map((r) => r.reviewer_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const votes = new Map<string, ReviewVote>()
  if (viewerId && ids.length) {
    const { data: voteRows, error: voteErr } = await supabase
      .from('review_votes')
      .select('review_id, vote')
      .eq('user_id', viewerId)
      .in('review_id', ids)

    if (!voteErr && voteRows) {
      for (const v of voteRows) {
        const row = v as { review_id: string; vote: ReviewVote }
        votes.set(String(row.review_id), row.vote)
      }
    } else {
      const { data: likes } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', viewerId)
        .in('review_id', ids)
      for (const l of likes ?? []) {
        votes.set(String((l as { review_id: string }).review_id), 'helpful')
      }
    }
  }

  const repliesByReview = new Map<string, ReviewReplyRow[]>()
  if (ids.length) {
    const { data: replies } = await supabase
      .from('review_replies')
      .select('*')
      .in('review_id', ids)
      .order('created_at', { ascending: true })
    for (const raw of replies ?? []) {
      const r = raw as ReviewReplyRow
      const list = repliesByReview.get(r.review_id) ?? []
      list.push(r)
      repliesByReview.set(r.review_id, list)
    }
  }

  const avatars = new Map<string, string | null>()
  if (reviewerIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url, profile_photo, location')
      .in('id', reviewerIds)
    for (const p of profiles ?? []) {
      const row = p as {
        id: string
        avatar_url: string | null
        profile_photo: string | null
        location: string | null
      }
      avatars.set(row.id, row.avatar_url || row.profile_photo)
    }

    // Fill missing country codes from listing when needed
    const missingCountry = rows.filter((r) => !r.reviewer_country_code && r.listing_id)
    if (missingCountry.length) {
      const listingIds = [
        ...new Set(missingCountry.map((r) => String(r.listing_id))),
      ]
      const { data: listings } = await supabase
        .from('listings')
        .select('id, country_name')
        .in('id', listingIds)
      const countryByListing = new Map(
        ((listings ?? []) as Array<{ id: string; country_name: string | null }>).map((l) => [
          l.id,
          guessCountryCode(l.country_name),
        ]),
      )
      for (const r of rows) {
        if (!r.reviewer_country_code && r.listing_id) {
          r.reviewer_country_code = countryByListing.get(String(r.listing_id)) ?? null
        }
      }
    }

    const missingCategory = rows.filter((r) => !r.project_category && r.listing_id)
    if (missingCategory.length) {
      const listingIds = [...new Set(missingCategory.map((r) => String(r.listing_id)))]
      const { data: listings } = await supabase
        .from('listings')
        .select('id, subcategory_slugs, category:categories(name)')
        .in('id', listingIds)
      const catByListing = new Map<string, string>()
      for (const l of listings ?? []) {
        const row = l as {
          id: string
          subcategory_slugs?: string[] | null
          category?: { name?: string } | null
        }
        catByListing.set(
          row.id,
          row.category?.name || row.subcategory_slugs?.[0] || 'Project',
        )
      }
      for (const r of rows) {
        if (!r.project_category && r.listing_id) {
          r.project_category = catByListing.get(String(r.listing_id)) ?? null
        }
      }
    }
  }

  const items = rows.map((r) => mapReviewRow(r, votes, repliesByReview, avatars))
  return sortReviews(items, sort)
}

/** @deprecated Prefer setReviewVote — kept for older call sites */
export async function toggleReviewLike(
  reviewId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<{ liked: boolean; likeCount: number } | { error: string }> {
  const res = await setReviewVote(
    reviewId,
    userId,
    currentlyLiked ? null : 'helpful',
  )
  if ('error' in res) return { error: res.error }
  return { liked: res.my_vote === 'helpful', likeCount: res.helpful_count }
}

export async function setReviewVote(
  reviewId: string,
  userId: string,
  vote: ReviewVote | null,
): Promise<
  | {
      my_vote: ReviewVote | null
      helpful_count: number
      not_helpful_count: number
    }
  | { error: string }
> {
  if (vote == null) {
    await supabase.from('review_votes').delete().eq('review_id', reviewId).eq('user_id', userId)
    await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', userId)
  } else {
    const { error } = await supabase.from('review_votes').upsert(
      {
        review_id: reviewId,
        user_id: userId,
        vote,
      } as never,
      { onConflict: 'review_id,user_id' },
    )

    if (error) {
      // Legacy fallback: helpful maps to likes
      if (vote === 'helpful') {
        const ins = await supabase.from('review_likes').upsert(
          { review_id: reviewId, user_id: userId } as never,
          { onConflict: 'review_id,user_id' },
        )
        if (ins.error && ins.error.code !== '23505') return { error: ins.error.message }
      } else if (/relation|schema cache|does not exist/i.test(error.message)) {
        return { error: 'votes_unavailable' }
      } else if (error.code !== '23505') {
        return { error: error.message }
      }
    } else if (vote === 'helpful') {
      await supabase.from('review_likes').upsert(
        { review_id: reviewId, user_id: userId } as never,
        { onConflict: 'review_id,user_id' },
      )
    } else {
      await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', userId)
    }
  }

  const [{ count: helpfulCount }, { count: notHelpfulCount }, reviewRow] = await Promise.all([
    supabase
      .from('review_votes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .eq('vote', 'helpful'),
    supabase
      .from('review_votes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .eq('vote', 'not_helpful'),
    supabase
      .from('reviews')
      .select('helpful_count, not_helpful_count, like_count')
      .eq('id', reviewId)
      .maybeSingle(),
  ])

  const row = reviewRow.data as {
    helpful_count?: number
    not_helpful_count?: number
    like_count?: number
  } | null

  let helpful = helpfulCount ?? row?.helpful_count ?? row?.like_count ?? 0
  let notHelpful = notHelpfulCount ?? row?.not_helpful_count ?? 0

  if (helpfulCount == null && notHelpfulCount == null) {
    const { count } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
    helpful = count ?? row?.like_count ?? 0
  }

  return {
    my_vote: vote,
    helpful_count: helpful,
    not_helpful_count: notHelpful,
  }
}

export async function addReviewReply(input: {
  reviewId: string
  authorId: string
  authorName: string
  body: string
}): Promise<{ reply: ReviewReplyRow } | { error: string }> {
  const body = input.body.trim()
  if (!body) return { error: 'empty' }

  const { data, error } = await supabase
    .from('review_replies')
    .insert({
      review_id: input.reviewId,
      author_id: input.authorId,
      author_name: input.authorName,
      body,
    } as never)
    .select('*')
    .single()

  if (error || !data) return { error: error?.message || 'failed' }
  return { reply: data as ReviewReplyRow }
}
