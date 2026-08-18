/** Detect Vite/Webpack dynamic-import failures after a deploy (stale hashed chunks). */

export const CHUNK_RELOAD_KEY = 'dimarket:chunk-reload'
const RELOAD_COOLDOWN_MS = 60_000

export function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  const name = error instanceof Error ? error.name : ''
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Loading CSS chunk [\w-]+ failed/i.test(msg) ||
    name === 'ChunkLoadError'
  )
}

function recentlyReloaded(raw: string | null): boolean {
  if (!raw) return false
  if (raw === '1') return true
  const ts = Number(raw)
  return Number.isFinite(ts) && Date.now() - ts < RELOAD_COOLDOWN_MS
}

/** One-shot full reload so the browser picks up the latest index + asset hashes. */
export function reloadOnceForStaleChunk(): boolean {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false
  }
  try {
    if (recentlyReloaded(sessionStorage.getItem(CHUNK_RELOAD_KEY))) return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    // Private mode / blocked storage — still attempt reload once via URL marker.
    if (window.location.search.includes('chunk_reload=1')) return false
    const url = new URL(window.location.href)
    url.searchParams.set('chunk_reload', '1')
    window.location.replace(url.toString())
    return true
  }
  window.location.reload()
  return true
}

/** Drop the URL marker only. Keep the session cooldown so a later successful
 *  locale/chunk import cannot clear the flag and start an infinite reload. */
export function clearChunkReloadFlag(): void {
  if (typeof window !== 'undefined' && window.location.search.includes('chunk_reload=')) {
    const url = new URL(window.location.href)
    url.searchParams.delete('chunk_reload')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }
}
