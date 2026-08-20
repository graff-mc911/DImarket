import {
  EMPTY_BZ_QUOTE,
  type BzQuoteDraft,
  type BzQuoteScreen,
} from './buildzoomQuoteFlow'

const SESSION_KEY = 'dimarket_bz_quote_session'
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

export type BzQuoteSession = {
  screen: BzQuoteScreen
  farthest: BzQuoteScreen
  draft: BzQuoteDraft
  savedAt: number
}

export function loadQuoteSession(): BzQuoteSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BzQuoteSession
    if (!parsed?.draft || !parsed.screen) return null
    if (Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) {
      clearQuoteSession()
      return null
    }
    return {
      screen: parsed.screen,
      farthest: parsed.farthest || parsed.screen,
      draft: { ...EMPTY_BZ_QUOTE, ...parsed.draft },
      savedAt: parsed.savedAt,
    }
  } catch {
    return null
  }
}

export function saveQuoteSession(session: Omit<BzQuoteSession, 'savedAt'>) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...session, savedAt: Date.now() } satisfies BzQuoteSession),
    )
  } catch {
    /* ignore quota */
  }
}

export function clearQuoteSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}
