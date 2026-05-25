import { AD_IMAGE_VARIANTS, type AdImageVariantKey } from '../types'

const MAX_FILE_BYTES = 15 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export function validateAdImageFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return 'invalid_type'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'too_large'
  }
  return null
}

/** Масштабування з cover + центруванням (safe padding 4%) */
export async function renderAdVariant(
  source: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
  safePadding = 0.04,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unavailable')

  ctx.fillStyle = '#1a1816'
  ctx.fillRect(0, 0, width, height)

  const padW = width * (1 - safePadding * 2)
  const padH = height * (1 - safePadding * 2)
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const scale = Math.max(padW / sw, padH / sh)
  const dw = sw * scale
  const dh = sh * scale
  const dx = (width - dw) / 2
  const dy = (height - dh) / 2

  ctx.drawImage(source, dx, dy, dw, dh)

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob_failed'))), 'image/jpeg', 0.9)
  })
}

export async function generateAllAdVariants(
  file: File,
  onProgress?: (key: AdImageVariantKey) => void,
): Promise<Record<AdImageVariantKey, Blob>> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const out = {} as Record<AdImageVariantKey, Blob>
    for (const spec of AD_IMAGE_VARIANTS) {
      onProgress?.(spec.key)
      out[spec.key] = await renderAdVariant(img, spec.width, spec.height)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image_load_failed'))
    img.src = url
  })
}
