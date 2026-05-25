/**
 * Prod auth: autoconfirm email, redirect URLs, enable Google/Apple toggles.
 * Google/Apple Client ID + Secret still required in Dashboard → Auth → Providers.
 *
 * node scripts/apply-auth-config-prod.mjs
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
  console.error('SUPABASE_ACCESS_TOKEN missing in .env.local')
  process.exit(1)
}

const redirectList = [
  'https://dimarket.app',
  'https://dimarket.app/**',
  'https://www.dimarket.app',
  'https://www.dimarket.app/**',
  'http://localhost:5173',
  'http://localhost:5173/**',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5173/**',
].join(',')

const patch = {
  site_url: 'https://dimarket.app',
  uri_allow_list: redirectList,
  mailer_autoconfirm: true,
  external_google_enabled: true,
  external_apple_enabled: true,
}

console.log('Patching auth config...', patch)

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(patch),
})

const body = await res.text()
if (!res.ok) {
  console.error('PATCH failed:', res.status, body)
  process.exit(1)
}

const verify = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` },
})
const cfg = await verify.json()
console.log('\nAuth config now:')
console.log('  site_url:', cfg.site_url)
console.log('  mailer_autoconfirm:', cfg.mailer_autoconfirm)
console.log('  external_google_enabled:', cfg.external_google_enabled)
console.log('  google client_id set:', Boolean(cfg.external_google_client_id))
console.log('  external_apple_enabled:', cfg.external_apple_enabled)
console.log('  apple client_id set:', Boolean(cfg.external_apple_client_id))
console.log('  uri_allow_list:', (cfg.uri_allow_list || '').slice(0, 120) + '...')

if (!cfg.external_google_client_id || !cfg.external_apple_client_id) {
  console.log(
    '\n⚠️  Увімкніть Google/Apple у Dashboard → Authentication → Providers і вставте Client ID / Secret.',
  )
}
