/**
 * Apply Manufacturer/Agent roles + products + ad linkage on prod.
 * Requires SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens, sbp_...).
 *
 * node scripts/apply-mfr-agent-roles-migration.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const files = ['supabase/migrations/APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql']

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
const token = (env.SUPABASE_ACCESS_TOKEN || '').trim()

if (!token || token.length < 20 || token.includes('..') || token === 'sbp_...') {
  console.error(
    'SUPABASE_ACCESS_TOKEN missing or invalid.\n' +
      'Create one: Supabase Dashboard → Account → Access Tokens → generate sbp_...\n' +
      'Or paste SQL manually: supabase/migrations/APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql',
  )
  process.exit(1)
}

async function applySql(relPath) {
  const full = resolve(root, relPath)
  const sql = readFileSync(full, 'utf8')
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
  console.log('Applying', relPath, `(${sql.length} chars)`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error('Migration failed:', res.status, text.slice(0, 1200))
    process.exit(1)
  }
  console.log('OK', relPath, text.slice(0, 300))
}

for (const f of files) {
  await applySql(f)
}
console.log('MFR/Agent roles migration applied OK')
