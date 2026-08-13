import { supabase } from '../supabase'
import { createNotification } from '../notifications/notifications'
import { slugifyCommercial } from './slug'
import { normalizeSpokenLanguageCode, spokenLanguageFilterVariants } from '../languageDisplay'
import type {
  AgentProfile,
  AgentInvitation,
  CommercialSearchFilters,
  ManufacturerProfile,
  RepresentationApplication,
  RepresentationOpportunity,
  ReportReason,
} from './types'

const MFR_SELECT = '*'
const AGENT_SELECT = '*'
const OPP_SELECT = '*, manufacturer:manufacturer_profiles(*)'

function applyLanguageContains(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  column: string,
  language: string | null | undefined,
) {
  const variants = spokenLanguageFilterVariants(language)
  if (!variants.length) return q
  // PostgREST: match any legacy Ukrainian tag (UA/UK/uk/ua)
  return q.or(variants.map((v) => `${column}.cs.{"${v}"}`).join(','))
}

function applyTextFilter<T extends { or?: (f: string) => T; ilike?: (c: string, v: string) => T }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  query: string,
  columns: string[],
) {
  const t = query.trim()
  if (!t) return q
  const pattern = `%${t}%`
  return q.or(columns.map((c) => `${c}.ilike.${pattern}`).join(','))
}

export async function fetchManufacturers(
  filters: CommercialSearchFilters,
  limit = 40,
): Promise<ManufacturerProfile[]> {
  let q = supabase
    .from('manufacturer_profiles')
    .select(MFR_SELECT)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(limit)

  q = applyTextFilter(q, filters.query, ['company_name', 'description', 'headquarters'])
  if (filters.country) q = q.eq('country', filters.country)
  if (filters.category) q = q.contains('categories', [filters.category])
  if (filters.language) q = applyLanguageContains(q, 'languages', filters.language)
  if (filters.verifiedOnly) q = q.eq('verification_status', 'verified')
  if (filters.exclusive === 'exclusive') q = q.eq('exclusive_representation', true)
  if (filters.exclusive === 'non_exclusive') q = q.eq('non_exclusive_representation', true)
  if (filters.minExperience != null) q = q.lte('minimum_experience_years', filters.minExperience)

  const { data, error } = await q
  if (error) {
    console.error('fetchManufacturers', error)
    return []
  }
  return (data ?? []) as ManufacturerProfile[]
}

export async function fetchAgents(
  filters: CommercialSearchFilters,
  limit = 40,
): Promise<AgentProfile[]> {
  let q = supabase
    .from('agent_profiles')
    .select(AGENT_SELECT)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(limit)

  q = applyTextFilter(q, filters.query, ['full_name', 'company_name', 'description', 'city'])
  if (filters.country) q = q.eq('country', filters.country)
  if (filters.category) q = q.contains('categories', [filters.category])
  if (filters.language) q = applyLanguageContains(q, 'languages', filters.language)
  if (filters.verifiedOnly) q = q.eq('verification_status', 'verified')
  if (filters.availableOnly) q = q.eq('available_for_new_brands', true)
  if (filters.minExperience != null) q = q.gte('years_experience', filters.minExperience)

  const { data, error } = await q
  if (error) {
    console.error('fetchAgents', error)
    return []
  }
  return (data ?? []) as AgentProfile[]
}

export async function fetchOpportunities(
  filters: CommercialSearchFilters,
  limit = 40,
): Promise<RepresentationOpportunity[]> {
  let q = supabase
    .from('representation_opportunities')
    .select(OPP_SELECT)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(limit)

  q = applyTextFilter(q, filters.query, ['title', 'description'])
  if (filters.country) q = q.eq('target_country', filters.country)
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.language) q = applyLanguageContains(q, 'required_languages', filters.language)
  if (filters.exclusive === 'exclusive') q = q.eq('exclusive', true)
  if (filters.exclusive === 'non_exclusive') q = q.eq('exclusive', false)
  if (filters.remote === 'remote') q = q.eq('remote_possible', true)
  if (filters.remote === 'local') q = q.eq('travel_required', true)

  const { data, error } = await q
  if (error) {
    console.error('fetchOpportunities', error)
    return []
  }
  return (data ?? []) as RepresentationOpportunity[]
}

export async function fetchManufacturerBySlug(slug: string): Promise<ManufacturerProfile | null> {
  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .select(MFR_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('fetchManufacturerBySlug', error)
    return null
  }
  return data as ManufacturerProfile | null
}

export async function fetchAgentBySlug(slug: string): Promise<AgentProfile | null> {
  const { data, error } = await supabase
    .from('agent_profiles')
    .select(AGENT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('fetchAgentBySlug', error)
    return null
  }
  return data as AgentProfile | null
}

export async function fetchOpportunityById(id: string): Promise<RepresentationOpportunity | null> {
  const { data, error } = await supabase
    .from('representation_opportunities')
    .select(OPP_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('fetchOpportunityById', error)
    return null
  }
  return data as RepresentationOpportunity | null
}

export async function fetchMyManufacturer(profileId: string): Promise<ManufacturerProfile | null> {
  const { data } = await supabase
    .from('manufacturer_profiles')
    .select(MFR_SELECT)
    .eq('profile_id', profileId)
    .maybeSingle()
  return (data as ManufacturerProfile | null) ?? null
}

export async function fetchMyAgent(profileId: string): Promise<AgentProfile | null> {
  const { data } = await supabase
    .from('agent_profiles')
    .select(AGENT_SELECT)
    .eq('profile_id', profileId)
    .maybeSingle()
  return (data as AgentProfile | null) ?? null
}

export async function upsertManufacturerProfile(
  profileId: string,
  patch: Partial<ManufacturerProfile> & { company_name: string },
): Promise<{ row: ManufacturerProfile | null; error: string | null }> {
  const existing = await fetchMyManufacturer(profileId)
  const payload = {
    ...patch,
    profile_id: profileId,
    slug: existing?.slug ?? slugifyCommercial(patch.company_name),
    updated_at: new Date().toISOString(),
    ...(patch.languages
      ? { languages: patch.languages.map(normalizeSpokenLanguageCode).filter(Boolean) }
      : {}),
  }
  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .upsert(payload, { onConflict: 'profile_id' })
    .select(MFR_SELECT)
    .single()
  if (error) return { row: null, error: error.message }
  return { row: data as ManufacturerProfile, error: null }
}

export async function upsertAgentProfile(
  profileId: string,
  patch: Partial<AgentProfile> & { full_name: string },
): Promise<{ row: AgentProfile | null; error: string | null }> {
  const existing = await fetchMyAgent(profileId)
  const payload = {
    ...patch,
    profile_id: profileId,
    slug: existing?.slug ?? slugifyCommercial(patch.full_name),
    updated_at: new Date().toISOString(),
    ...(patch.languages
      ? { languages: patch.languages.map(normalizeSpokenLanguageCode).filter(Boolean) }
      : {}),
  }
  const { data, error } = await supabase
    .from('agent_profiles')
    .upsert(payload, { onConflict: 'profile_id' })
    .select(AGENT_SELECT)
    .single()
  if (error) return { row: null, error: error.message }
  return { row: data as AgentProfile, error: null }
}

export async function createOpportunity(
  manufacturerId: string,
  input: Partial<RepresentationOpportunity> & { title: string },
): Promise<{ row: RepresentationOpportunity | null; error: string | null }> {
  const { data, error } = await supabase
    .from('representation_opportunities')
    .insert({
      manufacturer_id: manufacturerId,
      title: input.title,
      description: input.description ?? '',
      category: input.category ?? null,
      products: input.products ?? [],
      target_country: input.target_country ?? null,
      target_regions: input.target_regions ?? [],
      target_customer_types: input.target_customer_types ?? [],
      required_experience: input.required_experience ?? null,
      required_languages: (input.required_languages ?? [])
        .map(normalizeSpokenLanguageCode)
        .filter(Boolean),
      commission_type: input.commission_type ?? null,
      commission_range: input.commission_range ?? null,
      exclusive: input.exclusive ?? false,
      contract_type: input.contract_type ?? null,
      travel_required: input.travel_required ?? false,
      remote_possible: input.remote_possible ?? true,
      minimum_requirements: input.minimum_requirements ?? null,
      application_deadline: input.application_deadline ?? null,
      status: input.status ?? 'published',
    })
    .select(OPP_SELECT)
    .single()
  if (error) return { row: null, error: error.message }
  return { row: data as RepresentationOpportunity, error: null }
}

export async function applyToOpportunity(input: {
  opportunityId: string
  agentId: string
  manufacturerId: string
  message: string
  manufacturerProfileId: string
}): Promise<{ row: RepresentationApplication | null; error: string | null }> {
  const { data, error } = await supabase
    .from('representation_applications')
    .insert({
      opportunity_id: input.opportunityId,
      agent_id: input.agentId,
      manufacturer_id: input.manufacturerId,
      message: input.message,
      status: 'pending',
    })
    .select('*')
    .single()
  if (error) return { row: null, error: error.message }

  await createNotification({
    userId: input.manufacturerProfileId,
    type: 'match',
    title: 'New representation application',
    body: 'A commercial agent applied to your opportunity.',
    linkPath: '/commercial-agents/dashboard',
    referenceType: 'representation_application',
    referenceId: data.id,
  })
  await trackCommercialEvent('application_sent', input.agentId, 'opportunity', input.opportunityId)

  return { row: data as RepresentationApplication, error: null }
}

export async function inviteAgent(input: {
  manufacturerId: string
  agentId: string
  agentProfileId: string
  opportunityId?: string | null
  message: string
}): Promise<{ row: AgentInvitation | null; error: string | null }> {
  const { data, error } = await supabase
    .from('agent_invitations')
    .insert({
      manufacturer_id: input.manufacturerId,
      agent_id: input.agentId,
      opportunity_id: input.opportunityId ?? null,
      message: input.message,
      status: 'pending',
    })
    .select('*')
    .single()
  if (error) return { row: null, error: error.message }

  await createNotification({
    userId: input.agentProfileId,
    type: 'match',
    title: 'New manufacturer invitation',
    body: 'A manufacturer invited you to represent their brand.',
    linkPath: '/commercial-agents/dashboard',
    referenceType: 'agent_invitation',
    referenceId: data.id,
  })
  await trackCommercialEvent('invitation_sent', null, 'agent', input.agentId)

  return { row: data as AgentInvitation, error: null }
}

export async function updateApplicationStatus(
  id: string,
  status: RepresentationApplication['status'],
  notifyUserId?: string | null,
): Promise<boolean> {
  const { error } = await supabase
    .from('representation_applications')
    .update({ status })
    .eq('id', id)
  if (error) {
    console.error('updateApplicationStatus', error)
    return false
  }
  if (notifyUserId) {
    const title =
      status === 'accepted'
        ? 'Application accepted'
        : status === 'rejected'
          ? 'Application rejected'
          : status === 'viewed'
            ? 'Application viewed'
            : 'Application updated'
    await createNotification({
      userId: notifyUserId,
      type: 'match',
      title,
      body: `Your representation application is now: ${status}.`,
      linkPath: '/commercial-agents/dashboard',
      referenceType: 'representation_application',
      referenceId: id,
    })
  }
  return true
}

export async function updateInvitationStatus(
  id: string,
  status: AgentInvitation['status'],
  notifyUserId?: string | null,
): Promise<boolean> {
  const { error } = await supabase.from('agent_invitations').update({ status }).eq('id', id)
  if (error) {
    console.error('updateInvitationStatus', error)
    return false
  }
  if (notifyUserId && (status === 'accepted' || status === 'declined')) {
    await createNotification({
      userId: notifyUserId,
      type: 'match',
      title: status === 'accepted' ? 'Invitation accepted' : 'Invitation declined',
      body: `An agent ${status} your invitation.`,
      linkPath: '/commercial-agents/dashboard',
      referenceType: 'agent_invitation',
      referenceId: id,
    })
  }
  return true
}

export async function fetchMyApplicationsAsAgent(agentId: string) {
  const { data } = await supabase
    .from('representation_applications')
    .select('*, opportunity:representation_opportunities(*)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function fetchApplicationsForManufacturer(manufacturerId: string) {
  const { data } = await supabase
    .from('representation_applications')
    .select('*, agent:agent_profiles(*), opportunity:representation_opportunities(*)')
    .eq('manufacturer_id', manufacturerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function fetchInvitationsForAgent(agentId: string) {
  const { data } = await supabase
    .from('agent_invitations')
    .select('*, manufacturer:manufacturer_profiles(*)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function fetchInvitationsForManufacturer(manufacturerId: string) {
  const { data } = await supabase
    .from('agent_invitations')
    .select('*, agent:agent_profiles(*)')
    .eq('manufacturer_id', manufacturerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function fetchOpportunitiesForManufacturer(manufacturerId: string) {
  const { data } = await supabase
    .from('representation_opportunities')
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .order('updated_at', { ascending: false })
  return (data ?? []) as RepresentationOpportunity[]
}

export async function toggleCommercialFavorite(
  userId: string,
  itemType: 'manufacturer' | 'agent' | 'opportunity',
  itemId: string,
  currentlySaved: boolean,
): Promise<boolean> {
  if (currentlySaved) {
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
    return !error
  }
  const { error } = await supabase.from('saved_items').insert({
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
  })
  if (!error) await trackCommercialEvent('favorite_added', userId, itemType, itemId)
  return !error
}

export async function isCommercialFavorite(
  userId: string,
  itemType: 'manufacturer' | 'agent' | 'opportunity',
  itemId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle()
  return Boolean(data)
}

export async function reportCommercialEntity(input: {
  reporterId: string
  entityType: 'manufacturer' | 'agent' | 'opportunity' | 'message'
  entityId: string
  reason: ReportReason
  details?: string
}): Promise<boolean> {
  const { error } = await supabase.from('commercial_entity_reports').insert({
    reporter_id: input.reporterId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    reason: input.reason,
    details: input.details ?? '',
  })
  return !error
}

export async function setVerificationStatus(
  table: 'manufacturer_profiles' | 'agent_profiles',
  id: string,
  status: 'unverified' | 'pending' | 'verified' | 'rejected',
): Promise<{ ok: boolean; error?: string }> {
  const payload: Record<string, unknown> = {
    verification_status: status,
    updated_at: new Date().toISOString(),
  }
  // Rejected profiles must leave public search / map immediately.
  if (status === 'rejected') payload.is_published = false
  if (status === 'verified') payload.is_published = true

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .select('id')

  if (error) {
    // Production may not have 'rejected' in CHECK yet — soft-reject via unpublish.
    if (status === 'rejected') {
      const { data: soft, error: softErr } = await supabase
        .from(table)
        .update({
          is_published: false,
          verification_status: 'unverified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id')
      if (softErr) return { ok: false, error: softErr.message }
      if (!soft?.length) return { ok: false, error: 'update_blocked' }
      return { ok: true, error: 'soft_rejected_unpublish_only' }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.length) return { ok: false, error: 'update_blocked' }
  return { ok: true }
}

export type OwnerDeleteCommercialResult = {
  ok: boolean
  error?: string
  profileId?: string | null
  authDeleted?: boolean
  raw?: unknown
}

/** Owner moderation delete: RPC cleanup + optional auth.users via edge function. */
export async function ownerDeleteCommercialEntity(input: {
  kind: 'agent' | 'manufacturer'
  id: string
  deleteAuth?: boolean
  profileId?: string | null
}): Promise<OwnerDeleteCommercialResult> {
  const deleteAuth = input.deleteAuth !== false

  const { data, error } = await supabase.rpc('owner_delete_commercial_entity', {
    p_kind: input.kind,
    p_id: input.id,
    p_delete_auth: deleteAuth,
  })

  let profileId = input.profileId ?? null
  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>
    if (row.ok === false) {
      return { ok: false, error: String(row.error || 'rpc_failed'), raw: data }
    }
    if (typeof row.profile_id === 'string') profileId = row.profile_id
  }

  // Fallback when RPC not yet applied: direct delete (owner RLS).
  if (error) {
    const table = input.kind === 'manufacturer' ? 'manufacturer_profiles' : 'agent_profiles'
    const { data: deleted, error: delErr } = await supabase
      .from(table)
      .delete()
      .eq('id', input.id)
      .select('id, profile_id')
    if (delErr) return { ok: false, error: delErr.message }
    if (!deleted?.length) {
      return {
        ok: false,
        error:
          error.message ||
          'delete_blocked — apply APPLY_CA_OWNER_MODERATION.sql and ensure is_site_owner',
      }
    }
    profileId = (deleted[0] as { profile_id?: string }).profile_id ?? profileId
  }

  let authDeleted = false
  if (deleteAuth && profileId) {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (token) {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        'admin-delete-commercial-entity',
        {
          body: {
            kind: input.kind,
            id: input.id,
            profileId,
            deleteAuth: true,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (!fnErr && fnData && typeof fnData === 'object' && (fnData as { authDeleted?: boolean }).authDeleted) {
        authDeleted = true
      }
    }
  }

  return { ok: true, profileId, authDeleted, raw: data }
}

export async function trackCommercialEvent(
  eventName: string,
  actorId: string | null,
  entityType?: string | null,
  entityId?: string | null,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from('commercial_analytics_events').insert({
      event_name: eventName,
      actor_id: actorId,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      meta,
    })
  } catch {
    /* non-blocking */
  }
}

export function openCommercialMessage(otherProfileId: string) {
  sessionStorage.setItem('conversation_with', otherProfileId)
  sessionStorage.removeItem('conversation_listing')
}

/** Detect whether CA tables exist on the linked Supabase project. */
export async function probeCommercialAgentsReady(): Promise<
  'ready' | 'missing_schema' | 'error'
> {
  const { error } = await supabase.from('manufacturer_profiles').select('id').limit(1)
  if (!error) return 'ready'
  const code = (error as { code?: string }).code || ''
  const msg = error.message || ''
  if (code === 'PGRST205' || /could not find the table/i.test(msg)) return 'missing_schema'
  if (code === '42501' || /permission denied/i.test(msg)) return 'ready'
  console.error('probeCommercialAgentsReady', error)
  return 'error'
}
