import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient, publishListing, uploadTelegramPhoto } from './publish.ts'
import {
  buildCategoryPicks,
  findPickByCallback,
  type CategoryPick,
} from './categories.ts'
import {
  applyCategoryPick,
  applyWorkGroupPick,
  emptyDraft,
  needsContact,
  processText,
  startNewListing,
  type BotStep,
  type CategoryRow,
  type ListingDraft,
} from './flow.ts'
import { loadGeoTree } from './geo.ts'
import {
  applyCity,
  applyCountry,
  applyRegion,
  keyboardForGeoStep,
  resolveCountryByIndex,
} from './geoFlow.ts'
import { categoryLabel, normalizeLocale, t, type BotLocale } from './i18n.ts'

type TgUser = { id: number; first_name?: string; username?: string; language_code?: string }
type TgChat = { id: number; type: string }
type TgMessage = {
  message_id: number
  chat: TgChat
  from?: TgUser
  text?: string
  photo?: { file_id: string; file_size?: number }[]
  caption?: string
}
type TgCallback = { id: string; from: TgUser; message?: TgMessage; data?: string }
type TgUpdate = {
  update_id: number
  message?: TgMessage
  callback_query?: TgCallback
}

type SessionRow = {
  chat_id: number
  telegram_user_id: number | null
  locale: string
  step: BotStep
  draft: ListingDraft
  listing_id: string | null
  status: string
}

async function tgApi(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<{ ok?: boolean; description?: string }>
}

async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  extra?: Record<string, unknown>,
) {
  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: text.slice(0, 4096),
    ...extra,
  })
}

function mainKeyboard(locale: BotLocale) {
  return {
    reply_markup: {
      keyboard: [[{ text: t(locale, 'btnNew') }], [{ text: t(locale, 'btnCancel') }]],
      resize_keyboard: true,
    },
  }
}

function categoryInlineKeyboard(picks: CategoryPick[], locale: BotLocale) {
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < picks.length; i += 2) {
    const row: { text: string; callback_data: string }[] = []
    for (let j = i; j < Math.min(i + 2, picks.length); j++) {
      const p = picks[j]
      if (p.kind === 'category') {
        const name = categoryLabel(p.row.slug, locale, p.row.name)
        const label = `${p.row.icon || ''} ${name}`.trim().slice(0, 60)
        row.push({ text: label, callback_data: `cat:${p.row.slug}` })
      } else {
        const label = `${p.icon} ${p.label}`.trim().slice(0, 60)
        row.push({ text: label, callback_data: `work:${p.slug}` })
      }
    }
    rows.push(row)
  }
  return { reply_markup: { inline_keyboard: rows } }
}

function confirmInlineKeyboard(locale: BotLocale) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: t(locale, 'btnYes'), callback_data: 'confirm:yes' },
          { text: t(locale, 'btnNo'), callback_data: 'confirm:no' },
        ],
      ],
    },
  }
}

async function loadDbCategories(admin: ReturnType<typeof createAdminClient>): Promise<CategoryRow[]> {
  const { data } = await admin!
    .from('categories')
    .select('id, slug, name, icon')
    .is('parent_id', null)
    .order('name')
  return (data ?? []) as CategoryRow[]
}

async function getSession(
  admin: ReturnType<typeof createAdminClient>,
  chatId: number,
): Promise<SessionRow | null> {
  const { data } = await admin!
    .from('telegram_bot_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle()
  return data as SessionRow | null
}

async function saveSession(
  admin: ReturnType<typeof createAdminClient>,
  row: Partial<SessionRow> & { chat_id: number },
) {
  await admin!.from('telegram_bot_sessions').upsert(
    {
      ...row,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'chat_id' },
  )
}

async function handleFlowReply(
  token: string,
  chatId: number,
  locale: BotLocale,
  reply: ReturnType<typeof processText>,
  admin: ReturnType<typeof createAdminClient>,
  session: SessionRow,
  dbCategories: CategoryRow[],
  picks: CategoryPick[],
  geoTree: Awaited<ReturnType<typeof loadGeoTree>>,
  from?: TgUser,
) {
  if (reply.publish) {
    const siteUrl = Deno.env.get('SITE_URL') || 'https://dimarket.app'
    const draft = { ...reply.draft }
    if (from?.username) draft.telegramUsername = from.username
    if (!draft.contactName && from?.first_name) draft.contactName = from.first_name

    const telegramUserId = from?.id ?? session.telegram_user_id
    const result = await publishListing(
      admin!,
      draft,
      locale,
      siteUrl,
      telegramUserId
        ? {
            telegramUserId,
            telegramChatId: chatId,
            contactName: draft.contactName,
            contactPhone: draft.contactPhone,
          }
        : null,
    )
    if (!result.ok) {
      await sendMessage(token, chatId, t(locale, 'publishError'), mainKeyboard(locale))
      return
    }

    await saveSession(admin, {
      chat_id: chatId,
      step: 'idle',
      draft: emptyDraft(),
      listing_id: result.listingId,
      status: 'completed',
      locale,
    })
    await sendMessage(token, chatId, t(locale, 'published', { link: result.link }), mainKeyboard(locale))

    const channelId = Deno.env.get('TELEGRAM_CHANNEL_ID')
    if (channelId) {
      await tgApi(token, 'sendMessage', {
        chat_id: channelId,
        text: `🆕 ${draft.description?.slice(0, 120)}…\n📍 ${draft.location}\n${result.link}`.slice(
          0,
          4096,
        ),
      }).catch(() => {})
    }
    return
  }

  await saveSession(admin, {
    chat_id: chatId,
    step: reply.step,
    draft: reply.draft,
    locale,
    telegram_user_id: session.telegram_user_id,
    status: 'active',
  })

  const geoKb = keyboardForGeoStep(reply.step, reply.draft, geoTree)
  const extra =
    reply.step === 'category'
      ? categoryInlineKeyboard(picks, locale)
      : reply.step === 'confirm'
        ? confirmInlineKeyboard(locale)
        : geoKb
          ? geoKb
          : mainKeyboard(locale)

  await sendMessage(token, chatId, reply.text, extra)
}

function handleGeoCallback(
  data: string,
  draft: ListingDraft,
  geoTree: Awaited<ReturnType<typeof loadGeoTree>>,
  locale: BotLocale,
): ReturnType<typeof processText> | null {
  if (data.startsWith('geo:c:')) {
    const idx = parseInt(data.slice(6), 10)
    const country = resolveCountryByIndex(geoTree, idx)
    if (!country) return null
    return applyCountry(draft, country, geoTree, locale)
  }
  if (data.startsWith('geo:rp:')) {
    const page = parseInt(data.slice(7), 10)
    return {
      text: t(locale, 'askRegion'),
      step: 'region',
      draft: { ...draft, imageUrls: [...(draft.imageUrls ?? [])], geoRegionPage: page },
    }
  }
  if (data.startsWith('geo:r:')) {
    const idx = parseInt(data.slice(6), 10)
    const region = draft.geoRegionList?.[idx]
    if (!region) return null
    return applyRegion(draft, region, geoTree, locale)
  }
  if (data.startsWith('geo:cp:')) {
    const page = parseInt(data.slice(7), 10)
    return {
      text: t(locale, 'askCityPick'),
      step: 'city',
      draft: { ...draft, imageUrls: [...(draft.imageUrls ?? [])], geoCityPage: page },
    }
  }
  if (data.startsWith('geo:city:')) {
    const idx = parseInt(data.slice(9), 10)
    const city = draft.geoCityList?.[idx]
    if (!city) return null
    return applyCity(draft, city, locale)
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('ok', { status: 200 })
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
  if (!token) {
    console.error('telegram-bot: TELEGRAM_BOT_TOKEN missing')
    return new Response('not configured', { status: 503 })
  }

  if (webhookSecret) {
    const header = req.headers.get('x-telegram-bot-api-secret-token')
    if (header !== webhookSecret) {
      return new Response('forbidden', { status: 403 })
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return new Response('db not configured', { status: 503 })
  }

  let update: TgUpdate
  try {
    update = (await req.json()) as TgUpdate
  } catch {
    return new Response('bad json', { status: 400 })
  }

  try {
    const dbCategories = await loadDbCategories(admin)
    const geoTree = await loadGeoTree(admin)

    if (update.callback_query) {
      const cq = update.callback_query
      const chatId = cq.message?.chat.id
      if (!chatId) {
        await tgApi(token, 'answerCallbackQuery', { callback_query_id: cq.id })
        return new Response('ok')
      }

      const locale = normalizeLocale(cq.from.language_code)
      let session =
        (await getSession(admin, chatId)) ??
        ({
          chat_id: chatId,
          telegram_user_id: cq.from.id,
          locale,
          step: 'idle' as BotStep,
          draft: emptyDraft(),
          listing_id: null,
          status: 'active',
        } satisfies SessionRow)

      const data = cq.data || ''
      const picks = buildCategoryPicks(dbCategories, locale)

      const pick = findPickByCallback(picks, data)
      if (pick) {
        const reply =
          pick.kind === 'work'
            ? applyWorkGroupPick(session.draft, pick, dbCategories, locale)
            : applyCategoryPick(session.draft, pick.row, locale)
        await handleFlowReply(token, chatId, locale, reply, admin, session, dbCategories, picks, geoTree, cq.from)
      } else if (data.startsWith('geo:')) {
        const reply = handleGeoCallback(data, session.draft, geoTree, locale)
        if (reply) {
          await handleFlowReply(token, chatId, locale, reply, admin, session, dbCategories, picks, geoTree, cq.from)
        }
      } else if (data === 'confirm:yes') {
        const reply = processText('confirm', session.draft, 'yes', locale, dbCategories, picks, geoTree)
        await handleFlowReply(token, chatId, locale, reply, admin, session, dbCategories, picks, geoTree, cq.from)
      } else if (data === 'confirm:no') {
        const reply = processText('confirm', session.draft, 'no', locale, dbCategories, picks, geoTree)
        await handleFlowReply(token, chatId, locale, reply, admin, session, dbCategories, picks, geoTree, cq.from)
      }

      await tgApi(token, 'answerCallbackQuery', { callback_query_id: cq.id })
      return new Response('ok')
    }

    const msg = update.message
    if (!msg?.chat?.id) return new Response('ok')

    const chatId = msg.chat.id
    const from = msg.from
    const locale = normalizeLocale(from?.language_code)
    const picks = buildCategoryPicks(dbCategories, locale)
    const text = (msg.text || msg.caption || '').trim()

    let session = await getSession(admin, chatId)
    if (!session) {
      session = {
        chat_id: chatId,
        telegram_user_id: from?.id ?? null,
        locale,
        step: 'idle',
        draft: emptyDraft(),
        listing_id: null,
        status: 'active',
      }
      await saveSession(admin, session)
    }

    if (text === '/start' || text === '/help') {
      await saveSession(admin, {
        chat_id: chatId,
        step: 'idle',
        draft: emptyDraft(),
        locale,
        telegram_user_id: from?.id ?? null,
        status: 'active',
      })
      await sendMessage(
        token,
        chatId,
        `${t(locale, 'welcome')}\n\n${t(locale, 'promo')}`,
        mainKeyboard(locale),
      )
      return new Response('ok')
    }

    if (text === '/cancel' || text === t(locale, 'btnCancel')) {
      await saveSession(admin, {
        chat_id: chatId,
        step: 'idle',
        draft: emptyDraft(),
        locale,
        telegram_user_id: from?.id ?? null,
        status: 'active',
      })
      await sendMessage(token, chatId, t(locale, 'cancelled'), mainKeyboard(locale))
      return new Response('ok')
    }

    const linkMatch = text.match(/^\/link(?:@\w+)?\s+(\S+)/i)
    if (linkMatch) {
      const code = linkMatch[1].trim()
      const { data: linked, error: linkErr } = await admin!.rpc('link_telegram_by_code', {
        p_code: code,
        p_chat_id: chatId,
      })
      if (linkErr) {
        console.error('link_telegram_by_code:', linkErr.message)
        await sendMessage(token, chatId, t(locale, 'linkError'), mainKeyboard(locale))
        return new Response('ok')
      }
      await sendMessage(
        token,
        chatId,
        linked ? t(locale, 'linkSuccess') : t(locale, 'linkInvalid'),
        mainKeyboard(locale),
      )
      return new Response('ok')
    }

    if (msg.photo?.length && session.step === 'photos') {
      const best = msg.photo[msg.photo.length - 1]
      const draft = { ...session.draft, imageUrls: [...(session.draft.imageUrls ?? [])] }
      const tempId = crypto.randomUUID()
      const url = await uploadTelegramPhoto(admin, token, best.file_id, tempId)
      if (url) draft.imageUrls!.push(url)

      if (needsContact(draft)) {
        await saveSession(admin, { chat_id: chatId, step: 'contact', draft, locale })
        await sendMessage(token, chatId, t(locale, 'askContact'), mainKeyboard(locale))
      } else {
        const reply = processText('photos', draft, 'skip', locale, dbCategories, picks, geoTree)
        await handleFlowReply(token, chatId, locale, reply, admin, session, dbCategories, picks, geoTree, from)
      }
      return new Response('ok')
    }

    if (!text) return new Response('ok')

    if (text === '/new' || text === t(locale, 'btnNew')) {
      const start = startNewListing(locale)
      await saveSession(admin, {
        chat_id: chatId,
        step: start.step,
        draft: start.draft,
        locale,
        telegram_user_id: from?.id ?? null,
        status: 'active',
      })
      await sendMessage(token, chatId, start.text, {
        ...categoryInlineKeyboard(picks, locale),
        ...mainKeyboard(locale),
      })
      return new Response('ok')
    }

    if (session.step === 'idle') {
      await sendMessage(
        token,
        chatId,
        `${t(locale, 'welcome')}\n\n${t(locale, 'promo')}`,
        mainKeyboard(locale),
      )
      return new Response('ok')
    }

    const step = session.step
    const reply = processText(step, session.draft, text, locale, dbCategories, picks, geoTree)
    await handleFlowReply(token, chatId, locale, reply, admin, session, dbCategories, picks, geoTree, from)

    return new Response('ok')
  } catch (e) {
    console.error('telegram-bot error:', e)
    return new Response('error', { status: 500 })
  }
})
