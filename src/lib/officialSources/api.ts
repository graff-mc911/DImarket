import { supabase } from '../supabase'
import type { VerificationStatus } from './core'

export type OfficialSourceRow = {
  id: string
  source_key: string
  source_name: string
  source_url: string
  source_type: string
  country_code: string
  region: string | null
  jurisdiction: string | null
  official_domain: string | null
  last_checked_at: string | null
  last_changed_at: string | null
  last_success_at: string | null
  next_verification_at: string
  source_hash: string | null
  http_status: number | null
  content_status: string
  verification_status: VerificationStatus
  trust_tier: string
  is_active: boolean
  check_interval_hours: number
}

export type SourceChangeRow = {
  id: string
  source_id: string
  detected_at: string
  old_hash: string | null
  new_hash: string | null
  change_type: string
  change_summary: string | null
  old_excerpt: string | null
  new_excerpt: string | null
  severity: string
  status: string
  official_sources?: Pick<OfficialSourceRow, 'source_name' | 'source_url' | 'country_code'> | null
}

export type LegalDocumentRow = {
  id: string
  doc_key: string
  title: string
  doc_kind: string
  country_code: string
  region: string | null
  jurisdiction: string | null
  primary_source_id: string | null
  verification_status: VerificationStatus
  current_version_id: string | null
  next_verification_at: string
  last_verified_at: string | null
  is_published: boolean
  official_sources?: Pick<
    OfficialSourceRow,
    'source_name' | 'source_url' | 'trust_tier' | 'last_checked_at' | 'verification_status'
  > | null
}

/** Tables land via migration; cast until generated Database types catch up. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function listOfficialSources(): Promise<OfficialSourceRow[]> {
  const { data, error } = await db
    .from('official_sources')
    .select('*')
    .order('country_code')
    .order('source_name')
  if (error) throw error
  return (data ?? []) as OfficialSourceRow[]
}

export async function listSourceChanges(limit = 40): Promise<SourceChangeRow[]> {
  const { data, error } = await db
    .from('source_changes')
    .select(
      'id, source_id, detected_at, old_hash, new_hash, change_type, change_summary, old_excerpt, new_excerpt, severity, status, official_sources(source_name, source_url, country_code)',
    )
    .order('detected_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SourceChangeRow[]
}

export async function listLegalDocuments(): Promise<LegalDocumentRow[]> {
  const { data, error } = await db
    .from('legal_documents')
    .select(
      '*, official_sources(source_name, source_url, trust_tier, last_checked_at, verification_status)',
    )
    .order('country_code')
    .order('title')
  if (error) throw error
  return (data ?? []) as LegalDocumentRow[]
}

export async function updateSourceChangeStatus(
  changeId: string,
  status: 'approved' | 'rejected' | 'published' | 'review_required',
  notes?: string,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await db
    .from('source_changes')
    .update({
      status,
      review_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.user?.id ?? null,
    })
    .eq('id', changeId)
  if (error) throw error
}

export async function invokeOfficialSourcesMonitor(action: 'cron_run' | 'status' | 'check_now') {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/official-sources-monitor`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({ action }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.error ?? `Monitor failed (${res.status})`)
  }
  return body
}
