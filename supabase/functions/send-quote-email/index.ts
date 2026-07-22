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

  const to = String(body.to_email || '').trim().toLowerCase()
  if (!to || !to.includes('@')) {
    return jsonResponse({ ok: false, error: 'invalid_email' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (body.quote_id) {
    const { data: quote } = await admin
      .from('quotes')
      .select('id, professional_id, listing_id, total, status')
      .eq('id', body.quote_id)
      .maybeSingle()
    if (!quote || quote.professional_id !== user.id) {
      return jsonResponse({ ok: false, error: 'forbidden' }, 403)
    }
  }

  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('VITE_SITE_URL') ?? 'https://dimarket.app'
  const title = body.project_title || 'your project'
  const total = Number(body.total) || 0
  const currency = body.currency === 'EUR' || !body.currency ? '€' : `${body.currency} `
  const name = body.customer_name || 'there'
  const pdfLink = body.pdf_url
    ? `<p style="margin:24px 0"><a href="${body.pdf_url}" style="display:inline-block;background:#1d1d1f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">View quote PDF</a></p>`
    : ''

  const html = body.html && body.html.includes('<html')
    ? body.html
    : `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1f;background:#f5f5f7;padding:32px">
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

  if (body.quote_id) {
    await admin
      .from('quotes')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', body.quote_id)
      .eq('professional_id', user.id)
  }

  return jsonResponse({ ok: true })
})
