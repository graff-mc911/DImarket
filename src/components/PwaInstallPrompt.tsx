import { useEffect, useState } from 'react'
import { CheckCircle2, Download, ExternalLink, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePwaInstall } from '../contexts/PwaInstallContext'

const DISMISS_KEY = 'dimarket_pwa_install_dismissed'
const DISMISS_INSTALLED_KEY = 'dimarket_pwa_installed_hint_dismissed'

/**
 * Optional bottom banner — primary one-click install lives in Header / Settings.
 */
export function PwaInstallPrompt() {
  const { t } = useApp()
  const { canInstall, isInstalled, isStandalone, install } = usePwaInstall()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone) {
      setVisible(false)
      return
    }

    if (canInstall) {
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return
      } catch {
        /* ignore */
      }
      setVisible(true)
      return
    }

    if (isInstalled) {
      try {
        if (sessionStorage.getItem(DISMISS_INSTALLED_KEY) === '1') return
      } catch {
        /* ignore */
      }
      setVisible(true)
      return
    }

    setVisible(false)
  }, [canInstall, isInstalled, isStandalone])

  if (!visible) return null

  const mode = canInstall ? 'install' : 'already'

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(
        mode === 'already' ? DISMISS_INSTALLED_KEY : DISMISS_KEY,
        '1',
      )
    } catch {
      /* ignore */
    }
  }

  const installNow = async () => {
    const outcome = await install()
    if (outcome === 'accepted') {
      setVisible(false)
    } else if (outcome === 'dismissed') {
      dismiss()
    }
  }

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[80] mx-auto max-w-md xl:bottom-6">
      <div className="flex items-start gap-3 rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-none text-white ${
            mode === 'already' ? 'bg-emerald-600' : 'bg-[#2f2a24]'
          }`}
        >
          {mode === 'already' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#2f2a24]">
            {mode === 'already' ? t('pwa.alreadyTitle') : t('pwa.installTitle')}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-[#6f665d]">
            {mode === 'already' ? t('pwa.alreadyText') : t('pwa.installText')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mode === 'install' ? (
              <button
                type="button"
                onClick={() => void installNow()}
                className="inline-flex items-center justify-center rounded-full bg-[#2f2a24] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
              >
                {t('pwa.saveAsApp')}
              </button>
            ) : null}
            {mode === 'already' ? (
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <ExternalLink className="h-3.5 w-3.5" />
                {t('pwa.alreadyHint')}
              </p>
            ) : (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(148,163,184,0.35)] px-3.5 py-1.5 text-xs font-semibold text-[#6f665d] hover:bg-[#f3f0ea]"
              >
                {t('pwa.installLater')}
              </button>
            )}
            {mode === 'already' ? (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(148,163,184,0.35)] px-3.5 py-1.5 text-xs font-semibold text-[#6f665d] hover:bg-[#f3f0ea]"
              >
                {t('pwa.installLater')}
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-[#8a8178] hover:bg-[#f3f0ea]"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
