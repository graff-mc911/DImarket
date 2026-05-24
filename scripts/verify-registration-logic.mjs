/**
 * Перевірка логіки ролей реєстрації (без Supabase).
 * Запуск: node scripts/verify-registration-logic.mjs
 */

function normalizeProfileRole(role) {
  const r = (role || 'client').toLowerCase()
  if (r === 'advertiser') return { user_role: 'client', is_professional: false }
  if (r === 'professional' || r === 'company') {
    return { user_role: r, is_professional: true }
  }
  if (r === 'owner') return { user_role: 'owner', is_professional: false }
  return { user_role: 'client', is_professional: false }
}

function getIntendedRole(profile, user) {
  const meta = user?.user_metadata
  if (meta?.user_role === 'advertiser' || meta?.intended_role === 'advertiser') {
    return 'advertiser'
  }
  return profile?.user_role ?? null
}

function getPostLoginPath(profile, options) {
  if (profile?.is_site_owner) return '/dashboard'
  const role = options?.intendedRole ?? profile?.user_role
  if (role === 'advertiser') return '/advertising'
  if (role === 'client') return '/listings'
  return '/settings'
}

let failed = 0

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message)
    failed++
  } else {
    console.log('ok', message)
  }
}

const cases = [
  {
    role: 'client',
    user_role: 'client',
    is_professional: false,
    path: '/listings',
  },
  {
    role: 'professional',
    user_role: 'professional',
    is_professional: true,
    path: '/settings',
  },
  {
    role: 'company',
    user_role: 'company',
    is_professional: true,
    path: '/settings',
  },
  {
    role: 'advertiser',
    user_role: 'client',
    is_professional: false,
    path: '/advertising',
  },
]

for (const c of cases) {
  const norm = normalizeProfileRole(c.role)
  assert(norm.user_role === c.user_role, `${c.role} → user_role ${c.user_role}`)
  assert(
    norm.is_professional === c.is_professional,
    `${c.role} → is_professional ${c.is_professional}`,
  )

  const profile = { user_role: norm.user_role, is_site_owner: false }
  const metaUser =
    c.role === 'advertiser'
      ? { user_metadata: { user_role: 'advertiser', intended_role: 'advertiser' } }
      : { user_metadata: { user_role: c.role } }

  const intended = getIntendedRole(profile, metaUser)
  assert(
    intended === (c.role === 'advertiser' ? 'advertiser' : c.user_role),
    `${c.role} intended role`,
  )

  const path = getPostLoginPath(profile, {
    intendedRole: c.role === 'advertiser' ? 'advertiser' : profile.user_role,
  })
  assert(path === c.path, `${c.role} → redirect ${c.path}`)
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`)
  process.exit(1)
}

console.log('\nAll registration role logic checks passed.')
