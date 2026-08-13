/** Shared visibility helpers for public ad display. */

const OWNER_CANCEL_NOTE_RE =
  /(відхилено|скасовано|rejected|cancelled|canceled|owner_cancelled|вимкнен)/i

export function isOwnerCancelledReviewNote(reviewNote: string | null | undefined): boolean {
  return OWNER_CANCEL_NOTE_RE.test(reviewNote || '')
}

export function stripOwnerCancelReviewTail(reviewNote: string | null | undefined): string | null {
  const raw = (reviewNote || '').replace(/^owner_managed:?\s*/i, '').trim()
  if (!raw) return null
  if (OWNER_CANCEL_NOTE_RE.test(raw)) return null
  return raw
}
