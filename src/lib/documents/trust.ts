/**
 * Honest verification mapping for Documents & Procedures.
 * Static catalog seed dates must NEVER appear as lastVerified.
 * Prefer live OSM status when enrichDocumentWithOsm() has run.
 */

import type { VerificationStatus } from '../officialSources/core'
import type { DocumentRecord, DocumentStatus } from './types'

/** Map catalog status → OSM verification status for freshness UI. */
export function documentVerificationStatus(doc: DocumentRecord): VerificationStatus {
  if (doc.osmVerificationStatus) {
    const s = doc.osmVerificationStatus as VerificationStatus
    return s
  }
  if (doc.lastVerified) return 'verified'
  if (doc.status === 'outdated') return 'outdated'
  if (doc.status === 'under_review' || doc.templateNeedsLegalReview) return 'needs_review'
  return 'needs_research'
}

/**
 * Status label for lists/detail — never show "active" without a real verification date
 * or OSM verified overlay.
 */
export function honestDocumentStatus(doc: DocumentRecord): DocumentStatus {
  if (doc.status === 'outdated') return 'outdated'
  if (doc.osmVerificationStatus === 'outdated' || doc.osmVerificationStatus === 'unavailable') {
    return 'outdated'
  }
  if (
    doc.osmVerificationStatus === 'verified' &&
    doc.lastVerified &&
    doc.status === 'active'
  ) {
    return 'active'
  }
  if (doc.lastVerified && doc.status === 'active' && !doc.osmVerificationStatus) {
    return 'active'
  }
  return 'under_review'
}
