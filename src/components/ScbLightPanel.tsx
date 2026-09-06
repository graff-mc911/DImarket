import { useCallback, useEffect, useState } from 'react'
import { Calculator, ExternalLink, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  fetchScbLinkStatus,
  provisionScbAccount,
  SCB_LIGHT_URL,
  type ScbLinkStatus,
} from '../lib/scbLight'

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
  const [provisioning, setProvisioning] = useState(false)

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

  const createAccount = () => {
    setProvisioning(true)
    provisionScbAccount({})
    window.setTimeout(() => {
      void reload().finally(() => setProvisioning(false))
    }, 1200)
  }

  const statusLine = () => {
    if (loading) return t('scbLight.loading')
    if (status === 'provisioned') return t('scbLight.statusReady')
    if (status === 'existing_email') return t('scbLight.statusExisting')
    if (status === 'failed') return t('scbLight.statusFailed')
    return t('scbLight.statusPending')
  }

  const showCreate = !loading && (status === null || status === 'failed')

  if (variant === 'banner') {
    return (
      <div className="mb-4 flex flex-col gap-3 rounded-none border border-[#dbeafe] bg-[linear-gradient(135deg,rgba(219,234,254,0.55),rgba(255,255,255,0.95))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[#2563eb] text-white">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#2f2a24]">{t('scbLight.title')}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#6f665d]">{t('scbLight.subtitle')}</p>
            <p className="mt-1 text-[11px] text-[#8a8178]">{t('scbLight.pipeline')}</p>
            <p className="mt-1 text-[11px] text-[#8a8178]">{statusLine()}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {(status === null || status === 'failed') && (
            <button
              type="button"
              disabled={provisioning}
              onClick={createAccount}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#2563eb]/40 bg-white px-4 py-2 text-[12px] font-semibold text-[#2563eb] hover:bg-[#eff6ff] disabled:opacity-60"
            >
              {provisioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('scbLight.createAccount')}
            </button>
          )}
          <button
            type="button"
            onClick={openScb}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            {t('scbLight.open')}
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-none border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.05)] p-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-[#2563eb]" />
        <span className="font-semibold text-[#2f2a24]">{t('scbLight.title')}</span>
      </div>
      <p className="mt-2 text-sm text-[#6f665d]">{t('scbLight.subtitle')}</p>
      <p className="mt-1 text-xs text-[#8a8178]">{t('scbLight.pipeline')}</p>
      <p className="mt-2 text-xs text-[#8a8178]">
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('scbLight.loading')}
          </span>
        ) : (
          statusLine()
        )}
      </p>
      <p className="mt-1 text-xs text-[#8a8178]">{t('scbLight.sameCredentials')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {showCreate ? (
          <button
            type="button"
            disabled={provisioning}
            onClick={createAccount}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(37,99,235,0.35)] bg-white/80 px-4 py-2 text-xs font-semibold text-[#2563eb] hover:bg-white disabled:opacity-60"
          >
            {provisioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {t('scbLight.createAccount')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={openScb}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
        >
          {t('scbLight.open')}
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
