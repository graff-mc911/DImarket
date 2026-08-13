/**
 * Apply production advertising hotfix SQL via service role (PostgREST + optional SQL).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * node scripts/apply-deactivate-stale-ads.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
      const k = t.slice(0, i).trim()
      if (out[k]) continue
      out[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return out
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const service = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service || service.includes('...')) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const STALE_ID = '4ef33bff-593e-476f-966f-f2854fb3eb26'

const { data: before } = await admin
  .from('ad_campaigns')
  .select('id,title,status,review_note')
  .eq('id', STALE_ID)
  .maybeSingle()
console.log('before', before)

const { data: updated, error } = await admin
  .from('ad_campaigns')
  .update({
    status: 'rejected',
    approved_by: null,
    approved_at: null,
    updated_at: new Date().toISOString(),
  })
  .eq('id', STALE_ID)
  .eq('status', 'active')
  .select('id,status,review_note')

if (error) {
  console.error(error)
  process.exit(1)
}
console.log('updated stale by id', updated)

const { data: bulk, error: bulkErr } = await admin
  .from('ad_campaigns')
  .update({
    status: 'rejected',
    approved_by: null,
    approved_at: null,
    updated_at: new Date().toISOString(),
  })
  .eq('status', 'active')
  .or(
    'review_note.ilike.%відхилено%,review_note.ilike.%скасовано%,review_note.ilike.%rejected%,review_note.ilike.%cancelled%',
  )
  .select('id,title,status,review_note')

if (bulkErr) console.error('bulk', bulkErr)
else console.log('bulk cancelled-note deactivate', bulk)

const { data: active } = await admin
  .from('ad_campaigns')
  .select('id,title,status,review_note')
  .eq('status', 'active')
console.log('remaining active', active)
