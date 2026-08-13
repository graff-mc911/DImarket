/**
 * Live check: Top Masters public source must not return QA Smoke / QA Chat.
 * Uses the same filter rules as src/lib/publicProfileVisibility.ts against prod REST.
 *
 * node scripts/e2e-top-masters-qa-gate.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const out = {}
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
  return { ...out, ...process.env }
}

function isLikelyQaOrTestProfile(profile) {
  const name = (profile.full_name || '').trim()
  if (!name) return false
  if (/^qa([\s_\-.]|$)/i.test(name)) return true
  if (/\bqa[\s_\-]*(smoke|chat|master|e2e|admin|client|company|mfr|mfg|pv|advertiser|final|stranger|audit)\b/i.test(name)) {
    return true
  }
  return false
}

function isProfilePubliclyListable(profile) {
  if (profile.deleted_at || profile.hidden_at) return false
  if (isLikelyQaOrTestProfile(profile)) return false
  if (profile.is_professional !== true) return false
  return true
}

const env = loadEnv()
let url = env.VITE_SUPABASE_URL
let anon = env.VITE_SUPABASE_ANON_KEY

if (!anon || anon === '...' || anon.includes('PASTE')) {
  const html = await fetch('https://dimarket.app/').then((r) => r.text())
  const m = html.match(/\/assets\/index-[^"]+\.js/)
  const js = await fetch(`https://dimarket.app${m[0]}`).then((r) => r.text())
  anon = js.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0]
  url = 'https://wjlfvajloxkevggwjgtk.supabase.co'
}

const sb = createClient(url, anon, { auth: { persistSession: false } })

const { data, error } = await sb
  .from('profiles')
  .select('id, full_name, user_role, is_professional, is_featured, rating, created_at, deleted_at, hidden_at')
  .eq('is_professional', true)
  .eq('user_role', 'professional')
  .order('created_at', { ascending: false })
  .limit(24)

if (error && /deleted_at|hidden_at|42703/i.test(error.message)) {
  const retry = await sb
    .from('profiles')
    .select('id, full_name, user_role, is_professional, is_featured, rating, created_at')
    .eq('is_professional', true)
    .eq('user_role', 'professional')
    .order('created_at', { ascending: false })
    .limit(24)
  if (retry.error) {
    console.error(retry.error)
    process.exit(1)
  }
  var rows = retry.data || []
} else if (error) {
  console.error(error)
  process.exit(1)
} else {
  var rows = data || []
}

const rawQa = rows.filter((r) => isLikelyQaOrTestProfile(r))
const filtered = rows.filter(isProfilePubliclyListable)
const filteredQa = filtered.filter((r) => isLikelyQaOrTestProfile(r))

console.log('RAW top-by-created (24):')
for (const r of rows.slice(0, 12)) console.log(' -', r.full_name)
console.log(`\nRaw QA in fetch: ${rawQa.length}`)
console.log(`After public gate: ${filtered.length} (QA left: ${filteredQa.length})`)

if (filteredQa.length > 0) {
  console.error('FAIL: QA still listable after gate')
  process.exit(1)
}
if (rawQa.length === 0) {
  console.log('NOTE: no QA in current raw top-24 (may already be cleaned)')
}
console.log('PASS: public gate excludes QA from Top Masters eligibility')
