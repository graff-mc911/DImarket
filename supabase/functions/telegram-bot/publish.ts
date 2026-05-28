import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { buildTitle, type ListingDraft } from './flow.ts'
import type { BotLocale } from './i18n.ts'

export async function publishListing(
  admin: SupabaseClient,
  draft: ListingDraft,
  locale: BotLocale,
  siteUrl: string,
): Promise<{ ok: true; listingId: string; link: string } | { ok: false; error: string }> {
  if (!draft.description?.trim() || draft.description.trim().length < 15) {
    return { ok: false, error: 'description' }
  }
  if (!draft.location?.trim()) return { ok: false, error: 'location' }
  if (!draft.contactPhone?.trim() && !draft.contactEmail?.trim()) {
    return { ok: false, error: 'contact' }
  }

  const duration = draft.deadlineDays ?? 30
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + duration)

  const description =
    draft.description.trim() +
    (draft.telegramUsername ? `\n\nTelegram: @${draft.telegramUsername}` : '')

  const listingData = {
    title: buildTitle(draft, locale),
    description,
    category_id: draft.categoryId || null,
    listing_type: 'service_request' as const,
    price: draft.price ?? null,
    currency: draft.currency || 'EUR',
    location: draft.location.trim(),
    visibility_radius: 'city' as const,
    contact_name: draft.contactName?.trim() || 'Telegram client',
    contact_phone: draft.contactPhone?.trim() || null,
    contact_email: draft.contactEmail?.trim() || null,
    author_id: null,
    duration_days: duration,
    expires_at: expiresAt.toISOString(),
    is_premium: false,
    status: 'active' as const,
  }

  const { data: listing, error } = await admin
    .from('listings')
    .insert(listingData)
    .select('id')
    .maybeSingle()

  if (error || !listing?.id) {
    console.error('telegram-bot publish:', error)
    return { ok: false, error: error?.message || 'insert_failed' }
  }

  const urls = (draft.imageUrls ?? []).map((u) => u.trim()).filter(Boolean)
  if (urls.length > 0) {
    const imageInserts = urls.map((url, index) => ({
      listing_id: listing.id,
      image_url: url,
      display_order: index,
    }))
    const { error: imgErr } = await admin.from('listing_images').insert(imageInserts)
    if (imgErr) console.error('listing_images:', imgErr)
  }

  const base = siteUrl.replace(/\/$/, '')
  const link = `${base}/listing/${listing.id}`
  return { ok: true, listingId: listing.id, link }
}

export async function uploadTelegramPhoto(
  admin: SupabaseClient,
  botToken: string,
  fileId: string,
  listingId: string,
): Promise<string | null> {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    })
    const fileJson = (await fileRes.json()) as { ok?: boolean; result?: { file_path?: string } }
    if (!fileJson.ok || !fileJson.result?.file_path) return null

    const filePath = fileJson.result.file_path
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`
    const bin = await fetch(fileUrl)
    if (!bin.ok) return null
    const bytes = new Uint8Array(await bin.arrayBuffer())
    const ext = filePath.split('.').pop() || 'jpg'
    const objectPath = `listings/telegram/${listingId}/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await admin.storage.from('ad-media').upload(objectPath, bytes, {
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      upsert: true,
    })
    if (upErr) {
      console.error('storage upload:', upErr)
      return fileUrl
    }

    const { data: pub } = admin.storage.from('ad-media').getPublicUrl(objectPath)
    return pub.publicUrl || fileUrl
  } catch (e) {
    console.error('uploadTelegramPhoto:', e)
    return null
  }
}

export function createAdminClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return createClient(url, key)
}
