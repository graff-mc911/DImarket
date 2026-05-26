import { useMemo } from 'react'
import { Copy, Layers } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { AdBannerMediaForm } from '../AdBannerMediaForm'
import { AdMediaDisplay } from '../AdMediaDisplay'
import { AdMediaEditor } from '../AdMediaEditor'
import { useAdBannerMediaUpload } from '../../hooks/useAdBannerMediaUpload'
import {
  emptySlotMediaEntry,
  layoutKeyFromSlotId,
  slotMediaEntryHasMedia,
  sortSlotsForEditor,
  type SlotMediaEntry,
  type SlotMediaMap,
} from '../../lib/adSlotMedia'
import { containerSpecForSlotId, formatSlotContainerShort } from '../../lib/adSlotContainerSpecs'
import { formatSlotLabel } from '../../lib/adPlacementSlots'
import { AD_BANNER_LAYOUT_META } from '../../lib/adBannerLayouts'
import type { AdMediaStyle } from '../../lib/adMediaStyle'
import type { BannerMediaType } from '../../hooks/useAdBannerMediaUpload'

type AdPerSlotMediaEditorProps = {
  selectedSlots: string[]
  slotMedia: SlotMediaMap
  onSlotMediaChange: (next: SlotMediaMap) => void
  /** Базове медіа для слотів без окремого файлу */
  fallbackMediaUrl: string
  fallbackSlideUrls: string[]
  fallbackMediaType: BannerMediaType
  fallbackMediaStyle: AdMediaStyle
  onFallbackMediaUrl: (url: string) => void
  onFallbackSlideUrls: (urls: string[] | ((p: string[]) => string[])) => void
  onFallbackMediaType: (t: BannerMediaType) => void
  onFallbackMediaStyle: (s: AdMediaStyle) => void
}

function SlotMediaBlock({
  slotId,
  entry,
  onChange,
}: {
  slotId: string
  entry: SlotMediaEntry
  onChange: (entry: SlotMediaEntry) => void
}) {
  const { t } = useApp()
  const layoutKey = layoutKeyFromSlotId(slotId)
  const spec = containerSpecForSlotId(slotId)
  const sizeLabel = spec ? formatSlotContainerShort(spec) : ''

  const upload = useAdBannerMediaUpload({
    mediaUrl: entry.mediaUrl,
    slideUrls: entry.slideUrls,
    mediaType: entry.mediaType,
    setMediaUrl: (url) => onChange({ ...entry, mediaUrl: url }),
    setSlideUrls: (urls) => {
      const next = typeof urls === 'function' ? urls(entry.slideUrls) : urls
      onChange({ ...entry, slideUrls: next, mediaUrl: next[0] || entry.mediaUrl })
    },
    setMediaType: (type) => onChange({ ...entry, mediaType: type }),
    uploadErrorFallback: t('advertising.error.upload'),
  })

  const hasMedia = slotMediaEntryHasMedia(entry)
  const previewUrl = entry.slideUrls[0] || entry.mediaUrl

  return (
    <div className="rounded-[18px] border border-white/50 bg-[rgba(255,255,255,0.35)] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#2f2a24]">{formatSlotLabel(slotId, t)}</p>
          {sizeLabel ? (
            <p className="text-[11px] font-semibold tabular-nums text-[#6366f1]">
              {t('advertising.slotMedia.size')}: {sizeLabel}px
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-[rgba(99,102,241,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase text-[#4338ca]">
          {t(`advertising.mediaEditor.layout.${layoutKey}`)}
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          upload.setIsDragOver(true)
        }}
        onDragLeave={() => upload.setIsDragOver(false)}
        onDrop={upload.handleDrop}
        className={
          'relative mb-3 overflow-hidden rounded-[14px] border-2 border-dashed transition ' +
          (upload.isDragOver
            ? 'border-[#6366f1] bg-[rgba(99,102,241,0.06)]'
            : hasMedia
              ? 'border-[rgba(34,197,94,0.35)]'
              : 'border-[rgba(148,163,184,0.35)]')
        }
      >
        {hasMedia ? (
          <div className="p-2">
            <AdMediaDisplay
              src={previewUrl}
              mediaType={entry.mediaType}
              style={entry.mediaStyle}
              layoutKey={layoutKey}
              className={AD_BANNER_LAYOUT_META[layoutKey].aspectClass}
              imageClassName="h-full w-full object-contain"
              animateSlides
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => upload.openFilePicker(false)}
            className="flex w-full flex-col items-center gap-2 px-4 py-8 text-sm font-semibold text-[#6f665d]"
          >
            <Layers className="h-6 w-6 text-[#6366f1]" />
            {t('advertising.slotMedia.uploadForSlot')}
          </button>
        )}
        <input
          ref={upload.fileInputRef}
          type="file"
          accept={upload.acceptedMime.join(',')}
          multiple={entry.mediaType === 'image'}
          onChange={upload.handleFileChange}
          className="hidden"
        />
      </div>

      {hasMedia && (
        <AdMediaEditor
          mediaType={entry.mediaType}
          primaryUrl={entry.mediaUrl}
          slideUrls={entry.slideUrls.length ? entry.slideUrls : [entry.mediaUrl]}
          style={entry.mediaStyle}
          onStyleChange={(mediaStyle) => onChange({ ...entry, mediaStyle })}
          onSlideUrlsChange={(slideUrls) =>
            onChange({ ...entry, slideUrls, mediaUrl: slideUrls[0] || entry.mediaUrl })
          }
          onPrimaryUrlChange={(mediaUrl) => onChange({ ...entry, mediaUrl })}
          onUploadFiles={(files) => upload.uploadFiles(files, { append: true })}
          isUploading={upload.pendingUploads > 0}
        />
      )}
    </div>
  )
}

export function AdPerSlotMediaEditor({
  selectedSlots,
  slotMedia,
  onSlotMediaChange,
  fallbackMediaUrl,
  fallbackSlideUrls,
  fallbackMediaType,
  fallbackMediaStyle,
  onFallbackMediaUrl,
  onFallbackSlideUrls,
  onFallbackMediaType,
  onFallbackMediaStyle,
}: AdPerSlotMediaEditorProps) {
  const { t } = useApp()
  const sorted = useMemo(() => sortSlotsForEditor(selectedSlots), [selectedSlots])

  const sideSlots = sorted.filter((id) => id.includes('_side_'))
  const otherSlots = sorted.filter((id) => !id.includes('_side_'))

  const patchSlot = (slotId: string, entry: SlotMediaEntry) => {
    onSlotMediaChange({ ...slotMedia, [slotId]: entry })
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-extrabold text-[#2f2a24]">{t('advertising.slotMedia.title')}</h3>
        <p className="mt-1 text-sm leading-6 text-[#6f665d]">{t('advertising.slotMedia.desc')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sideSlots.length > 1 && (
            <button
              type="button"
              onClick={copyFirstSideToAllSides}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#c7d2fe] bg-white px-3 py-1.5 text-xs font-semibold text-[#4338ca]"
            >
              <Copy className="h-3.5 w-3.5" />
              {t('advertising.slotMedia.copySide')}
            </button>
          )}
          <button
            type="button"
            onClick={applyFallbackToEmpty}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e7ddd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5a54]"
          >
            {t('advertising.slotMedia.fillEmpty')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((slotId) => (
          <SlotMediaBlock
            key={slotId}
            slotId={slotId}
            entry={slotMedia[slotId] ?? emptySlotMediaEntry()}
            onChange={(entry) => patchSlot(slotId, entry)}
          />
        ))}
      </div>

      <div className="rounded-[20px] border border-dashed border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.25)] p-4">
        <p className="text-sm font-bold text-[#2f2a24]">{t('advertising.slotMedia.fallbackTitle')}</p>
        <p className="mt-1 text-xs leading-5 text-[#6f665d]">{t('advertising.slotMedia.fallbackDesc')}</p>
        <div className="mt-4">
          <AdBannerMediaForm
            mediaType={fallbackMediaType}
            setMediaType={onFallbackMediaType}
            mediaUrl={fallbackMediaUrl}
            setMediaUrl={onFallbackMediaUrl}
            slideUrls={fallbackSlideUrls}
            setSlideUrls={onFallbackSlideUrls}
            mediaStyle={fallbackMediaStyle}
            setMediaStyle={onFallbackMediaStyle}
          />
        </div>
      </div>

      {otherSlots.length > 0 && sideSlots.length > 0 && (
        <p className="text-xs text-[#9a8776]">{t('advertising.slotMedia.sideNote')}</p>
      )}
    </div>
  )
}
