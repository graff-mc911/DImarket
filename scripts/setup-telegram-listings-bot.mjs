#!/usr/bin/env node
/**
 * Webhook для бота оголошень DImarket (прийом заявок у Telegram → listings).
 *
 * Потрібно в .env.local:
 *   TELEGRAM_BOT_TOKEN=...        (від @BotFather)
 *   SUPABASE_SERVICE_ROLE_KEY=... (для secrets; CLI підставить з login)
 *
 * Запуск:
 *   node scripts/setup-telegram-listings-bot.mjs
 *   node scripts/setup-telegram-listings-bot.mjs YOUR_BOT_TOKEN
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { randomBytes } from 'crypto'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const webhookPath = 'telegram-bot'

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

if (!botToken) {
  console.error(`
Потрібен TELEGRAM_BOT_TOKEN від @BotFather.

  node scripts/setup-telegram-listings-bot.mjs YOUR_BOT_TOKEN
`)
  process.exit(1)
}

const me = await tgApi(botToken, 'getMe', {})
if (!me.ok) {
  console.error('Невірний токен:', me.description)
  process.exit(1)
}
console.log('Бот:', '@' + me.result.username)

const webhookSecret =
  env.TELEGRAM_WEBHOOK_SECRET?.trim() || randomBytes(24).toString('hex')
const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/${webhookPath}`

const wh = await tgApi(botToken, 'setWebhook', {
  url: webhookUrl,
  secret_token: webhookSecret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
})
if (!wh.ok) {
  console.error('setWebhook failed:', wh.description)
  process.exit(1)
}
console.log('Webhook:', webhookUrl)

saveEnv('TELEGRAM_BOT_TOKEN', botToken)
saveEnv('TELEGRAM_WEBHOOK_SECRET', webhookSecret)
if (!env.SITE_URL?.trim()) saveEnv('SITE_URL', 'https://dimarket.app')

const secretArgs = [
  `TELEGRAM_BOT_TOKEN=${botToken}`,
  `TELEGRAM_WEBHOOK_SECRET=${webhookSecret}`,
  `SITE_URL=${env.SITE_URL?.trim() || 'https://dimarket.app'}`,
]
if (env.TELEGRAM_CHANNEL_ID?.trim()) {
  secretArgs.push(`TELEGRAM_CHANNEL_ID=${env.TELEGRAM_CHANNEL_ID.trim()}`)
}

console.log('Supabase secrets…')
const sec = spawnSync(
  'npx',
  ['supabase', 'secrets', 'set', ...secretArgs, '--project-ref', projectRef],
  { stdio: 'inherit', shell: true, cwd: root },
)
if (sec.status !== 0) process.exit(sec.status ?? 1)

console.log('Deploy telegram-bot…')
const dep = spawnSync(
  'npx',
  ['supabase', 'functions', 'deploy', webhookPath, '--project-ref', projectRef],
  { stdio: 'inherit', shell: true, cwd: root },
)
if (dep.status !== 0) process.exit(dep.status ?? 1)

console.log('Брендинг бота (DImarket + аватар DI)…')
const brand = spawnSync('node', ['scripts/update-telegram-bot-branding.mjs', token], {
  stdio: 'inherit',
  cwd: root,
})
if (brand.status !== 0) {
  console.warn('Брендинг не оновлено — запустіть: node scripts/update-telegram-bot-branding.mjs')
}

console.log(`
Готово.

1. Застосуйте SQL міграцію (якщо ще не): npm run db:apply-telegram-bot
2. Відкрийте бота @${me.result.username} → /start → «Подати оголошення»
3. Після публікації оголошення зʼявиться на https://dimarket.app
`)
