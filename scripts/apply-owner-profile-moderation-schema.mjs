/**
 * Apply OWNER profile moderation SCHEMA + RPC only (no QA UPDATE).
 * Requires SUPABASE_ACCESS_TOKEN (sbp_...).
 *
 * node scripts/apply-owner-profile-moderation-schema.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const file = 'supabase/migrations/APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql'

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
const token = (env.SUPABASE_ACCESS_TOKEN || '').trim()

if (!token || token.length < 20 || token.includes('...')) {
  console.error(
    'SUPABASE_ACCESS_TOKEN missing or invalid.\n' +
      'Or paste supabase/migrations/APPLY_OWNER_PROFILE_MODERATION_SCHEMA_ONLY.sql in Supabase SQL Editor.',
  )
  process.exit(1)
}

const sql = readFileSync(resolve(root, file), 'utf8')
if (/One-shot:\s*hide known QA/i.test(sql) || /SET\s+hidden_at\s*=\s*COALESCE\(hidden_at,\s*now\(\)\)/i.test(sql)) {
  console.error('Refusing to apply: QA UPDATE block detected in SQL file')
  process.exit(1)
}

console.log('Applying', file, `(${sql.length} chars) — SCHEMA/RPC ONLY, no QA hide`)
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) {
  console.error('Migration failed:', res.status, text.slice(0, 2000))
  process.exit(1)
}
console.log('OK schema/RPC applied:', text.slice(0, 300))
