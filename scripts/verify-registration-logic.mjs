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
  if (r === 'manufacturer' || r === 'commercial_agent') {
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
  if (role === 'manufacturer') return '/commercial-agents/dashboard?role=manufacturer&tab=profile'
  if (role === 'commercial_agent') return '/commercial-agents/dashboard?role=agent&tab=profile'
  if (role === 'client') return '/customer/dashboard'
  if (role === 'professional' || role === 'company') return '/pro/dashboard'
  return '/customer/dashboard'
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
    path: '/customer/dashboard',
  },
  {
    role: 'professional',
    user_role: 'professional',
    is_professional: true,
    path: '/pro/dashboard',
  },
  {
    role: 'company',
    user_role: 'company',
    is_professional: true,
    path: '/pro/dashboard',
  },
  {
    role: 'manufacturer',
    user_role: 'manufacturer',
    is_professional: true,
    path: '/commercial-agents/dashboard?role=manufacturer&tab=profile',
  },
  {
    role: 'commercial_agent',
    user_role: 'commercial_agent',
    is_professional: true,
    path: '/commercial-agents/dashboard?role=agent&tab=profile',
  },
  {
    role: 'advertiser',
    user_role: 'client',
    is_professional: false,
    path: '/advertising',
  },
]

for (const c of cases) {
  const n = normalizeProfileRole(c.role)
  assert(n.user_role === c.user_role, `${c.role} → user_role ${c.user_role}`)
  assert(n.is_professional === c.is_professional, `${c.role} → is_professional ${c.is_professional}`)
  const intended = getIntendedRole({ user_role: n.user_role }, {
    user_metadata: c.role === 'advertiser' ? { user_role: 'advertiser' } : {},
  })
  assert(
    c.role === 'advertiser' ? intended === 'advertiser' : intended === c.user_role,
    `${c.role} intended role`,
  )
  const path = getPostLoginPath({ user_role: n.user_role }, { intendedRole: c.role === 'advertiser' ? 'advertiser' : n.user_role })
  assert(path === c.path, `${c.role} → redirect ${c.path}`)
}

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll registration role logic checks passed.')
