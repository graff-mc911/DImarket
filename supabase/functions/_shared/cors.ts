// Backward-compatible static CORS headers.
// NOTE: `Access-Control-Allow-Origin: '*'` is kept here only for backward
// compatibility with functions that have not yet been migrated to the
// request-aware helpers below. New code should use `corsJsonResponse` /
// `corsOptions` which reflect a strict origin allowlist. See _shared/auth.ts.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret',
}

const ALLOWED_ORIGINS = [
  'https://dimarket.app',
  'https://www.dimarket.app',
  'https://dimarket.market',
  'https://www.dimarket.market',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function allowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ''
}

export function corsHeadersFor(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(req),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret',
    'Vary': 'Origin',
  }
}

// Request-aware helpers — prefer these in new code.
export function corsOptions(req: Request): Response {
  return new Response(null, { status: 200, headers: corsHeadersFor(req) })
}

export function corsJsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
  })
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
