/**
 * Apply Commercial Agents migration on prod via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
 *
 * npm run db:apply-commercial-agents
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const migrationPath = resolve(
  root,
  'supabase/migrations/20260810180000_commercial_agents.sql',
)

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
  console.error('SUPABASE_ACCESS_TOKEN missing in .env.local')
  process.exit(1)
}

const sql = readFileSync(migrationPath, 'utf8')
const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
if (!res.ok) {
  console.error('Migration failed:', res.status, text)
  process.exit(1)
}
console.log('Commercial Agents migration applied OK')
console.log(text.slice(0, 500))
