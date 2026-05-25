import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  listing_id: string
  category_slug?: string
  city?: string
  country?: string
  language?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401)

  try {
    const body = (await req.json()) as Body
    if (!body.listing_id) return jsonResponse({ error: 'listing_id_required' }, 400)

    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let query = service
      .from('profiles')
      .select(
        'id, full_name, location, rating, total_reviews, response_rate, preferred_language, is_verified, is_premium, professional_categories(category:categories(slug))',
      )
      .in('user_role', ['professional', 'company'])
      .eq('is_active', true)
      .limit(40)

    const { data: profiles, error } = await query
    if (error) return jsonResponse({ error: error.message }, 500)

    const ranked = (profiles ?? [])
      .map((p) => scoreProfile(p, body))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)

    const rows = ranked.map((m, i) => ({
      listing_id: body.listing_id,
      contractor_id: m.profileId,
      score: m.score,
      reasons: m.reasons,
      rank_position: i + 1,
    }))

    if (rows.length) {
      await service.from('match_scores').upsert(rows, { onConflict: 'listing_id,contractor_id' })
      await service.from('ai_matches').insert({
        listing_id: body.listing_id,
        user_id: user.id,
        criteria: body,
        matches: ranked,
      })
    }

    return jsonResponse({ matches: ranked })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
})

function scoreProfile(
  p: Record<string, unknown>,
  criteria: Body,
): { profileId: string; fullName: string; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const rating = (p.rating as number) ?? 0
  const reviews = (p.total_reviews as number) ?? 0
  score += Math.min(30, rating * 6)
  score += Math.min(15, Math.log10(reviews + 1) * 10)
  if (rating >= 4) reasons.push('high_rating')

  const loc = ((p.location as string) ?? '').toLowerCase()
  if (criteria.city && loc.includes(criteria.city.toLowerCase())) {
    score += 20
    reasons.push('near_location')
  }

  if (p.is_verified) {
    score += 8
    reasons.push('verified')
  }

  const cats = p.professional_categories as Array<{ category?: { slug?: string } }> | undefined
  if (criteria.category_slug && cats?.some((c) => c.category?.slug === criteria.category_slug)) {
    score += 18
    reasons.push('category_match')
  }

  return {
    profileId: p.id as string,
    fullName: (p.full_name as string) || 'Professional',
    score: Math.round(score * 10) / 10,
    reasons,
  }
}
