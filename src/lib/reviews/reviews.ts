import { createNotification } from '../notifications/notifications'
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
  listing_id?: string | null
  rating: number
  comment?: string | null
  work_quality: number
  communication: number
  speed: number
  reliability: number
  would_recommend: boolean
  media_urls?: ReviewMediaItem[]
}

export type ReviewSort = 'newest' | 'highest' | 'lowest'

export type ReviewReplyRow = {
  id: string
  review_id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}

export type ReviewFeedItem = {
  id: string
  professional_id: string
  reviewer_id: string | null
  reviewer_name: string
  reviewer_role: string | null
  rating: number
  comment: string | null
  listing_id: string | null
  work_quality: number | null
  communication: number | null
  speed: number | null
  reliability: number | null
  would_recommend: boolean | null
  media_urls: ReviewMediaItem[]
  like_count: number
  is_verified_customer: boolean
  created_at: string
  liked_by_me: boolean
  replies: ReviewReplyRow[]
}

export type RatingStats = {
  average: number
  count: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  recommendPct: number | null
}

async function detectVerifiedCustomer(
  reviewerId: string,
  professionalId: string,
  listingId?: string | null,
): Promise<boolean> {
  if (listingId) return true

  const { count: inbound } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', professionalId)
    .eq('recipient_id', reviewerId)
  if ((inbound ?? 0) > 0) return true

  const { count: outbound } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', reviewerId)
    .eq('recipient_id', professionalId)
  return (outbound ?? 0) > 0
}

export async function submitReviewV2(
  input: ReviewV2Input,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (input.listing_id) {
    const { data: dup } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', input.listing_id)
      .eq('reviewer_id', input.reviewer_id)
      .maybeSingle()
    if (dup) return { ok: false, error: 'duplicate' }
  }

  const media = input.media_urls ?? []
  if (!input.comment?.trim() && media.length === 0) {
    return { ok: false, error: 'empty' }
  }

  const avg = Math.round(
    (input.work_quality + input.communication + input.speed + input.reliability) / 4,
  )
  const rating = Math.min(5, Math.max(1, Math.round((input.rating + avg) / 2)))
  const isVerified = await detectVerifiedCustomer(
    input.reviewer_id,
    input.professional_id,
    input.listing_id,
  )

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      professional_id: input.professional_id,
      reviewer_id: input.reviewer_id,
      reviewer_name: input.reviewer_name,
      reviewer_email: input.reviewer_email,
      reviewer_role: input.reviewer_role,
      listing_id: input.listing_id,
      rating,
      comment: input.comment?.trim() || (media.length ? ' ' : null),
      work_quality: input.work_quality,
      communication: input.communication,
      speed: input.speed,
      reliability: input.reliability,
      would_recommend: input.would_recommend,
      is_approved: true,
      is_hidden: false,
      moderation_flag: detectSuspiciousReview(input),
      media_urls: media,
      like_count: 0,
      is_verified_customer: isVerified,
    } as never)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

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

  return { ok: true, id: (data as { id: string } | null)?.id }
}

function detectSuspiciousReview(input: ReviewV2Input): boolean {
  const text = (input.comment || '').toLowerCase()
  if (!text.trim() && input.rating === 5 && input.work_quality === 5) return true
  const spam = ['http://', 'https://', 'telegram', 'whatsapp me', 'crypto', 'free money']
  return spam.some((s) => text.includes(s))
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

export function sortReviews<T extends { rating: number; created_at: string }>(
  items: T[],
  sort: ReviewSort,
): T[] {
  const copy = [...items]
  if (sort === 'highest') {
    copy.sort((a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at))
  } else if (sort === 'lowest') {
    copy.sort((a, b) => a.rating - b.rating || b.created_at.localeCompare(a.created_at))
  } else {
    copy.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  return copy
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

  let liked = new Set<string>()
  if (viewerId && ids.length) {
    const { data: likes } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('user_id', viewerId)
      .in('review_id', ids)
    liked = new Set((likes ?? []).map((l) => String((l as { review_id: string }).review_id)))
  }

  let repliesByReview = new Map<string, ReviewReplyRow[]>()
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

  const items: ReviewFeedItem[] = rows.map((r) => ({
    id: String(r.id),
    professional_id: String(r.professional_id),
    reviewer_id: (r.reviewer_id as string | null) ?? null,
    reviewer_name: String(r.reviewer_name || 'Customer'),
    reviewer_role: (r.reviewer_role as string | null) ?? null,
    rating: Number(r.rating) || 0,
    comment: (r.comment as string | null) ?? null,
    listing_id: (r.listing_id as string | null) ?? null,
    work_quality: (r.work_quality as number | null) ?? null,
    communication: (r.communication as number | null) ?? null,
    speed: (r.speed as number | null) ?? null,
    reliability: (r.reliability as number | null) ?? null,
    would_recommend: (r.would_recommend as boolean | null) ?? null,
    media_urls: normalizeMediaUrls(r.media_urls),
    like_count: Number(r.like_count) || 0,
    is_verified_customer: Boolean(r.is_verified_customer) || Boolean(r.listing_id),
    created_at: String(r.created_at),
    liked_by_me: liked.has(String(r.id)),
    replies: repliesByReview.get(String(r.id)) ?? [],
  }))

  return sortReviews(items, sort)
}

export async function toggleReviewLike(
  reviewId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<{ liked: boolean; likeCount: number } | { error: string }> {
  if (currentlyLiked) {
    await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', userId)
  } else {
    const { error } = await supabase.from('review_likes').insert({
      review_id: reviewId,
      user_id: userId,
    } as never)
    if (error && error.code !== '23505') return { error: error.message }
  }

  const { count } = await supabase
    .from('review_likes')
    .select('*', { count: 'exact', head: true })
    .eq('review_id', reviewId)

  return { liked: !currentlyLiked, likeCount: count ?? 0 }
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
