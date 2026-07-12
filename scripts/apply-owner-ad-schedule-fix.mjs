/**
 * Застосувати fix owner ad perpetual schedule на prod.
 * node scripts/apply-owner-ad-schedule-fix.mjs
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
const anon = env.VITE_SUPABASE_ANON_KEY
const baseUrl = env.VITE_SUPABASE_URL || `https://${projectRef}.supabase.co`

if (!token) {
  console.error('Додайте SUPABASE_ACCESS_TOKEN у .env.local')
  process.exit(1)
}

const sqlPath = resolve(root, 'supabase/migrations/20260712100000_fix_owner_ad_perpetual_schedule.sql')
const sql = readFileSync(sqlPath, 'utf8')

console.log('Applying owner ad schedule fix on', projectRef, '...')

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

console.log('SQL applied OK:', body || '(empty)')

if (anon) {
  const r = await fetch(
    `${baseUrl}/rest/v1/ad_campaigns?select=id,title,ends_at&status=eq.active&limit=20`,
    { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
  )
  const rows = await r.json()
  console.log('Active campaigns visible to anon:', Array.isArray(rows) ? rows.length : rows)
  if (Array.isArray(rows)) {
    for (const c of rows) console.log(' ', c.title, '| ends:', c.ends_at || 'NULL')
  }
}
