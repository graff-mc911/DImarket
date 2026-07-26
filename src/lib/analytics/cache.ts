type Entry<T> = { at: number; value: T }

const store = new Map<string, Entry<unknown>>()
const DEFAULT_TTL_MS = 60_000

export function analyticsCacheGet<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const hit = store.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > ttlMs) {
    store.delete(key)
    return null
  }
  return hit.value as T
}

export function analyticsCacheSet<T>(key: string, value: T): void {
  store.set(key, { at: Date.now(), value })
}

export function analyticsCacheInvalidate(prefix?: string): void {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
