import { useState } from 'react'
import { AlertCircle, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { TranslationKey } from '../../lib/i18n'
import { aiDb } from '../../lib/ai/db'
import { supabase } from '../../lib/supabase'
import {
  AD_IMAGE_VARIANTS,
  generateAllAdVariants,
  validateAdImageFile,
  type AdImageVariantKey,
} from '../../lib/bots'

type AdImageAdaptPanelProps = {
  userId: string
  campaignId?: string | null
  onVariantsReady?: (urls: Record<string, string>) => void
}

/** Завантаження одного зображення → варіанти для рекламних блоків */
export function AdImageAdaptPanel({ userId, campaignId, onVariantsReady }: AdImageAdaptPanelProps) {
  const { t } = useApp()
  const [status, setStatus] = useState<
    'idle' | 'original_uploaded' | 'processing' | 'ready' | 'failed'
  >('idle')
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [assetId, setAssetId] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    const validation = validateAdImageFile(file)
    if (validation === 'invalid_type') {
      setError(t('ai.adImage.errorType'))
      return
    }
    if (validation === 'too_large') {
      setError(t('ai.adImage.errorSize'))
      return
    }

    setStatus('processing')

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const origPath = `ad-assets/${userId}/${Date.now()}-orig.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(origPath, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (upErr) throw upErr

      const { data: origUrl } = supabase.storage.from('media').getPublicUrl(origPath)
      setStatus('original_uploaded')

      const { data: assetRow, error: assetErr } = await aiDb
        .from('ad_image_assets')
        .insert({
          user_id: userId,
          campaign_id: campaignId ?? null,
          original_path: origPath,
          original_url: origUrl.publicUrl,
          mime_type: file.type,
          file_size_bytes: file.size,
          status: 'processing',
        })
        .select('id')
        .maybeSingle()

      if (assetErr) throw assetErr
      const aid = assetRow?.id as string
      setAssetId(aid)

      const blobs = await generateAllAdVariants(file)
      const urls: Record<string, string> = {}

      for (const spec of AD_IMAGE_VARIANTS) {
        const blob = blobs[spec.key as AdImageVariantKey]
        const vPath = `ad-assets/${userId}/${aid}-${spec.key}.jpg`
        const { error: vErr } = await supabase.storage.from('media').upload(vPath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        })
        if (vErr) throw vErr
        const { data: vUrl } = supabase.storage.from('media').getPublicUrl(vPath)
        urls[spec.key] = vUrl.publicUrl

        await aiDb.from('ad_image_variants').upsert({
          asset_id: aid,
          variant_key: spec.key,
          width: spec.width,
          height: spec.height,
          storage_path: vPath,
          public_url: vUrl.publicUrl,
        })
      }

      await aiDb
        .from('ad_image_assets')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', aid)

      setPreviews(urls)
      setStatus('ready')
      onVariantsReady?.(urls)
    } catch (e) {
      console.error(e)
      setStatus('failed')
      setError(e instanceof Error ? e.message : t('ai.adImage.errorGeneric'))
      if (assetId) {
        await aiDb.from('ad_image_assets').update({ status: 'failed', error_message: String(e) }).eq('id', assetId)
      }
    }
  }

  return (
    <div className="rounded-[20px] border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.04)] p-4">
      <p className="text-sm font-bold text-[#2f2a24]">{t('ai.adImage.title')}</p>
      <p className="mt-1 text-[11px] text-[#6f665d]">{t('ai.adImage.desc')}</p>

      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-[rgba(99,102,241,0.35)] py-8">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
        {status === 'processing' ? (
          <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
        ) : (
          <ImagePlus className="h-8 w-8 text-[#6366f1]" />
        )}
        <span className="mt-2 text-xs font-semibold text-[#6366f1]">{t('ai.adImage.upload')}</span>
      </label>

      <p className="mt-2 text-[10px] text-[#9a8776]">
        {t('ai.adImage.status')}: {t(`ai.adImage.status.${status}`)}
      </p>

      {error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-[#c45a4a]">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            {t('ai.retry')}
          </button>
        </p>
      )}

      {status === 'ready' && (
        <p className="mt-2 flex items-center gap-1 text-xs text-[#3d7a52]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('ai.adImage.ready')}
        </p>
      )}

      {Object.keys(previews).length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {AD_IMAGE_VARIANTS.map((spec) => (
            <div key={spec.key} className="overflow-hidden rounded-lg border border-[rgba(148,163,184,0.2)]">
              <p className="bg-white/80 px-2 py-0.5 text-[9px] font-semibold">{t(spec.labelKey as TranslationKey)}</p>
              {previews[spec.key] ? (
                <img src={previews[spec.key]} alt="" className="h-20 w-full object-cover" />
              ) : (
                <div className="flex h-20 items-center justify-center text-[10px] text-[#9a8776]">—</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
