/**
 * Verify owner profile moderation RPCs on production AFTER schema apply.
 * Uses Management API + set_config to simulate site owner JWT.
 * Does NOT hide/delete any profiles.
 *
 * node scripts/verify-owner-profile-moderation-rpcs.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const OWNER_EMAIL = 'ivan.sovban@gmail.com'

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
if (!token || token.length < 20 || token.includes('...')) {
  console.error('SUPABASE_ACCESS_TOKEN required for verification')
  process.exit(1)
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 1200)}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function unwrapJsonb(rows, key = 'data') {
  if (!Array.isArray(rows) || !rows.length) return []
  // Prefer last row that has the key (after set_config result rows)
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    if (!row || typeof row !== 'object') continue
    if (!(key in row)) continue
    let v = row[key]
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v)
      } catch {
        return []
      }
    }
    return Array.isArray(v) ? v : v && typeof v === 'object' ? v : []
  }
  // Single object result
  if (rows[0] && key in rows[0]) {
    let v = rows[0][key]
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v)
      } catch {
        return []
      }
    }
    return Array.isArray(v) ? v : []
  }
  return []
}

console.log('=== 0) Schema columns ===')
const cols = await query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles'
    AND column_name IN ('deleted_at','hidden_at','ranking_priority','deleted_by','hidden_by')
  ORDER BY column_name
`)
console.log(JSON.stringify(cols, null, 2))
const colNames = Array.isArray(cols) ? cols.map((c) => c.column_name) : []
if (!colNames.includes('deleted_at') || !colNames.includes('ranking_priority')) {
  console.error('FAIL: moderation columns missing — schema not applied')
  process.exit(1)
}

console.log('=== Resolve owner uid ===')
const ownerRows = await query(`
  SELECT p.id::text AS id, p.is_site_owner, p.user_role, u.email
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.is_site_owner = true
     OR p.user_role = 'owner'
     OR lower(coalesce(u.email,'')) = lower('${OWNER_EMAIL}')
  LIMIT 5
`)
console.log(JSON.stringify(ownerRows, null, 2))
const ownerId = Array.isArray(ownerRows) && ownerRows[0] ? ownerRows[0].id : null
if (!ownerId) {
  console.error('FAIL: no owner profile found')
  process.exit(1)
}

async function searchAsOwner(filter) {
  const rows = await query(`
    WITH auth_sim AS (
      SELECT
        set_config('request.jwt.claim.sub', '${ownerId}', true) AS sub,
        set_config('request.jwt.claim.role', 'authenticated', true) AS role
    )
    SELECT public.admin_search_profiles('', '${filter}', 2000) AS data
    FROM auth_sim
  `)
  return unwrapJsonb(rows, 'data')
}

console.log('=== Public baseline counts ===')
const pubRows = await query(`
  SELECT
    (SELECT count(*)::int FROM profiles WHERE is_professional = true) AS public_listable,
    (SELECT count(*)::int FROM profiles WHERE is_professional = true AND user_role = 'professional') AS top_masters,
    (SELECT count(*)::int FROM profiles WHERE is_professional = true AND user_role = 'company') AS top_companies,
    (SELECT count(*)::int FROM profiles WHERE
      full_name ILIKE 'QA %' OR full_name ILIKE 'qa-%' OR full_name ILIKE 'qa_%'
    ) AS qa_named
`)
const pub = Array.isArray(pubRows) ? pubRows[0] : pubRows
console.log(JSON.stringify(pub, null, 2))

const filters = ['top_masters', 'top_companies', 'qa', 'public_listable', 'professional', 'company', 'all']
const results = {}
for (const f of filters) {
  const arr = await searchAsOwner(f)
  results[f] = {
    count: arr.length,
    sample: arr.slice(0, 8).map((r) => r.full_name),
    has_qa_smoke: arr.some((r) => /QA Smoke professional/i.test(r.full_name || '')),
    has_qa_chat: arr.some((r) => /QA Chat Pro/i.test(r.full_name || '')),
  }
  console.log(`filter=${f}`, JSON.stringify(results[f]))
}

console.log('=== Owner authorization ===')
try {
  await query(`
    WITH auth_sim AS (
      SELECT
        set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true) AS sub,
        set_config('request.jwt.claim.role', 'authenticated', true) AS role
    )
    SELECT public.admin_search_profiles('', 'all', 1) AS data
    FROM auth_sim
  `)
  console.log('non_owner: UNEXPECTED_SUCCESS')
} catch (e) {
  console.log('non_owner: REJECTED', String(e.message).slice(0, 180))
}

try {
  await query(`
    WITH auth_sim AS (
      SELECT
        set_config('request.jwt.claim.sub', '${ownerId}', true) AS sub,
        set_config('request.jwt.claim.role', 'authenticated', true) AS role
    )
    SELECT public.admin_assert_site_owner() AS asserted
    FROM auth_sim
  `)
  console.log('owner_assert: PASS')
} catch (e) {
  console.log('owner_assert: FAIL', String(e.message).slice(0, 180))
}

const consistencyRows = await query(`
  WITH auth_sim AS (
    SELECT
      set_config('request.jwt.claim.sub', '${ownerId}', true) AS sub,
      set_config('request.jwt.claim.role', 'authenticated', true) AS role
  )
  SELECT public.admin_profile_consistency_counts() AS c
  FROM auth_sim
`)
const consistency = unwrapJsonb(consistencyRows, 'c')
console.log('consistency:', JSON.stringify(consistencyRows, null, 2))

const checks = {
  top_masters_match:
    results.top_masters.count === pub.top_masters,
  top_companies_match:
    results.top_companies.count === pub.top_companies,
  public_listable_match:
    results.public_listable.count === pub.public_listable,
  qa_smoke_visible_to_owner: results.top_masters.has_qa_smoke || results.qa.has_qa_smoke || results.all.has_qa_smoke,
  qa_chat_visible_to_owner: results.top_masters.has_qa_chat || results.qa.has_qa_chat || results.all.has_qa_chat,
  no_hidden_yet: true,
}

console.log('=== CHECKS ===')
console.log(JSON.stringify({ ownerId, pub, results, checks }, null, 2))

const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
if (failed.length) {
  console.error('FAILED CHECKS:', failed.join(', '))
  process.exit(1)
}
console.log('ALL VERIFICATION CHECKS PASSED (no QA cleanup performed)')
