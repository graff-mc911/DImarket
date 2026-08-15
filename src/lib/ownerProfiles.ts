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
  | 'top_companies'
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

/** Same base set as homepage «Топ компанії». */
export function isTopCompaniesProfile(row: Pick<OwnerProfileRow, 'is_professional' | 'user_role'>): boolean {
  return row.is_professional === true && row.user_role === 'company'
}

function parseOwnerSearchRows(data: unknown): OwnerProfileRow[] {
  if (Array.isArray(data)) return data as OwnerProfileRow[]
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as OwnerProfileRow[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Filters that old prod `admin_search_profiles` (pre-moderation SQL) does not understand.
 * Unknown filters match zero rows and return `[]` successfully — that caused Owner list = 0.
 */
const LEGACY_UNKNOWN_FILTERS = new Set<OwnerProfileFilter>([
  'top_masters',
  'top_companies',
  'public_listable',
  'qa',
  'company',
  'manufacturer',
  'commercial_agent',
  'hidden',
  'deleted',
])

/** Map modern filters → legacy RPC when APPLY_OWNER_PROFILE_MODERATION.sql is not applied yet. */
function legacyRpcArgs(
  requestedFilter: OwnerProfileFilter,
  query: string,
): { p_query: string; p_filter: string } {
  const q = query.trim()
  switch (requestedFilter) {
    case 'qa':
      return { p_query: q || 'QA', p_filter: 'all' }
    case 'public_listable':
    case 'top_masters':
      return { p_query: q, p_filter: 'professional' }
    case 'top_companies':
    case 'company':
      return { p_query: q, p_filter: 'all' }
    case 'manufacturer':
    case 'commercial_agent':
      return { p_query: q || requestedFilter, p_filter: 'all' }
    case 'hidden':
    case 'deleted':
      return { p_query: q, p_filter: 'all' }
    default:
      return { p_query: q, p_filter: requestedFilter }
  }
}

function postFilterRows(rows: OwnerProfileRow[], requestedFilter: OwnerProfileFilter): OwnerProfileRow[] {
  switch (requestedFilter) {
    case 'top_masters':
      return rows.filter(isTopMastersProfile)
    case 'top_companies':
      return rows.filter(isTopCompaniesProfile)
    case 'public_listable':
      return rows.filter((r) => r.is_professional === true)
    case 'company':
      return rows.filter((r) => r.user_role === 'company')
    case 'manufacturer':
      return rows.filter((r) => r.user_role === 'manufacturer')
    case 'commercial_agent':
      return rows.filter((r) => r.user_role === 'commercial_agent')
    case 'qa':
      return rows.filter(
        (r) =>
          /^qa([\s_\-.]|$)/i.test((r.full_name || '').trim()) ||
          /QA /i.test(r.full_name || '') ||
          /qa|dimarket-audit|dimarket-test/i.test(r.email || ''),
      )
    case 'hidden':
      return rows.filter((r) => Boolean(r.hidden_at || r.is_hidden) && !r.deleted_at && !r.is_deleted)
    case 'deleted':
      return rows.filter((r) => Boolean(r.deleted_at || r.is_deleted))
    default:
      return rows
  }
}

const OWNER_PROFILE_SELECT =
  'id, full_name, phone, location, user_role, is_professional, is_verified, verification_level, is_premium, is_featured, is_site_owner, rating, total_reviews, completed_jobs, created_at, updated_at'

/**
 * Direct `profiles` SELECT — works even when moderation SQL / modern RPC filters are missing.
 * Public RLS already allows reading the same rows the homepage shows.
 */
async function ownerSearchProfilesViaTable(opts: {
  query: string
  filter: OwnerProfileFilter
  limit: number
}): Promise<OwnerProfileRow[]> {
  const q = opts.query.trim()
  let req = supabase
    .from('profiles')
    .select(OWNER_PROFILE_SELECT)
    .order('created_at', { ascending: false })
    .limit(opts.limit)

  switch (opts.filter) {
    case 'top_masters':
      req = req.eq('is_professional', true).eq('user_role', 'professional')
      break
    case 'top_companies':
      req = req.eq('is_professional', true).eq('user_role', 'company')
      break
    case 'public_listable':
    case 'professional':
      req = req.eq('is_professional', true)
      break
    case 'company':
      req = req.eq('user_role', 'company')
      break
    case 'manufacturer':
      req = req.eq('user_role', 'manufacturer')
      break
    case 'commercial_agent':
      req = req.eq('user_role', 'commercial_agent')
      break
    case 'client':
      req = req.eq('is_professional', false)
      break
    case 'premium':
      req = req.eq('is_premium', true)
      break
    case 'verified':
      req = req.eq('is_verified', true)
      break
    case 'hidden':
    case 'deleted':
      // Columns may not exist until SCHEMA_ONLY SQL is applied — return [] quietly.
      return []
    default:
      break
  }

  if (q) {
    const safe = q.replace(/[%(),]/g, ' ').trim()
    if (safe) {
      const parts = [
        `full_name.ilike.%${safe}%`,
        `phone.ilike.%${safe}%`,
        `user_role.ilike.%${safe}%`,
      ]
      if (/^[0-9a-f-]{8,36}$/i.test(safe)) {
        parts.push(`id.eq.${safe}`)
      }
      req = req.or(parts.join(','))
    }
  }

  const { data, error } = await req
  if (error) {
    // Soft-fail search or-filter quirks: retry without text search.
    if (q) {
      const retry = await supabase
        .from('profiles')
        .select(OWNER_PROFILE_SELECT)
        .order('created_at', { ascending: false })
        .limit(opts.limit)
      const { data: data2, error: error2 } = await retry
      if (error2) throw error2
      const needle = q.toLowerCase()
      return ((data2 || []) as OwnerProfileRow[]).filter((r) => {
        const hay = `${r.full_name || ''} ${r.phone || ''} ${r.user_role || ''} ${r.id}`.toLowerCase()
        return hay.includes(needle)
      })
    }
    throw error
  }
  return (data || []) as OwnerProfileRow[]
}

async function rpcSearchProfiles(
  p_query: string,
  p_filter: string,
  p_limit: number,
): Promise<OwnerProfileRow[]> {
  const data = await callRpc<OwnerProfileRow[] | unknown>('admin_search_profiles', {
    p_query,
    p_filter,
    p_limit,
  })
  return parseOwnerSearchRows(data)
}

export async function ownerSearchProfiles(opts: {
  query?: string
  filter?: OwnerProfileFilter
  limit?: number
}): Promise<OwnerProfileRow[]> {
  const requestedFilter = opts.filter ?? 'all'
  const limit = opts.limit ?? OWNER_PROFILE_FETCH_LIMIT
  const query = opts.query ?? ''
  const q = query.trim()

  let rows: OwnerProfileRow[] = []
  let rpcFailed = false

  try {
    rows = await rpcSearchProfiles(q, requestedFilter, limit)
  } catch (e) {
    rpcFailed = true
    const msg = e instanceof Error ? e.message : String(e)
    // Missing RPC / wrong signature → try legacy remapped filter.
    // unauthorized/forbidden → still fall through to table (homepage-visible rows).
    if (!/admin_search_profiles|function|schema cache|does not exist|PGRST202|unauthorized|forbidden/i.test(msg)) {
      throw e
    }
  }

  // Old RPC: unknown filter → successful empty array (not an error). Remap + retry.
  if (
    rows.length === 0 &&
    !rpcFailed &&
    LEGACY_UNKNOWN_FILTERS.has(requestedFilter)
  ) {
    try {
      const legacy = legacyRpcArgs(requestedFilter, query)
      rows = await rpcSearchProfiles(legacy.p_query, legacy.p_filter, limit)
    } catch {
      /* table fallback below */
    }
  }

  // After remap failure / auth assert / empty modern filter: read profiles directly.
  if (rows.length === 0) {
    try {
      rows = await ownerSearchProfilesViaTable({
        query: q,
        filter: requestedFilter,
        limit,
      })
    } catch {
      /* keep rows as-is */
    }
  }

  return postFilterRows(rows, requestedFilter)
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

/** Public count for homepage «Топ компанії» (is_professional + user_role=company). */
export async function fetchPublicTopCompaniesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_professional', true)
    .eq('user_role', 'company')

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
