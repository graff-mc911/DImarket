/**
 * Застосовує AI platform migration на prod через Supabase Management API.
 * Потрібно в .env.local: SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * node scripts/apply-ai-platform-migration.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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
const token = env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error('Додайте SUPABASE_ACCESS_TOKEN у .env.local (https://supabase.com/dashboard/account/tokens)')
  process.exit(1)
}

const sqlPath = resolve(root, 'supabase/migrations/20260602120000_ai_platform.sql')
const sql = readFileSync(sqlPath, 'utf8')

console.log('Applying AI platform migration on', projectRef, '...')

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const body = await res.text()
if (!res.ok) {
  console.error('Failed:', res.status, body)
  process.exit(1)
}

console.log('OK — AI platform tables and RLS applied.')

// Перевірка наявності таблиць
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
if (serviceKey && url) {
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, serviceKey)
  const tables = [
    'ai_conversations',
    'ai_messages',
    'ad_image_assets',
    'ai_fraud_reports',
  ]
  for (const table of tables) {
    const { error } = await sb.from(table).select('id').limit(1)
    console.log(table, error ? `WARN: ${error.message}` : 'reachable')
  }
}

console.log('Done. Deploy edge: supabase functions deploy ai-router')
