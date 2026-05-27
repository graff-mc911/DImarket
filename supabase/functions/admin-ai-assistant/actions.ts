import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type AdminAction =
  | { type: 'boost_rating'; email: string; amount: number }
  | { type: 'set_rating'; email: string; value: number }
  | { type: 'reset_rating'; email: string }
  | { type: 'verify'; email: string; verified: boolean }
  | { type: 'feature'; email: string; featured: boolean }
  | { type: 'top_professionals'; limit: number }
  | { type: 'platform_stats' }
  | { type: 'create_ad'; title: string; description?: string; image_url?: string; days?: number; budget?: number; placement?: string }
  | { type: 'update_ad'; search: string; patch: Record<string, unknown> }
  | { type: 'create_listing'; title: string; description: string; location: string; price?: number }
  | { type: 'send_email'; email: string; subject: string; body: string }
  | { type: 'send_inapp'; email: string; body: string; subject?: string }
  | { type: 'ban_user'; email: string }
  | { type: 'broadcast_professionals'; body: string; subject?: string }

export type ActionResult = {
  ok: boolean
  message: string
  table?: Record<string, unknown>[]
  pendingConfirmation?: boolean
  confirmToken?: string
}

const RATING_MAX = 9.99

async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const normalized = email.trim().toLowerCase()
  let page = 1
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data.users.length) break
    const hit = data.users.find((u) => u.email?.toLowerCase() === normalized)
    if (hit?.id) return { id: hit.id, email: hit.email ?? normalized }
    if (data.users.length < 200) break
    page++
  }
  return null
}

async function getProfile(admin: SupabaseClient, userId: string) {
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, rating, is_professional, is_verified, is_featured, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  return data
}

export async function executeAction(
  admin: SupabaseClient,
  adminId: string,
  action: AdminAction,
  confirmed: boolean,
): Promise<ActionResult> {
  const destructive = ['ban_user', 'broadcast_professionals'].includes(action.type)
  if (destructive && !confirmed) {
    return {
      ok: false,
      message: '⚠️ Небезпечна дія. Напишіть «ПІДТВЕРДЖУЮ» і повторіть команду.',
      pendingConfirmation: true,
      confirmToken: action.type,
    }
  }

  switch (action.type) {
    case 'platform_stats': {
      const [profiles, listings, ads, pendingAds] = await Promise.all([
        admin.from('profiles').select('id', { count: 'exact', head: true }),
        admin.from('listings').select('id', { count: 'exact', head: true }),
        admin.from('ad_campaigns').select('id', { count: 'exact', head: true }),
        admin.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      ])
      return {
        ok: true,
        message: `📊 Статистика: користувачів ${profiles.count ?? 0}, оголошень ${listings.count ?? 0}, реклами ${ads.count ?? 0} (на модерації ${pendingAds.count ?? 0}).`,
        table: [
          { metric: 'profiles', value: profiles.count ?? 0 },
          { metric: 'listings', value: listings.count ?? 0 },
          { metric: 'ad_campaigns', value: ads.count ?? 0 },
          { metric: 'pending_ads', value: pendingAds.count ?? 0 },
        ],
      }
    }

    case 'top_professionals': {
      const { data } = await admin
        .from('profiles')
        .select('full_name, rating, is_verified, is_featured, location')
        .eq('is_professional', true)
        .order('rating', { ascending: false })
        .limit(action.limit)
      const rows = (data ?? []).map((p, i) => ({
        rank: i + 1,
        name: p.full_name ?? '—',
        rating: p.rating,
        verified: p.is_verified,
        featured: p.is_featured,
        location: p.location,
      }))
      return {
        ok: true,
        message: `✅ Топ ${rows.length} майстрів за рейтингом.`,
        table: rows,
      }
    }

    case 'boost_rating':
    case 'set_rating':
    case 'reset_rating':
    case 'verify':
    case 'feature': {
      const user = await findUserByEmail(admin, action.email)
      if (!user) return { ok: false, message: `❌ Користувача ${action.email} не знайдено.` }

      const patch: Record<string, unknown> = {}
      const profile = await getProfile(admin, user.id)
      if (!profile) return { ok: false, message: '❌ Профіль не знайдено.' }

      if (action.type === 'boost_rating') {
        const next = Math.min(RATING_MAX, Number(profile.rating ?? 0) + action.amount * 0.1)
        patch.rating = next
      } else if (action.type === 'set_rating') {
        patch.rating = Math.min(RATING_MAX, Math.max(0, action.value))
      } else if (action.type === 'reset_rating') {
        patch.rating = 0
      } else if (action.type === 'verify') {
        patch.is_verified = action.verified
        patch.verified_at = action.verified ? new Date().toISOString() : null
      } else if (action.type === 'feature') {
        patch.is_featured = action.featured
        patch.featured_expires_at = action.featured
          ? new Date(Date.now() + 30 * 86400000).toISOString()
          : null
      }

      const { error } = await admin.from('profiles').update(patch).eq('id', user.id)
      if (error) return { ok: false, message: `❌ ${error.message}` }

      const { data: updated } = await admin
        .from('profiles')
        .select('full_name, rating, is_verified, is_featured')
        .eq('id', user.id)
        .single()

      return {
        ok: true,
        message: `✅ Оновлено ${action.email}. Рейтинг: ${updated?.rating ?? 0}/${RATING_MAX}`,
        table: [updated ?? {}],
      }
    }

    case 'create_ad': {
      const starts = new Date()
      const ends = new Date(starts.getTime() + (action.days ?? 30) * 86400000)
      const { data, error } = await admin
        .from('ad_campaigns')
        .insert({
          advertiser_id: adminId,
          title: action.title,
          description: action.description ?? '',
          image_url: action.image_url ?? 'https://dimarket.app/og-image.png',
          link_url: 'https://dimarket.app',
          placement: (action.placement as 'home') ?? 'home',
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          status: 'active',
          price_paid: action.budget ?? null,
          currency_paid: 'EUR',
        })
        .select('id, title, starts_at, ends_at, status')
        .single()
      if (error) return { ok: false, message: `❌ ${error.message}` }
      return {
        ok: true,
        message: `✅ Кампанія «${data.title}» створена. ID: ${data.id}. До ${ends.toLocaleDateString('uk-UA')}.`,
        table: [data as Record<string, unknown>],
      }
    }

    case 'update_ad': {
      const { data: rows } = await admin
        .from('ad_campaigns')
        .select('id, title')
        .ilike('title', `%${action.search}%`)
        .limit(1)
      if (!rows?.length) return { ok: false, message: `❌ Кампанію «${action.search}» не знайдено.` }
      const { error } = await admin
        .from('ad_campaigns')
        .update(action.patch)
        .eq('id', rows[0].id)
      if (error) return { ok: false, message: `❌ ${error.message}` }
      return { ok: true, message: `✅ Кампанію «${rows[0].title}» оновлено.` }
    }

    case 'create_listing': {
      const expires = new Date(Date.now() + 30 * 86400000).toISOString()
      const { data, error } = await admin.from('listings').insert({
        title: action.title,
        description: action.description,
        location: action.location,
        price: action.price ?? null,
        currency: 'EUR',
        listing_type: 'service_request',
        contact_name: 'Admin',
        author_id: adminId,
        expires_at: expires,
        status: 'active',
      }).select('id, title, location, price, status').single()
      if (error) return { ok: false, message: `❌ ${error.message}` }
      return {
        ok: true,
        message: `✅ Оголошення «${data.title}» додано.`,
        table: [data as Record<string, unknown>],
      }
    }

    case 'send_email': {
      const key = Deno.env.get('RESEND_API_KEY')
      if (!key) return { ok: false, message: '❌ RESEND_API_KEY не налаштовано на сервері.' }
      const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'DImarket <noreply@dimarket.app>'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [action.email],
          subject: action.subject,
          html: `<p>${action.body}</p><p style="font-size:12px"><a href="https://dimarket.app/settings">Відписатися</a></p>`,
        }),
      })
      if (!res.ok) return { ok: false, message: '❌ Не вдалося надіслати email.' }
      return { ok: true, message: `✅ Email надіслано на ${action.email}.` }
    }

    case 'send_inapp': {
      const user = await findUserByEmail(admin, action.email)
      if (!user) return { ok: false, message: `❌ ${action.email} не знайдено.` }
      await admin.from('notifications').insert({
        user_id: user.id,
        type: 'system',
        title: action.subject ?? 'DImarket',
        body: action.body,
        link_path: '/settings',
      })
      return { ok: true, message: `✅ Сповіщення в додатку для ${action.email}.` }
    }

    case 'ban_user': {
      const user = await findUserByEmail(admin, action.email)
      if (!user) return { ok: false, message: `❌ ${action.email} не знайдено.` }
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        ban_duration: '876000h',
      })
      if (error) return { ok: false, message: `❌ ${error.message}` }
      return { ok: true, message: `✅ Користувача ${action.email} заблоковано.` }
    }

    case 'broadcast_professionals': {
      const { data: pros } = await admin
        .from('profiles')
        .select('id')
        .eq('is_professional', true)
        .limit(200)
      let sent = 0
      for (const p of pros ?? []) {
        await admin.from('notifications').insert({
          user_id: p.id,
          type: 'system',
          title: action.subject ?? 'DImarket',
          body: action.body,
          link_path: '/',
        })
        sent++
      }
      return { ok: true, message: `✅ Розіслано ${sent} сповіщень майстрам.` }
    }

    default:
      return { ok: false, message: '❌ Невідома дія.' }
  }
}

export function parseShortcut(input: string): AdminAction | null {
  const t = input.trim()
  if (t === '/stats' || t === '/health') return { type: 'platform_stats' }
  if (t === '/learn') return { type: 'platform_stats' }

  const boost = t.match(/^\/boost\s+(\S+)\s+(\d+(?:\.\d+)?)$/i)
  if (boost) return { type: 'boost_rating', email: boost[1], amount: Number(boost[2]) }

  const verify = t.match(/^\/verify\s+(\S+)$/i)
  if (verify) return { type: 'verify', email: verify[1], verified: true }

  const ban = t.match(/^\/ban\s+(\S+)$/i)
  if (ban) return { type: 'ban_user', email: ban[1] }

  const emailCmd = t.match(/^\/email\s+(\S+)\s+(.+)$/is)
  if (emailCmd) {
    return {
      type: 'send_email',
      email: emailCmd[1],
      subject: 'Повідомлення від DImarket',
      body: emailCmd[2].trim(),
    }
  }

  const search = t.match(/^\/search\s+(.+)$/is)
  if (search) return { type: 'platform_stats' }

  return null
}

export function parseNaturalLanguage(text: string): AdminAction | null {
  const lower = text.toLowerCase()

  const boost = lower.match(
    /(?:підніми|підвищ|boost).*(?:рейтинг|rating).*(?:майстра|користувач[ау]?)?\s*([^\s]+@[^\s]+).*?(\d+)/,
  )
  if (boost) return { type: 'boost_rating', email: boost[1], amount: Number(boost[2]) }

  const top = lower.match(/(?:топ|top)\s*(\d+)?\s*(?:майстр|professional)/)
  if (top) return { type: 'top_professionals', limit: Number(top[1] || 5) }

  const verify = lower.match(/(?:верифікуй|verify)\s+([^\s]+@[^\s]+)/)
  if (verify) return { type: 'verify', email: verify[1], verified: true }

  const emailSend = lower.match(
    /(?:відправ|надішли|send).*(?:email|лист|повідомлення).*?([^\s]+@[^\s]+)[:\s]+['"]?(.+)['"]?$/i,
  )
  if (emailSend) {
    return {
      type: 'send_email',
      email: emailSend[1],
      subject: 'DImarket',
      body: emailSend[2].trim(),
    }
  }

  const adCreate = lower.match(
    /(?:створи|create).*(?:реклам|кампані[юя]).*(?:для|for)\s+(.+?)(?:на\s+(\d+)\s*дн|$)/,
  )
  if (adCreate) {
    return {
      type: 'create_ad',
      title: adCreate[1].trim(),
      days: Number(adCreate[2] || 30),
      budget: 500,
    }
  }

  const listing = lower.match(
    /(?:додай|створи).*(?:оголошення|listing)[:\s]+(.+?)(?:у|в)\s+([^,]+?)(?:,.*?(\d+))?(?:\s*євро|eur)?$/i,
  )
  if (listing) {
    return {
      type: 'create_listing',
      title: listing[1].trim(),
      location: listing[2].trim(),
      description: listing[1].trim(),
      price: listing[3] ? Number(listing[3]) : undefined,
    }
  }

  if (lower.includes('статистик') || lower.includes('stats')) {
    return { type: 'platform_stats' }
  }

  return null
}
