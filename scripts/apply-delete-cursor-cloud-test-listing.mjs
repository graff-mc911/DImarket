/**
 * Soft-deletes Cursor Cloud test listings on prod via Supabase Management API.
 * Needs SUPABASE_ACCESS_TOKEN in .env.local (https://supabase.com/dashboard/account/tokens)
 *
 * node scripts/apply-delete-cursor-cloud-test-listing.mjs
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
  console.error('Add a real SUPABASE_ACCESS_TOKEN to .env.local, then re-run.')
  process.exit(1)
}

const sql = readFileSync(resolve(root, 'scripts/delete-cursor-cloud-test-listing.sql'), 'utf8')
console.log('Soft-deleting Cursor Cloud test listings on prod...')
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
console.log('OK — test listing(s) soft-deleted.')
console.log(body.slice(0, 1500))
