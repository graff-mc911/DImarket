#!/usr/bin/env node
/**
 * Привʼязує author_id до оголошень, створених через Telegram без профілю.
 * node scripts/backfill-telegram-listing-authors.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function telegramEmail(telegramUserId) {
  return `telegram+${telegramUserId}@users.dimarket.app`
}

async function ensureAuthor(admin, { telegramUserId, telegramChatId, contactName, contactPhone }) {
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()

  const patch = { telegram_chat_id: telegramChatId }
  if (contactName?.trim()) patch.full_name = contactName.trim()
  if (contactPhone?.trim()) patch.phone = contactPhone.trim()

  if (existing?.id) {
    await admin.from('profiles').update(patch).eq('id', existing.id)
    return existing.id
  }

  const email = telegramEmail(telegramUserId)
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: contactName?.trim() || 'Клієнт DImarket',
      user_role: 'client',
      phone: contactPhone?.trim() || '',
      telegram_user_id: telegramUserId,
    },
  })

  let userId = created?.user?.id
  if (error && !userId) {
    const { data: again } = await admin
      .from('profiles')
      .select('id')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle()
    if (again?.id) {
      await admin.from('profiles').update({ ...patch, telegram_user_id: telegramUserId }).eq('id', again.id)
      return again.id
    }
    throw new Error(`createUser ${telegramUserId}: ${error.message}`)
  }

  await admin.from('profiles').update({ ...patch, telegram_user_id: telegramUserId }).eq('id', userId)
  return userId
}

const env = { ...loadEnvFile('.env.local'), ...process.env }
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Потрібні SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: sessions, error: sessErr } = await admin
  .from('telegram_bot_sessions')
  .select('chat_id, telegram_user_id, listing_id, draft')
  .not('listing_id', 'is', null)

if (sessErr) {
  console.error(sessErr.message)
  process.exit(1)
}

let fixed = 0
for (const s of sessions ?? []) {
  const tgId = s.telegram_user_id
  if (!tgId || !s.listing_id) continue

  const { data: listing } = await admin
    .from('listings')
    .select('id, author_id, contact_name, contact_phone')
    .eq('id', s.listing_id)
    .maybeSingle()

  if (!listing || listing.author_id) continue

  const draft = s.draft || {}
  const authorId = await ensureAuthor(admin, {
    telegramUserId: tgId,
    telegramChatId: s.chat_id,
    contactName: draft.contactName || listing.contact_name,
    contactPhone: draft.contactPhone || listing.contact_phone,
  })

  const { error: upErr } = await admin
    .from('listings')
    .update({ author_id: authorId })
    .eq('id', listing.id)

  if (upErr) {
    console.error('listing', listing.id, upErr.message)
    continue
  }
  fixed++
  console.log('OK', listing.id, '→', authorId)
}

console.log(`\nОновлено оголошень: ${fixed}`)
