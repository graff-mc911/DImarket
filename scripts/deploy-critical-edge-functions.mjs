/**
 * Deploy Edge Functions required by production UI that currently 404.
 * Requires valid SUPABASE_ACCESS_TOKEN (sbp_...).
 *
 * node scripts/deploy-critical-edge-functions.mjs
 */
import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const CRITICAL = [
  'official-sources-monitor',
  'send-quote-email',
  'dispatch-web-push',
  'send-notification',
  'create-billing-portal',
  'stripe-connect',
  'google-calendar-oauth',
  'google-calendar-sync',
]

function loadEnv() {
  const out = { ...process.env }
  for (const name of ['.env', '.env.local']) {
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
  return out
}

const env = loadEnv()
const token = (env.SUPABASE_ACCESS_TOKEN || '').trim()
if (!token || token.length < 20 || token.includes('...') || token === 'sbp_...') {
  console.error('Valid SUPABASE_ACCESS_TOKEN required to deploy edge functions.')
  process.exit(1)
}

let failed = 0
for (const fn of CRITICAL) {
  console.log('Deploying', fn)
  const r = spawnSync(
    'npx',
    ['supabase', 'functions', 'deploy', fn, '--project-ref', projectRef],
    { cwd: root, env: { ...process.env, SUPABASE_ACCESS_TOKEN: token }, encoding: 'utf8' },
  )
  process.stdout.write(r.stdout || '')
  process.stderr.write(r.stderr || '')
  if (r.status !== 0) failed += 1
}
process.exit(failed ? 1 : 0)
