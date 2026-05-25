/**
 * Застосовує Phase 1 migration на prod через Supabase Management API.
 * Потрібно в .env.local: SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * npm run db:apply-phase1
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
  console.error(`
SUPABASE_ACCESS_TOKEN не знайдено.

1. Відкрийте https://supabase.com/dashboard/account/tokens
2. Create token → скопіюйте sbp_...
3. Додайте в .env.local:
   SUPABASE_ACCESS_TOKEN=sbp_...

4. Знову: npm run db:apply-phase1
`)
  process.exit(1)
}

const sqlPath = resolve(root, 'supabase/migrations/20260628120000_phase1_marketplace.sql')
const sql = readFileSync(sqlPath, 'utf8')

console.log('Applying Phase 1 migration on', projectRef, '...')

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
  console.error('Failed:', res.status, body.slice(0, 800))
  process.exit(1)
}

console.log('OK — Phase 1 tables, RLS, RPC, storage policies applied.')

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
if (serviceKey && url) {
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, serviceKey)
  const tables = [
    'ai_job_sessions',
    'conversations',
    'contractor_verifications',
    'notifications',
    'match_scores',
  ]
  for (const table of tables) {
    const { error } = await sb.from(table).select('id').limit(1)
    console.log(table, error ? `WARN: ${error.message}` : 'reachable')
  }
  const { error: rpcErr } = await sb.rpc('ensure_conversation', {
    p_other_user_id: '00000000-0000-0000-0000-000000000001',
    p_listing_id: null,
  })
  console.log(
    'ensure_conversation RPC',
    rpcErr?.message?.includes('not_authenticated') || rpcErr?.message?.includes('invalid')
      ? 'exists'
      : rpcErr
        ? `WARN: ${rpcErr.message}`
        : 'callable',
  )
}

console.log('Next: npm run deploy:phase1-functions')
