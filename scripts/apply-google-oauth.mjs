/**
 * Увімкнути Google OAuth у Supabase (потрібні ключі в .env.local).
 *
 * GOOGLE_OAUTH_CLIENT_ID=...
 * GOOGLE_OAUTH_CLIENT_SECRET=...
 * SUPABASE_ACCESS_TOKEN=...
 *
 * node scripts/apply-google-oauth.mjs
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
const clientId = env.GOOGLE_OAUTH_CLIENT_ID?.trim()
const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()

if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN missing')
  process.exit(1)
}
if (!clientId || !clientSecret) {
  console.error('Додайте GOOGLE_OAUTH_CLIENT_ID і GOOGLE_OAUTH_CLIENT_SECRET у .env.local')
  console.error('Інструкція: docs/OAUTH_SETUP.md')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret,
  }),
})

if (!res.ok) {
  console.error('Failed:', res.status, await res.text())
  process.exit(1)
}

console.log('OK — Google OAuth увімкнено.')
console.log('Додайте у Vercel: VITE_OAUTH_GOOGLE_ENABLED=true і зробіть redeploy.')
