/**
 * Backfill profiles + public footer stats RPC on remote Supabase.
 *
 * .env.local:
 *   SUPABASE_ACCESS_TOKEN — sbp_… (Dashboard → Account → Access Tokens)
 *   або SUPABASE_SERVICE_ROLE_KEY для перевірки після застосування
 *
 * Запуск: node scripts/apply-auth-profile-migration.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

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

const env = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
  ...process.env,
}

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co'
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = 'wjlfvajloxkevggwjgtk'

const sqlPath = resolve(
  root,
  'supabase/migrations/20260524140000_profile_backfill_and_public_stats.sql',
)
const sql = readFileSync(sqlPath, 'utf8')

if (!accessToken) {
  console.error(
    'Потрібен SUPABASE_ACCESS_TOKEN у .env.local (Supabase → Account → Access Tokens → sbp_…).',
  )
  console.error('Або вставте SQL уручну: supabase/migrations/20260524140000_profile_backfill_and_public_stats.sql')
  process.exit(1)
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
)

const body = await res.text()
if (!res.ok) {
  console.error('Management API error:', res.status, body)
  process.exit(1)
}

console.log('Migration applied:', body.slice(0, 200) || 'OK')

const anonKey = env.VITE_SUPABASE_ANON_KEY
if (anonKey) {
  const pub = createClient(url, anonKey)
  const { data, error } = await pub.rpc('get_public_footer_stats')
  if (error) {
    console.error('Verify RPC:', error.message)
  } else {
    console.log('get_public_footer_stats:', JSON.stringify(data))
  }
}
