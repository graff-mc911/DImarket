import { MAX_COMPARE } from './types'

const STORAGE_KEY = 'dimarket_compare_pro_ids'
const EVENT = 'dimarket:compare-changed'

function readIds(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(String).filter(Boolean).slice(0, MAX_COMPARE)
  } catch {
    return []
  }
}

function writeIds(ids: string[]) {
  const next = [...new Set(ids)].slice(0, MAX_COMPARE)
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
  }
  return next
}

export function getCompareIds(): string[] {
  return readIds()
}

export function isInCompare(id: string): boolean {
  return readIds().includes(id)
}

export function addToCompare(id: string): { ids: string[]; ok: boolean; reason?: string } {
  const ids = readIds()
  if (ids.includes(id)) return { ids, ok: true }
  if (ids.length >= MAX_COMPARE) {
    return { ids, ok: false, reason: `You can compare up to ${MAX_COMPARE} professionals.` }
  }
  return { ids: writeIds([...ids, id]), ok: true }
}

export function removeFromCompare(id: string): string[] {
  return writeIds(readIds().filter((x) => x !== id))
}

export function toggleCompare(id: string): {
  ids: string[]
  added: boolean
  ok: boolean
  reason?: string
} {
  if (isInCompare(id)) {
    return { ids: removeFromCompare(id), added: false, ok: true }
  }
  const res = addToCompare(id)
  return { ids: res.ids, added: res.ok, ok: res.ok, reason: res.reason }
}

export function clearCompare(): void {
  writeIds([])
}

export function setCompareIds(ids: string[]): string[] {
  return writeIds(ids)
}

export function subscribeCompare(listener: (ids: string[]) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener(readIds())
  }
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<string[]>).detail
    listener(Array.isArray(detail) ? detail : readIds())
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(EVENT, onCustom as EventListener)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(EVENT, onCustom as EventListener)
  }
}
