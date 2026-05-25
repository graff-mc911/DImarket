import { useRef, useState } from 'react'
import { ImagePlus, Plus, RotateCcw, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  AD_BANNER_LAYOUT_KEYS,
  AD_BANNER_LAYOUT_META,
  type AdBannerLayoutKey,
} from '../lib/adBannerLayouts'
import {
  AD_SLIDESHOW_TRANSITIONS,
  clearLayoutPrefs,
  layoutHasPrefs,
  LAYOUT_DEFAULT_TRANSITION,
  resolveDisplayMode,
  resolveLayoutPrefs,
  resolveLayoutTransition,
  setLayoutPrefs,
  TRANSITIONS_FOR_LAYOUT,
  type AdDisplayMode,
  type AdMediaStyle,
  type AdSlideshowTransition,
} from '../lib/adMediaStyle'
import { AdMediaDisplay } from './AdMediaDisplay'

type AdMediaEditorProps = {
  mediaType: 'image' | 'gif' | 'video'
  primaryUrl: string
  slideUrls: string[]
  style: AdMediaStyle
  onStyleChange: (style: AdMediaStyle) => void
  onSlideUrlsChange: (urls: string[]) => void
  onPrimaryUrlChange: (url: string) => void
  onUploadFiles: (files: File[]) => Promise<void>
  isUploading?: boolean
}

const DISPLAY_MODES: AdDisplayMode[] = ['single', 'rotate', 'collage']

export function AdMediaEditor({
  mediaType,
  primaryUrl,
  slideUrls,
  style,
  onStyleChange,
  onSlideUrlsChange,
  onPrimaryUrlChange,
  onUploadFiles,
  isUploading = false,
}: AdMediaEditorProps) {
  const { t } = useApp()
  const extraInputRef = useRef<HTMLInputElement>(null)
  const [activeLayout, setActiveLayout] = useState<AdBannerLayoutKey>('center')

  const displayUrl = slideUrls[0] || primaryUrl
  const canMulti = mediaType === 'image' || mediaType === 'gif'
  const hasMedia = Boolean(displayUrl.trim())
  const previewAspectClass = AD_BANNER_LAYOUT_META[activeLayout].aspectClass
  const slideCount = slideUrls.filter(Boolean).length
  const layoutPrefs = resolveLayoutPrefs(style, activeLayout)
  const displayMode = resolveDisplayMode(style, activeLayout, slideCount)
  const transition = resolveLayoutTransition(style, activeLayout)

  const patchSlideshow = (patch: Partial<NonNullable<AdMediaStyle['slideshow']>>) => {
    onStyleChange({
      ...style,
      slideshow: {
        urls: slideUrls,
        intervalMs: style.slideshow?.intervalMs ?? 3500,
        transition: style.slideshow?.transition ?? 'fade',
        ...patch,
      },
    })
  }

  const patchLayout = (patch: Partial<typeof layoutPrefs>) => {
    onStyleChange(
      setLayoutPrefs(style, activeLayout, {
        ...layoutPrefs,
        ...patch,
      }),
    )
  }

  const removeSlide = (index: number) => {
    const next = slideUrls.filter((_, i) => i !== index)
    onSlideUrlsChange(next)
    if (index === 0) onPrimaryUrlChange(next[0] ?? '')
    if (next.length > 1) {
      patchSlideshow({ urls: next })
    } else {
      onStyleChange({ ...style, slideshow: null })
    }
  }

  const layoutLabel = (key: AdBannerLayoutKey) => t(`advertising.mediaEditor.layout.${key}`)
  const modeLabel = (mode: AdDisplayMode) => t(`advertising.mediaEditor.mode.${mode}`)
  const transitionLabel = (tr: AdSlideshowTransition) =>
    t(`advertising.mediaEditor.transition.${tr}`)

  const transitionsForLayout =
    TRANSITIONS_FOR_LAYOUT[activeLayout].filter((tr) => AD_SLIDESHOW_TRANSITIONS.includes(tr))

  return (
    <div className="space-y-4 rounded-[20px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.35)] p-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6f665d]">
          {t('advertising.mediaEditor.bannerTypes')}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[#9a8776]">
          {t('advertising.mediaEditor.bannerTypesHint')}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AD_BANNER_LAYOUT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveLayout(key)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                activeLayout === key
                  ? 'bg-[#6366f1] text-white shadow-sm'
                  : 'border border-[rgba(99,102,241,0.25)] bg-white/60 text-[#5f5a54] hover:bg-white'
              }`}
            >
              {layoutLabel(key)}
              {layoutHasPrefs(style, key) && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6f665d]">
            {t('advertising.mediaEditor.previewFrame')} — {layoutLabel(activeLayout)}
          </p>
          {layoutHasPrefs(style, activeLayout) && (
            <button
              type="button"
              onClick={() => onStyleChange(clearLayoutPrefs(style, activeLayout))}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#6366f1]"
            >
              <RotateCcw className="h-3 w-3" />
              {t('advertising.mediaEditor.resetLayout')}
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[#9a8776]">
          {t('advertising.mediaEditor.autoFitHint')}
        </p>
        <div
          className={`relative mt-3 w-full overflow-hidden rounded-[16px] border border-[rgba(99,102,241,0.25)] ${previewAspectClass}`}
        >
          {hasMedia ? (
            <AdMediaDisplay
              src={displayUrl}
              mediaType={mediaType}
              style={style}
              layoutKey={activeLayout}
              className="h-full w-full"
              imageClassName="h-full w-full"
              animateSlides={displayMode === 'rotate'}
            />
          ) : (
            <div className="flex h-full min-h-[7.5rem] items-center justify-center bg-[#1a1816] text-xs text-white/60">
              {t('advertising.preview.placeholder')}
            </div>
          )}
        </div>
      </div>

      {hasMedia && canMulti && (
        <div>
          <p className="text-xs font-bold text-[#5f5a54]">{t('advertising.mediaEditor.images')}</p>
          <p className="mt-1 text-[11px] text-[#9a8776]">{t('advertising.mediaEditor.imagesHint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {slideUrls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative h-14 w-20 overflow-hidden rounded-lg border border-[rgba(148,163,184,0.3)]"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeSlide(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/55 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {slideUrls.length < 6 && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => extraInputRef.current?.click()}
                className="flex h-14 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(99,102,241,0.35)] text-[#6366f1] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span className="mt-0.5 text-[9px] font-semibold">
                  {isUploading ? '…' : t('advertising.mediaEditor.addImage')}
                </span>
              </button>
            )}
          </div>
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
        </div>
      )}

      {hasMedia && canMulti && slideCount >= 1 && (
        <div className="border-t border-[rgba(148,163,184,0.15)] pt-4">
          <p className="text-xs font-bold text-[#5f5a54]">
            {t('advertising.mediaEditor.displayFor')} {layoutLabel(activeLayout)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DISPLAY_MODES.map((mode) => {
              const disabled =
                (mode === 'rotate' || mode === 'collage') && slideCount < 2
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={disabled}
                  onClick={() => patchLayout({ displayMode: mode })}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:opacity-40 ${
                    displayMode === mode
                      ? 'bg-[#6366f1] text-white'
                      : 'border border-[rgba(99,102,241,0.25)] bg-white/60 text-[#5f5a54]'
                  }`}
                >
                  {modeLabel(mode)}
                </button>
              )
            })}
          </div>
          {slideCount < 2 && (
            <p className="mt-2 text-[10px] text-[#9a8776]">
              {t('advertising.mediaEditor.slideshowNeedTwo')}
            </p>
          )}

          {displayMode === 'rotate' && slideCount >= 2 && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[#6f665d]">
                {t('advertising.mediaEditor.interval')} ({(style.slideshow?.intervalMs ?? 3500) / 1000}s)
                <input
                  type="range"
                  min={1500}
                  max={8000}
                  step={500}
                  value={style.slideshow?.intervalMs ?? 3500}
                  onChange={(e) => patchSlideshow({ intervalMs: Number(e.target.value) })}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-xs font-semibold text-[#6f665d]">
                {t('advertising.mediaEditor.transition')}
                <select
                  value={transition}
                  onChange={(e) =>
                    patchLayout({ transition: e.target.value as AdSlideshowTransition })
                  }
                  className="input-glass mt-1 w-full"
                >
                  {transitionsForLayout.map((tr) => (
                    <option key={tr} value={tr}>
                      {transitionLabel(tr)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-[10px] text-[#9a8776] sm:col-span-2">
                {t('advertising.mediaEditor.transitionDefault')}:{' '}
                {transitionLabel(LAYOUT_DEFAULT_TRANSITION[activeLayout])}
              </p>
            </div>
          )}

          {displayMode === 'collage' && slideCount >= 2 && (
            <p className="mt-2 text-[11px] text-[#9a8776]">
              {t('advertising.mediaEditor.collageHint')}
            </p>
          )}
        </div>
      )}

      {!hasMedia && (
        <p className="flex items-center gap-2 text-xs text-[#9a8776]">
          <ImagePlus className="h-4 w-4" />
          {t('advertising.mediaEditor.uploadFirst')}
        </p>
      )}
    </div>
  )
}
