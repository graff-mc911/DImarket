import { Film, ImagePlus, Play, Upload, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { DEFAULT_AD_MEDIA_STYLE, type AdMediaStyle } from '../lib/adMediaStyle'
import { useAdBannerMediaUpload, type BannerMediaType } from '../hooks/useAdBannerMediaUpload'
import { AdMediaDisplay } from './AdMediaDisplay'
import { AdMediaEditor } from './AdMediaEditor'

type AdBannerMediaFormProps = {
  mediaType: BannerMediaType
  setMediaType: (t: BannerMediaType) => void
  mediaUrl: string
  setMediaUrl: (url: string) => void
  slideUrls: string[]
  setSlideUrls: (urls: string[] | ((prev: string[]) => string[])) => void
  mediaStyle: AdMediaStyle
  setMediaStyle: (s: AdMediaStyle) => void
  showTypeSwitcher?: boolean
}

export function AdBannerMediaForm({
  mediaType,
  setMediaType,
  mediaUrl,
  setMediaUrl,
  slideUrls,
  setSlideUrls,
  mediaStyle,
  setMediaStyle,
  showTypeSwitcher = true,
}: AdBannerMediaFormProps) {
  const { t } = useApp()
  const {
    fileInputRef,
    uploadState,
    pendingUploads,
    isDragOver,
    setIsDragOver,
    canMultiImage,
    hasBannerMedia,
    uploadFiles,
    openFilePicker,
    handleDrop,
    handleFileChange,
    applyBannerUrl,
    clearMedia,
    acceptedMime,
  } = useAdBannerMediaUpload({
    mediaUrl,
    slideUrls,
    mediaType,
    setMediaUrl,
    setSlideUrls,
    setMediaType,
    uploadErrorFallback: t('advertising.error.upload'),
  })

  return (
    <div className="space-y-4">
      {showTypeSwitcher && (
        <div className="flex justify-end">
          <div className="flex gap-1 rounded-full border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.5)] p-0.5">
            {(['image', 'gif', 'video'] as BannerMediaType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                className={
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ' +
                  (mediaType === type
                    ? 'bg-white text-[#2f2a24] shadow-sm'
                    : 'text-[#6f665d] hover:text-[#2f2a24]')
                }
              >
                {type === 'video' && <Film className="h-3 w-3" />}
                {type === 'gif' && <Play className="h-3 w-3" />}
                {type === 'image' && <ImagePlus className="h-3 w-3" />}
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={
          'relative rounded-[22px] border-2 border-dashed transition ' +
          (isDragOver
            ? 'border-[#6366f1] bg-[rgba(99,102,241,0.05)]'
            : hasBannerMedia
              ? 'border-[rgba(34,197,94,0.4)] bg-[rgba(236,250,240,0.6)]'
              : uploadState.status === 'error'
                ? 'border-[rgba(239,68,68,0.4)] bg-[rgba(255,237,232,0.6)]'
                : 'border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.3)]')
        }
      >
        {hasBannerMedia && uploadState.status !== 'uploading' ? (
          <div className="p-3">
            <div className="relative overflow-hidden rounded-[16px]">
              <AdMediaDisplay
                src={slideUrls[0] || mediaUrl}
                mediaType={mediaType}
                style={mediaStyle}
                className="h-48 w-full"
                imageClassName="h-full w-full"
                animateSlides={(mediaStyle.slideshow?.urls?.length ?? 0) > 1}
              />
              <button
                type="button"
                onClick={() => {
                  clearMedia()
                  setMediaStyle({ ...DEFAULT_AD_MEDIA_STYLE })
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {canMultiImage && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {slideUrls.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative h-12 w-16 overflow-hidden rounded-lg border border-[rgba(148,163,184,0.35)]"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {slideUrls.length < 6 && (
                  <button
                    type="button"
                    disabled={pendingUploads > 0}
                    onClick={() => openFilePicker(true)}
                    className="flex h-12 items-center gap-1.5 rounded-full border border-dashed border-[rgba(99,102,241,0.45)] px-3 text-xs font-semibold text-[#6366f1] disabled:opacity-50"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {pendingUploads > 0
                      ? t('advertising.form.uploadingMore')
                      : t('advertising.form.addMoreImages')}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : uploadState.status === 'uploading' && !hasBannerMedia ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(99,102,241,0.2)] border-t-[#6366f1]" />
            <div className="text-sm font-semibold text-[#6f665d]">
              {t('advertising.form.uploading')} {uploadState.progress}%
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openFilePicker(false)}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 p-10 hover:bg-[rgba(99,102,241,0.04)]"
          >
            <div
              className={
                'flex h-14 w-14 items-center justify-center rounded-[20px] ' +
                (uploadState.status === 'error'
                  ? 'bg-[rgba(239,68,68,0.10)] text-[#ef4444]'
                  : 'bg-[rgba(99,102,241,0.10)] text-[#6366f1]')
              }
            >
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center text-sm font-semibold text-[#2f2a24]">
              {t('advertising.form.mediaDrop')}
            </div>
            {canMultiImage && (
              <div className="text-[11px] text-[#6366f1]">{t('advertising.form.mediaMultiPick')}</div>
            )}
            {uploadState.status === 'error' && uploadState.error && (
              <div className="text-xs font-semibold text-[#ef4444]">{uploadState.error}</div>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMime.join(',')}
        multiple={canMultiImage}
        onChange={handleFileChange}
        className="hidden"
      />

      <label className="block text-xs font-semibold text-[#6f665d]">
        {t('advertising.form.mediaUrlLabel')}
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => applyBannerUrl(e.target.value)}
          className="input-glass mt-1 w-full"
          placeholder={t('advertising.form.mediaUrlPlaceholder')}
        />
      </label>

      {hasBannerMedia && (
        <AdMediaEditor
          mediaType={mediaType}
          primaryUrl={mediaUrl}
          slideUrls={slideUrls.length ? slideUrls : [mediaUrl]}
          style={mediaStyle}
          onStyleChange={setMediaStyle}
          onSlideUrlsChange={setSlideUrls}
          onPrimaryUrlChange={setMediaUrl}
          onUploadFiles={(files) => uploadFiles(files, { append: true })}
          isUploading={pendingUploads > 0}
        />
      )}
    </div>
  )
}
