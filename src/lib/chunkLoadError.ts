/** Detect Vite/Webpack dynamic-import failures after a deploy (stale hashed chunks). */

export const CHUNK_RELOAD_KEY = 'dimarket:chunk-reload'
const CHUNK_SW_CLEARED_KEY = 'dimarket:chunk-sw-cleared'
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

/**
 * Chrome: a service worker + HTTP cache can pin HTML (or an aborted import)
 * to a hashed /assets/*.js URL. Reload alone does not help. Drop SW + Cache
 * Storage, then reload. HTTP disk cache for that exact filename still needs
 * a new Vite hash from deploy.
 */
export async function recoverFromStaleChunks(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(CHUNK_SW_CLEARED_KEY) === '1') return false
    sessionStorage.setItem(CHUNK_SW_CLEARED_KEY, '1')
  } catch {
    if (window.location.search.includes('chunk_sw=1')) return false
  }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((reg) => reg.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    /* still reload */
  }

  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    /* ignore */
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('chunk_reload')
  url.searchParams.set('chunk_sw', '1')
  window.location.replace(url.pathname + url.search + url.hash)
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
  if (typeof window !== 'undefined' && window.location.search.includes('chunk_sw=')) {
    const url = new URL(window.location.href)
    url.searchParams.delete('chunk_sw')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }
}
