// Simple in-memory per-IP rate limiter for Supabase Edge Functions.
//
// NOTE: This is per-instance, not distributed. It meaningfully raises the bar
// against casual anonymous abuse of cost-bearing (LLM) endpoints. For
// production-scale protection, back this with a Supabase table or Upstash
// Redis so the limit is shared across all function instances.
//
// Usage:
//   const rl = rateLimit(req, { windowMs: 60_000, max: 20, keyPrefix: 'ai-assistant' })
//   if (!rl.ok) return jsonResponse({ ok: false, error: 'rate_limited', retry_after: rl.retryAfter }, 429)

const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(
  req: Request,
  opts: { windowMs: number; max: number; keyPrefix?: string },
): { ok: true } | { ok: false; retryAfter: number } {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const key = `${opts.keyPrefix || 'rl'}:${ip}`
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.reset < now) {
    buckets.set(key, { count: 1, reset: now + opts.windowMs })
    return { ok: true }
  }
  if (entry.count >= opts.max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)) }
  }
  entry.count++
  return { ok: true }
}

// Opportunistic cleanup so the map does not grow unbounded across long-lived
// instances. Safe to call on every request.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of buckets) {
      if (entry.reset < now) buckets.delete(key)
    }
  }, 5 * 60 * 1000)
}
