/**
 * Перевірка prod Supabase для self-serve реклами.
 * node scripts/verify-prod-ad-schema.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const out = {}
  for (const name of ['.env.local', '.env']) {
    const p = resolve(root, name)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 1) continue
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return { ...out, ...process.env }
}

const env = loadEnv()
const base = env.VITE_SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co'
const key = env.VITE_SUPABASE_ANON_KEY
if (!key) {
  console.error('VITE_SUPABASE_ANON_KEY missing in .env.local')
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function check(name, url, ok = (r) => r.ok) {
  const res = await fetch(url, { headers })
  const pass = ok(res)
  console.log(pass ? 'OK' : 'FAIL', name, res.status)
  if (!pass) {
    const t = await res.text()
    console.log(' ', t.slice(0, 200))
  }
  return pass
}

const rest = `${base}/rest/v1`
const storage = `${base}/storage/v1`

let all = true
all &= await check('geo_catalog', `${rest}/geo_catalog?select=country,city&limit=1`)
all &= await check('active_geo', `${rest}/active_geo?select=country,city,user_count&limit=1`)
all &= await check('ad_campaigns.regions', `${rest}/ad_campaigns?select=id,regions&limit=1`)
all &= await check('storage bucket ad-media', `${storage}/bucket/ad-media`)
all &= await check(
  'create-checkout-session',
  `${base}/functions/v1/create-checkout-session`,
  (r) => r.status !== 404,
)
all &= await check(
  'verify-checkout-session',
  `${base}/functions/v1/verify-checkout-session`,
  (r) => r.status !== 404,
)

process.exit(all ? 0 : 1)
