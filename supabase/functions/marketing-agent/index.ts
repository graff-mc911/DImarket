import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { chatCompletion } from '../_shared/openai.ts'

type Action =
  | 'status'
  | 'get_config'
  | 'update_config'
  | 'list_posts'
  | 'approve_post'
  | 'reject_post'
  | 'generate_preview'
  | 'run_cycle'
  | 'cron_run'
  | 'publish_post'
  | 'analytics_summary'
  | 'registration_webhook'

type Body = {
  action?: Action
  payload?: Record<string, unknown>
}

const DIMARKET_KNOWLEDGE = `DiMarket (https://dimarket.app/) — marketplace with roles: CLIENT, MASTER, COMPANY, ADVERTISER.`

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  telegram: 4096,
  linkedin: 3000,
}

const ROLE_HOOKS: Record<string, string> = {
  client: 'Find trusted masters and companies near you',
  master: 'Grow your client base — register as Master on DiMarket',
  company: 'Scale your business on DiMarket marketplace',
  advertiser: 'Reach thousands of users — advertise on DiMarket',
}

const DEFAULT_MARKETS = [
  { countryCode: 'UA', languageCode: 'uk', label: 'Ukraine' },
  { countryCode: 'US', languageCode: 'en', label: 'United States' },
  { countryCode: 'DE', languageCode: 'de', label: 'Germany' },
]

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { ok: false as const, error: 'unauthorized' }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_site_owner, user_role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin =
    profile?.is_site_owner === true || profile?.user_role === 'owner'
  if (!isAdmin) return { ok: false as const, error: 'forbidden' }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  return { ok: true as const, admin, userId: user.id }
}

function contentHash(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i)
    h |= 0
  }
  return `h${Math.abs(h).toString(16)}`
}

async function generateWithLlm(
  prompt: string,
): Promise<{ text: string; provider: string } | null> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const block = data?.content?.[0]
      if (block?.text) {
        return { text: String(block.text).trim(), provider: 'anthropic' }
      }
    }
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (openaiKey) {
    const out = await chatCompletion(openaiKey, 'You are a marketing copywriter.', prompt)
    if (out) return { text: out, provider: 'openai' }
  }

  return null
}

function parseContentJson(raw: string, fallbackRole: string): {
  body: string
  hashtags: string[]
  title?: string
  imagePrompt?: string
} {
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) {
      const j = JSON.parse(m[0])
      return {
        body: String(j.body ?? raw),
        hashtags: Array.isArray(j.hashtags) ? j.hashtags.map(String) : [],
        title: j.title ? String(j.title) : undefined,
        imagePrompt: j.imagePrompt ? String(j.imagePrompt) : undefined,
      }
    }
  } catch { /* template */ }
  return {
    body: `${ROLE_HOOKS[fallbackRole] ?? ROLE_HOOKS.client} — https://dimarket.app/`,
    hashtags: ['DiMarket', fallbackRole],
  }
}

async function publishTelegram(body: string): Promise<{ ok: boolean; id?: string }> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHANNEL_ID')
  if (!token || !chatId) return { ok: false }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: body.slice(0, 4096) }),
  })
  const data = await res.json()
  return { ok: Boolean(data.ok), id: data.result?.message_id?.toString() }
}

type AdminClient = ReturnType<typeof createClient>

function formatPostBody(post: { body: string; hashtags?: string[] | null }): string {
  const tags = (post.hashtags ?? []).map((h) => `#${String(h).replace(/^#/, '')}`).join(' ')
  return tags ? `${post.body}\n\n${tags}` : post.body
}

async function publishBlog(
  admin: AdminClient,
  body: string,
): Promise<{ ok: boolean; id?: string }> {
  const message = body.slice(0, 280)
  await admin.from('announcements').update({ is_active: false }).eq('type', 'promo')
  const { data, error } = await admin
    .from('announcements')
    .insert({
      message,
      type: 'promo',
      is_active: true,
      starts_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return { ok: false }
  return { ok: true, id: data?.id as string }
}

async function publishPostInternal(
  admin: AdminClient,
  post: Record<string, unknown>,
): Promise<{ success: boolean; externalId?: string }> {
  const postId = String(post.id)
  const platform = String(post.platform)
  const fullBody = formatPostBody({
    body: String(post.body),
    hashtags: post.hashtags as string[] | null,
  })
  let success = false
  let externalId: string | undefined

  if (platform === 'telegram') {
    const r = await publishTelegram(fullBody)
    success = r.ok
    externalId = r.id
  }
  if (!success) {
    const blog = await publishBlog(admin, fullBody)
    success = blog.ok
    externalId = blog.id
  }

  await admin
    .from('marketing_posts')
    .update({
      status: success ? 'published' : 'failed',
      published_at: success ? new Date().toISOString() : null,
      external_id: externalId ?? null,
      publish_error: success ? null : 'publish_failed',
    })
    .eq('id', postId)

  await admin.from('marketing_analytics').insert({
    post_id: postId,
    event_type: 'publish',
    payload: { platform, success, externalId },
  })

  return { success, externalId }
}

async function runCycleInternal(admin: AdminClient): Promise<{ created: number; published: number }> {
  const { data: config } = await admin.from('marketing_agent_config').select('*').eq('id', 'default').single()
  if (!config?.is_running) return { created: 0, published: 0 }

  const markets = (config.target_markets?.length ? config.target_markets : DEFAULT_MARKETS) as {
    countryCode: string
    languageCode: string
  }[]
  const platforms = (config.platforms?.length ? config.platforms : ['blog', 'telegram']) as string[]
  const roles = ['client', 'master', 'company', 'advertiser']
  const { data: existing } = await admin.from('marketing_posts').select('content_hash').limit(500)
  const hashes = new Set((existing ?? []).map((r) => r.content_hash).filter(Boolean))

  let created = 0
  const roleStart = config.next_role_index ?? 0
  const slotCount = config.frequency === 'hourly' ? 4 : config.frequency === 'weekly' ? 16 : 8

  for (let i = 0; i < Math.min(slotCount, markets.length * platforms.length); i++) {
    const market = markets[i % markets.length]
    const platform = platforms[i % platforms.length]
    const role = roles[(roleStart + i) % roles.length]
    const prompt = `${DIMARKET_KNOWLEDGE}
Unique post: role ${role}, ${platform}, ${market.languageCode}, ${market.countryCode}. JSON only.`
    const gen = await generateWithLlm(prompt)
    const parsed = parseContentJson(gen?.text ?? '', role)
    const hash = contentHash(parsed.body)
    if (hashes.has(hash)) continue
    hashes.add(hash)
    const status = config.auto_publish ? 'approved' : 'pending_review'
    const { data: inserted } = await admin
      .from('marketing_posts')
      .insert({
        role_target: role,
        platform,
        country_code: market.countryCode,
        language_code: market.languageCode,
        body: parsed.body,
        hashtags: parsed.hashtags,
        image_prompt: parsed.imagePrompt ?? null,
        content_hash: hash,
        llm_provider: gen?.provider ?? 'template',
        status,
      })
      .select('*')
      .single()

    created++
    if (config.auto_publish && inserted) {
      await publishPostInternal(admin, inserted as Record<string, unknown>)
    }
  }

  await admin
    .from('marketing_agent_config')
    .update({
      last_run_at: new Date().toISOString(),
      next_role_index: (roleStart + created) % 4,
    })
    .eq('id', 'default')

  const { data: approved } = await admin
    .from('marketing_posts')
    .select('*')
    .eq('status', 'approved')
    .limit(10)

  let published = config.auto_publish ? created : 0
  if (!config.auto_publish) {
    for (const post of approved ?? []) {
      const r = await publishPostInternal(admin, post as Record<string, unknown>)
      if (r.success) published++
    }
  }

  await admin.from('marketing_analytics').insert({
    event_type: 'cycle_complete',
    payload: { created, published },
  })

  return { created, published }
}

function verifyCronAuth(req: Request): boolean {
  const secret = Deno.env.get('MARKETING_CRON_SECRET')
  const header = req.headers.get('x-cron-secret')
  if (secret && header === secret) return true
  const auth = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true
  return false
}

function cronIsDue(config: { frequency?: string; last_run_at?: string | null }): boolean {
  const last = config.last_run_at ? new Date(config.last_run_at).getTime() : 0
  const gap =
    config.frequency === 'hourly'
      ? 55 * 60 * 1000
      : config.frequency === 'weekly'
        ? 6.5 * 24 * 60 * 60 * 1000
        : 23 * 60 * 60 * 1000
  return Date.now() - last >= gap
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400)
  }

  const action = body.action ?? 'status'

  if (action === 'cron_run') {
    if (!verifyCronAuth(req)) {
      return jsonResponse({ ok: false, error: 'forbidden' }, 403)
    }
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: config } = await admin.from('marketing_agent_config').select('*').eq('id', 'default').single()
    if (!config?.is_running) {
      return jsonResponse({ ok: true, data: { skipped: true, reason: 'agent_stopped' } })
    }
    const force = body.payload?.force === true
    if (!force && !cronIsDue(config)) {
      return jsonResponse({ ok: true, data: { skipped: true, reason: 'not_due' } })
    }
    const result = await runCycleInternal(admin)
    return jsonResponse({ ok: true, data: result })
  }

  if (action === 'registration_webhook') {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const userId = String(body.payload?.userId ?? '')
    const userRole = String(body.payload?.userRole ?? 'client')
    const languageCode = String(body.payload?.languageCode ?? 'uk')
    const countryCode = String(body.payload?.countryCode ?? 'UA')

    if (!userId) return jsonResponse({ ok: false, error: 'missing_user' }, 400)

    // Authorization is REQUIRED: the calling user must authenticate and their
    // JWT subject must match the userId in the payload. Previously this was
    // only checked `if (authHeader)` — an anonymous caller could trigger paid
    // LLM generation that auto-publishes to real Telegram/blog channels.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user || user.id !== userId) {
      return jsonResponse({ ok: false, error: 'forbidden' }, 403)
    }

    await admin.from('marketing_registration_attribution').insert({
      user_id: userId,
      user_role: userRole,
      language_code: languageCode,
      country_code: countryCode,
      utm_source: body.payload?.utmSource ?? null,
      utm_campaign: body.payload?.utmCampaign ?? null,
    })

    const welcomePrompt = `${DIMARKET_KNOWLEDGE}
Write a short welcome message in language "${languageCode}" for new ${userRole} user. Include dimarket.app link. JSON: {"body":"","hashtags":[]}`

    const gen = await generateWithLlm(welcomePrompt)
    const parsed = parseContentJson(gen?.text ?? '', userRole)

    const { data: post } = await admin.from('marketing_posts').insert({
      role_target: userRole,
      platform: 'telegram',
      country_code: countryCode,
      language_code: languageCode,
      content_kind: 'social_post',
      body: parsed.body,
      hashtags: parsed.hashtags,
      status: 'approved',
      llm_provider: gen?.provider ?? 'template',
      content_hash: contentHash(parsed.body),
    }).select('*').single()

    const { data: agentCfg } = await admin.from('marketing_agent_config').select('auto_publish').eq('id', 'default').maybeSingle()

    const { data: attrRows } = await admin
      .from('marketing_registration_attribution')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (attrRows?.[0]?.id) {
      await admin
        .from('marketing_registration_attribution')
        .update({ welcome_sent: true, post_id: post?.id ?? null })
        .eq('id', attrRows[0].id)
    }

    let boostPostId: string | null = null
    if (userRole === 'master' || userRole === 'company') {
      const boostPrompt = `${DIMARKET_KNOWLEDGE}
New ${userRole} joined DiMarket in ${countryCode}. Write a short promo encouraging others to hire/register. Lang: ${languageCode}. JSON: {"body":"","hashtags":[]}`
      const boostGen = await generateWithLlm(boostPrompt)
      const boostParsed = parseContentJson(boostGen?.text ?? '', userRole)
      const { data: boostPost } = await admin.from('marketing_posts').insert({
        role_target: userRole,
        platform: 'blog',
        country_code: countryCode,
        language_code: languageCode,
        content_kind: 'social_post',
        body: boostParsed.body,
        hashtags: boostParsed.hashtags,
        status: 'approved',
        llm_provider: boostGen?.provider ?? 'template',
        content_hash: contentHash(boostParsed.body + Date.now()),
      }).select('*').single()
      if (boostPost) {
        boostPostId = boostPost.id as string
        await publishPostInternal(admin, boostPost as Record<string, unknown>)
      }
    }

    if (agentCfg?.auto_publish && post) {
      await publishPostInternal(admin, post as Record<string, unknown>)
    }

    return jsonResponse({
      ok: true,
      data: { postId: post?.id, welcome: parsed.body, boostPostId },
    })
  }

  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, auth.error === 'forbidden' ? 403 : 401)
  }
  const { admin } = auth

  try {
    switch (action) {
      case 'status':
        return jsonResponse({
          ok: true,
          data: {
            anthropic: Boolean(Deno.env.get('ANTHROPIC_API_KEY')),
            openai: Boolean(Deno.env.get('OPENAI_API_KEY')),
            telegram: Boolean(Deno.env.get('TELEGRAM_BOT_TOKEN')),
            facebook: Boolean(Deno.env.get('FACEBOOK_ACCESS_TOKEN')),
            instagram: Boolean(Deno.env.get('INSTAGRAM_ACCESS_TOKEN')),
            tiktok: Boolean(Deno.env.get('TIKTOK_ACCESS_TOKEN')),
            twitter: Boolean(Deno.env.get('TWITTER_ACCESS_TOKEN')),
            linkedin: Boolean(Deno.env.get('LINKEDIN_ACCESS_TOKEN')),
            deepl: Boolean(Deno.env.get('DEEPL_API_KEY')),
            dalle: Boolean(Deno.env.get('DALLE_API_KEY') || Deno.env.get('OPENAI_API_KEY')),
            sendgrid: Boolean(Deno.env.get('SENDGRID_API_KEY')),
            mailchimp: Boolean(Deno.env.get('MAILCHIMP_API_KEY')),
          },
        })

      case 'get_config': {
        const { data } = await admin.from('marketing_agent_config').select('*').eq('id', 'default').maybeSingle()
        if (!data) {
          await admin.from('marketing_agent_config').upsert({
            id: 'default',
            target_markets: DEFAULT_MARKETS,
          })
        }
        const { data: cfg } = await admin.from('marketing_agent_config').select('*').eq('id', 'default').single()
        return jsonResponse({ ok: true, data: cfg })
      }

      case 'update_config': {
        const patch = body.payload ?? {}
        const { data, error } = await admin
          .from('marketing_agent_config')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', 'default')
          .select()
          .single()
        if (error) return jsonResponse({ ok: false, error: error.message }, 400)
        return jsonResponse({ ok: true, data })
      }

      case 'list_posts': {
        const status = body.payload?.status as string | undefined
        let q = admin.from('marketing_posts').select('*').order('created_at', { ascending: false }).limit(50)
        if (status) q = q.eq('status', status)
        const { data } = await q
        return jsonResponse({ ok: true, data: data ?? [] })
      }

      case 'approve_post': {
        const postId = String(body.payload?.postId ?? '')
        await admin.from('marketing_posts').update({ status: 'approved' }).eq('id', postId)
        return jsonResponse({ ok: true })
      }

      case 'reject_post': {
        const postId = String(body.payload?.postId ?? '')
        await admin.from('marketing_posts').update({ status: 'failed', publish_error: 'rejected_by_admin' }).eq('id', postId)
        return jsonResponse({ ok: true })
      }

      case 'generate_preview': {
        const role = String(body.payload?.role ?? 'client')
        const platform = String(body.payload?.platform ?? 'telegram')
        const languageCode = String(body.payload?.languageCode ?? 'uk')
        const countryCode = String(body.payload?.countryCode ?? 'UA')
        const limit = PLATFORM_LIMITS[platform] ?? 2000
        const prompt = `${DIMARKET_KNOWLEDGE}
Generate social post for role ${role}, platform ${platform}, lang ${languageCode}, country ${countryCode}. Max ${limit} chars.
JSON: {"body":"","hashtags":[],"title":"","imagePrompt":""}`
        const gen = await generateWithLlm(prompt)
        const parsed = parseContentJson(gen?.text ?? '', role)
        if (parsed.body.length > limit) parsed.body = parsed.body.slice(0, limit - 1) + '…'
        return jsonResponse({ ok: true, data: { ...parsed, provider: gen?.provider ?? 'template' } })
      }

      case 'run_cycle': {
        const { data: config } = await admin.from('marketing_agent_config').select('is_running').eq('id', 'default').single()
        if (!config?.is_running) {
          return jsonResponse({ ok: false, error: 'agent_stopped' }, 400)
        }
        const result = await runCycleInternal(admin)
        return jsonResponse({ ok: true, data: result })
      }

      case 'publish_post': {
        const postId = String(body.payload?.postId ?? '')
        const { data: post } = await admin.from('marketing_posts').select('*').eq('id', postId).single()
        if (!post) return jsonResponse({ ok: false, error: 'not_found' }, 404)
        const { success, externalId } = await publishPostInternal(admin, post as Record<string, unknown>)
        return jsonResponse({ ok: true, data: { success, externalId } })
      }

      case 'analytics_summary': {
        const { data: events } = await admin
          .from('marketing_analytics')
          .select('event_type, payload, created_at')
          .order('created_at', { ascending: false })
          .limit(200)
        const { count: postsPublished } = await admin
          .from('marketing_posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
        const { count: pending } = await admin
          .from('marketing_posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_review')
        const { count: registrations } = await admin
          .from('marketing_registration_attribution')
          .select('*', { count: 'exact', head: true })
        return jsonResponse({
          ok: true,
          data: {
            postsPublished: postsPublished ?? 0,
            pendingReview: pending ?? 0,
            attributedRegistrations: registrations ?? 0,
            recentEvents: events ?? [],
          },
        })
      }

      default:
        return jsonResponse({ ok: false, error: 'unknown_action' }, 400)
    }
  } catch (e) {
    console.error(e)
    return jsonResponse({ ok: false, error: 'internal_error' }, 500)
  }
})
