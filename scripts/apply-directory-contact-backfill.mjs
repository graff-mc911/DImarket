/**
 * Apply published directory phones + company reclassify on prod.
 *
 * Tries, in order:
 *   1) SUPABASE_ACCESS_TOKEN — Management API SQL
 *   2) SUPABASE_SERVICE_ROLE_KEY — PostgREST updates
 *
 * node scripts/apply-directory-contact-backfill.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const sqlFile = 'data/directory/fix-incomplete-directory-profiles.sql'
const supabaseUrl = `https://${projectRef}.supabase.co`

const COMPANY_IDS = [
  'cfea3db8-b754-4e12-81c6-bf04bf9d93c2', // Reformas Esquivel
  'bba9fff4-e1a5-4c3b-9f75-42541066b1b6', // Lamin Reformas y Fontanería
  '4e6fd39b-5486-4844-9c3e-013d73b0d180', // Malerisch GmbH
]

const PHONES = [
  ['f52fde86-97ff-41b7-a448-42548d2d0d70', '+49 6151 5011204'],
  ['41e720df-5d2d-4fb7-b77a-78d87b4eeab2', '+49 172 6399986'],
  ['a63a36f1-596b-4141-b11b-c16b15973387', '+34 624 281 936'],
  ['4e41f10c-0da7-41eb-bed0-d774f82c1c05', '+34 981 680 465'],
  ['137da278-5e58-4211-92fb-563ead6dff26', '+48 788 931 535'],
  ['243e575a-d249-45f1-b963-0f1f34f3ca95', '+34 914 350 398'],
  ['b536b377-9a4b-467c-a938-6864c4a95ada', '+49 7024 8040'],
  ['6da5d5cf-2ec1-4fea-a662-44d392f6b376', '+41 58 436 6800'],
  ['0ab4834e-af4e-4d96-af8d-8224ffdcd6f2', '+49 9252 3590'],
  ['2e6bd237-2e65-4f52-a263-15dd4ddc647d', '+49 521 7830'],
  ['e900576c-3900-49b3-936d-27a89f9a6c9d', '+32 59 55 81 11'],
  ['aaef99a3-bf69-4b7f-a2f2-4071fb32de35', '+43 1 60192 0'],
  ['e29b9047-53ca-4e0c-bcb2-aa28857b9d55', '+48 33 819 53 00'],
  ['26808605-c04e-4f75-a683-e8187ba006be', '+45 46 56 03 00'],
]

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
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const hasToken = token.length >= 20 && !token.includes('...')
const hasService = serviceKey.length >= 20 && !serviceKey.includes('...')

async function viaManagementApi() {
  const sql = readFileSync(resolve(root, sqlFile), 'utf8')
  console.log('Applying', sqlFile, `via Management API (${sql.length} chars)`)
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`management api ${res.status}: ${text.slice(0, 1500)}`)
  console.log('OK via Management API:', text.slice(0, 300))
}

async function viaServiceRole() {
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: roleError } = await admin
    .from('profiles')
    .update({ user_role: 'company' })
    .in('id', COMPANY_IDS)
    .eq('user_role', 'professional')
  if (roleError) throw new Error(`reclassify: ${roleError.message}`)
  console.log('OK reclassified business-named professionals')

  for (const [id, phone] of PHONES) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, phone')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`${id}: ${error.message}`)
    if (!data) {
      console.log('skip missing', id)
      continue
    }
    if (typeof data.phone === 'string' && data.phone.trim()) {
      console.log('keep existing phone', id)
      continue
    }
    const { error: upError } = await admin.from('profiles').update({ phone }).eq('id', id)
    if (upError) throw new Error(`${id}: ${upError.message}`)
    console.log('OK phone', id, phone)
  }
}

if (hasToken) {
  await viaManagementApi()
} else if (hasService) {
  await viaServiceRole()
} else {
  console.error(
    'Need SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY.\n' +
      `Or paste ${sqlFile} in Supabase SQL Editor.`,
  )
  process.exit(1)
}
