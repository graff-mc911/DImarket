import { useCallback, useState } from 'react'
import {
  collectUrlsFromSlotEntry,
  deleteAdMediaUrls,
  mediaTypeFromFile,
  uploadAdMediaFileSafe,
} from '../lib/adMediaStorage'
import { DEFAULT_AD_MEDIA_STYLE } from '../lib/adMediaStyle'
import {
  emptySlotMediaEntry,
  normalizeSlotMediaEntry,
  slotMediaEntryHasMedia,
  type SlotMediaEntry,
  type SlotMediaMap,
} from '../lib/adSlotMedia'

export type SlotUploadErrorCode = 'occupied' | 'upload'

export class SlotMediaUploadError extends Error {
  code: SlotUploadErrorCode
  constructor(code: SlotUploadErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

type UseSlotMediaUploadOptions = {
  slotMediaRef: React.MutableRefObject<SlotMediaMap>
  onSlotMediaChange: (next: SlotMediaMap) => void
  uploadErrorFallback: string
}

export function useSlotMediaUpload({
  slotMediaRef,
  onSlotMediaChange,
  uploadErrorFallback,
}: UseSlotMediaUploadOptions) {
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const commitSlot = useCallback(
    (slotId: string, entry: SlotMediaEntry) => {
      onSlotMediaChange({
        ...slotMediaRef.current,
        [slotId]: normalizeSlotMediaEntry(entry),
      })
    },
    [onSlotMediaChange, slotMediaRef],
  )

  const entryFor = useCallback(
    (slotId: string) =>
      normalizeSlotMediaEntry(slotMediaRef.current[slotId] ?? emptySlotMediaEntry()),
    [slotMediaRef],
  )

  const clearSlot = useCallback(
    async (slotId: string) => {
      const prev = entryFor(slotId)
      const urls = collectUrlsFromSlotEntry(prev)
      commitSlot(slotId, emptySlotMediaEntry())
      setLastError(null)
      if (urls.length) await deleteAdMediaUrls(urls)
    },
    [commitSlot, entryFor],
  )

  const uploadToSlot = useCallback(
    async (slotId: string, file: File, options?: { replace?: boolean }) => {
      const replace = options?.replace === true
      const prev = entryFor(slotId)
      const occupied = slotMediaEntryHasMedia(prev)

      if (occupied && !replace) {
        throw new SlotMediaUploadError('occupied', 'SLOT_OCCUPIED')
      }

      const oldUrls = occupied ? collectUrlsFromSlotEntry(prev) : []

      setUploadingSlotId(slotId)
      setLastError(null)

      try {
        const url = await uploadAdMediaFileSafe(file, uploadErrorFallback)
        const mediaType = mediaTypeFromFile(file)

        commitSlot(slotId, {
          mediaUrl: url,
          mediaType,
          slideUrls: [url],
          mediaStyle: occupied
            ? normalizeSlotMediaEntry(prev).mediaStyle
            : { ...DEFAULT_AD_MEDIA_STYLE },
        })

        const toDelete = oldUrls.filter((u) => u.trim() !== url.trim())
        if (toDelete.length) await deleteAdMediaUrls(toDelete)
      } catch (err) {
        const message =
          err instanceof SlotMediaUploadError
            ? err.message
            : err instanceof Error
              ? err.message
              : uploadErrorFallback
        setLastError(message)
        throw err
      } finally {
        setUploadingSlotId(null)
      }
    },
    [commitSlot, entryFor, uploadErrorFallback],
  )

  const updateSlotEntry = useCallback(
    (slotId: string, patch: Partial<SlotMediaEntry>) => {
      commitSlot(slotId, { ...entryFor(slotId), ...patch })
    },
    [commitSlot, entryFor],
  )

  return {
    uploadingSlotId,
    lastError,
    setLastError,
    clearSlot,
    uploadToSlot,
    updateSlotEntry,
    isUploading: uploadingSlotId !== null,
  }
}
