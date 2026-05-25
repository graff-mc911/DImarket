import type { User } from '@supabase/supabase-js'
import { upsertGeoCatalogFromLocation } from './adGeoCatalog'
import { supabase } from './supabase'
import type { Profile, UserRole } from './types'

export type RegistrationRole = UserRole | 'advertiser'

const PENDING_REG_KEY = 'dimarket_pending_registration'

export type PendingRegistration = {
  role: RegistrationRole
  full_name?: string
  phone?: string
  location?: string
  company_name?: string
}

export function savePendingRegistration(data: PendingRegistration): void {
  try {
    sessionStorage.setItem(PENDING_REG_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function consumePendingRegistration(): PendingRegistration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_REG_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_REG_KEY)
    return JSON.parse(raw) as PendingRegistration
  } catch {
    return null
  }
}

/** Роль у profiles (CHECK у БД) + прапорець майстра. advertiser → client у БД, роль у metadata. */
export function normalizeProfileRole(role: string | undefined | null): {
  user_role: UserRole
  is_professional: boolean
} {
  const r = (role || 'client').toLowerCase()
  if (r === 'advertiser') {
    return { user_role: 'client', is_professional: false }
  }
  if (r === 'professional' || r === 'company') {
    return { user_role: r as UserRole, is_professional: true }
  }
  if (r === 'owner') {
    return { user_role: 'owner', is_professional: false }
  }
  return { user_role: 'client', is_professional: false }
}

export function getIntendedRole(
  profile: { user_role?: string | null } | null,
  user?: User | null,
): string | null {
  const meta = user?.user_metadata
  if (meta?.user_role === 'advertiser' || meta?.intended_role === 'advertiser') {
    return 'advertiser'
  }
  return profile?.user_role ?? null
}

/** Створює або доповнює profiles після signUp / signIn / OAuth. */
export async function ensureUserProfile(
  user: User,
  extras?: PendingRegistration,
): Promise<Profile | null> {
  const pending = extras ?? consumePendingRegistration()
  const meta = user.user_metadata ?? {}

  const roleSource = String(pending?.role ?? meta.user_role ?? 'client')
  const { user_role, is_professional } = normalizeProfileRole(roleSource)

  const displayName =
    pending?.full_name?.trim() ||
    (typeof meta.full_name === 'string' ? meta.full_name.trim() : '') ||
    user.email?.split('@')[0] ||
    'User'

  const location =
    pending?.location ??
    (typeof meta.location === 'string' ? meta.location : null) ??
    null
  const phone =
    pending?.phone ?? (typeof meta.phone === 'string' ? meta.phone : null) ?? null

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (readError) {
    console.error('[profileSync] read:', readError.message)
  }

  if (existing) {
    const shouldSetRole =
      !existing.user_role ||
      existing.user_role === 'client' ||
      (roleSource !== 'client' && roleSource !== 'advertiser')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: existing.full_name?.trim() ? existing.full_name : displayName,
        user_role: shouldSetRole ? user_role : existing.user_role,
        is_professional: existing.is_professional || is_professional,
        phone: existing.phone || phone,
        location: existing.location || location,
      })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('[profileSync] update:', error.message)
      return existing as Profile
    }

    if (roleSource === 'advertiser') {
      await supabase.auth.updateUser({
        data: { user_role: 'advertiser', intended_role: 'advertiser' },
      })
    }

    const savedLocation = (data as Profile).location || location
    if (savedLocation) void upsertGeoCatalogFromLocation(savedLocation)

    return data as Profile
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: displayName,
        user_role,
        is_professional,
        phone,
        location,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (error) {
    console.error('[profileSync] upsert:', error.message)
    return null
  }

  if (roleSource === 'advertiser') {
    await supabase.auth.updateUser({
      data: { user_role: 'advertiser', intended_role: 'advertiser' },
    })
  }

  if (location) void upsertGeoCatalogFromLocation(location)

  return data as Profile
}
