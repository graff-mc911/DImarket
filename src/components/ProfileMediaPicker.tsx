import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Upload } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  PROFILE_IMAGE_ACCEPT,
  uploadProfileImage,
  validateProfileImageFile,
} from '../lib/profileMediaUpload'
import { formatSupabaseError } from '../lib/supabaseErrors'

type ProfileMediaPickerProps = {
  userId: string | null
  label: string
  hint?: string
  /** Одне фото профілю */
  single?: boolean
  photoUrl?: string
  onPhotoUrlChange?: (url: string) => void
  /** Кілька фото портфоліо */
  portfolioUrls?: string[]
  onPortfolioChange?: (urls: string[]) => void
}

export function ProfileMediaPicker({
  userId,
  label,
  hint,
  single = false,
  photoUrl = '',
  onPhotoUrlChange,
  portfolioUrls = [],
  onPortfolioChange,
}: ProfileMediaPickerProps) {
  const { t } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState('')

  const pickFiles = () => {
    if (!userId || uploading) return
    inputRef.current?.click()
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (!userId) return
    const list = Array.from(files).filter((f) => f.size > 0)
    if (!list.length) return

    setUploading(true)
    setUploadError(null)

    try {
      if (single && onPhotoUrlChange) {
        const invalid = validateProfileImageFile(list[0])
        if (invalid) throw new Error(invalid)
        const url = await uploadProfileImage(userId, list[0], 'avatar')
        onPhotoUrlChange(url)
      } else if (onPortfolioChange) {
        const uploaded: string[] = []
        for (const file of list) {
          const invalid = validateProfileImageFile(file)
          if (invalid) throw new Error(invalid)
          uploaded.push(await uploadProfileImage(userId, file, 'portfolio'))
        }
        const next = [...portfolioUrls.filter(Boolean), ...uploaded]
        onPortfolioChange(next)
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      setUploadError(
        raw === 'JPG, PNG, WebP, GIF' || raw.startsWith('Max')
          ? raw
          : formatSupabaseError(err, t('settings.error.uploadMedia')),
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const addUrl = () => {
    const url = urlDraft.trim()
    if (!url) return
    if (single && onPhotoUrlChange) {
      onPhotoUrlChange(url)
    } else if (onPortfolioChange) {
      onPortfolioChange([...portfolioUrls.filter(Boolean), url])
    }
    setUrlDraft('')
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{label}</label>
      {hint && <p className="mb-2 text-xs text-[#7a7168]">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        multiple={!single}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!userId || uploading}
          onClick={pickFiles}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.35)] bg-white/50 px-4 py-2 text-sm font-semibold text-[#2f2a24] transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {t('settings.uploadFromDevice')}
        </button>
      </div>

      {uploadError && (
        <p className="mt-2 text-xs text-[#a44a3a]">{uploadError}</p>
      )}

      {single && photoUrl && (
        <div className="mt-4 flex">
          <img
            src={photoUrl}
            alt={t('settings.profilePhotoAlt')}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white/70"
          />
        </div>
      )}

      {!single && portfolioUrls.some(Boolean) && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {portfolioUrls.map((url, index) =>
            url ? (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-[18px] bg-[rgba(255,248,241,0.4)]"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {onPortfolioChange && (
                  <button
                    type="button"
                    onClick={() =>
                      onPortfolioChange(portfolioUrls.filter((_, i) => i !== index))
                    }
                    className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    {t('settings.removePortfolioImage')}
                  </button>
                )}
              </div>
            ) : null,
          )}
        </div>
      )}

      {!single && !portfolioUrls.some(Boolean) && (
        <div className="mt-4 flex flex-col items-center rounded-[18px] border border-dashed border-[rgba(148,163,184,0.35)] bg-white/25 py-8">
          <ImagePlus className="h-10 w-10 text-[#9a8776]" />
          <p className="mt-2 text-xs text-[#7a7168]">{t('settings.portfolioEmptyHint')}</p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          className="input-glass flex-1"
          placeholder={t('settings.mediaUrlPlaceholder')}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlDraft.trim()}
          className="btn-ghost rounded-full px-4 text-sm disabled:opacity-50"
        >
          {t('settings.addMediaUrl')}
        </button>
      </div>
    </div>
  )
}
