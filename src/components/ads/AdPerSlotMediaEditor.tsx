import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Trash2, Upload } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { AdMediaEditor } from '../AdMediaEditor'
import { AdPlacementSitePreview } from '../AdPlacementSitePreview'
import { AdPlacementPagesBar } from './AdPlacementPagesBar'
import { AD_MEDIA_ACCEPT } from '../../lib/adMediaStorage'
import {
  emptySlotMediaEntry,
  layoutKeyFromSlotId,
  normalizeSlotMediaEntry,
  slotMediaEntryHasMedia,
  sortSlotsForEditor,
  type SlotMediaEntry,
  type SlotMediaMap,
} from '../../lib/adSlotMedia'
import { formatSlotLabel } from '../../lib/adPlacementSlots'
import {
  editorPageFromSlotId,
  wireframeGroupForEditorPage,
  type PlacementEditorPageId,
} from '../../lib/adPlacementPages'
import type { AdMediaStyle } from '../../lib/adMediaStyle'
import type { BannerMediaType } from '../../hooks/useAdBannerMediaUpload'
import { SlotMediaUploadError, useSlotMediaUpload } from '../../hooks/useSlotMediaUpload'

type AdPerSlotMediaEditorProps = {
  selectedSlots: string[]
  onSelectedSlotsChange?: (slots: string[]) => void
  slotMedia: SlotMediaMap
  onSlotMediaChange: (next: SlotMediaMap) => void
  editorPage?: PlacementEditorPageId
  onEditorPageChange?: (page: PlacementEditorPageId) => void
  fallbackMediaUrl: string
  fallbackSlideUrls: string[]
  fallbackMediaType: BannerMediaType
  fallbackMediaStyle: AdMediaStyle
  onFallbackMediaUrl: (url: string) => void
  onFallbackSlideUrls: (urls: string[] | ((p: string[]) => string[])) => void
  onFallbackMediaType: (t: BannerMediaType) => void
  onFallbackMediaStyle: (s: AdMediaStyle) => void
  cardTitle?: string
  hideHeader?: boolean
  /** Без кнопок сторінок — компактна схема Home/Listings/Professionals */
  hidePagePicker?: boolean
}

function normalizeSlotMediaMap(map: SlotMediaMap): SlotMediaMap {
  const out: SlotMediaMap = { ...map }
  for (const id of Object.keys(out)) {
    out[id] = normalizeSlotMediaEntry(out[id] ?? emptySlotMediaEntry())
  }
  return out
}

export function AdPerSlotMediaEditor({
  selectedSlots,
  onSelectedSlotsChange,
  slotMedia,
  onSlotMediaChange,
  editorPage: editorPageProp,
  onEditorPageChange,
  fallbackMediaUrl,
  fallbackSlideUrls,
  fallbackMediaType,
  fallbackMediaStyle,
  cardTitle,
  hideHeader = false,
  hidePagePicker = false,
}: AdPerSlotMediaEditorProps) {
  const { t } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSlotRef = useRef<string | null>(null)
  const replaceModeRef = useRef(false)
  const slotMediaRef = useRef(slotMedia)
  slotMediaRef.current = slotMedia

  const [focusedSlotId, setFocusedSlotId] = useState<string | null>(null)
  const [slotHint, setSlotHint] = useState<string | null>(null)

  const slotUpload = useSlotMediaUpload({
    slotMediaRef,
    onSlotMediaChange,
    uploadErrorFallback: t('advertising.error.upload'),
  })

  const displaySlotMedia = useMemo(() => normalizeSlotMediaMap(slotMedia), [slotMedia])

  const sorted = useMemo(() => sortSlotsForEditor(selectedSlots), [selectedSlots])
  const sideSlots = sorted.filter((id) => id.includes('_side_'))

  const [internalPage, setInternalPage] = useState<PlacementEditorPageId>('home')
  const previewPage = hidePagePicker ? internalPage : (editorPageProp ?? 'home')

  /** Фокус слота — у межах поточної вкладки wireframe (single-page mode) */
  useEffect(() => {
    if (hidePagePicker) return

    const group = wireframeGroupForEditorPage(previewPage)
    const pageSlotIds = group.desktop.left.concat(
      group.desktop.right,
      group.desktop.center ? [group.desktop.center] : [],
      group.mobile.inline,
    )

    if (
      focusedSlotId &&
      selectedSlots.includes(focusedSlotId) &&
      pageSlotIds.includes(focusedSlotId)
    ) {
      return
    }

    const preferredOnPage = pageSlotIds.find((id) => selectedSlots.includes(id))
    if (preferredOnPage) {
      setFocusedSlotId(preferredOnPage)
      return
    }

    setFocusedSlotId(selectedSlots[0] ?? pageSlotIds[0] ?? null)
  }, [previewPage, selectedSlots, focusedSlotId, hidePagePicker])

  useEffect(() => {
    if (!hidePagePicker) return
    if (focusedSlotId && selectedSlots.includes(focusedSlotId)) return
    setFocusedSlotId(selectedSlots[0] ?? null)
  }, [hidePagePicker, selectedSlots, focusedSlotId])

  const focusedEntry = focusedSlotId
    ? displaySlotMedia[focusedSlotId] ?? emptySlotMediaEntry()
    : emptySlotMediaEntry()

  const openFilePicker = (slotId: string, replace: boolean) => {
    if (hidePagePicker) setInternalPage(editorPageFromSlotId(slotId))
    else onEditorPageChange?.(editorPageFromSlotId(slotId))
    setFocusedSlotId(slotId)
    if (!replace && slotMediaEntryHasMedia(displaySlotMedia[slotId])) {
      setSlotHint(t('advertising.slotStudio.mustRemoveFirst'))
      return
    }
    setSlotHint(null)
    replaceModeRef.current = replace
    pendingSlotRef.current = slotId
    fileInputRef.current?.click()
  }

  const handleFileInput = async (files: FileList | null) => {
    const slotId = pendingSlotRef.current ?? focusedSlotId
    const replace = replaceModeRef.current
    pendingSlotRef.current = null
    replaceModeRef.current = false

    if (!files?.length || !slotId) return

    try {
      await slotUpload.uploadToSlot(slotId, files[0], { replace })
      setSlotHint(null)
    } catch (err) {
      if (err instanceof SlotMediaUploadError && err.code === 'occupied') {
        setSlotHint(t('advertising.slotStudio.mustRemoveFirst'))
      } else if (err instanceof Error) {
        setSlotHint(err.message)
      }
    }
  }

  const copyFirstSideToAllSides = () => {
    const source = sideSlots.map((id) => displaySlotMedia[id]).find(slotMediaEntryHasMedia)
    if (!source) return
    const norm = normalizeSlotMediaEntry(source)
    const next = { ...slotMediaRef.current }
    for (const id of sideSlots) {
      next[id] = {
        ...norm,
        mediaStyle: { ...norm.mediaStyle },
        slideUrls: [...norm.slideUrls],
      }
    }
    onSlotMediaChange(normalizeSlotMediaMap(next))
  }

  const applyFallbackToEmpty = () => {
    if (!fallbackMediaUrl.trim() && !fallbackSlideUrls.length) return
    const next = { ...slotMediaRef.current }
    for (const id of sorted) {
      if (slotMediaEntryHasMedia(next[id])) continue
      next[id] = normalizeSlotMediaEntry({
        mediaUrl: fallbackSlideUrls[0] || fallbackMediaUrl,
        mediaType: fallbackMediaType,
        slideUrls: fallbackSlideUrls.length ? [...fallbackSlideUrls] : [fallbackMediaUrl],
        mediaStyle: { ...fallbackMediaStyle },
      })
    }
    onSlotMediaChange(normalizeSlotMediaMap(next))
  }

  if (selectedSlots.length === 0) {
    return (
      <p className="text-sm text-[#6f665d]">{t('advertising.slotMedia.selectSlotsFirst')}</p>
    )
  }

  const title = cardTitle ?? t('advertising.placementsSection.title')
  const focusedHasMedia = slotMediaEntryHasMedia(focusedEntry)
  const focusedLayout = focusedSlotId ? layoutKeyFromSlotId(focusedSlotId) : 'center'
  const isBusy = slotUpload.isUploading

  const previewProps = {
    compact: true as const,
    hidePageTabs: true as const,
    selected: selectedSlots,
    slotMedia: displaySlotMedia,
    focusedSlotId,
    onFocusSlot: (id: string | null) => {
      if (id) {
        if (hidePagePicker) setInternalPage(editorPageFromSlotId(id))
        else onEditorPageChange?.(editorPageFromSlotId(id))
      }
      setFocusedSlotId(id)
      setSlotHint(null)
    },
    onSlotClear: (id: string) => void slotUpload.clearSlot(id),
    onSlotUploadRequest: (id: string) => openFilePicker(id, false),
    onSlotReplaceRequest: (id: string) => openFilePicker(id, true),
    editorPage: previewPage,
    onEditorPageChange,
  }

  return (
    <div className={hidePagePicker ? 'space-y-2' : 'space-y-3'}>
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

      {onEditorPageChange && !hidePagePicker && (
        <AdPlacementPagesBar
          activePage={previewPage}
          onPageChange={onEditorPageChange}
          selectedSlots={selectedSlots}
        />
      )}

      {!hidePagePicker && (
        <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.slotStudio.onePerSlot')}</p>
      )}

      {(slotHint || slotUpload.lastError) && (
        <p className="rounded-[12px] border border-[rgba(245,158,11,0.35)] bg-[rgba(255,251,235,0.95)] px-3 py-2 text-xs font-semibold text-[#b45309]">
          {slotHint || slotUpload.lastError}
        </p>
      )}

      {hidePagePicker ? (
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
          <div className="min-w-0">
            {onSelectedSlotsChange ? (
              <AdPlacementSitePreview {...previewProps} onChange={onSelectedSlotsChange} />
            ) : (
              <AdPlacementSitePreview {...previewProps} />
            )}
          </div>
          <aside className="rounded-[12px] border border-[rgba(148,163,184,0.18)] bg-white/35 p-2">
            {focusedSlotId ? (
              <p className="text-[10px] font-semibold text-[#2f2a24]">
                {formatSlotLabel(focusedSlotId, t)}
              </p>
            ) : (
              <p className="text-[10px] text-[#9a8776]">{t('advertising.slotStudio.focusHint')}</p>
            )}
            {focusedSlotId && !focusedHasMedia ? (
              <button
                type="button"
                onClick={() => openFilePicker(focusedSlotId, false)}
                disabled={isBusy}
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full bg-[#6366f1] px-2 py-1 text-[10px] font-semibold text-white"
              >
                <Upload className="h-3 w-3" />
                {t('advertising.slotStudio.uploadHere')}
              </button>
            ) : null}
            {focusedHasMedia && focusedSlotId ? (
              <div className="mt-2 max-h-[240px] overflow-y-auto">
                <AdMediaEditor
                  compact
                  singleImageOnly
                  fixedLayoutKey={focusedLayout}
                  mediaType={focusedEntry.mediaType}
                  primaryUrl={focusedEntry.mediaUrl}
                  slideUrls={[focusedEntry.mediaUrl]}
                  style={focusedEntry.mediaStyle}
                  onStyleChange={(mediaStyle) => {
                    onSlotMediaChange({
                      ...slotMediaRef.current,
                      [focusedSlotId]: normalizeSlotMediaEntry({
                        ...focusedEntry,
                        mediaStyle,
                      }),
                    })
                  }}
                  onSlideUrlsChange={() => {}}
                  onPrimaryUrlChange={() => {}}
                  onUploadFiles={async () => {}}
                  onClearMedia={() => void slotUpload.clearSlot(focusedSlotId)}
                />
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <>
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
                singleImageOnly
                fixedLayoutKey={focusedLayout}
                mediaType={focusedEntry.mediaType}
                primaryUrl={focusedEntry.mediaUrl}
                slideUrls={[focusedEntry.mediaUrl]}
                style={focusedEntry.mediaStyle}
                onStyleChange={(mediaStyle) => {
                  if (!focusedSlotId) return
                  onSlotMediaChange({
                    ...slotMediaRef.current,
                    [focusedSlotId]: normalizeSlotMediaEntry({
                      ...focusedEntry,
                      mediaStyle,
                    }),
                  })
                }}
                onSlideUrlsChange={() => {}}
                onPrimaryUrlChange={() => {}}
                onUploadFiles={async () => {}}
                onClearMedia={() => focusedSlotId && void slotUpload.clearSlot(focusedSlotId)}
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
          {!focusedHasMedia ? (
            <button
              type="button"
              onClick={() => openFilePicker(focusedSlotId, false)}
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-full bg-[#6366f1] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              <Upload className="h-3 w-3" />
              {isBusy ? '…' : t('advertising.slotStudio.uploadHere')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openFilePicker(focusedSlotId, true)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-full bg-[#6366f1] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                <Upload className="h-3 w-3" />
                {isBusy ? '…' : t('advertising.slotStudio.replace')}
              </button>
              <button
                type="button"
                onClick={() => void slotUpload.clearSlot(focusedSlotId)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(239,68,68,0.35)] bg-white px-3 py-1 text-[11px] font-semibold text-[#b91c1c] disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {t('advertising.slotStudio.removeMedia')}
              </button>
            </>
          )}
        </div>
      )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={AD_MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          void handleFileInput(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
