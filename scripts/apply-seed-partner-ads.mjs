/**
 * Застосовує seed партнерської реклами на remote Supabase.
 *
 * Потрібно в .env.local:
 *   SUPABASE_ACCESS_TOKEN (sbp_...) — Dashboard → Account → Access Tokens
 * або
 *   SUPABASE_SERVICE_ROLE_KEY — Settings → API → service_role
 *
 * Запуск: node scripts/apply-seed-partner-ads.mjs
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

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = 'wjlfvajloxkevggwjgtk'
const sqlPath = resolve(
  root,
  'supabase/migrations/20260522150000_seed_partner_ad_campaigns.sql',
)
const sql = readFileSync(sqlPath, 'utf8')

if (!url) {
  console.error('VITE_SUPABASE_URL не знайдено в .env.local')
  process.exit(1)
}

if (accessToken) {
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
  console.log('Partner ads seed applied via Supabase Management API.')
} else {
  console.error(
    'Додайте SUPABASE_ACCESS_TOKEN у .env.local або виконайте SQL у Dashboard:\n' +
      `https://supabase.com/dashboard/project/${projectRef}/sql/new\n` +
      `Файл: ${sqlPath}`,
  )
  process.exit(1)
}

const anonKey = env.VITE_SUPABASE_ANON_KEY
if (anonKey) {
  const pub = createClient(url, anonKey)
  const { data, error } = await pub
    .from('ad_campaigns')
    .select('id,title,stripe_payment_id,price_paid')
    .eq('status', 'active')
    .like('stripe_payment_id', 'presence_free_%')
    .limit(10)

  if (error) console.error('Verify:', error.message)
  else console.log('Active presence partner ads:', data?.length ?? 0)
}
