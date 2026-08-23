import { supabase } from './supabase'
import { formatSupabaseError } from './supabaseErrors'
import type { AdMediaStyle } from './adMediaStyle'

const BUCKET = 'media'
const MAX_FILE_MB = 20
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

/** Returns the authenticated user id, or null if not logged in. */
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

export const AD_MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

const ACCEPTED_MIME = AD_MEDIA_ACCEPT.split(',')

export type SlotBannerMediaType = 'image' | 'gif' | 'video'

export function mediaTypeFromFile(file: File): SlotBannerMediaType {
  if (file.type === 'video/mp4' || file.type === 'video/webm') return 'video'
  if (file.type === 'image/gif') return 'gif'
  return 'image'
}

/** Завантажує один файл у media, повертає публічний URL */
export async function uploadAdMediaFile(file: File): Promise<string> {
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new Error('JPG, PNG, WebP, GIF, MP4, WebM')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Max ${MAX_FILE_MB} MB`)
  }
  const ext = file.name.split('.').pop() ?? 'bin'
  // Owner-scoped path `campaigns/<user_id>/<file>` — required by storage RLS
  // so only the owning user can mutate their own campaign creatives.
  const userId = await currentUserId()
  if (!userId) throw new Error('auth_required')
  const path = `campaigns/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadAdMediaFileSafe(
  file: File,
  fallbackMessage: string,
): Promise<string> {
  try {
    return await uploadAdMediaFile(file)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('Max') || message.includes('JPG')) throw err
    throw new Error(formatSupabaseError(err, fallbackMessage))
  }
}

/** Шлях у bucket з публічного URL Supabase Storage */
export function storagePathFromPublicUrl(url: string): string | null {
  const raw = url?.trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    const marker = `/${BUCKET}/`
    const i = u.pathname.indexOf(marker)
    if (i < 0) return null
    return decodeURIComponent(u.pathname.slice(i + marker.length))
  } catch {
    return null
  }
}

export function collectUrlsFromSlotEntry(entry: {
  mediaUrl?: string
  slideUrls?: string[]
  mediaStyle?: AdMediaStyle
}): string[] {
  const set = new Set<string>()
  const add = (u: string) => {
    const t = u.trim()
    if (t) set.add(t)
  }
  add(entry.mediaUrl ?? '')
  for (const u of entry.slideUrls ?? []) add(u)
  const slideshow = entry.mediaStyle?.slideshow?.urls
  if (Array.isArray(slideshow)) {
    for (const u of slideshow) add(String(u))
  }
  return [...set]
}

/** Видаляє файли з media (ігнорує зовнішні URL) */
export async function deleteAdMediaUrls(urls: string[]): Promise<void> {
  const paths = [...new Set(urls.map(storagePathFromPublicUrl).filter(Boolean))] as string[]
  if (!paths.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.warn('media delete:', error.message)
}
