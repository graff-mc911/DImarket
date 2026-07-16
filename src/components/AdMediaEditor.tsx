import { useRef, useState } from 'react'
import { ImagePlus, Plus, X } from 'lucide-react'
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
  /** Компактна панель без великого превʼю (превʼю на схемі слотів) */
  compact?: boolean
  /** Фіксований тип банера — без перемикання layout */
  fixedLayoutKey?: AdBannerLayoutKey
  onClearMedia?: () => void
  /** Один файл на слот — без галереї та додавання кадрів */
  singleImageOnly?: boolean
  /** Показати режим/анімацію навіть для singleImageOnly (компактний редактор слотів) */
  showAnimationControls?: boolean
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
  compact = false,
  fixedLayoutKey,
  onClearMedia,
  singleImageOnly = false,
  showAnimationControls = false,
}: AdMediaEditorProps) {
  const { t } = useApp()
  const extraInputRef = useRef<HTMLInputElement>(null)
  const [activeLayout, setActiveLayout] = useState<AdBannerLayoutKey>(fixedLayoutKey ?? 'center')
  const layoutKey = fixedLayoutKey ?? activeLayout

  const displayUrl = slideUrls[0] || primaryUrl
  const canMulti = mediaType === 'image' || mediaType === 'gif'
  const hasMedia = Boolean(displayUrl.trim())
  const previewAspectClass = AD_BANNER_LAYOUT_META[layoutKey].aspectClass
  const slideCount = slideUrls.filter(Boolean).length
  const activeDisplayMode = resolveDisplayMode(style, layoutKey, slideCount)

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

  const patchLayout = (layout: AdBannerLayoutKey, patch: Partial<ReturnType<typeof resolveLayoutPrefs>>) => {
    const prefs = resolveLayoutPrefs(style, layout)
    onStyleChange(setLayoutPrefs(style, layout, { ...prefs, ...patch }))
  }

  const removeSlide = (index: number) => {
    const next = slideUrls.filter((_, i) => i !== index)
    onSlideUrlsChange(next)
    onPrimaryUrlChange(next[0] ?? '')
    if (next.length > 1) {
      patchSlideshow({ urls: next })
    } else {
      onStyleChange({ ...style, slideshow: null })
    }
    if (next.length === 0 && onClearMedia) onClearMedia()
  }

  const layoutLabel = (key: AdBannerLayoutKey) => t(`advertising.mediaEditor.layout.${key}`)
  const modeLabel = (mode: AdDisplayMode) => t(`advertising.mediaEditor.mode.${mode}`)
  const transitionLabel = (tr: AdSlideshowTransition) =>
    t(`advertising.mediaEditor.transition.${tr}`)

  const anyRotate =
    slideCount >= 2 &&
    AD_BANNER_LAYOUT_KEYS.some((k) => resolveDisplayMode(style, k, slideCount) === 'rotate')

  const shellClass = compact
    ? 'space-y-3'
    : 'space-y-4 rounded-[20px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.35)] p-4'

  return (
    <div className={shellClass}>
      {!compact && (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6f665d]">
          {t('advertising.mediaEditor.previewFrame')}
        </p>
        {!fixedLayoutKey && (
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
            </button>
          ))}
        </div>
        )}
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
              layoutKey={layoutKey}
              className="h-full w-full"
              animateSlides={activeDisplayMode === 'rotate'}
            />
          ) : (
            <div className="flex h-full min-h-[7.5rem] items-center justify-center bg-[#1a1816] text-xs text-white/60">
              {t('advertising.preview.placeholder')}
            </div>
          )}
        </div>
      </div>
      )}

      {compact && onClearMedia && hasMedia && (
        <button
          type="button"
          onClick={onClearMedia}
          className="flex w-full items-center justify-center gap-1 rounded-full border border-[rgba(239,68,68,0.3)] py-1.5 text-[10px] font-semibold text-[#b91c1c]"
        >
          <X className="h-3 w-3" />
          {t('advertising.slotStudio.removeMedia')}
        </button>
      )}

      {hasMedia && canMulti && !singleImageOnly && (
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

      {(hasMedia && canMulti && !singleImageOnly) ||
      (hasMedia && showAnimationControls) ? (
        <div className={compact ? 'space-y-2' : 'border-t border-[rgba(148,163,184,0.15)] pt-4'}>
          {!compact && (
          <>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6f665d]">
            {t('advertising.mediaEditor.perLayoutTitle')}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[#9a8776]">
            {t('advertising.mediaEditor.perLayoutHint')}
          </p>
          </>
          )}

          {slideCount < 2 && (
            <p className="mt-2 text-[10px] text-[#9a8776]">
              {t('advertising.mediaEditor.slideshowNeedTwo')}
            </p>
          )}

          <div className="mt-3 space-y-3">
            {(showAnimationControls && fixedLayoutKey
              ? [fixedLayoutKey]
              : fixedLayoutKey
                ? [fixedLayoutKey]
                : AD_BANNER_LAYOUT_KEYS
            ).map((lk) => {
              const mode = resolveDisplayMode(style, lk, slideCount)
              const transition = resolveLayoutTransition(style, lk)
              const transitions = TRANSITIONS_FOR_LAYOUT[lk].filter((tr) =>
                AD_SLIDESHOW_TRANSITIONS.includes(tr),
              )

              return (
                <div
                  key={lk}
                  className="rounded-[14px] border border-[rgba(148,163,184,0.18)] bg-white/40 p-3"
                >
                  {!compact && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#2f2a24]">
                      {layoutLabel(lk)}
                      {layoutHasPrefs(style, lk) && (
                        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                      )}
                    </span>
                    {layoutHasPrefs(style, lk) && (
                      <button
                        type="button"
                        onClick={() => onStyleChange(clearLayoutPrefs(style, lk))}
                        className="text-[10px] font-semibold text-[#6366f1]"
                      >
                        {t('advertising.mediaEditor.resetLayout')}
                      </button>
                    )}
                  </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1">
                    {DISPLAY_MODES.map((m) => {
                      const disabled = (m === 'rotate' || m === 'collage') && slideCount < 2
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={disabled}
                          onClick={() => patchLayout(lk, { displayMode: m })}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold disabled:opacity-40 ${
                            mode === m
                              ? 'bg-[#6366f1] text-white'
                              : 'border border-[rgba(99,102,241,0.2)] text-[#5f5a54]'
                          }`}
                        >
                          {modeLabel(m)}
                        </button>
                      )
                    })}
                  </div>

                  <label className="mt-2 block text-[10px] font-semibold text-[#6f665d]">
                    {t('advertising.mediaEditor.effectForLayout')}
                    <select
                      value={transition}
                      disabled={mode !== 'rotate' || slideCount < 2}
                      onChange={(e) =>
                        patchLayout(lk, {
                          transition: e.target.value as AdSlideshowTransition,
                        })
                      }
                      className="input-glass mt-1 w-full text-xs disabled:opacity-50"
                    >
                      {transitions.map((tr) => (
                        <option key={tr} value={tr}>
                          {transitionLabel(tr)}
                        </option>
                      ))}
                    </select>
                    {mode !== 'rotate' && slideCount >= 2 && (
                      <span className="mt-0.5 block text-[9px] font-normal text-[#9a8776]">
                        {t('advertising.mediaEditor.effectRotateOnly')}
                      </span>
                    )}
                  </label>
                </div>
              )
            })}
          </div>

          {anyRotate && slideCount >= 2 && (
            <label className="mt-4 block text-xs font-semibold text-[#6f665d]">
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
          )}

          <p className="mt-3 text-[10px] text-[#9a8776]">
            {t('advertising.mediaEditor.collageHint')}
          </p>
        </div>
      ) : null}

      {!hasMedia && (
        <p className="flex items-center gap-2 text-xs text-[#9a8776]">
          <ImagePlus className="h-4 w-4" />
          {t('advertising.mediaEditor.uploadFirst')}
        </p>
      )}
    </div>
  )
}
