#!/usr/bin/env node
/**
 * Apply spain-electricians-avatars-backfill.sql via Supabase Management API
 * or service_role REST updates.
 *
 * Needs one of:
 *   SUPABASE_ACCESS_TOKEN=sbp_...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const sqlPath = resolve(root, 'data/directory/spain-electricians-avatars-backfill.sql')
const reportPath = resolve(root, 'data/directory/spain-electricians-avatars-report.json')

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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || `https://${projectRef}.supabase.co`

async function viaManagementApi() {
  const sql = readFileSync(sqlPath, 'utf8')
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
}

async function viaServiceRole() {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  for (const row of report) {
    const { error } = await admin
      .from('profiles')
      .update({ avatar_url: row.final_photo, profile_photo: row.final_photo })
      .eq('id', row.id)
    if (error) throw new Error(`${row.name}: ${error.message}`)
    console.log('OK', row.name)
  }
}

if (token && !String(token).includes('...')) {
  await viaManagementApi()
} else if (serviceKey && !String(serviceKey).includes('...')) {
  await viaServiceRole()
} else {
  console.error(
    'Need real SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'UI already falls back to hosted avatars via src/lib/directoryAvatars.ts.\n' +
      `SQL ready: ${sqlPath}`,
  )
  process.exit(2)
}
