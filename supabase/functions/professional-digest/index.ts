import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  action?: 'cron_run' | 'preview'
  payload?: { force?: boolean }
}

function verifyCronAuth(req: Request): boolean {
  const secret = Deno.env.get('DIGEST_CRON_SECRET') ?? Deno.env.get('MARKETING_CRON_SECRET')
  const header = req.headers.get('x-cron-secret')
  if (secret && header === secret) return true
  const auth = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true
  return false
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return false
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  return res.ok
}

function cityToken(location: string | null | undefined): string {
  return (location ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
}

function jobMatchesProfessional(
  job: { location: string | null; subcategory_slugs: string[] | null },
  pro: { location: string | null; work_subcategory_slugs: string[] | null },
): boolean {
  const proCity = cityToken(pro.location)
  const jobCity = cityToken(job.location)
  if (!proCity || !jobCity) return false
  if (!jobCity.includes(proCity) && !proCity.includes(jobCity)) return false

  const work = pro.work_subcategory_slugs ?? []
  const subs = job.subcategory_slugs ?? []
  if (!work.length || !subs.length) return true
  return subs.some((s) => work.includes(s) || work.some((w) => s.startsWith(`${w}-`) || w.startsWith(`${s}-`)))
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  let body: Body = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const action = body.action ?? 'cron_run'
  if (action !== 'cron_run' && action !== 'preview') {
    return jsonResponse({ ok: false, error: 'unknown_action' }, 400)
  }
  if (!verifyCronAuth(req)) {
    return jsonResponse({ ok: false, error: 'forbidden' }, 403)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const since = new Date()
  since.setDate(since.getDate() - 7)
  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('VITE_SITE_URL') ?? 'https://dimarket.app'

  const [{ data: jobs }, { data: pros }] = await Promise.all([
    admin
      .from('listings')
      .select('id, title, location, subcategory_slugs, created_at')
      .eq('listing_type', 'service_request')
      .eq('status', 'active')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(200),
    admin
      .from('profiles')
      .select('id, full_name, location, work_subcategory_slugs, email_digest_enabled, notifications_enabled')
      .eq('is_professional', true)
      .neq('user_role', 'company'),
  ])

  const activeJobs = jobs ?? []
  const recipients = (pros ?? []).filter(
    (p) => p.notifications_enabled !== false && p.email_digest_enabled !== false,
  )

  let sent = 0
  const preview: { userId: string; jobCount: number }[] = []

  for (const pro of recipients) {
    const matched = activeJobs.filter((job) => jobMatchesProfessional(job, pro))
    if (!matched.length) continue

    preview.push({ userId: pro.id, jobCount: matched.length })
    if (action === 'preview') continue

    const { data: authUser } = await admin.auth.admin.getUserById(pro.id)
    const email = authUser?.user?.email?.trim()
    if (!email) continue

    const items = matched
      .slice(0, 8)
      .map(
        (j) =>
          `<li><a href="${siteUrl}/listing/${j.id}">${String(j.title ?? 'Job').slice(0, 80)}</a> — ${String(j.location ?? '').slice(0, 60)}</li>`,
      )
      .join('')

    const html = `<p>Hi ${pro.full_name ?? 'professional'},</p>
<p>Here are ${matched.length} new job request(s) in your area this week:</p>
<ul>${items}</ul>
<p><a href="${siteUrl}/listings">Browse all jobs</a></p>
<p style="font-size:12px;color:#888"><a href="${siteUrl}/settings">Unsubscribe from weekly digest</a></p>`

    const subject = `Weekly jobs digest — ${matched.length} new request(s)`
    if (await sendResendEmail(email, subject, html)) sent++
  }

  return jsonResponse({
    ok: true,
    data: {
      jobs: activeJobs.length,
      recipients: recipients.length,
      sent,
      preview: action === 'preview' ? preview.slice(0, 20) : undefined,
    },
  })
})
