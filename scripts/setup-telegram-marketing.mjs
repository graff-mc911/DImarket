#!/usr/bin/env node
/**
 * Підключення Telegram для маркетинг-агента.
 *
 * Варіант A — аргументи:
 *   node scripts/setup-telegram-marketing.mjs <BOT_TOKEN> <CHANNEL_ID>
 *   node scripts/setup-telegram-marketing.mjs <BOT_TOKEN> @your_channel
 *
 * Варіант B — .env.local:
 *   TELEGRAM_BOT_TOKEN=...
 *   TELEGRAM_CHANNEL_ID=...   (або @channel_username)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'

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

function saveEnv(key, value) {
  const path = resolve(root, '.env.local')
  const line = `${key}=${value}`
  if (!existsSync(path)) {
    writeFileSync(path, line + '\n', 'utf8')
    return
  }
  const raw = readFileSync(path, 'utf8')
  const re = new RegExp(`^${key}=.*$`, 'm')
  writeFileSync(path, re.test(raw) ? raw.replace(re, line) : raw.trimEnd() + '\n' + line + '\n', 'utf8')
}

async function tgApi(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

const env = { ...loadEnvFile('.env.local'), ...process.env }
let botToken = process.argv[2]?.trim() || env.TELEGRAM_BOT_TOKEN?.trim()
let channelRef = process.argv[3]?.trim() || env.TELEGRAM_CHANNEL_ID?.trim()

if (!botToken) {
  console.error(`
Потрібен TELEGRAM_BOT_TOKEN.

1. Відкрийте https://t.me/BotFather → /newbot → скопіюйте токен
2. Створіть канал → додайте бота адміністратором (право "Post messages")
3. Запустіть:

   node scripts/setup-telegram-marketing.mjs YOUR_BOT_TOKEN @your_channel

   або @channel_username / -1001234567890
`)
  process.exit(1)
}

const me = await tgApi(botToken, 'getMe', {})
if (!me.ok) {
  console.error('Невірний токен:', me.description)
  process.exit(1)
}
console.log('Бот:', '@' + me.result.username)

if (!channelRef) {
  console.error(`
Вкажіть канал другим аргументом:
  @channel_name   або   -100xxxxxxxxxx

ID каналу: перешліть будь-яке повідомлення з каналу боту @getidsbot
або опублікуйте пост у каналі і використайте @channel_username
`)
  process.exit(1)
}

let chatId = channelRef
if (channelRef.startsWith('@')) {
  const chat = await tgApi(botToken, 'getChat', { chat_id: channelRef })
  if (!chat.ok) {
    console.error('Не вдалося отримати канал:', chat.description)
    console.error('Переконайтесь, що бот — адмін каналу.')
    process.exit(1)
  }
  chatId = String(chat.result.id)
  console.log('Channel ID:', chatId, `(${chat.title})`)
}

const test = await tgApi(botToken, 'sendMessage', {
  chat_id: chatId,
  text: '✅ DiMarket Marketing Agent — Telegram підключено. https://dimarket.app',
})
if (!test.ok) {
  console.error('Тестове повідомлення не надіслано:', test.description)
  console.error('Додайте бота адміном каналу з правом публікації.')
  process.exit(1)
}
console.log('Тестове повідомлення надіслано ✓')

saveEnv('TELEGRAM_BOT_TOKEN', botToken)
saveEnv('TELEGRAM_CHANNEL_ID', chatId)
console.log('Збережено в .env.local')

const cronSecret = env.MARKETING_CRON_SECRET
const args = [
  `TELEGRAM_BOT_TOKEN=${botToken}`,
  `TELEGRAM_CHANNEL_ID=${chatId}`,
]
if (env.OPENAI_API_KEY?.trim()) args.push(`OPENAI_API_KEY=${env.OPENAI_API_KEY.trim()}`)
if (cronSecret?.trim()) args.push(`MARKETING_CRON_SECRET=${cronSecret.trim()}`)

console.log('Оновлення Supabase secrets...')
const sec = spawnSync('npx', ['supabase', 'secrets', 'set', ...args, '--project-ref', projectRef], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
})
if (sec.status !== 0) process.exit(sec.status ?? 1)

spawnSync('npx', ['supabase', 'functions', 'deploy', 'marketing-agent', '--project-ref', projectRef], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
})

console.log(`
Готово! Telegram підключено до marketing-agent.
Панель: https://dimarket.app/admin/marketing-agent
`)
