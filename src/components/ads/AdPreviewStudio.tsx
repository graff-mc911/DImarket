import { useMemo, useRef, useState } from 'react'
import { ImagePlus, Plus, RotateCcw, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { AdOverlayCard } from '../AdOverlayCard'
import type { AdCampaignWithAdvertiser } from '../../lib/adCampaigns'
import {
  AD_BANNER_LAYOUT_KEYS,
  AD_BANNER_LAYOUT_META,
  type AdBannerLayoutKey,
} from '../../lib/adBannerLayouts'
import {
  buildMediaStylePayload,
  COLLAGE_MAX_BY_LAYOUT,
  DEFAULT_AD_MEDIA_STYLE,
  patchLayoutFrame,
  resolveDisplayMode,
  resolveLayoutFrame,
  resolveLayoutTransition,
  setLayoutPrefs,
  TRANSITIONS_FOR_LAYOUT,
  type AdDisplayMode,
  type AdMediaStyle,
  type AdSlideshowTransition,
} from '../../lib/adMediaStyle'
import {
  wireframeSlotSizeShort,
} from '../../lib/adSlotContainerSpecs'
import { containerSpecForOverlayVariant } from '../../lib/adSlotDisplay'
import {
  slotMediaEntryHasMedia,
  type SlotMediaMap,
} from '../../lib/adSlotMedia'
import { formatSlotLabel } from '../../lib/adPlacementSlots'

type DraftMediaType = 'image' | 'gif' | 'video'

export type AdPreviewStudioProps = {
  title: string
  description: string
  linkUrl: string
  mediaUrl: string
  mediaType: DraftMediaType
  mediaReady: boolean
  placeholderTitle: string
  mediaStyle?: AdMediaStyle
  slideUrls?: string[]
  className?: string
  onMediaStyleChange?: (style: AdMediaStyle) => void
  onSlideUrlsChange?: (urls: string[]) => void
  onUploadFiles?: (files: File[]) => Promise<void>
  selectedSlots?: string[]
  slotMedia?: SlotMediaMap
  editable?: boolean
}

const DISPLAY_MODES: AdDisplayMode[] = ['single', 'rotate', 'collage']

function collectSlideUrls(
  selectedSlots: string[] | undefined,
  slotMedia: SlotMediaMap | undefined,
  slideUrls: string[],
  mediaUrl: string,
): string[] {
  const fromSlots: string[] = []
  for (const id of selectedSlots ?? []) {
    const entry = slotMedia?.[id]
    if (!slotMediaEntryHasMedia(entry)) continue
    const url = entry!.slideUrls[0] || entry!.mediaUrl
    if (url) fromSlots.push(url)
  }
  const unique = [...new Set([...fromSlots, ...slideUrls.filter(Boolean)])]
  if (unique.length > 0) return unique
  return mediaUrl.trim() ? [mediaUrl.trim()] : []
}

function previewMaxWidthClass(layout: AdBannerLayoutKey): string {
  switch (layout) {
    case 'side':
      return 'mx-auto w-full max-w-[248px]'
    case 'center':
      return 'mx-auto w-full max-w-[720px]'
    case 'leaderboard':
      return 'mx-auto w-full max-w-[720px]'
    case 'mobile':
      return 'mx-auto w-full max-w-[390px]'
    default:
      return 'mx-auto w-full max-w-xl'
  }
}

export function AdPreviewStudio({
  title,
  description,
  linkUrl,
  mediaUrl,
  mediaType,
  mediaReady,
  placeholderTitle,
  mediaStyle: mediaStyleProp,
  slideUrls = [],
  className = '',
  onMediaStyleChange,
  onSlideUrlsChange,
  onUploadFiles,
  selectedSlots,
  slotMedia,
  editable = false,
}: AdPreviewStudioProps) {
  const { t } = useApp()
  const [previewLayout, setPreviewLayout] = useState<AdBannerLayoutKey>('center')
  const extraInputRef = useRef<HTMLInputElement>(null)

  const mediaStyle = mediaStyleProp ?? DEFAULT_AD_MEDIA_STYLE
  const allSlides = useMemo(
    () => collectSlideUrls(selectedSlots, slotMedia, slideUrls, mediaUrl),
    [selectedSlots, slotMedia, slideUrls, mediaUrl],
  )
  const slideCount = allSlides.length
  const canMulti = mediaType === 'image' || mediaType === 'gif'
  const overlayVariant = AD_BANNER_LAYOUT_META[previewLayout].overlayVariant
  const spec = containerSpecForOverlayVariant(overlayVariant)
  const sizeLabel = wireframeSlotSizeShort(spec)
  const displayMode = resolveDisplayMode(mediaStyle, previewLayout, slideCount)
  const frame = resolveLayoutFrame(mediaStyle, previewLayout)
  const transition = resolveLayoutTransition(mediaStyle, previewLayout)

  const stylePayload = mediaReady
    ? buildMediaStylePayload(mediaStyle, allSlides)
    : null

  const draft: AdCampaignWithAdvertiser = {
    id: 'draft-preview',
    title: title.trim() || placeholderTitle,
    description: description.trim() || null,
    link_url: linkUrl.trim() || '#',
    image_url: mediaType !== 'video' ? allSlides[0] || null : null,
    media_url: allSlides[0] || null,
    media_type: mediaType,
    media_style: stylePayload,
    advertiser: null,
  } as AdCampaignWithAdvertiser

  const patchStyle = (next: AdMediaStyle) => {
    onMediaStyleChange?.(next)
  }

  const patchLayout = (patch: { displayMode?: AdDisplayMode; transition?: AdSlideshowTransition }) => {
    const prefs = mediaStyle.byLayout?.[previewLayout] ?? {}
    patchStyle(setLayoutPrefs(mediaStyle, previewLayout, { ...prefs, ...patch }))
  }

  const patchFrame = (patch: Parameters<typeof patchLayoutFrame>[2]) => {
    patchStyle(patchLayoutFrame(mediaStyle, previewLayout, patch))
  }

  const resetFrame = () => {
    const prefs = mediaStyle.byLayout?.[previewLayout]
    if (!prefs?.frame) return
    const { frame: _f, ...rest } = prefs
    patchStyle(setLayoutPrefs(mediaStyle, previewLayout, rest))
  }

  const removeSlide = (index: number) => {
    if (!onSlideUrlsChange) return
    const next = allSlides.filter((_, i) => i !== index)
    onSlideUrlsChange(next)
    if (next.length <= 1) {
      patchStyle({ ...mediaStyle, slideshow: null })
    }
  }

  const layoutLabel = (key: AdBannerLayoutKey) => t(`advertising.mediaEditor.layout.${key}`)
  const modeLabel = (mode: AdDisplayMode) => t(`advertising.mediaEditor.mode.${mode}`)
  const collageMax = COLLAGE_MAX_BY_LAYOUT[previewLayout]

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap justify-center gap-1.5">
        {AD_BANNER_LAYOUT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreviewLayout(key)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              previewLayout === key
                ? 'bg-[#6366f1] text-white'
                : 'border border-[rgba(99,102,241,0.2)] text-[#6f665d]'
            }`}
          >
            {layoutLabel(key)}
          </button>
        ))}
      </div>

      <p className="mb-2 text-center text-[10px] font-semibold tabular-nums text-[#9a8776]">
        {t('advertising.previewStudio.containerSize')}: {sizeLabel}
      </p>

      <div className={previewMaxWidthClass(previewLayout)}>
        <AdOverlayCard
          campaign={draft}
          variant={overlayVariant}
          className="w-full"
          showDescription={Boolean(description.trim())}
          imageOnly={previewLayout === 'leaderboard'}
        />
      </div>

      {editable && mediaReady && canMulti && onMediaStyleChange && (
        <div className="mt-4 space-y-3 rounded-[16px] border border-[rgba(148,163,184,0.2)] bg-white/35 p-3">
          <p className="text-xs font-bold text-[#2f2a24]">{t('advertising.previewStudio.imagesTitle')}</p>
          <p className="text-[10px] leading-snug text-[#9a8776]">{t('advertising.previewStudio.imagesHint')}</p>
          <div className="flex flex-wrap gap-2">
            {allSlides.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative h-14 w-20 overflow-hidden rounded-lg border border-[rgba(148,163,184,0.3)]"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {onSlideUrlsChange && allSlides.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSlide(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/55 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            ))}
            {onUploadFiles && allSlides.length < 6 && (
              <button
                type="button"
                onClick={() => extraInputRef.current?.click()}
                className="flex h-14 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(99,102,241,0.35)] text-[#6366f1]"
              >
                <Plus className="h-4 w-4" />
                <span className="mt-0.5 text-[9px] font-semibold">{t('advertising.mediaEditor.addImage')}</span>
              </button>
            )}
          </div>
          {onUploadFiles && (
            <input
              ref={extraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files?.length) void onUploadFiles(Array.from(files))
                e.target.value = ''
              }}
            />
          )}
        </div>
      )}

      {editable && mediaReady && onMediaStyleChange && (
        <div className="mt-3 space-y-3 rounded-[16px] border border-[rgba(148,163,184,0.2)] bg-white/35 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6f665d]">
            {t('advertising.previewStudio.displayTitle')}
          </p>

          <div className="flex flex-wrap gap-1">
            {DISPLAY_MODES.map((m) => {
              const disabled = (m === 'rotate' || m === 'collage') && slideCount < 2
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => patchLayout({ displayMode: m })}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold disabled:opacity-40 ${
                    displayMode === m
                      ? 'bg-[#6366f1] text-white'
                      : 'border border-[rgba(99,102,241,0.2)] text-[#5f5a54]'
                  }`}
                >
                  {modeLabel(m)}
                </button>
              )
            })}
          </div>

          {slideCount < 2 && (
            <p className="text-[10px] text-[#9a8776]">{t('advertising.mediaEditor.slideshowNeedTwo')}</p>
          )}

          {displayMode === 'collage' && slideCount >= 2 && (
            <p className="text-[10px] text-[#9a8776]">
              {t('advertising.previewStudio.collageMax').replace('{n}', String(collageMax))}
            </p>
          )}

          {displayMode === 'rotate' && slideCount >= 2 && (
            <label className="block text-[10px] font-semibold text-[#6f665d]">
              {t('advertising.mediaEditor.transition')}
              <select
                value={transition}
                onChange={(e) =>
                  patchLayout({ transition: e.target.value as AdSlideshowTransition })
                }
                className="input-glass mt-1 w-full text-xs"
              >
                {TRANSITIONS_FOR_LAYOUT[previewLayout].map((tr) => (
                  <option key={tr} value={tr}>
                    {t(`advertising.mediaEditor.transition.${tr}`)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="border-t border-[rgba(148,163,184,0.15)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#2f2a24]">{t('advertising.previewStudio.frameTitle')}</p>
              {mediaStyle.byLayout?.[previewLayout]?.frame && (
                <button
                  type="button"
                  onClick={resetFrame}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6366f1]"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t('advertising.previewStudio.resetFrame')}
                </button>
              )}
            </div>
            <p className="mt-1 text-[10px] text-[#9a8776]">{t('advertising.previewStudio.frameHint')}</p>

            <div className="mt-2 flex gap-1">
              {(['contain', 'cover'] as const).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => patchFrame({ fit })}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    frame.fit === fit
                      ? 'bg-[#6366f1] text-white'
                      : 'border border-[rgba(99,102,241,0.2)] text-[#5f5a54]'
                  }`}
                >
                  {t(`advertising.previewStudio.fit.${fit}`)}
                </button>
              ))}
            </div>

            <label className="mt-2 block text-[10px] font-semibold text-[#6f665d]">
              {t('advertising.previewStudio.scale')} ({Math.round((frame.scale ?? 1) * 100)}%)
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={Math.round((frame.scale ?? 1) * 100)}
                onChange={(e) => patchFrame({ scale: Number(e.target.value) / 100 })}
                className="mt-1 w-full"
              />
            </label>

            <label className="mt-2 block text-[10px] font-semibold text-[#6f665d]">
              {t('advertising.previewStudio.positionX')} ({frame.positionX}%)
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={frame.positionX ?? 50}
                onChange={(e) => patchFrame({ positionX: Number(e.target.value) })}
                className="mt-1 w-full"
              />
            </label>

            <label className="mt-2 block text-[10px] font-semibold text-[#6f665d]">
              {t('advertising.previewStudio.positionY')} ({frame.positionY}%)
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={frame.positionY ?? 50}
                onChange={(e) => patchFrame({ positionY: Number(e.target.value) })}
                className="mt-1 w-full"
              />
            </label>
          </div>

          <div className="border-t border-[rgba(148,163,184,0.15)] pt-3">
            <p className="text-xs font-bold text-[#2f2a24]">{t('advertising.previewStudio.textTitle')}</p>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-[#5f5a54]">
              <input
                type="checkbox"
                checked={Boolean(mediaStyle.textOverlay)}
                onChange={(e) => patchStyle({ ...mediaStyle, textOverlay: e.target.checked })}
                className="mt-0.5"
              />
              <span>{t('advertising.previewStudio.textOverlay')}</span>
            </label>
            <p className="mt-1 text-[10px] text-[#9a8776]">{t('advertising.previewStudio.textHint')}</p>
          </div>
        </div>
      )}

      {!mediaReady && (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[#9a8776]">
          <ImagePlus className="h-4 w-4" />
          {t('advertising.mediaEditor.uploadFirst')}
        </p>
      )}

      {selectedSlots && selectedSlots.length > 0 && slotMedia && (
        <p className="mt-2 text-center text-[9px] text-[#9a8776]">
          {t('advertising.previewStudio.slotsHint')}:{' '}
          {selectedSlots
            .filter((id) => slotMediaEntryHasMedia(slotMedia[id]))
            .map((id) => formatSlotLabel(id, t))
            .join(', ') || '—'}
        </p>
      )}
    </div>
  )
}
