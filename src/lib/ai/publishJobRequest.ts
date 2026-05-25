import { supabase } from '../supabase'
import type { Listing } from '../types'
import { buildDraftTitle, type JobRequestDraft } from './jobRequestDraft'
import { runMatchingForListing } from '../matching/persistMatches'

export type PublishJobRequestInput = {
  draft: JobRequestDraft
  authorId: string | null
  currencyCode: string
  categoryLabel?: string
}

export type PublishJobRequestResult =
  | { ok: true; listing: Listing }
  | { ok: false; error: string }

export function validateJobRequestDraft(
  draft: JobRequestDraft,
  contactRequiredMsg: string,
): string | null {
  if (!draft.description?.trim() || draft.description.trim().length < 15) {
    return 'description'
  }
  if (!draft.location?.trim()) return 'location'
  if (!draft.contactPhone?.trim() && !draft.contactEmail?.trim()) {
    return contactRequiredMsg
  }
  return null
}

export async function publishJobRequestFromDraft(
  input: PublishJobRequestInput,
): Promise<PublishJobRequestResult> {
  const { draft, authorId, currencyCode, categoryLabel } = input
  const duration = draft.deadlineDays ?? 30
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + duration)

  const listingData = {
    title: buildDraftTitle(draft, categoryLabel),
    description: draft.description!.trim(),
    category_id: draft.categoryId || null,
    listing_type: 'service_request' as const,
    price: draft.price ?? null,
    currency: draft.currency || currencyCode,
    location: draft.location!.trim(),
    visibility_radius: draft.visibilityRadius ?? 'city',
    contact_name: draft.contactName?.trim() || 'Client',
    contact_phone: draft.contactPhone?.trim() || null,
    contact_email: draft.contactEmail?.trim() || null,
    author_id: authorId,
    duration_days: duration,
    expires_at: expiresAt.toISOString(),
    is_premium: false,
    status: 'active' as const,
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert(listingData)
    .select()
    .maybeSingle<Listing>()

  if (listingError) {
    return { ok: false, error: listingError.message }
  }
  if (!listing) {
    return { ok: false, error: 'listing_missing' }
  }

  const urls = (draft.imageUrls ?? []).map((u) => u.trim()).filter(Boolean)
  if (urls.length > 0) {
    const imageInserts = urls.map((url, index) => ({
      listing_id: listing.id,
      image_url: url,
      display_order: index,
    }))
    const { error: imagesError } = await supabase.from('listing_images').insert(imageInserts)
    if (imagesError) console.error('listing_images insert:', imagesError)
  }

  const city = draft.location?.split(',')[0]?.trim()
  void runMatchingForListing(listing.id, {
    categorySlug: draft.categorySlug,
    city,
    language: undefined,
  })

  return { ok: true, listing }
}
