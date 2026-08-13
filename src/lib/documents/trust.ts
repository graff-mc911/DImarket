/**
 * Honest verification mapping for Documents & Procedures.
 * Static catalog seed dates must NEVER appear as lastVerified.
 */

import type { VerificationStatus } from '../officialSources/core'
import type { DocumentRecord } from './types'

/** Map catalog status → OSM verification status for freshness UI. */
export function documentVerificationStatus(doc: DocumentRecord): VerificationStatus {
  if (doc.lastVerified) return 'verified'
  if (doc.status === 'outdated') return 'outdated'
  if (doc.status === 'under_review' || doc.templateNeedsLegalReview) return 'needs_review'
  return 'needs_research'
}
