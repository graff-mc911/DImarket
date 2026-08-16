/**
 * Enrich static Documents & Procedures records with live OSM freshness
 * from legal_documents (when seeded / linked).
 */

import { supabase } from '../supabase'
import type { VerificationStatus } from '../officialSources/core'
import type { DocumentRecord } from './types'
import { documentsOsmDocKey } from './osmKeys'

// OSM tables may not yet be in generated Database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type OsmFreshnessRow = {
  id: string
  doc_key: string
  verification_status: VerificationStatus
  last_verified_at: string | null
  next_verification_at: string | null
  is_published: boolean
  official_sources?: {
    source_name: string | null
    source_url: string | null
    last_checked_at: string | null
    verification_status: string | null
  } | null
}

export async function fetchOsmFreshnessByDocKey(
  docKey: string,
): Promise<OsmFreshnessRow | null> {
  const { data, error } = await db
    .from('legal_documents')
    .select(
      'id, doc_key, verification_status, last_verified_at, next_verification_at, is_published, official_sources(source_name, source_url, last_checked_at, verification_status)',
    )
    .eq('doc_key', docKey)
    .maybeSingle()
  if (error || !data) return null
  return data as OsmFreshnessRow
}

/** Overlay OSM verification onto a catalog document (never invents verified). */
export async function enrichDocumentWithOsm(doc: DocumentRecord): Promise<DocumentRecord> {
  const osmDocKey = doc.osmDocKey || documentsOsmDocKey(doc.countryCode, doc.slug)
  try {
    const row = await fetchOsmFreshnessByDocKey(osmDocKey)
    if (!row) {
      return { ...doc, osmDocKey }
    }
    const sourceChecked = row.official_sources?.last_checked_at ?? null
    const lastVerified =
      row.verification_status === 'verified'
        ? row.last_verified_at ?? sourceChecked
        : null
    return {
      ...doc,
      osmDocKey,
      legalDocumentId: row.id,
      osmVerificationStatus: row.verification_status,
      osmNextVerificationAt: row.next_verification_at,
      lastVerified,
      status:
        row.verification_status === 'outdated' || row.verification_status === 'unavailable'
          ? 'outdated'
          : row.verification_status === 'verified' && row.is_published
            ? 'active'
            : 'under_review',
      source:
        row.official_sources?.source_url
          ? {
              name: row.official_sources.source_name || doc.source.name,
              url: row.official_sources.source_url,
              lastVerified,
            }
          : doc.source,
    }
  } catch {
    return { ...doc, osmDocKey }
  }
}
