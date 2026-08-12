import { useCallback, useEffect, useState } from 'react'
import { Calculator, ExternalLink, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { fetchScbLinkStatus, SCB_LIGHT_URL, type ScbLinkStatus } from '../lib/scbLight'

/** Link to SCB Light + optional provision status for professionals. */
export function ScbLightPanel({
  userId,
  variant = 'card',
}: {
  userId: string
  variant?: 'card' | 'banner'
}) {
  const { t } = useApp()
  const [status, setStatus] = useState<ScbLinkStatus>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const row = await fetchScbLinkStatus(userId)
    setStatus(row?.status ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const openScb = () => {
    window.open(SCB_LIGHT_URL, '_blank', 'noopener,noreferrer')
  }

  const statusLine = () => {
    if (loading) return t('scbLight.loading')
    if (status === 'provisioned') return t('scbLight.statusReady')
    if (status === 'existing_email') return t('scbLight.statusExisting')
    if (status === 'failed') return t('scbLight.statusFailed')
    return t('scbLight.statusPending')
  }

  if (variant === 'banner') {
    return (
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#dbeafe] bg-[linear-gradient(135deg,rgba(219,234,254,0.55),rgba(255,255,255,0.95))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1d1d1f]">{t('scbLight.title')}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#6e6e73]">{t('scbLight.subtitle')}</p>
            <p className="mt-1 text-[11px] text-[#86868b]">{statusLine()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openScb}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
        >
          {t('scbLight.open')}
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.05)] p-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-[#2563eb]" />
        <span className="font-semibold text-[#2f2a24]">{t('scbLight.title')}</span>
      </div>
      <p className="mt-2 text-sm text-[#6f665d]">{t('scbLight.subtitle')}</p>
      <p className="mt-2 text-xs text-[#86868b]">
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('scbLight.loading')}
          </span>
        ) : (
          statusLine()
        )}
      </p>
      <p className="mt-1 text-xs text-[#86868b]">{t('scbLight.sameCredentials')}</p>
      <button
        type="button"
        onClick={openScb}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(37,99,235,0.35)] bg-white/80 px-4 py-2 text-xs font-semibold text-[#2563eb] hover:bg-white"
      >
        {t('scbLight.open')}
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
