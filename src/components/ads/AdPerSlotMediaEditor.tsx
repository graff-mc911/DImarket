import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Trash2, Upload } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { AdMediaEditor } from '../AdMediaEditor'
import { AdPlacementSitePreview } from '../AdPlacementSitePreview'
import { AdPlacementPagesBar } from './AdPlacementPagesBar'
import { useAdBannerMediaUpload } from '../../hooks/useAdBannerMediaUpload'
import {
  emptySlotMediaEntry,
  layoutKeyFromSlotId,
  slotMediaEntryHasMedia,
  sortSlotsForEditor,
  type SlotMediaEntry,
  type SlotMediaMap,
} from '../../lib/adSlotMedia'
import { formatSlotLabel, type AdPageKey } from '../../lib/adPlacementSlots'
import type { AdMediaStyle } from '../../lib/adMediaStyle'
import type { BannerMediaType } from '../../hooks/useAdBannerMediaUpload'

type AdPerSlotMediaEditorProps = {
  selectedSlots: string[]
  onSelectedSlotsChange?: (slots: string[]) => void
  slotMedia: SlotMediaMap
  onSlotMediaChange: (next: SlotMediaMap) => void
  page?: AdPageKey
  onPageChange?: (page: AdPageKey) => void
  fallbackMediaUrl: string
  fallbackSlideUrls: string[]
  fallbackMediaType: BannerMediaType
  fallbackMediaStyle: AdMediaStyle
  onFallbackMediaUrl: (url: string) => void
  onFallbackSlideUrls: (urls: string[] | ((p: string[]) => string[])) => void
  onFallbackMediaType: (t: BannerMediaType) => void
  onFallbackMediaStyle: (s: AdMediaStyle) => void
  /** Заголовок картки (напр. «Де показувати рекламу») */
  cardTitle?: string
  /** Заголовок уже зовні секції */
  hideHeader?: boolean
}

export function AdPerSlotMediaEditor({
  selectedSlots,
  onSelectedSlotsChange,
  slotMedia,
  onSlotMediaChange,
  page: pageProp,
  onPageChange,
  fallbackMediaUrl,
  fallbackSlideUrls,
  fallbackMediaType,
  fallbackMediaStyle,
  onFallbackMediaUrl,
  onFallbackSlideUrls,
  onFallbackMediaType,
  onFallbackMediaStyle,
  cardTitle,
  hideHeader = false,
}: AdPerSlotMediaEditorProps) {
  const { t } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadSlotRef = useRef<string | null>(null)
  const [focusedSlotId, setFocusedSlotId] = useState<string | null>(null)

  const sorted = useMemo(() => sortSlotsForEditor(selectedSlots), [selectedSlots])
  const sideSlots = sorted.filter((id) => id.includes('_side_'))

  useEffect(() => {
    if (focusedSlotId && selectedSlots.includes(focusedSlotId)) return
    setFocusedSlotId(selectedSlots[0] ?? null)
  }, [selectedSlots, focusedSlotId])

  const activeSlotId = focusedSlotId
  const focusedEntry = activeSlotId
    ? (slotMedia[activeSlotId] ?? emptySlotMediaEntry())
    : emptySlotMediaEntry()

  const entryForSlot = (slotId: string) => slotMedia[slotId] ?? emptySlotMediaEntry()

  const patchSlot = useCallback(
    (slotId: string, entry: SlotMediaEntry) => {
      onSlotMediaChange({ ...slotMedia, [slotId]: entry })
    },
    [onSlotMediaChange, slotMedia],
  )

  const clearSlot = useCallback(
    (slotId: string) => {
      onSlotMediaChange({ ...slotMedia, [slotId]: emptySlotMediaEntry() })
    },
    [onSlotMediaChange, slotMedia],
  )

  const upload = useAdBannerMediaUpload({
    mediaUrl: focusedEntry.mediaUrl,
    slideUrls: focusedEntry.slideUrls,
    mediaType: focusedEntry.mediaType,
    setMediaUrl: (url) => {
      const slotId = uploadSlotRef.current || focusedSlotId
      if (!slotId) return
      const entry = entryForSlot(slotId)
      patchSlot(slotId, { ...entry, mediaUrl: url })
    },
    setSlideUrls: (urls) => {
      const slotId = uploadSlotRef.current || focusedSlotId
      if (!slotId) return
      const entry = entryForSlot(slotId)
      const next = typeof urls === 'function' ? urls(entry.slideUrls) : urls
      patchSlot(slotId, {
        ...entry,
        slideUrls: next,
        mediaUrl: next[0] || entry.mediaUrl,
      })
    },
    setMediaType: (type) => {
      const slotId = uploadSlotRef.current || focusedSlotId
      if (!slotId) return
      patchSlot(slotId, { ...entryForSlot(slotId), mediaType: type })
    },
    uploadErrorFallback: t('advertising.error.upload'),
  })

  const requestUpload = (slotId: string) => {
    uploadSlotRef.current = slotId
    setFocusedSlotId(slotId)
    setTimeout(() => fileInputRef.current?.click(), 0)
  }

  const copyFirstSideToAllSides = () => {
    const source = sideSlots.map((id) => slotMedia[id]).find(slotMediaEntryHasMedia)
    if (!source) return
    const next = { ...slotMedia }
    for (const id of sideSlots) {
      next[id] = {
        ...source,
        mediaStyle: { ...source.mediaStyle },
        slideUrls: [...source.slideUrls],
      }
    }
    onSlotMediaChange(next)
  }

  const applyFallbackToEmpty = () => {
    if (!fallbackMediaUrl.trim() && !fallbackSlideUrls.length) return
    const next = { ...slotMedia }
    for (const id of sorted) {
      if (slotMediaEntryHasMedia(next[id])) continue
      next[id] = {
        mediaUrl: fallbackSlideUrls[0] || fallbackMediaUrl,
        mediaType: fallbackMediaType,
        slideUrls: fallbackSlideUrls.length ? [...fallbackSlideUrls] : [fallbackMediaUrl],
        mediaStyle: { ...fallbackMediaStyle },
      }
    }
    onSlotMediaChange(next)
  }

  if (selectedSlots.length === 0) {
    return (
      <p className="text-sm text-[#6f665d]">{t('advertising.slotMedia.selectSlotsFirst')}</p>
    )
  }

  const title = cardTitle ?? t('advertising.placementsSection.title')
  const focusedHasMedia = slotMediaEntryHasMedia(focusedEntry)
  const focusedLayout = focusedSlotId ? layoutKeyFromSlotId(focusedSlotId) : 'center'
  const previewPage = pageProp ?? 'home'

  const previewProps = {
    compact: true as const,
    hidePageTabs: true as const,
    selected: selectedSlots,
    slotMedia,
    focusedSlotId,
    onFocusSlot: setFocusedSlotId,
    onSlotClear: clearSlot,
    onSlotUploadRequest: requestUpload,
    page: previewPage,
    onPageChange,
  }

  return (
    <div className="space-y-3">
      {!hideHeader && (
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[#2f2a24]">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-[#6f665d]">{t('advertising.slotStudio.desc')}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sideSlots.length > 1 && (
            <button
              type="button"
              onClick={copyFirstSideToAllSides}
              className="inline-flex items-center gap-1 rounded-full border border-[#c7d2fe] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#4338ca]"
            >
              <Copy className="h-3 w-3" />
              {t('advertising.slotMedia.copySide')}
            </button>
          )}
          <button
            type="button"
            onClick={applyFallbackToEmpty}
            className="inline-flex items-center gap-1 rounded-full border border-[#e7ddd3] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#5f5a54]"
          >
            {t('advertising.slotMedia.fillEmpty')}
          </button>
        </div>
      </div>
      )}

      {onPageChange && (
        <AdPlacementPagesBar
          activePage={previewPage}
          onPageChange={onPageChange}
          selectedSlots={selectedSlots}
        />
      )}

      <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.slotStudio.desc')}</p>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_1fr]">
        <aside className="order-2 rounded-[16px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.45)] p-3 lg:order-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6f665d]">
            {t('advertising.slotStudio.animationTitle')}
          </p>
          {focusedSlotId ? (
            <p className="mt-1 text-xs font-semibold text-[#2f2a24]">
              {formatSlotLabel(focusedSlotId, t)}
            </p>
          ) : null}
          {focusedHasMedia ? (
            <div className="mt-2 max-h-[min(52vh,420px)] overflow-y-auto pr-0.5">
              <AdMediaEditor
                compact
                fixedLayoutKey={focusedLayout}
                mediaType={focusedEntry.mediaType}
                primaryUrl={focusedEntry.mediaUrl}
                slideUrls={
                  focusedEntry.slideUrls.length
                    ? focusedEntry.slideUrls
                    : [focusedEntry.mediaUrl]
                }
                style={focusedEntry.mediaStyle}
                onStyleChange={(mediaStyle) =>
                  focusedSlotId && patchSlot(focusedSlotId, { ...focusedEntry, mediaStyle })
                }
                onSlideUrlsChange={(slideUrls) => {
                  if (!focusedSlotId) return
                  patchSlot(focusedSlotId, {
                    ...focusedEntry,
                    slideUrls,
                    mediaUrl: slideUrls[0] ?? '',
                  })
                }}
                onPrimaryUrlChange={(mediaUrl) =>
                  focusedSlotId && patchSlot(focusedSlotId, { ...focusedEntry, mediaUrl })
                }
                onUploadFiles={(files) => upload.uploadFiles(files, { append: true })}
                isUploading={upload.pendingUploads > 0}
                onClearMedia={() => focusedSlotId && clearSlot(focusedSlotId)}
              />
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[#9a8776]">{t('advertising.slotStudio.focusHint')}</p>
          )}
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          {onSelectedSlotsChange ? (
            <AdPlacementSitePreview {...previewProps} onChange={onSelectedSlotsChange} />
          ) : (
            <AdPlacementSitePreview {...previewProps} />
          )}
        </div>
      </div>

      {focusedSlotId && (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-white/40 bg-white/30 px-3 py-2">
          <span className="text-xs font-semibold text-[#2f2a24]">
            {formatSlotLabel(focusedSlotId, t)}
          </span>
          <button
            type="button"
            onClick={() => requestUpload(focusedSlotId)}
            disabled={upload.pendingUploads > 0}
            className="inline-flex items-center gap-1 rounded-full bg-[#6366f1] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            <Upload className="h-3 w-3" />
            {focusedHasMedia
              ? t('advertising.slotStudio.replace')
              : t('advertising.slotStudio.uploadHere')}
          </button>
          {focusedHasMedia && (
            <button
              type="button"
              onClick={() => clearSlot(focusedSlotId)}
              className="inline-flex items-center gap-1 rounded-full border border-[rgba(239,68,68,0.35)] bg-white px-3 py-1 text-[11px] font-semibold text-[#b91c1c]"
            >
              <Trash2 className="h-3 w-3" />
              {t('advertising.slotStudio.removeMedia')}
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={upload.acceptedMime.join(',')}
        multiple={focusedEntry.mediaType === 'image'}
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : []
          const slot = uploadSlotRef.current || focusedSlotId
          if (files.length && slot) {
            if (slot !== focusedSlotId) setFocusedSlotId(slot)
            void upload.uploadFiles(files, {
              append: slotMediaEntryHasMedia(entryForSlot(slot)),
            })
          }
          e.target.value = ''
          uploadSlotRef.current = null
        }}
      />
    </div>
  )
}
