/**
 * Застосовує міграцію оплаченої реклами на remote Supabase.
 *
 * Потрібно в .env.local (або змінні середовища):
 *   SUPABASE_SERVICE_ROLE_KEY — Dashboard → Settings → API → service_role
 *
 * Запуск: node scripts/apply-paid-ads-migration.mjs
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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Додайте SUPABASE_SERVICE_ROLE_KEY у .env.local (Supabase → Settings → API → service_role secret).',
  )
  process.exit(1)
}

const sqlPath = resolve(
  root,
  'supabase/migrations/20260519140000_paid_ad_campaigns_display.sql',
)
const sql = readFileSync(sqlPath, 'utf8')

// Management API: виконання SQL (потрібен Personal Access Token sbp_...)
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = 'wjlfvajloxkevggwjgtk'

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
  console.log('Migration applied via Supabase Management API.')
} else {
  console.log('SUPABASE_ACCESS_TOKEN не знайдено — оновлюємо demo-кампанії через service_role REST...')

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: rows, error: selErr } = await admin
    .from('ad_campaigns')
    .select('id')
    .eq('status', 'active')
    .is('stripe_payment_id', null)
    .or('price_paid.is.null,price_paid.eq.0')

  if (selErr) {
    console.error('Select error:', selErr.message)
    process.exit(1)
  }

  let updated = 0
  for (const row of rows || []) {
    const { error } = await admin
      .from('ad_campaigns')
      .update({
        price_paid: 25,
        currency_paid: 'eur',
        stripe_payment_id: `demo_paid_${row.id}`,
      })
      .eq('id', row.id)

    if (error) {
      console.error('Update', row.id, error.message)
    } else {
      updated++
    }
  }

  console.log(`Оновлено ${updated} активних кампаній (demo paid).`)
  console.warn(
    'RLS і RPC (track_ad_impression) потребують SQL у Dashboard або SUPABASE_ACCESS_TOKEN / supabase db push.',
  )
}

// Перевірка
const anonKey = env.VITE_SUPABASE_ANON_KEY
if (anonKey) {
  const pub = createClient(url, anonKey)
  const { data, error } = await pub
    .from('ad_campaigns')
    .select('id,title,stripe_payment_id,price_paid')
    .eq('status', 'active')
    .not('stripe_payment_id', 'is', null)
    .limit(5)

  if (error) console.error('Verify:', error.message)
  else console.log('Active paid (anon query):', data?.length ?? 0, 'rows')
}
