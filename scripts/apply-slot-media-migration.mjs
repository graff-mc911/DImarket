/**
 * Apply slot_media column migration on remote Supabase.
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
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

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const token = env.SUPABASE_ACCESS_TOKEN
const projectRef = 'wjlfvajloxkevggwjgtk'
const sql = readFileSync(
  resolve(root, 'supabase/migrations/20260630140000_ad_campaign_slot_media.sql'),
  'utf8',
)

if (!token) {
  console.log('SUPABASE_ACCESS_TOKEN missing — apply migration manually in Supabase SQL editor.')
  process.exit(0)
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
)
const body = await res.text()
if (!res.ok) {
  console.error('Migration failed:', res.status, body)
  process.exit(1)
}
console.log('slot_media migration applied:', body || 'ok')
