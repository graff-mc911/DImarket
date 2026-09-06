import { useCallback, useEffect, useState } from 'react'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  connectStatusLabel,
  fetchConnectStatus,
  openConnectDashboard,
  startConnectOnboarding,
  type ConnectStatus,
} from '../lib/stripeConnect'

/** Compact Stripe Connect Express CTA for Settings / ProDashboard. */
export function ConnectPayoutPanel({
  variant = 'card',
  returnPath = '/settings?connect=return',
}: {
  variant?: 'card' | 'banner'
  returnPath?: string
}) {
  const { t } = useApp()
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetchConnectStatus()
    if ('error' in res) {
      setError(res.error)
      setStatus(null)
    } else {
      setStatus(res)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
    const params = new URLSearchParams(window.location.search)
    if (params.get('connect') === 'return' || params.get('connect') === 'refresh') {
      void reload()
    }
  }, [reload])

  const onOnboard = async () => {
    setBusy(true)
    setError(null)
    const res = await startConnectOnboarding({
      returnPath,
      refreshPath: returnPath.includes('?')
        ? returnPath.replace(/connect=[^&]*/, 'connect=refresh')
        : `${returnPath}?connect=refresh`,
    })
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    window.location.href = res.url
  }

  const onManage = async () => {
    setBusy(true)
    setError(null)
    const res = await openConnectDashboard()
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  if (variant === 'banner') {
    if (loading || status?.ready) return null
    return (
      <div className="mb-4 rounded-none border border-[rgba(148,163,184,0.22)] bg-white px-4 py-3">
        <p className="text-[13px] font-semibold text-[#2f2a24]">
          {t('connect.bannerTitle' as never) || 'Enable payouts to receive escrow'}
        </p>
        <p className="mt-1 text-[12px] text-[#6f665d]">
          {t('connect.bannerSub' as never) ||
            'Connect Stripe Express so project funds transfer to you after completion.'}
        </p>
        {error ? <p className="mt-2 text-[12px] text-[#b91c1c]">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          className="mt-2 rounded-full bg-[#2f2a24] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
          onClick={() => void onOnboard()}
        >
          {busy ? '…' : t('connect.enableCta' as never) || 'Connect payouts'}
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card mb-6 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-[#c96d2c]" />
        <div>
          <h2 className="text-xl font-extrabold text-[#2f2a24]">
            {t('connect.title' as never) || 'Project payouts'}
          </h2>
          <p className="mt-1 text-sm text-[#6f665d]">
            {t('connect.sub' as never) ||
              'Stripe Connect Express — receive escrow Transfers after the client completes the project (platform fee 5%).'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#7a7168]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading' as never) || 'Loading…'}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#2f2a24]">
            {connectStatusLabel(status)}
            {status?.ready ? (
              <span className="ml-2 rounded-full bg-[rgba(236,250,240,0.92)] px-2 py-0.5 text-xs font-bold text-[#3d7a52]">
                Ready
              </span>
            ) : null}
          </p>
          {error ? <p className="mt-2 text-sm text-[#a44a3a]">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {!status?.ready ? (
              <button
                type="button"
                disabled={busy}
                className="btn-primary rounded-full disabled:opacity-40"
                onClick={() => void onOnboard()}
              >
                {busy
                  ? '…'
                  : status?.connected
                    ? t('connect.continueCta' as never) || 'Continue onboarding'
                    : t('connect.enableCta' as never) || 'Connect payouts'}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                className="btn-secondary inline-flex items-center gap-1.5 rounded-full disabled:opacity-40"
                onClick={() => void onManage()}
              >
                {t('connect.manageCta' as never) || 'Manage Stripe'}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={busy || loading}
              className="btn-secondary rounded-full text-sm disabled:opacity-40"
              onClick={() => void reload()}
            >
              {t('project.matches.refresh' as never) || 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
