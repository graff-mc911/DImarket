import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  clearChunkReloadFlag,
  isChunkLoadError,
  recoverFromStaleChunks,
  reloadOnceForStaleChunk,
} from './chunkLoadError'

/**
 * React.lazy wrapper that recovers from stale deploy chunks with a one-time reload.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory()
      clearChunkReloadFlag()
      return mod
    } catch (error) {
      if (!isChunkLoadError(error)) throw error
      if (reloadOnceForStaleChunk()) {
        return new Promise(() => {})
      }
      const started = await recoverFromStaleChunks()
      if (started) return new Promise(() => {})
      throw error
    }
  })
}
