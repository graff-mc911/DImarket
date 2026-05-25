/**
 * Колонки для збереження профілю в Settings.
 * node scripts/ensure-profiles-settings-columns.mjs
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
  console.error('SUPABASE_ACCESS_TOKEN missing')
  process.exit(1)
}

const sql = `
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD';
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portfolio_images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS subcategory_slugs text[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS work_subcategory_slugs text[] NOT NULL DEFAULT '{}';
`

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

if (!res.ok) {
  console.error('Failed:', res.status, await res.text())
  process.exit(1)
}
console.log('OK — profile/listings columns ensured.')
