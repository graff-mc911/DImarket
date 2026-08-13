import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'dimarket_pwa_install_dismissed'

/**
 * Desktop/mobile install CTA. Captures beforeinstallprompt (Chrome/Edge)
 * so users can pin DImarket as a standalone app.
 */
export function PwaInstallPrompt() {
  const { t } = useApp()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    if (standalone) {
      setInstalled(true)
      return
    }

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      /* ignore */
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setInstalled(true)
      setVisible(false)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || !visible || !deferred) return null

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        setVisible(false)
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d1d1f] text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d1d1f]">{t('pwa.installTitle')}</p>
          <p className="mt-0.5 text-xs leading-snug text-[#6e6e73]">{t('pwa.installText')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void install()}
              className="inline-flex items-center justify-center rounded-full bg-[#1d1d1f] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
            >
              {t('pwa.installButton')}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-full border border-[#d2d2d7] px-3.5 py-1.5 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7]"
            >
              {t('pwa.installLater')}
            </button>
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
