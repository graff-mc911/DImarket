/** Detect Vite/Webpack dynamic-import failures after a deploy (stale hashed chunks). */

export const CHUNK_RELOAD_KEY = 'dimarket:chunk-reload'

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

/** One-shot full reload so the browser picks up the latest index + asset hashes. */
export function reloadOnceForStaleChunk(): boolean {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false
  }
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
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

export function clearChunkReloadFlag(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.location.search.includes('chunk_reload=')) {
    const url = new URL(window.location.href)
    url.searchParams.delete('chunk_reload')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }
}
