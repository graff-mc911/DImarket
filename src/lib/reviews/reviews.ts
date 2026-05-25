import { supabase } from '../supabase'

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
}

export async function submitReviewV2(input: ReviewV2Input): Promise<{ ok: boolean; error?: string }> {
  if (input.listing_id) {
    const { data: dup } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', input.listing_id)
      .eq('reviewer_id', input.reviewer_id)
      .maybeSingle()
    if (dup) return { ok: false, error: 'duplicate' }
  }

  const avg = Math.round(
    (input.work_quality + input.communication + input.speed + input.reliability) / 4,
  )
  const rating = Math.min(5, Math.max(1, Math.round((input.rating + avg) / 2)))

  const { error } = await supabase.from('reviews').insert({
    professional_id: input.professional_id,
    reviewer_id: input.reviewer_id,
    reviewer_name: input.reviewer_name,
    reviewer_email: input.reviewer_email,
    reviewer_role: input.reviewer_role,
    listing_id: input.listing_id,
    rating,
    comment: input.comment,
    work_quality: input.work_quality,
    communication: input.communication,
    speed: input.speed,
    reliability: input.reliability,
    would_recommend: input.would_recommend,
    is_approved: true,
    is_hidden: false,
    moderation_flag: detectSuspiciousReview(input),
  })

  if (error) return { ok: false, error: error.message }

  const { error: rpcErr } = await supabase.rpc('refresh_profile_rating', {
    p_profile_id: input.professional_id,
  })
  if (rpcErr) {
    await supabase.from('profiles').update({ rating }).eq('id', input.professional_id)
  }

  await supabase.from('notifications').insert({
    user_id: input.professional_id,
    type: 'review',
    title: 'New review',
    body: `${input.reviewer_name} left a ${rating}-star review`,
    link_path: `/professional/${input.professional_id}`,
  })

  return { ok: true }
}

function detectSuspiciousReview(input: ReviewV2Input): boolean {
  const text = (input.comment || '').toLowerCase()
  if (!text && input.rating === 5 && input.work_quality === 5) return true
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
  })
  if (!error) {
    await supabase.from('reviews').update({ moderation_flag: true }).eq('id', reviewId)
  }
  return !error
}

export function reviewSummary(reviews: Array<{ rating: number; work_quality?: number | null }>) {
  if (!reviews.length) return { average: 0, count: 0 }
  const sum = reviews.reduce((a, r) => a + r.rating, 0)
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length }
}
