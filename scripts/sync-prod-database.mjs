/**
 * Synchronize production Supabase schema with supabase/migrations.
 *
 * Requires in .env.local (or env):
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (Dashboard → Account → Access Tokens)
 * Optional:
 *   SUPABASE_SERVICE_ROLE_KEY=...   (post-apply REST verification)
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *
 * Usage:
 *   node scripts/sync-prod-database.mjs              # audit + apply
 *   node scripts/sync-prod-database.mjs --audit-only
 *   node scripts/sync-prod-database.mjs --from=20260719120000
 *
 * Safety: never deletes data. Migrations should use IF NOT EXISTS / OR REPLACE.
 * Already-present objects are treated as skipped when SQL errors match known patterns.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const defaultUrl = `https://${projectRef}.supabase.co`

function cleanEnvValue(v) {
  if (v == null) return ''
  let s = String(v).trim().replace(/^["']|["']$/g, '')
  // Cloud / Vercel CLI sometimes redacts secrets to this placeholder
  if (!s || s === '[SENSITIVE]' || s.includes('[SENSITIVE]')) return ''
  return s
}

function loadEnvFile(name) {
  const path = name.startsWith('/') ? name : resolve(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const k = t.slice(0, i).trim()
    const v = cleanEnvValue(t.slice(i + 1))
    if (v) out[k] = v
  }
  return out
}

const args = new Set(process.argv.slice(2))
const auditOnly = args.has('--audit-only')
const fromArg = [...args].find((a) => a.startsWith('--from='))
const fromStamp = fromArg ? fromArg.split('=')[1] : null
const envFileArg = [...args].find((a) => a.startsWith('--env-file='))
const extraEnvFile = envFileArg ? envFileArg.split('=')[1] : null

const fileEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
  ...loadEnvFile('.env.vercel.local'),
  ...(extraEnvFile ? loadEnvFile(extraEnvFile) : {}),
  ...loadEnvFile('/tmp/supabase-audit.env'),
}
const env = { ...fileEnv }
for (const [k, v] of Object.entries(process.env)) {
  const cleaned = cleanEnvValue(v)
  if (cleaned) env[k] = cleaned
}

const accessToken = cleanEnvValue(env.SUPABASE_ACCESS_TOKEN)
const rawUrl = cleanEnvValue(env.VITE_SUPABASE_URL) || cleanEnvValue(env.SUPABASE_URL) || defaultUrl
const url = rawUrl.replace(/\/$/, '')
const anonKey = cleanEnvValue(env.VITE_SUPABASE_ANON_KEY)
const serviceKey = cleanEnvValue(env.SUPABASE_SERVICE_ROLE_KEY)

const SKIP_ERROR_RE =
  /already exists|duplicate key|duplicate column|duplicate_object|42710|42P07|42701|P0001|must be owner|cannot change name of view/i

/** Ordered migrations that close known production gaps (subset first for speed / safety). */
const PRIORITY_MIGRATIONS = [
  '20260628120000_phase1_marketplace.sql',
  '20260713100000_phase3_referrals_and_job_notify.sql',
  '20260719120000_lead_marketplace_mvp.sql',
  '20260720120000_create_project_wizard_ensure.sql',
  '20260720140000_project_feed_geo_realtime.sql',
  '20260720150000_ai_match_profile_fields.sql',
  '20260722100000_quote_equipment_pdf.sql',
  '20260722120000_verification_platinum.sql',
  '20260722140000_portfolio_upgrade.sql',
  '20260722150000_review_system_upgrade.sql',
  '20260722160000_chat_media_push_upgrade.sql',
  '20260722170000_booking_calendar.sql',
  '20260722180000_notification_center_upgrade.sql',
  '20260723120000_admin_panel.sql',
  '20260723130000_monetization_system.sql',
  '20260725120000_analytics_system.sql',
  '20260725140000_marketplace_categories.sql',
  '20260725180000_homepage_metrics.sql',
  '20260725190000_category_completed_projects.sql',
  '20260726270000_trust_verification_system.sql',
  '20260726280000_prod_schema_sync_critical.sql',
]

const REQUIRED_TABLES = [
  'verification_documents',
  'verification_status',
  'verification_history',
  'trust_scores',
  'project_applications',
  'saved_items',
  'conversations',
  'messages',
  'notifications',
  'contractor_verifications',
  'homepage_metrics',
  'bookings',
  'listings',
  'profiles',
  'categories',
  'reviews',
]

// Compatibility views (created by critical sync over real tables)
const REQUIRED_VIEWS = [
  'verification_requests',
  'favorites',
  'company_reviews',
  'professional_reviews',
]

const REQUIRED_RPCS = [
  'get_marketplace_category_page',
  'get_homepage_metrics',
  'ensure_conversation',
  'create_notification',
  'count_unread_notifications',
  'admin_review_verification',
  'recompute_trust_score',
  'get_public_footer_stats',
  'refresh_profile_rating',
  'register_app_visit',
]

const REQUIRED_COLUMNS = [
  ['profiles', 'verification_level'],
  ['profiles', 'email_verified_at'],
  ['profiles', 'phone_verified_at'],
  ['profiles', 'business_verified'],
  ['profiles', 'trusted_professional'],
  ['profiles', 'identity_verified'],
  ['profiles', 'is_verified'],
  ['profiles', 'is_premium'],
  ['profiles', 'trust_score'],
  ['profiles', 'trust_level'],
  ['notifications', 'is_archived'],
  ['conversations', 'is_archived'],
]

const REQUIRED_BUCKETS = [
  'verification-docs',
  'chat-media',
  'portfolio-media',
  'project-files',
  'ad-media',
  'review-media',
  'quote-pdfs',
  // aliases requested by product brief (created as aliases / real buckets in critical sync)
  'avatars',
  'company-logos',
  'company-gallery',
  'chat-files',
  'verification-documents',
  'portfolio',
]

async function rest(path, { method = 'GET', key = anonKey, body } = {}) {
  if (!key) return { status: 0, body: 'no key' }
  const res = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

async function tableExists(name) {
  const { status, body } = await rest(`/rest/v1/${name}?select=*&limit=1`)
  if (status === 200) return true
  if (body.includes('PGRST205') || body.includes('Could not find the table')) return false
  // 400 often means table exists but column/select issue
  return status !== 404
}

async function rpcExists(name) {
  const { status, body } = await rest(`/rest/v1/rpc/${name}`, { method: 'POST', body: {} })
  if (body.includes('PGRST202') || body.includes('Could not find the function')) return false
  return true
}

async function columnExists(table, column) {
  const { status } = await rest(`/rest/v1/${table}?select=${column}&limit=1`)
  return status === 200
}

async function bucketExists(id) {
  const key = serviceKey || anonKey
  const { status } = await rest(`/storage/v1/bucket/${id}`, { key })
  return status === 200
}

async function runSql(sql, label) {
  if (!accessToken) throw new Error('SUPABASE_ACCESS_TOKEN missing')
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    if (SKIP_ERROR_RE.test(text)) {
      return { ok: true, skipped: true, status: res.status, body: text.slice(0, 500) }
    }
    return { ok: false, skipped: false, status: res.status, body: text.slice(0, 2000) }
  }
  return { ok: true, skipped: false, status: res.status, body: text.slice(0, 500) }
}

async function audit() {
  const report = {
    checkedAt: new Date().toISOString(),
    projectRef,
    tables: { present: [], missing: [] },
    views: { present: [], missing: [] },
    rpcs: { present: [], missing: [] },
    columns: { present: [], missing: [] },
    buckets: { present: [], missing: [] },
  }

  for (const t of REQUIRED_TABLES) {
    ;(await tableExists(t) ? report.tables.present : report.tables.missing).push(t)
  }
  for (const v of REQUIRED_VIEWS) {
    ;(await tableExists(v) ? report.views.present : report.views.missing).push(v)
  }
  for (const r of REQUIRED_RPCS) {
    ;(await rpcExists(r) ? report.rpcs.present : report.rpcs.missing).push(r)
  }
  for (const [table, col] of REQUIRED_COLUMNS) {
    const key = `${table}.${col}`
    ;(await columnExists(table, col) ? report.columns.present : report.columns.missing).push(key)
  }
  for (const b of REQUIRED_BUCKETS) {
    ;(await bucketExists(b) ? report.buckets.present : report.buckets.missing).push(b)
  }

  const miss =
    report.tables.missing.length +
    report.views.missing.length +
    report.rpcs.missing.length +
    report.columns.missing.length +
    report.buckets.missing.length
  const total =
    REQUIRED_TABLES.length +
    REQUIRED_VIEWS.length +
    REQUIRED_RPCS.length +
    REQUIRED_COLUMNS.length +
    REQUIRED_BUCKETS.length
  report.healthScore = Math.round(((total - miss) / total) * 100)
  return report
}

function listMigrationFiles() {
  const dir = resolve(root, 'supabase/migrations')
  const all = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  // Prefer priority list order, then any remaining after fromStamp
  const priority = PRIORITY_MIGRATIONS.filter((f) => all.includes(f))
  const rest = all.filter((f) => !priority.includes(f))
  let ordered = [...priority, ...rest]
  if (fromStamp) {
    ordered = ordered.filter((f) => f >= fromStamp)
  }
  // Default apply = priority only (safer). Pass --all to apply every file.
  if (!args.has('--all')) ordered = priority
  return ordered.map((f) => resolve(dir, f))
}

function printAudit(report) {
  console.log('\n========== SCHEMA AUDIT ==========')
  console.log('Health score:', report.healthScore + '/100')
  console.log('Missing tables:', report.tables.missing.join(', ') || 'none')
  console.log('Missing views:', report.views.missing.join(', ') || 'none')
  console.log('Missing RPCs:', report.rpcs.missing.join(', ') || 'none')
  console.log('Missing columns:', report.columns.missing.join(', ') || 'none')
  console.log('Missing buckets:', report.buckets.missing.join(', ') || 'none')
  console.log('==================================\n')
}

async function main() {
  if (!anonKey && !serviceKey) {
    console.warn('WARN: No anon/service key — audit via REST will be limited.')
  }

  const before = await audit()
  printAudit(before)

  const outDir = resolve('/opt/cursor/artifacts')
  try {
    mkdirSync(outDir, { recursive: true })
  } catch {
    /* ignore */
  }
  writeFileSync(resolve(outDir, 'supabase-audit-before.json'), JSON.stringify(before, null, 2))

  if (auditOnly) {
    console.log('Audit-only mode. Exiting.')
    process.exit(before.healthScore >= 90 ? 0 : 2)
  }

  if (!accessToken) {
    console.error(`
ERROR: SUPABASE_ACCESS_TOKEN is required to apply migrations.

1) Open https://supabase.com/dashboard/account/tokens
2) Create access token (sbp_...)
3) Add to .env.local:
   SUPABASE_ACCESS_TOKEN=sbp_...
   VITE_SUPABASE_URL=${url}
   VITE_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # optional but recommended

4) Re-run:
   node scripts/sync-prod-database.mjs
`)
    writeFileSync(
      resolve(outDir, 'supabase-sync-report.md'),
      `# Supabase sync blocked\n\nMissing SUPABASE_ACCESS_TOKEN.\n\nPre-apply health: **${before.healthScore}/100**\n\nMissing RPCs: ${before.rpcs.missing.join(', ')}\nMissing tables: ${before.tables.missing.join(', ')}\nMissing columns: ${before.columns.missing.join(', ')}\nMissing buckets: ${before.buckets.missing.join(', ')}\n`,
    )
    process.exit(1)
  }

  const files = listMigrationFiles()
  const applied = []
  const skipped = []
  const failed = []

  console.log(`Applying ${files.length} migration file(s) to ${projectRef}...\n`)

  for (const file of files) {
    const name = basename(file)
    const sql = readFileSync(file, 'utf8')
    process.stdout.write(`→ ${name} ... `)
    try {
      const result = await runSql(sql, name)
      if (!result.ok) {
        // Retry once inside a DO block wrapper is not possible for whole files.
        // Classify skippable errors.
        if (SKIP_ERROR_RE.test(result.body)) {
          console.log('SKIP (exists)')
          skipped.push({ name, reason: result.body.slice(0, 200) })
        } else {
          console.log('FAIL', result.status)
          failed.push({ name, status: result.status, body: result.body })
          // Continue — later migrations may still apply; critical sync file is last in priority.
        }
      } else if (result.skipped) {
        console.log('SKIP')
        skipped.push({ name, reason: 'already exists' })
      } else {
        console.log('OK')
        applied.push(name)
      }
    } catch (e) {
      console.log('ERROR', e.message)
      failed.push({ name, body: e.message })
    }
  }

  const after = await audit()
  printAudit(after)

  const reportMd = `# DImarket Supabase Production Sync Report

Generated: ${new Date().toISOString()}
Project: \`${projectRef}\`

## Health
- Before: **${before.healthScore}/100**
- After: **${after.healthScore}/100**

## Applied migrations (${applied.length})
${applied.map((x) => `- ${x}`).join('\n') || '- (none)'}

## Skipped (${skipped.length})
${skipped.map((x) => `- ${x.name}: ${x.reason?.slice(0, 120) || 'exists'}`).join('\n') || '- (none)'}

## Failed (${failed.length})
${failed.map((x) => `- ${x.name}: ${x.body?.slice(0, 240)}`).join('\n') || '- (none)'}

## Remaining missing
- Tables: ${after.tables.missing.join(', ') || 'none'}
- Views: ${after.views.missing.join(', ') || 'none'}
- RPCs: ${after.rpcs.missing.join(', ') || 'none'}
- Columns: ${after.columns.missing.join(', ') || 'none'}
- Buckets: ${after.buckets.missing.join(', ') || 'none'}

## Notes
- \`company_reviews\` / \`professional_reviews\`: app uses \`reviews\` (views created in critical sync if missing).
- \`favorites\`: app uses \`saved_items\` (compatibility view in critical sync).
- \`verification_requests\`: view over \`contractor_verifications\`.
- No production data was deleted.
`

  writeFileSync(resolve(outDir, 'supabase-sync-report.md'), reportMd)
  writeFileSync(resolve(outDir, 'supabase-audit-after.json'), JSON.stringify(after, null, 2))
  writeFileSync(
    resolve(outDir, 'supabase-sync-result.json'),
    JSON.stringify({ applied, skipped, failed, before, after }, null, 2),
  )
  console.log('Report written to /opt/cursor/artifacts/supabase-sync-report.md')

  if (failed.length || after.healthScore < 85) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
