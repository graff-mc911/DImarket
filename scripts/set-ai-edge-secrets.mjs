/**
 * Встановлює AI-секрети в Supabase Edge Functions (не потрапляють у git).
 *
 * 1. Додайте в .env.local:
 *    OPENAI_API_KEY=sk-...
 *    OPENAI_MODEL=gpt-4o-mini          (опційно)
 *    GOOGLE_VISION_API_KEY=...         (опційно)
 *
 * 2. node scripts/set-ai-edge-secrets.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
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

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const openai = env.OPENAI_API_KEY?.trim()

if (!openai) {
  console.error(`
OPENAI_API_KEY не знайдено в .env.local

Додайте рядок (ключ з https://platform.openai.com/api-keys ):
  OPENAI_API_KEY=sk-proj-...

Потім знову: node scripts/set-ai-edge-secrets.mjs
`)
  process.exit(1)
}

const args = [`OPENAI_API_KEY=${openai}`]
if (env.OPENAI_MODEL?.trim()) args.push(`OPENAI_MODEL=${env.OPENAI_MODEL.trim()}`)
if (env.GOOGLE_VISION_API_KEY?.trim()) {
  args.push(`GOOGLE_VISION_API_KEY=${env.GOOGLE_VISION_API_KEY.trim()}`)
}
if (env.TELEGRAM_BOT_TOKEN?.trim()) args.push(`TELEGRAM_BOT_TOKEN=${env.TELEGRAM_BOT_TOKEN.trim()}`)
if (env.TELEGRAM_CHANNEL_ID?.trim()) args.push(`TELEGRAM_CHANNEL_ID=${env.TELEGRAM_CHANNEL_ID.trim()}`)
if (env.ANTHROPIC_API_KEY?.trim()) args.push(`ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY.trim()}`)
if (env.ANTHROPIC_MODEL?.trim()) args.push(`ANTHROPIC_MODEL=${env.ANTHROPIC_MODEL.trim()}`)
if (env.DEEPL_API_KEY?.trim()) args.push(`DEEPL_API_KEY=${env.DEEPL_API_KEY.trim()}`)
if (env.MARKETING_CRON_SECRET?.trim()) {
  args.push(`MARKETING_CRON_SECRET=${env.MARKETING_CRON_SECRET.trim()}`)
}
if (env.WHATSAPP_ACCESS_TOKEN?.trim()) {
  args.push(`WHATSAPP_ACCESS_TOKEN=${env.WHATSAPP_ACCESS_TOKEN.trim()}`)
}

// Локальний supabase functions serve читає supabase/functions/.env
const fnEnvPath = resolve(root, 'supabase/functions/.env')
const fnLines = [
  '# Auto-generated from .env.local — do not commit',
  `OPENAI_API_KEY=${openai}`,
]
if (env.OPENAI_MODEL?.trim()) fnLines.push(`OPENAI_MODEL=${env.OPENAI_MODEL.trim()}`)
if (env.GOOGLE_VISION_API_KEY?.trim()) {
  fnLines.push(`GOOGLE_VISION_API_KEY=${env.GOOGLE_VISION_API_KEY.trim()}`)
}
if (env.TELEGRAM_BOT_TOKEN?.trim()) fnLines.push(`TELEGRAM_BOT_TOKEN=${env.TELEGRAM_BOT_TOKEN.trim()}`)
if (env.WHATSAPP_ACCESS_TOKEN?.trim()) {
  fnLines.push(`WHATSAPP_ACCESS_TOKEN=${env.WHATSAPP_ACCESS_TOKEN.trim()}`)
}
mkdirSync(resolve(root, 'supabase/functions'), { recursive: true })
writeFileSync(fnEnvPath, fnLines.join('\n') + '\n', 'utf8')
console.log('Wrote supabase/functions/.env (local edge only)')

console.log('Setting Edge secrets on', projectRef, '...')

const r = spawnSync(
  'npx',
  ['supabase', 'secrets', 'set', ...args, '--project-ref', projectRef],
  { stdio: 'inherit', shell: true, cwd: root },
)

if (r.status !== 0) {
  console.error('supabase secrets set failed. Увійдіть: npx supabase login')
  process.exit(r.status ?? 1)
}

const functions = ['ai-router', 'sales-chat', 'marketing-agent']
for (const fn of functions) {
  console.log('Deploy', fn, '...')
  const d = spawnSync(
    'npx',
    ['supabase', 'functions', 'deploy', fn, '--project-ref', projectRef],
    { stdio: 'inherit', shell: true, cwd: root },
  )
  if (d.status !== 0) process.exit(d.status ?? 1)
}
console.log('OK — secrets + local .env + edge functions')
process.exit(0)
