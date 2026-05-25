import { useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatSupabaseError } from '../lib/supabaseErrors'

const ACCEPTED_ALL = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]

const ACCEPTED_BY_TYPE = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  gif: ['image/gif'],
  video: ['video/mp4', 'video/webm'],
} as const

const MAX_FILE_MB = 20
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

export type BannerMediaType = 'image' | 'gif' | 'video'

type UploadState = { status: 'idle' | 'uploading' | 'done' | 'error'; progress: number; error?: string }

type UseAdBannerMediaUploadOptions = {
  mediaUrl: string
  slideUrls: string[]
  mediaType: BannerMediaType
  setMediaUrl: (url: string) => void
  setSlideUrls: (urls: string[] | ((prev: string[]) => string[])) => void
  setMediaType: (type: BannerMediaType) => void
  uploadErrorFallback?: string
}

export function useAdBannerMediaUpload({
  mediaUrl,
  slideUrls,
  mediaType,
  setMediaUrl,
  setSlideUrls,
  setMediaType,
  uploadErrorFallback = 'Не вдалося завантажити файл',
}: UseAdBannerMediaUploadOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 })
  const [pendingUploads, setPendingUploads] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  const canMultiImage = mediaType === 'image' || mediaType === 'gif'
  const hasBannerMedia = Boolean(mediaUrl.trim() || slideUrls.length)

  const uploadOneFile = useCallback(async (file: File): Promise<string> => {
    if (!ACCEPTED_ALL.includes(file.type)) {
      throw new Error('JPG, PNG, WebP, GIF, MP4, WebM')
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`Max ${MAX_FILE_MB} MB`)
    }
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('ad-media')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('ad-media').getPublicUrl(path)
    return data.publicUrl
  }, [])

  const uploadFiles = useCallback(
    async (files: File[], options?: { append?: boolean }) => {
      const list = files.filter((f) => f.size > 0)
      if (!list.length) return

      const append =
        options?.append === true ||
        (Boolean(mediaUrl.trim() || slideUrls.length) && canMultiImage)

      if (!append) {
        const first = list[0]
        if (ACCEPTED_BY_TYPE.video.includes(first.type as (typeof ACCEPTED_BY_TYPE.video)[number])) {
          setMediaType('video')
        } else if (first.type === 'image/gif') {
          setMediaType('gif')
        } else {
          setMediaType('image')
        }
        setMediaUrl('')
        setSlideUrls([])
      }

      const isFirstBatch = !append
      if (isFirstBatch && !hasBannerMedia) {
        setUploadState({ status: 'uploading', progress: 10 })
      }
      setPendingUploads((n) => n + list.length)

      const uploaded: string[] = []
      try {
        for (const file of list) {
          uploaded.push(await uploadOneFile(file))
        }
        if (append) {
          setSlideUrls((prev) => {
            const next = [...prev, ...uploaded]
            return next.length ? next : uploaded
          })
          if (!mediaUrl.trim()) setMediaUrl(uploaded[0])
        } else {
          setMediaUrl(uploaded[0])
          setSlideUrls(uploaded)
        }
        setUploadState({ status: 'done', progress: 100 })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        setUploadState({
          status: 'error',
          progress: 0,
          error:
            message.startsWith('Max') || message.includes('JPG')
              ? message
              : formatSupabaseError(err, uploadErrorFallback),
        })
      } finally {
        setPendingUploads((n) => Math.max(0, n - list.length))
      }
    },
    [
      canMultiImage,
      hasBannerMedia,
      mediaUrl,
      setMediaType,
      setMediaUrl,
      setSlideUrls,
      slideUrls.length,
      uploadErrorFallback,
      uploadOneFile,
    ],
  )

  const openFilePicker = (append = false) => {
    const input = fileInputRef.current
    if (!input) return
    input.multiple = append || (canMultiImage && hasBannerMedia)
    input.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    void uploadFiles(files, { append: hasBannerMedia && canMultiImage })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length) {
      void uploadFiles(files, { append: hasBannerMedia && canMultiImage })
    }
    e.target.value = ''
  }

  const applyBannerUrl = (raw: string) => {
    const url = raw.trim()
    if (!url) {
      setMediaUrl('')
      setUploadState({ status: 'idle', progress: 0 })
      return
    }
    setMediaUrl(url)
    setSlideUrls(url ? [url] : [])
    if (url.match(/\.(mp4|webm)(\?|$)/i)) setMediaType('video')
    else if (url.match(/\.gif(\?|$)/i)) setMediaType('gif')
    else setMediaType('image')
    setUploadState({ status: 'done', progress: 100 })
  }

  const clearMedia = () => {
    setMediaUrl('')
    setSlideUrls([])
    setUploadState({ status: 'idle', progress: 0 })
  }

  const acceptedMime = ACCEPTED_BY_TYPE[mediaType]

  return {
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
    ACCEPTED_ALL,
  }
}
