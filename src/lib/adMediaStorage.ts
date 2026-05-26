import { supabase } from './supabase'
import type { AdMediaStyle } from './adMediaStyle'
import type { SlotMediaEntry } from './adSlotMedia'

const BUCKET = 'ad-media'

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

/** Видаляє файли з ad-media (ігнорує зовнішні URL) */
export async function deleteAdMediaUrls(urls: string[]): Promise<void> {
  const paths = [...new Set(urls.map(storagePathFromPublicUrl).filter(Boolean))] as string[]
  if (!paths.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.warn('ad-media delete:', error.message)
}
