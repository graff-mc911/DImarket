import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  quote_id?: string
  to_email?: string
  customer_name?: string
  project_title?: string
  total?: number
  currency?: string
  pdf_url?: string | null
  html?: string
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return { ok: false, error: 'RESEND_API_KEY missing' }
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  if (!res.ok) {
    const text = await res.text()
    return { ok: false, error: text.slice(0, 200) }
  }
  return { ok: true }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  )
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return jsonResponse({ ok: false, error: 'unauthorized' }, 401)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400)
  }

  // A quote_id is REQUIRED: the caller must own the quote they are emailing.
  // The recipient is DERIVED from the quote's listing owner (looked up via the
  // service role) — never from the request body. This prevents the function
  // from being used as an open email relay (arbitrary HTML to arbitrary address).
  if (!body.quote_id) {
    return jsonResponse({ ok: false, error: 'quote_id_required' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Load the quote + its listing + the listing owner (customer). Reject if the
  // caller does not own the quote.
  const { data: quote, error: qErr } = await admin
    .from('quotes')
    .select('id, professional_id, listing_id, total, currency, pdf_url, status')
    .eq('id', body.quote_id)
    .maybeSingle()
  if (qErr || !quote || quote.professional_id !== user.id) {
    return jsonResponse({ ok: false, error: 'forbidden' }, 403)
  }

  // Resolve the customer (listing owner) email from auth — the ONLY allowed recipient.
  const { data: listing } = await admin
    .from('listings')
    .select('id, author_id, title')
    .eq('id', quote.listing_id)
    .maybeSingle()
  if (!listing?.author_id) {
    return jsonResponse({ ok: false, error: 'customer_not_found' }, 404)
  }
  const { data: custUser } = await admin.auth.admin.getUserById(listing.author_id)
  const to = (custUser?.user?.email || '').trim().toLowerCase()
  if (!to || !to.includes('@')) {
    return jsonResponse({ ok: false, error: 'customer_email_unavailable' }, 404)
  }

  // All email content is built SERVER-SIDE from DB data — body.html / body.to_email
  // from the request are intentionally ignored to prevent content injection.
  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('VITE_SITE_URL') ?? 'https://dimarket.app'
  const title = listing.title || 'your project'
  const total = Number(quote.total) || 0
  const currency = quote.currency === 'EUR' || !quote.currency ? '€' : `${quote.currency} `
  const name = (custUser?.user?.user_metadata?.full_name as string) || 'there'
  const pdfLink = quote.pdf_url
    ? `<p style="margin:24px 0"><a href="${quote.pdf_url}" style="display:inline-block;background:#1d1d1f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">View quote PDF</a></p>`
    : ''

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1f;background:#f5f5f7;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px">
    <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#86868b">DImarket</p>
    <h1 style="margin:8px 0 0;font-size:24px;letter-spacing:-0.02em">New quote for ${title}</h1>
    <p style="color:#6e6e73;font-size:15px;line-height:1.5">Hi ${name}, you received a quote totaling <strong>${currency}${total.toFixed(2)}</strong>.</p>
    ${pdfLink}
    <p style="font-size:13px;color:#86868b"><a href="${siteUrl}/customer/dashboard" style="color:#0066cc">Open your dashboard</a></p>
  </div>
</body></html>`

  const subject = `Quote for ${title} — ${currency}${total.toFixed(2)}`
  const sent = await sendResendEmail(to, subject, html)
  if (!sent.ok) {
    return jsonResponse({ ok: false, error: sent.error || 'email_failed' }, 502)
  }

  await admin
    .from('quotes')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', body.quote_id)
    .eq('professional_id', user.id)

  return jsonResponse({ ok: true })
})
