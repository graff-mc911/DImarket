/**
 * Інтеграційна перевірка реєстрації всіх ролей через Supabase Admin API.
 *
 * .env.local: SUPABASE_SERVICE_ROLE_KEY
 * Запуск: node scripts/test-registration-roles.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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
const url = env.VITE_SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co'
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error('Потрібен SUPABASE_SERVICE_ROLE_KEY у .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function normalizeProfileRole(role) {
  const r = (role || 'client').toLowerCase()
  if (r === 'advertiser') return { user_role: 'client', is_professional: false }
  if (r === 'professional' || r === 'company') {
    return { user_role: r, is_professional: true }
  }
  return { user_role: 'client', is_professional: false }
}

const ROLES = ['client', 'professional', 'company', 'advertiser']
const stamp = Date.now()
let failed = 0
const createdIds = []

for (const role of ROLES) {
  const email = `e2e-${role}-${stamp}@dimarket-test.invalid`
  const password = 'TestPass123!'
  const fullName = `Test ${role}`

  console.log(`\n── ${role} ──`)

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: role === 'company' ? 'Test Company LLC' : fullName,
      user_role: role,
      phone: '+380000000000',
      location: 'Kyiv, Kyiv Oblast, Ukraine',
    },
  })

  if (createErr || !created.user) {
    console.error('createUser:', createErr?.message)
    failed++
    continue
  }

  createdIds.push(created.user.id)
  const expected = normalizeProfileRole(role)

  // Симулюємо ensureUserProfile (upsert як у клієнті)
  const { error: upsertErr } = await admin.from('profiles').upsert(
    {
      id: created.user.id,
      full_name: fullName,
      user_role: expected.user_role,
      is_professional: expected.is_professional,
      phone: '+380000000000',
      location: 'Kyiv, Kyiv Oblast, Ukraine',
    },
    { onConflict: 'id' },
  )

  if (upsertErr) {
    console.error('profiles upsert:', upsertErr.message)
    failed++
    continue
  }

  const { data: profile, error: readErr } = await admin
    .from('profiles')
    .select('user_role, is_professional, full_name')
    .eq('id', created.user.id)
    .single()

  if (readErr || !profile) {
    console.error('profiles read:', readErr?.message)
    failed++
    continue
  }

  const roleOk = profile.user_role === expected.user_role
  const profOk = profile.is_professional === expected.is_professional

  console.log('profile:', profile)
  if (!roleOk || !profOk) {
    console.error(`Expected user_role=${expected.user_role}, is_professional=${expected.is_professional}`)
    failed++
  } else {
    console.log('PASS')
  }

  // Перевірка signIn
  const anon = createClient(url, env.VITE_SUPABASE_ANON_KEY)
  const { error: signInErr } = await anon.auth.signInWithPassword({ email, password })
  if (signInErr) {
    console.error('signIn:', signInErr.message)
    failed++
  } else {
    console.log('signIn: OK')
    await anon.auth.signOut()
  }
}

// Cleanup
for (const id of createdIds) {
  await admin.auth.admin.deleteUser(id)
}

console.log(`\n${failed === 0 ? 'All role tests passed.' : failed + ' test(s) failed.'}`)
process.exit(failed > 0 ? 1 : 0)
