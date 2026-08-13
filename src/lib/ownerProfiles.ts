import { supabase } from './supabase'

export type OwnerProfileRow = {
  id: string
  full_name: string | null
  email?: string | null
  phone: string | null
  location: string | null
  user_role: string | null
  is_professional: boolean
  is_verified: boolean | null
  verification_level?: string | null
  is_premium: boolean | null
  is_featured: boolean | null
  is_site_owner?: boolean
  rating: number
  total_reviews: number
  completed_jobs?: number | null
  ranking_priority?: number | null
  hidden_at?: string | null
  deleted_at?: string | null
  created_at: string
  updated_at?: string
  is_hidden?: boolean
  is_deleted?: boolean
}

export type OwnerProfileFilter =
  | 'all'
  | 'public_listable'
  | 'top_masters'
  | 'professional'
  | 'client'
  | 'company'
  | 'manufacturer'
  | 'commercial_agent'
  | 'premium'
  | 'verified'
  | 'hidden'
  | 'deleted'
  | 'qa'

export type OwnerConsistencyCounts = {
  all_profiles: number
  public_listable: number
  masters_role: number
  companies_role: number
  hidden: number
  deleted: number
  qa_named: number
}

type RpcResult = { ok?: boolean; error?: string; action?: string; id?: string; ranking_priority?: number }

async function callRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never)
  if (error) throw error
  return data as T
}

/** Owner must be able to load the full public universe — no silent 70/100 truncation. */
export const OWNER_PROFILE_FETCH_LIMIT = 2000

/**
 * Same base set as homepage Top Masters:
 * profiles.is_professional = true AND user_role = 'professional'
 */
export function isTopMastersProfile(row: Pick<OwnerProfileRow, 'is_professional' | 'user_role'>): boolean {
  return row.is_professional === true && row.user_role === 'professional'
}

export async function ownerSearchProfiles(opts: {
  query?: string
  filter?: OwnerProfileFilter
  limit?: number
}): Promise<OwnerProfileRow[]> {
  let query = opts.query ?? ''
  let filter: string = opts.filter ?? 'all'
  const requestedFilter = opts.filter ?? 'all'
  const limit = opts.limit ?? OWNER_PROFILE_FETCH_LIMIT

  // Older prod RPC only supported: all|professional|client|premium|verified
  const legacyFilters = new Set(['all', 'professional', 'client', 'premium', 'verified'])
  if (!legacyFilters.has(filter)) {
    if (filter === 'qa') {
      query = query.trim() ? query : 'QA'
      filter = 'all'
    } else if (filter === 'public_listable' || filter === 'top_masters') {
      // Same set the client can list / Top Masters feed
      filter = 'professional'
    } else if (filter === 'company' || filter === 'manufacturer' || filter === 'commercial_agent') {
      query = query.trim() ? query : filter
      filter = 'all'
    } else if (filter === 'hidden' || filter === 'deleted') {
      filter = 'all'
    }
  }

  const data = await callRpc<OwnerProfileRow[] | unknown>('admin_search_profiles', {
    p_query: query,
    p_filter: filter,
    p_limit: limit,
  })
  let rows: OwnerProfileRow[] = []
  if (Array.isArray(data)) rows = data as OwnerProfileRow[]
  else if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as OwnerProfileRow[]
      rows = Array.isArray(parsed) ? parsed : []
    } catch {
      rows = []
    }
  }

  // Exact sync with PUBLIC Top Masters query (not companies).
  if (requestedFilter === 'top_masters') {
    rows = rows.filter(isTopMastersProfile)
  }

  // QA tab: keep only QA-looking names even if RPC returned a broader set.
  if (requestedFilter === 'qa') {
    rows = rows.filter((r) => /^qa([\s_\-.]|$)/i.test((r.full_name || '').trim()) || /QA /i.test(r.full_name || ''))
  }

  return rows
}

/**
 * Public count for homepage Top Masters base set
 * (is_professional + user_role=professional).
 */
export async function fetchPublicTopMastersCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_professional', true)
    .eq('user_role', 'professional')

  if (error) throw error
  return count ?? 0
}

/**
 * Public count (same base set the catalog uses) vs owner RPC result size.
 * Detects the "client 100 / owner 70" truncation bug.
 */
export async function fetchPublicListableProfileCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_professional', true)

  if (error) throw error
  return count ?? 0
}

export async function fetchOwnerConsistencyCounts(): Promise<OwnerConsistencyCounts | null> {
  try {
    const data = await callRpc<OwnerConsistencyCounts | unknown>('admin_profile_consistency_counts', {})
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as OwnerConsistencyCounts
    }
    return null
  } catch {
    return null
  }
}

async function withLegacyHideFallback(
  preferred: () => Promise<RpcResult>,
  legacy: () => Promise<RpcResult>,
): Promise<RpcResult> {
  try {
    return await preferred()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/Could not find the function|PGRST202|schema cache|does not exist/i.test(msg)) {
      return legacy()
    }
    throw e
  }
}

export async function ownerHideProfile(profileId: string): Promise<RpcResult> {
  return withLegacyHideFallback(
    () => callRpc('admin_hide_profile', { p_profile_id: profileId }),
    async () => {
      const res = await ownerUpdateProfileFlags(profileId, { is_professional: false })
      return { ...res, action: 'legacy_hide_is_professional_false' }
    },
  )
}

export async function ownerUnhideProfile(profileId: string): Promise<RpcResult> {
  return withLegacyHideFallback(
    () => callRpc('admin_unhide_profile', { p_profile_id: profileId }),
    async () => {
      const res = await ownerUpdateProfileFlags(profileId, { is_professional: true })
      return { ...res, action: 'legacy_unhide_is_professional_true' }
    },
  )
}

export async function ownerSoftDeleteProfile(profileId: string): Promise<RpcResult> {
  return withLegacyHideFallback(
    () => callRpc('admin_soft_delete_profile', { p_profile_id: profileId }),
    async () => {
      const res = await ownerUpdateProfileFlags(profileId, { is_professional: false })
      return { ...res, action: 'legacy_soft_delete_is_professional_false' }
    },
  )
}

export async function ownerRestoreProfile(profileId: string): Promise<RpcResult> {
  return withLegacyHideFallback(
    () => callRpc('admin_restore_profile', { p_profile_id: profileId }),
    async () => {
      const res = await ownerUpdateProfileFlags(profileId, { is_professional: true })
      return { ...res, action: 'legacy_restore_is_professional_true' }
    },
  )
}

export async function ownerSetRankingPriority(
  profileId: string,
  rankingPriority: number,
): Promise<RpcResult> {
  try {
    return await callRpc('admin_set_ranking_priority', {
      p_profile_id: profileId,
      p_ranking_priority: rankingPriority,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/Could not find the function|PGRST202|schema cache|does not exist/i.test(msg)) {
      return {
        ok: false,
        error:
          'admin_set_ranking_priority missing — apply APPLY_OWNER_PROFILE_MODERATION.sql',
      }
    }
    throw e
  }
}

export async function ownerUpdateProfileFlags(
  profileId: string,
  flags: {
    is_verified?: boolean | null
    is_premium?: boolean | null
    is_featured?: boolean | null
    is_professional?: boolean | null
    user_role?: string | null
  },
): Promise<RpcResult> {
  return callRpc('admin_update_profile_flags', {
    p_profile_id: profileId,
    p_is_verified: flags.is_verified ?? null,
    p_is_premium: flags.is_premium ?? null,
    p_is_featured: flags.is_featured ?? null,
    p_is_professional: flags.is_professional ?? null,
    p_user_role: flags.user_role ?? null,
    p_verification_level: null,
  })
}
