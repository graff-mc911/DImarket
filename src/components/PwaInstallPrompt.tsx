import { useEffect, useState } from 'react'
import { CheckCircle2, Download, ExternalLink, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'dimarket_pwa_install_dismissed'
const DISMISS_INSTALLED_KEY = 'dimarket_pwa_installed_hint_dismissed'

async function detectInstalledPwa(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  if (standalone) return true

  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; url?: string }>>
  }
  if (typeof nav.getInstalledRelatedApps === 'function') {
    try {
      const apps = await nav.getInstalledRelatedApps()
      if (apps?.length) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

/**
 * Desktop/mobile install CTA.
 * If Chrome already shows «Open in app», the PWA is installed — explain that.
 */
export function PwaInstallPrompt() {
  const { t } = useApp()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<'hidden' | 'install' | 'already'>('hidden')

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    void (async () => {
      const already = await detectInstalledPwa()
      if (cancelled) return
      if (already) {
        try {
          if (sessionStorage.getItem(DISMISS_INSTALLED_KEY) === '1') return
        } catch {
          /* ignore */
        }
        // Only hint when browsing in a normal tab (not inside the app window)
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setMode('already')
        }
        return
      }

      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return
      } catch {
        /* ignore */
      }
    })()

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('install')
    }
    const onInstalled = () => {
      setDeferred(null)
      setMode('already')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      cancelled = true
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (mode === 'hidden') return null

  const dismiss = () => {
    setMode('hidden')
    try {
      sessionStorage.setItem(
        mode === 'already' ? DISMISS_INSTALLED_KEY : DISMISS_KEY,
        '1',
      )
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setMode('already')
      } else {
        dismiss()
      }
    } catch {
      dismiss()
    } finally {
      setDeferred(null)
    }
  }

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[80] mx-auto max-w-md xl:bottom-6">
      <div className="flex items-start gap-3 rounded-2xl border border-[#e8e8ed] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
            mode === 'already' ? 'bg-emerald-600' : 'bg-[#1d1d1f]'
          }`}
        >
          {mode === 'already' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d1d1f]">
            {mode === 'already' ? t('pwa.alreadyTitle') : t('pwa.installTitle')}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-[#6e6e73]">
            {mode === 'already' ? t('pwa.alreadyText') : t('pwa.installText')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mode === 'install' && deferred ? (
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex items-center justify-center rounded-full bg-[#1d1d1f] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
              >
                {t('pwa.installButton')}
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
                className="inline-flex items-center justify-center rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7]"
              >
                {t('pwa.installLater')}
              </button>
            )}
            {mode === 'already' ? (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center justify-center rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7]"
              >
                {t('pwa.installLater')}
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-[#86868b] hover:bg-[#f5f5f7]"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
