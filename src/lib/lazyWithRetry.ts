import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  clearChunkReloadFlag,
  isChunkLoadError,
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
      if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
        // Hold suspense open while the page reloads.
        return new Promise(() => {})
      }
      throw error
    }
  })
}
