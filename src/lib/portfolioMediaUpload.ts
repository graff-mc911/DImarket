import { supabase } from './supabase'

export const PORTFOLIO_MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.pdf'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const DOC_TYPES = ['application/pdf']

const MAX_IMAGE_MB = 12
const MAX_VIDEO_MB = 80
const MAX_DOC_MB = 15

export function validatePortfolioMedia(file: File): string | null {
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Images max ${MAX_IMAGE_MB} MB`
    return null
  }
  if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return `Videos max ${MAX_VIDEO_MB} MB`
    return null
  }
  if (DOC_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')) {
    if (file.size > MAX_DOC_MB * 1024 * 1024) return `PDFs max ${MAX_DOC_MB} MB`
    return null
  }
  return 'Use image, video (mp4/webm), or PDF'
}

export function isVideoFile(file: File): boolean {
  return VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export async function uploadPortfolioMedia(
  userId: string,
  file: File,
): Promise<string> {
  const err = validatePortfolioMedia(file)
  if (err) throw new Error(err)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  let { error } = await supabase.storage.from('portfolio-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    // Fallback to media bucket used by existing profile uploads
    const fallbackPath = `campaigns/profiles/${userId}/portfolio-${Date.now()}.${ext}`
    const alt = await supabase.storage.from('media').upload(fallbackPath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (alt.error) throw alt.error || error
    const { data } = supabase.storage.from('media').getPublicUrl(fallbackPath)
    return data.publicUrl
  }

  const { data } = supabase.storage.from('portfolio-media').getPublicUrl(path)
  return data.publicUrl
}
