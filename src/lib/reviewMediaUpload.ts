import { supabase } from './supabase'

export const REVIEW_MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

const MAX_IMAGE_MB = 12
const MAX_VIDEO_MB = 80
const MAX_FILES = 6

export type ReviewMediaItem = {
  url: string
  type: 'image' | 'video'
}

export function validateReviewMedia(file: File): string | null {
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Images max ${MAX_IMAGE_MB} MB`
    return null
  }
  if (VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)) {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return `Videos max ${MAX_VIDEO_MB} MB`
    return null
  }
  return 'Use image or video (mp4/webm)'
}

export function isReviewVideoFile(file: File): boolean {
  return VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)
}

export async function uploadReviewMedia(userId: string, file: File): Promise<ReviewMediaItem> {
  const err = validateReviewMedia(file)
  if (err) throw new Error(err)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const mediaType: 'image' | 'video' = isReviewVideoFile(file) ? 'video' : 'image'

  let { error } = await supabase.storage.from('review-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    const fallbackPath = `campaigns/profiles/${userId}/review-${Date.now()}.${ext}`
    const alt = await supabase.storage.from('media').upload(fallbackPath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (alt.error) throw alt.error || error
    const { data } = supabase.storage.from('media').getPublicUrl(fallbackPath)
    return { url: data.publicUrl, type: mediaType }
  }

  const { data } = supabase.storage.from('review-media').getPublicUrl(path)
  return { url: data.publicUrl, type: mediaType }
}

export function normalizeMediaUrls(raw: unknown): ReviewMediaItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        const url = item.trim()
        const type: 'image' | 'video' = /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image'
        return { url, type }
      }
      if (item && typeof item === 'object' && 'url' in item) {
        const url = String((item as { url: unknown }).url || '')
        if (!url) return null
        const t = (item as { type?: string }).type
        const type: 'image' | 'video' =
          t === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image'
        return { url, type }
      }
      return null
    })
    .filter((x): x is ReviewMediaItem => Boolean(x))
    .slice(0, MAX_FILES)
}

export { MAX_FILES as REVIEW_MEDIA_MAX_FILES }
