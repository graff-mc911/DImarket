#!/usr/bin/env node
/**
 * Backfill service_latitude / service_longitude / service_radius_km for
 * Germany directory profiles from germany-directory-nationwide.json.
 *
 * Auth (first match):
 * 1) SUPABASE_SERVICE_ROLE_KEY
 * 2) SUPABASE_ACCESS_TOKEN (Management API SQL)
 *
 * Usage: node scripts/backfill-germany-directory-coords.mjs
 */
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const dataPath = resolve(root, 'data/directory/germany-directory-nationwide.json')
const reportPath = resolve(root, 'data/directory/germany-coords-backfill-report.json')

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
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || `https://${projectRef}.supabase.co`
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const token = env.SUPABASE_ACCESS_TOKEN

if (!existsSync(dataPath)) {
  console.error(`Missing ${dataPath}. Run: node scripts/build-germany-directory-seed.mjs`)
  process.exit(1)
}

const payload = JSON.parse(readFileSync(dataPath, 'utf8'))
const businesses = (payload.businesses || []).filter(
  (b) => b.service_latitude != null && b.service_longitude != null,
)

function sqlLiteral(v) {
  if (v == null) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

function buildSql() {
  const stmts = businesses.map((b) => {
    const radiusSql =
      process.env.DIRECTORY_IMPORT_SET_RADIUS === '1' &&
      b.service_radius_km != null &&
      Number.isFinite(Number(b.service_radius_km))
        ? `,\n  service_radius_km = ${Number(b.service_radius_km)}`
        : ''
    return `UPDATE public.profiles
SET
  service_latitude = ${Number(b.service_latitude)},
  service_longitude = ${Number(b.service_longitude)}${radiusSql}
WHERE is_professional = true
  AND full_name = ${sqlLiteral(b.full_name)}
  AND location ILIKE ${sqlLiteral(`%${b.city}%`)}
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM ${Number(b.service_latitude)}
       OR service_longitude IS DISTINCT FROM ${Number(b.service_longitude)});`
  })
  return stmts.join('\n\n')
}

async function viaServiceRole() {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const report = []
  for (const b of businesses) {
    const patch = {
      service_latitude: Number(b.service_latitude),
      service_longitude: Number(b.service_longitude),
    }
    if (
      process.env.DIRECTORY_IMPORT_SET_RADIUS === '1' &&
      b.service_radius_km != null
    ) {
      patch.service_radius_km = Number(b.service_radius_km)
    }

    const { data: matches, error: findErr } = await admin
      .from('profiles')
      .select('id, full_name, location, service_latitude, service_longitude')
      .ilike('full_name', b.full_name)
      .ilike('location', `%${b.city}%`)
      .eq('is_professional', true)
      .limit(5)

    if (findErr) {
      report.push({ slug: b.slug, status: 'find_error', error: findErr.message })
      continue
    }
    if (!matches?.length) {
      report.push({ slug: b.slug, status: 'not_found' })
      continue
    }

    for (const row of matches) {
      const { error } = await admin.from('profiles').update(patch).eq('id', row.id)
      if (error) {
        report.push({ slug: b.slug, id: row.id, status: 'update_error', error: error.message })
      } else {
        report.push({
          slug: b.slug,
          id: row.id,
          status: 'updated',
          lat: patch.service_latitude,
          lng: patch.service_longitude,
        })
        console.log(`OK ${b.slug} → ${row.id}`)
      }
    }
  }
  writeFileSync(reportPath, JSON.stringify({ finished_at: new Date().toISOString(), report }, null, 2) + '\n')
  const updated = report.filter((r) => r.status === 'updated').length
  console.log(`Updated ${updated}/${businesses.length} (see ${reportPath})`)
  return updated
}

async function viaManagementApi() {
  const sql = buildSql()
  const sqlPath = resolve(root, 'data/directory/germany-coords-backfill.sql')
  writeFileSync(sqlPath, sql + '\n')
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`management api ${res.status}: ${body}`)
  console.log('OK via management API')
  writeFileSync(
    reportPath,
    JSON.stringify(
      { finished_at: new Date().toISOString(), mode: 'management_api', businesses: businesses.length },
      null,
      2,
    ) + '\n',
  )
}

if (serviceKey && !String(serviceKey).includes('...')) {
  await viaServiceRole()
} else if (token && !String(token).includes('...')) {
  await viaManagementApi()
} else {
  const sqlPath = resolve(root, 'data/directory/germany-coords-backfill.sql')
  writeFileSync(sqlPath, buildSql() + '\n')
  console.error(
    'Need SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN.\n' +
      `SQL ready for manual apply: ${sqlPath}`,
  )
  process.exit(2)
}
