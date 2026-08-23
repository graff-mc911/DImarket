// Shared auth helpers for Supabase Edge Functions.
// Centralizes service-role verification (strict equality, fail-closed)
// so functions never treat a bare "Bearer <anything>" as authorized.

const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

/**
 * Strict service-role check. Returns true ONLY when the Authorization header
 * is exactly `Bearer <SERVICE_ROLE_KEY>`. Fails closed if the key is not
 * configured in the environment (no bypass).
 */
export function isServiceRoleRequest(req: Request): boolean {
  if (!SERVICE_KEY) return false
  const auth = req.headers.get('Authorization') || ''
  return auth === `Bearer ${SERVICE_KEY}`
}

/**
 * Returns a 401 Response if the caller is not the service role.
 * Use as `const denied = denyNonService(req); if (denied) return denied`.
 */
export function denyNonService(req: Request): Response | null {
  if (isServiceRoleRequest(req)) return null
  return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', ...originCorsHeaders(req) },
  })
}

// --- CORS (origin allowlist, not wildcard) ---

const ALLOWED_ORIGINS = [
  'https://dimarket.app',
  'https://www.dimarket.app',
  'https://dimarket.market',
  'https://www.dimarket.market',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function originCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret',
    'Vary': 'Origin',
  }
}

export function corsHeadersFor(req: Request): Record<string, string> {
  return originCorsHeaders(req)
}
