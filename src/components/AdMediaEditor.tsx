import { useCallback, useRef, useState } from 'react'
import { GripHorizontal, ImagePlus, Plus, Sun, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  clampPercent,
  DEFAULT_AD_MEDIA_STYLE,
  type AdMediaFit,
  type AdMediaStyle,
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
  onUploadFile: (file: File) => Promise<void>
  previewAspectClass?: string
}

export function AdMediaEditor({
  mediaType,
  primaryUrl,
  slideUrls,
  style,
  onStyleChange,
  onSlideUrlsChange,
  onPrimaryUrlChange,
  onUploadFile,
  previewAspectClass = 'aspect-[2.4/1] min-h-[7.5rem] max-h-[10rem]',
}: AdMediaEditorProps) {
  const { t } = useApp()
  const frameRef = useRef<HTMLDivElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const displayUrl = slideUrls[0] || primaryUrl
  const canMulti = mediaType === 'image' || mediaType === 'gif'
  const hasMedia = Boolean(displayUrl.trim())

  const patchStyle = (patch: Partial<AdMediaStyle>) => {
    onStyleChange({ ...style, ...patch })
  }

  const movePosition = useCallback(
    (clientX: number, clientY: number) => {
      const el = frameRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 100
      const y = ((clientY - rect.top) / rect.height) * 100
      patchStyle({ positionX: clampPercent(x), positionY: clampPercent(y) })
    },
    [style],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (!hasMedia || mediaType === 'video') return
    e.preventDefault()
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    movePosition(e.clientX, e.clientY)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    movePosition(e.clientX, e.clientY)
  }

  const onPointerUp = () => setDragging(false)

  const removeSlide = (index: number) => {
    const next = slideUrls.filter((_, i) => i !== index)
    onSlideUrlsChange(next)
    if (index === 0) onPrimaryUrlChange(next[0] ?? '')
  }

  const addSlidesFromFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      await onUploadFile(file)
    }
  }

  return (
    <div className="space-y-4 rounded-[20px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.35)] p-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6f665d]">
          {t('advertising.mediaEditor.previewFrame')}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[#9a8776]">
          {t('advertising.mediaEditor.dragHint')}
        </p>
        <div
          ref={frameRef}
          className={`relative mt-3 w-full cursor-crosshair overflow-hidden rounded-[16px] border border-[rgba(99,102,241,0.25)] ${previewAspectClass}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {hasMedia ? (
            <AdMediaDisplay
              src={displayUrl}
              mediaType={mediaType}
              style={style}
              className="h-full w-full"
              imageClassName="h-full w-full"
              animateSlides={slideUrls.length > 1}
            />
          ) : (
            <div className="flex h-full min-h-[7.5rem] items-center justify-center bg-[#1a1816] text-xs text-white/60">
              {t('advertising.preview.placeholder')}
            </div>
          )}
          {hasMedia && mediaType !== 'video' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <GripHorizontal className="h-6 w-6 text-white/50 drop-shadow" />
            </div>
          )}
        </div>
      </div>

      {hasMedia && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#6f665d]">
            {t('advertising.mediaEditor.fit')}
            <select
              value={style.fit}
              onChange={(e) => patchStyle({ fit: e.target.value as AdMediaFit })}
              className="input-glass mt-1 w-full"
            >
              <option value="cover">{t('advertising.mediaEditor.fitCover')}</option>
              <option value="contain">{t('advertising.mediaEditor.fitContain')}</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#6f665d]">
            {t('advertising.mediaEditor.scale')} ({style.scale}%)
            <input
              type="range"
              min={80}
              max={160}
              value={style.scale}
              onChange={(e) => patchStyle({ scale: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#6f665d] sm:col-span-2">
            <Sun className="h-3.5 w-3.5 shrink-0" />
            {t('advertising.mediaEditor.brightness')} ({style.brightness}%)
            <input
              type="range"
              min={60}
              max={140}
              value={style.brightness}
              onChange={(e) => patchStyle({ brightness: Number(e.target.value) })}
              className="min-w-0 flex-1"
            />
          </label>
          <label className="block text-xs font-semibold text-[#6f665d]">
            {t('advertising.mediaEditor.contrast')} ({style.contrast}%)
            <input
              type="range"
              min={60}
              max={140}
              value={style.contrast}
              onChange={(e) => patchStyle({ contrast: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </label>
          <label className="block text-xs font-semibold text-[#6f665d]">
            {t('advertising.mediaEditor.positionX')} ({style.positionX}%)
            <input
              type="range"
              min={0}
              max={100}
              value={style.positionX}
              onChange={(e) => patchStyle({ positionX: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </label>
          <label className="block text-xs font-semibold text-[#6f665d]">
            {t('advertising.mediaEditor.positionY')} ({style.positionY}%)
            <input
              type="range"
              min={0}
              max={100}
              value={style.positionY}
              onChange={(e) => patchStyle({ positionY: Number(e.target.value) })}
              className="mt-2 w-full"
            />
          </label>
        </div>
      )}

      {canMulti && hasMedia && (
        <div className="border-t border-[rgba(148,163,184,0.15)] pt-4">
          <p className="text-xs font-bold text-[#5f5a54]">{t('advertising.mediaEditor.slideshow')}</p>
          <p className="mt-1 text-[11px] text-[#9a8776]">{t('advertising.mediaEditor.slideshowHint')}</p>

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
                onClick={() => extraInputRef.current?.click()}
                className="flex h-14 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(99,102,241,0.35)] text-[#6366f1]"
              >
                <Plus className="h-4 w-4" />
                <span className="mt-0.5 text-[9px] font-semibold">{t('advertising.mediaEditor.addImage')}</span>
              </button>
            )}
          </div>

          {slideUrls.length > 1 && (
            <label className="mt-3 block text-xs font-semibold text-[#6f665d]">
              {t('advertising.mediaEditor.interval')} ({(style.slideshow?.intervalMs ?? 3500) / 1000}s)
              <input
                type="range"
                min={1500}
                max={8000}
                step={500}
                value={style.slideshow?.intervalMs ?? 3500}
                onChange={(e) =>
                  patchStyle({
                    slideshow: {
                      urls: slideUrls,
                      intervalMs: Number(e.target.value),
                      transition: style.slideshow?.transition ?? 'fade',
                    },
                  })
                }
                className="mt-2 w-full"
              />
            </label>
          )}

          <input
            ref={extraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (files?.length) void addSlidesFromFiles(files)
              e.target.value = ''
            }}
          />
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
