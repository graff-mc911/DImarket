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
  alert_sent_at?: string | null
  email_alert_sent_at?: string | null
  webhook_alert_sent_at?: string | null
  official_sources?: Pick<OfficialSourceRow, 'source_name' | 'source_url' | 'country_code'> | null
}

export type DocumentVersionRow = {
  id: string
  document_id: string
  version_number: string
  title: string
  body_markdown: string | null
  body_html: string | null
  source_id: string | null
  source_url: string | null
  published_at: string | null
  effective_from: string | null
  effective_until: string | null
  verified_at: string | null
  status: string
  change_summary: string | null
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
  document_versions?: DocumentVersionRow[]
}

export type PublishedLegalDocument = LegalDocumentRow & {
  current_version?: DocumentVersionRow | null
}

/** Tables land via migration; cast until generated Database types catch up. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type MonitorAction =
  | 'cron_run'
  | 'status'
  | 'check_now'
  | 'publish_version'
  | 'rollback_version'
  | 'create_draft_version'
  | 'update_draft_version'
  | 'weekly_digest'

async function callMonitor(
  action: MonitorAction,
  payload?: Record<string, unknown>,
): Promise<unknown> {
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
    body: JSON.stringify({ action, payload }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.error ?? `Monitor failed (${res.status})`)
  }
  return body
}

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
      'id, source_id, detected_at, old_hash, new_hash, change_type, change_summary, old_excerpt, new_excerpt, severity, status, alert_sent_at, email_alert_sent_at, webhook_alert_sent_at, official_sources(source_name, source_url, country_code)',
    )
    .order('detected_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SourceChangeRow[]
}

export async function listLegalDocuments(includeVersions = false): Promise<LegalDocumentRow[]> {
  const select = includeVersions
    ? '*, official_sources(source_name, source_url, trust_tier, last_checked_at, verification_status), document_versions(id, version_number, title, status, body_markdown, effective_from, effective_until, published_at, verified_at, change_summary, source_url)'
    : '*, official_sources(source_name, source_url, trust_tier, last_checked_at, verification_status)'
  const { data, error } = await db.from('legal_documents').select(select).order('country_code').order('title')
  if (error) throw error
  return (data ?? []) as LegalDocumentRow[]
}

export async function listPublishedLegalDocuments(): Promise<PublishedLegalDocument[]> {
  const { data, error } = await db
    .from('legal_documents')
    .select(
      '*, official_sources(source_name, source_url, trust_tier, last_checked_at, verification_status)',
    )
    .eq('is_published', true)
    .order('country_code')
    .order('title')
  if (error) throw error

  const rows = (data ?? []) as LegalDocumentRow[]
  const enriched: PublishedLegalDocument[] = []

  for (const doc of rows) {
    const { data: versions } = await db
      .from('document_versions')
      .select('*')
      .eq('document_id', doc.id)
      .in('status', ['published', 'superseded'])
    const list = (versions ?? []) as DocumentVersionRow[]
    const current =
      list.find((v) => v.id === doc.current_version_id) ??
      list.find((v) => v.status === 'published') ??
      null
    enriched.push({ ...doc, current_version: current })
  }
  return enriched
}

export async function getPublishedLegalDocument(docKey: string): Promise<PublishedLegalDocument | null> {
  const { data, error } = await db
    .from('legal_documents')
    .select(
      '*, official_sources(source_name, source_url, trust_tier, last_checked_at, verification_status)',
    )
    .eq('doc_key', docKey)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const doc = data as LegalDocumentRow
  const { data: versions } = await db
    .from('document_versions')
    .select('*')
    .eq('document_id', doc.id)
    .order('published_at', { ascending: false })

  const list = (versions ?? []) as DocumentVersionRow[]
  const current =
    list.find((v) => v.id === doc.current_version_id) ??
    list.find((v) => v.status === 'published') ??
    null

  return { ...doc, document_versions: list, current_version: current }
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

export async function invokeOfficialSourcesMonitor(
  action: 'cron_run' | 'status' | 'check_now' | 'weekly_digest',
) {
  return callMonitor(action)
}

export async function publishDocumentVersion(versionId: string) {
  return callMonitor('publish_version', { versionId })
}

export async function rollbackDocumentVersion(versionId: string) {
  return callMonitor('rollback_version', { versionId })
}

export async function createDocumentDraftVersion(input: {
  documentId: string
  versionNumber: string
  bodyMarkdown: string
  effectiveFrom?: string | null
  changeSummary?: string
}) {
  return callMonitor('create_draft_version', input)
}

export async function updateDocumentDraftVersion(input: {
  versionId: string
  bodyMarkdown: string
  changeSummary?: string
  effectiveFrom?: string | null
}) {
  return callMonitor('update_draft_version', input)
}
