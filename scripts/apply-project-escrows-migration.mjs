/**
 * Apply project_escrows migration via Supabase Management API.
 * Needs SUPABASE_ACCESS_TOKEN in .env.local
 *
 * node scripts/apply-project-escrows-migration.mjs
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

if (!token || token.includes('...')) {
  console.error('Add SUPABASE_ACCESS_TOKEN to .env.local')
  process.exit(1)
}

const sql = readFileSync(
  resolve(root, 'supabase/migrations/20260807200000_project_escrows.sql'),
  'utf8',
)
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
console.log('OK — project_escrows migration applied')
console.log(body.slice(0, 500))
