import { supabase } from './supabase'

/** JPEG, PNG, WebP, GIF — як у рекламних банерів (без відео для профілю). */
export const PROFILE_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif'

export const PROFILE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

const MAX_FILE_MB = 10
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

export function validateProfileImageFile(file: File): string | null {
  if (!PROFILE_IMAGE_MIME_TYPES.includes(file.type as (typeof PROFILE_IMAGE_MIME_TYPES)[number])) {
    return 'JPG, PNG, WebP, GIF'
  }
  if (file.size > MAX_FILE_BYTES) {
    return `Max ${MAX_FILE_MB} MB`
  }
  return null
}

export async function uploadProfileImage(
  userId: string,
  file: File,
  kind: 'avatar' | 'portfolio',
): Promise<string> {
  const validation = validateProfileImageFile(file)
  if (validation) {
    throw new Error(validation)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const path = `campaigns/profiles/${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`

  const { error } = await supabase.storage
    .from('ad-media')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('ad-media').getPublicUrl(path)
  return data.publicUrl
}
