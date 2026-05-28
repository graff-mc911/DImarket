#!/usr/bin/env node
/**
 * Оновлює назву та аватар бота в Telegram (DImarket + лого DI).
 * node scripts/update-telegram-bot-branding.mjs [BOT_TOKEN]
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

async function tgApi(token, method, body, isMultipart = false) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    ...(isMultipart ? { body } : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })
  return res.json()
}

async function ensureAvatarJpg() {
  const outPath = resolve(root, 'public/telegram-bot-avatar.jpg')
  const svgPath = resolve(root, 'public/favicon.svg')
  const fallback = resolve(root, 'public/favicon-96x96.png')

  try {
    const sharp = (await import('sharp')).default
    const size = 512
    const svg = readFileSync(svgPath)
    await sharp(svg, { density: 300 })
      .resize(size, size)
      .jpeg({ quality: 92 })
      .toFile(outPath)
    console.log('Generated', outPath, 'from favicon.svg (DI)')
    return outPath
  } catch (e) {
    console.warn('sharp fallback:', e.message)
    if (existsSync(fallback)) {
      const sharp = (await import('sharp')).default
      await sharp(fallback).jpeg({ quality: 92 }).toFile(outPath)
      return outPath
    }
    throw new Error('No avatar source found')
  }
}

async function setProfilePhoto(token, jpgPath) {
  const fileBytes = readFileSync(jpgPath)
  const form = new FormData()
  form.append('photo', JSON.stringify({ type: 'static', photo: 'attach://avatar' }))
  form.append('avatar', new Blob([fileBytes], { type: 'image/jpeg' }), 'avatar.jpg')

  const res = await fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
    method: 'POST',
    body: form,
  })
  return res.json()
}

const env = { ...loadEnvFile('.env.local'), ...process.env }
const token = process.argv[2]?.trim() || env.TELEGRAM_BOT_TOKEN?.trim()

if (!token) {
  console.error('Потрібен TELEGRAM_BOT_TOKEN')
  process.exit(1)
}

const me = await tgApi(token, 'getMe', {})
if (!me.ok) {
  console.error('Invalid token:', me.description)
  process.exit(1)
}
console.log('Bot:', '@' + me.result.username)

for (const language_code of [undefined, 'uk', 'ru', 'en']) {
  const body = { name: 'DImarket' }
  if (language_code) body.language_code = language_code
  const names = await tgApi(token, 'setMyName', body)
  const tag = language_code ?? 'default'
  console.log(`setMyName (${tag}):`, names.ok ? 'OK' : names.description)
}

const shortDesc = await tgApi(token, 'setMyShortDescription', {
  short_description:
    'Безкоштовна платформа будівельних послуг. Подайте оголошення — зʼявиться на dimarket.app',
})
console.log('setMyShortDescription:', shortDesc.ok ? 'OK' : shortDesc.description)

const desc = await tgApi(token, 'setMyDescription', {
  description:
    'DImarket — безкоштовний маркетплейс будівельних і ремонтних послуг.\n\nПодайте оголошення через бота: оберіть категорію, місто, опис — і майстри побачать ваш запит на https://dimarket.app',
})
console.log('setMyDescription:', desc.ok ? 'OK' : desc.description)

const avatarPath = await ensureAvatarJpg()
const photo = await setProfilePhoto(token, avatarPath)
console.log('setMyProfilePhoto:', photo.ok ? 'OK' : photo.description)

console.log('\nГотово. Перезапустіть Telegram (закрийте чат з ботом і відкрийте знову), щоб побачити нову назву та аватар.')
