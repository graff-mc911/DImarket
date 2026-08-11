/**
 * Verify Commercial Agents tables are live on prod (anon REST).
 * Exit 0 when ready; exit 1 when schema missing / unreachable.
 *
 * node scripts/verify-commercial-agents-prod.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
let url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co'
let anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''

if (!anon || anon.length < 40) {
  const html = await fetch('https://dimarket.app/').then((r) => r.text())
  const jsPath = html.match(/\/assets\/index-[^"]+\.js/)?.[0]
  if (!jsPath) {
    console.error('Cannot resolve anon key from live site')
    process.exit(1)
  }
  const bundle = await fetch(`https://dimarket.app${jsPath}`).then((r) => r.text())
  anon = bundle.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)?.[0] || ''
}

if (!anon) {
  console.error('Anon key missing')
  process.exit(1)
}

const tables = [
  'manufacturer_profiles',
  'agent_profiles',
  'representation_opportunities',
  'representation_applications',
  'agent_invitations',
  'commercial_entity_reports',
  'commercial_analytics_events',
]

let failed = 0
for (const table of tables) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  })
  const body = await res.text()
  const ok = res.status === 200 || res.status === 206
  console.log(ok ? 'OK ' : 'FAIL', table, res.status, body.slice(0, 100))
  if (!ok) failed += 1
}

// Directories should return arrays (possibly empty or seeded)
for (const path of [
  'manufacturer_profiles?select=slug&is_published=eq.true&limit=5',
  'agent_profiles?select=slug&is_published=eq.true&limit=5',
  'representation_opportunities?select=id,title&status=eq.published&limit=5',
]) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  })
  const data = await res.json().catch(() => null)
  const ok = res.ok && Array.isArray(data)
  console.log(ok ? 'OK ' : 'FAIL', 'list', path.split('?')[0], Array.isArray(data) ? data.length : data)
  if (!ok) failed += 1
}

if (failed) {
  console.error(`Commercial Agents prod verify failed (${failed})`)
  process.exit(1)
}
console.log('Commercial Agents prod verify OK')
