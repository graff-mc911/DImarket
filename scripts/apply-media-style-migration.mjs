import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
const sql = readFileSync(
  resolve(root, 'supabase/migrations/20260531120000_ad_campaign_media_style.sql'),
  'utf8',
)

if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN missing in .env.local')
  process.exit(1)
}

const res = await fetch(
  'https://api.supabase.com/v1/projects/wjlfvajloxkevggwjgtk/database/query',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
)
const body = await res.text()
if (!res.ok) {
  console.error(res.status, body)
  process.exit(1)
}
console.log('media_style column migration applied.')
