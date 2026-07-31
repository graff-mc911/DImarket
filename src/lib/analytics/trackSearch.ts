import { supabase } from '../supabase'

let lastKey = ''
let lastAt = 0

/**
 * Record a search for Search Analytics (deduped 8s for identical payloads).
 */
export async function recordSearchEvent(input: {
  query?: string | null
  categorySlug?: string | null
  city?: string | null
  country?: string | null
  resultCount?: number
  source?: string
}): Promise<void> {
  const payload = {
    query: input.query?.trim() || null,
    categorySlug: input.categorySlug?.trim() || null,
    city: input.city?.trim() || null,
    country: input.country?.trim() || null,
    resultCount: Math.max(0, input.resultCount ?? 0),
    source: input.source || 'search',
  }
  const key = JSON.stringify(payload)
  const now = Date.now()
  if (key === lastKey && now - lastAt < 8000) return
  lastKey = key
  lastAt = now

  try {
    const { error } = await supabase.rpc('record_search_event' as never, {
      p_query: payload.query,
      p_category_slug: payload.categorySlug,
      p_city: payload.city,
      p_country: payload.country,
      p_result_count: payload.resultCount,
      p_source: payload.source,
    } as never)
    if (!error) return
  } catch {
    /* fall through */
  }

  try {
    await supabase.from('search_events').insert({
      query: payload.query,
      category_slug: payload.categorySlug,
      city: payload.city,
      country: payload.country,
      result_count: payload.resultCount,
      source: payload.source,
    } as never)
  } catch {
    /* table may not exist yet */
  }
}
