import { supabase } from './supabase'
import { PROJECT_TRADES } from './projectWizard'

export type PortfolioMediaType = 'image' | 'video' | 'certificate' | 'before_after'

export type PortfolioItemRow = {
  id: string
  profile_id: string
  title: string
  description: string | null
  image_url: string | null
  video_url: string | null
  before_url: string | null
  after_url: string | null
  media_type: PortfolioMediaType
  category_slug: string | null
  like_count: number
  display_order: number
  created_at: string
  updated_at?: string
  liked_by_me?: boolean
}

export type PortfolioItemDraft = {
  title: string
  description: string
  media_type: PortfolioMediaType
  category_slug: string
  image_url: string
  video_url: string
  before_url: string
  after_url: string
}

export const EMPTY_PORTFOLIO_DRAFT: PortfolioItemDraft = {
  title: '',
  description: '',
  media_type: 'image',
  category_slug: '',
  image_url: '',
  video_url: '',
  before_url: '',
  after_url: '',
}

export const PORTFOLIO_CATEGORIES = [
  { id: '', label: 'All' },
  ...PROJECT_TRADES.map((t) => ({ id: t.id, label: t.labelEn })),
  { id: 'certificate', label: 'Certificates' },
]

export function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return 'General'
  if (slug === 'certificate') return 'Certificates'
  return PROJECT_TRADES.find((t) => t.id === slug)?.labelEn || slug
}

export function coverUrl(item: PortfolioItemRow): string | null {
  if (item.media_type === 'before_after') {
    return item.after_url || item.before_url || item.image_url
  }
  if (item.media_type === 'video') {
    return item.image_url || item.video_url
  }
  return item.image_url || item.before_url || item.after_url
}

export async function fetchPortfolioItems(
  profileId: string,
  viewerId?: string | null,
): Promise<PortfolioItemRow[]> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchPortfolioItems:', error)
    // Legacy fallback from portfolio_images
    const { data: profile } = await supabase
      .from('profiles')
      .select('portfolio_images')
      .eq('id', profileId)
      .maybeSingle()
    const urls = Array.isArray((profile as { portfolio_images?: unknown } | null)?.portfolio_images)
      ? ((profile as { portfolio_images: string[] }).portfolio_images).filter(Boolean)
      : []
    return urls.map((url, i) => ({
      id: `legacy-${i}`,
      profile_id: profileId,
      title: `Work ${i + 1}`,
      description: null,
      image_url: url,
      video_url: null,
      before_url: null,
      after_url: null,
      media_type: 'image' as const,
      category_slug: null,
      like_count: 0,
      display_order: i,
      created_at: new Date().toISOString(),
      liked_by_me: false,
    }))
  }

  const rows = ((data ?? []) as PortfolioItemRow[]).map((r) => ({
    ...r,
    media_type: r.media_type || ('image' as const),
    like_count: r.like_count ?? 0,
    video_url: r.video_url ?? null,
    before_url: r.before_url ?? null,
    after_url: r.after_url ?? null,
    category_slug: r.category_slug ?? null,
  }))
  if (!viewerId || rows.length === 0) {
    return rows.map((r) => ({ ...r, liked_by_me: false }))
  }

  const ids = rows.map((r) => r.id).filter((id) => !id.startsWith('legacy-'))
  if (!ids.length) return rows.map((r) => ({ ...r, liked_by_me: false }))

  const { data: likes } = await supabase
    .from('portfolio_likes')
    .select('portfolio_item_id')
    .eq('user_id', viewerId)
    .in('portfolio_item_id', ids)

  const liked = new Set((likes ?? []).map((l) => (l as { portfolio_item_id: string }).portfolio_item_id))
  return rows.map((r) => ({ ...r, liked_by_me: liked.has(r.id) }))
}

export async function createPortfolioItem(
  profileId: string,
  draft: PortfolioItemDraft,
  displayOrder = 0,
): Promise<{ id: string } | { error: string }> {
  const payload = {
    profile_id: profileId,
    title: draft.title.trim() || 'Untitled project',
    description: draft.description.trim() || null,
    media_type: draft.media_type,
    category_slug: draft.category_slug || null,
    image_url: draft.image_url || draft.after_url || draft.before_url || null,
    video_url: draft.video_url || null,
    before_url: draft.before_url || null,
    after_url: draft.after_url || null,
    display_order: displayOrder,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(payload as never)
    .select('id')
    .single()

  if (error || !data) return { error: error?.message || 'create_failed' }
  await syncLegacyPortfolioImages(profileId)
  return { id: (data as { id: string }).id }
}

export async function updatePortfolioItem(
  itemId: string,
  profileId: string,
  draft: PortfolioItemDraft,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from('portfolio_items')
    .update({
      title: draft.title.trim() || 'Untitled project',
      description: draft.description.trim() || null,
      media_type: draft.media_type,
      category_slug: draft.category_slug || null,
      image_url: draft.image_url || draft.after_url || draft.before_url || null,
      video_url: draft.video_url || null,
      before_url: draft.before_url || null,
      after_url: draft.after_url || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', itemId)
    .eq('profile_id', profileId)

  if (error) return { error: error.message }
  await syncLegacyPortfolioImages(profileId)
  return { ok: true }
}

export async function deletePortfolioItem(
  itemId: string,
  profileId: string,
): Promise<boolean> {
  if (itemId.startsWith('legacy-')) return false
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId)
    .eq('profile_id', profileId)
  if (!error) await syncLegacyPortfolioImages(profileId)
  return !error
}

/** Keep profiles.portfolio_images in sync for older surfaces */
async function syncLegacyPortfolioImages(profileId: string): Promise<void> {
  const { data } = await supabase
    .from('portfolio_items')
    .select('image_url, after_url, before_url, media_type')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })

  const urls = ((data ?? []) as Array<{
    image_url: string | null
    after_url: string | null
    before_url: string | null
  }>)
    .map((r) => r.image_url || r.after_url || r.before_url)
    .filter(Boolean) as string[]

  await supabase
    .from('profiles')
    .update({ portfolio_images: urls } as never)
    .eq('id', profileId)
}

export async function togglePortfolioLike(
  itemId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<{ liked: boolean; likeCount: number } | { error: string }> {
  if (itemId.startsWith('legacy-')) return { error: 'legacy_item' }

  if (currentlyLiked) {
    await supabase
      .from('portfolio_likes')
      .delete()
      .eq('portfolio_item_id', itemId)
      .eq('user_id', userId)
  } else {
    const { error } = await supabase.from('portfolio_likes').insert({
      portfolio_item_id: itemId,
      user_id: userId,
    } as never)
    if (error && error.code !== '23505') return { error: error.message }
  }

  const { count } = await supabase
    .from('portfolio_likes')
    .select('*', { count: 'exact', head: true })
    .eq('portfolio_item_id', itemId)

  const likeCount = count ?? 0
  await supabase
    .from('portfolio_items')
    .update({ like_count: likeCount } as never)
    .eq('id', itemId)

  return { liked: !currentlyLiked, likeCount }
}

export async function sharePortfolioItem(item: PortfolioItemRow, profileId: string): Promise<void> {
  const url = `${window.location.origin}/professional/${profileId}?portfolio=${item.id}`
  const title = item.title || 'Portfolio project'
  const text = item.description || 'Check out this project on DImarket'

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return
    } catch {
      /* fall through */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    window.prompt('Copy link', url)
  }
}

export function portfolioShareUrl(profileId: string, itemId?: string): string {
  const base = `${typeof window !== 'undefined' ? window.location.origin : 'https://dimarket.app'}/professional/${profileId}`
  return itemId ? `${base}?portfolio=${itemId}` : base
}
