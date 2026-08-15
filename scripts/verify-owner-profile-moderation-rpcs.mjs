/**
 * Verify owner profile moderation RPCs on production AFTER schema apply.
 * Uses Management API as postgres + set_config to simulate site owner JWT.
 * Does NOT hide/delete any profiles.
 *
 * Requires SUPABASE_ACCESS_TOKEN.
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
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 800)}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function len(rows) {
  if (Array.isArray(rows)) {
    // Management API may return [{admin_search_profiles: [...]}] or raw
    if (rows[0] && typeof rows[0] === 'object') {
      const v = Object.values(rows[0])[0]
      if (typeof v === 'string') {
        try {
          const parsed = JSON.parse(v)
          return Array.isArray(parsed) ? parsed.length : null
        } catch {
          return null
        }
      }
      if (Array.isArray(v)) return v.length
    }
    return rows.length
  }
  return null
}

function names(rows, n = 8) {
  let arr = rows
  if (Array.isArray(rows) && rows[0] && typeof rows[0] === 'object') {
    const v = Object.values(rows[0])[0]
    if (typeof v === 'string') {
      try {
        arr = JSON.parse(v)
      } catch {
        arr = []
      }
    } else if (Array.isArray(v)) arr = v
  }
  if (!Array.isArray(arr)) return []
  return arr.slice(0, n).map((r) => r.full_name || r.id)
}

function hasName(rows, needle) {
  let arr = rows
  if (Array.isArray(rows) && rows[0] && typeof rows[0] === 'object') {
    const v = Object.values(rows[0])[0]
    if (typeof v === 'string') {
      try {
        arr = JSON.parse(v)
      } catch {
        arr = []
      }
    } else if (Array.isArray(v)) arr = v
  }
  if (!Array.isArray(arr)) return false
  return arr.some((r) => String(r.full_name || '').includes(needle))
}

console.log('=== 0) Schema columns present? ===')
const cols = await query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles'
    AND column_name IN ('deleted_at','hidden_at','ranking_priority','deleted_by','hidden_by')
  ORDER BY column_name
`)
console.log(JSON.stringify(cols, null, 2))

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
  console.error('No owner profile found — cannot simulate Owner JWT')
  process.exit(1)
}

async function asOwner(sqlBody) {
  return query(`
    SELECT set_config('request.jwt.claim.sub', '${ownerId}', true);
    SELECT set_config('request.jwt.claim.role', 'authenticated', true);
    ${sqlBody}
  `)
}

// Public baseline counts (no auth simulation needed)
console.log('=== Public baseline counts ===')
const pub = await query(`
  SELECT
    (SELECT count(*)::int FROM profiles WHERE is_professional = true) AS public_listable,
    (SELECT count(*)::int FROM profiles WHERE is_professional = true AND user_role = 'professional') AS top_masters,
    (SELECT count(*)::int FROM profiles WHERE is_professional = true AND user_role = 'company') AS top_companies,
    (SELECT count(*)::int FROM profiles WHERE full_name ILIKE 'QA %' OR full_name ILIKE 'qa-%' OR full_name ILIKE 'qa_%') AS qa_named
`)
console.log(JSON.stringify(pub, null, 2))

const filters = ['top_masters', 'top_companies', 'qa', 'public_listable', 'professional', 'company']
const results = {}
for (const f of filters) {
  const rows = await asOwner(`SELECT public.admin_search_profiles('', '${f}', 2000) AS data;`)
  // Management API may return multiple result sets; find the data row
  let payload = rows
  if (Array.isArray(rows)) {
    const hit = rows.find((r) => r && Object.prototype.hasOwnProperty.call(r, 'data'))
    payload = hit ? [hit] : rows
  }
  results[f] = {
    count: len(payload.map ? payload : [{ data: payload }]),
    sample: names(payload),
  }
  // Fix count extraction for {data: jsonb}
  if (Array.isArray(payload) && payload[0]?.data != null) {
    const d = payload[0].data
    const arr = typeof d === 'string' ? JSON.parse(d) : d
    results[f].count = Array.isArray(arr) ? arr.length : null
    results[f].sample = Array.isArray(arr) ? arr.slice(0, 8).map((r) => r.full_name) : []
    results[f].has_qa_smoke = Array.isArray(arr) && arr.some((r) => /QA Smoke professional/i.test(r.full_name || ''))
    results[f].has_qa_chat = Array.isArray(arr) && arr.some((r) => /QA Chat Pro/i.test(r.full_name || ''))
  }
  console.log(`filter=${f}`, JSON.stringify(results[f]))
}

console.log('=== Owner authorization (non-owner should fail) ===')
try {
  await query(`
    SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
    SELECT set_config('request.jwt.claim.role', 'authenticated', true);
    SELECT public.admin_search_profiles('', 'all', 1);
  `)
  console.log('UNEXPECTED: non-owner call succeeded')
} catch (e) {
  console.log('non-owner rejected (expected):', String(e.message).slice(0, 200))
}

console.log('=== Owner authorization (owner assert) ===')
const assertOk = await asOwner(`SELECT public.admin_assert_site_owner(); SELECT 1 AS ok;`)
console.log('owner assert ok:', JSON.stringify(assertOk).slice(0, 200))

console.log('=== Consistency RPC ===')
const consistency = await asOwner(`SELECT public.admin_profile_consistency_counts() AS c;`)
console.log(JSON.stringify(consistency, null, 2))

console.log('=== SUMMARY JSON ===')
console.log(
  JSON.stringify(
    {
      ownerId,
      public: Array.isArray(pub) ? pub[0] : pub,
      filters: results,
    },
    null,
    2,
  ),
)
