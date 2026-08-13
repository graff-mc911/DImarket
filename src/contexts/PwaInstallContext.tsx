import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type PwaInstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

type PwaInstallContextValue = {
  /** Browser offered native install — one click via `install()`. */
  canInstall: boolean
  /** PWA already saved on this device. */
  isInstalled: boolean
  /** Running inside the installed app window. */
  isStandalone: boolean
  install: () => Promise<PwaInstallOutcome>
}

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined)

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

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setIsStandalone(standalone)

    let cancelled = false
    void detectInstalledPwa().then((installed) => {
      if (!cancelled) setIsInstalled(installed)
    })

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      deferredRef.current = null
      setCanInstall(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      cancelled = true
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async (): Promise<PwaInstallOutcome> => {
    const deferred = deferredRef.current
    if (!deferred) return 'unavailable'
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      deferredRef.current = null
      setCanInstall(false)
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
      }
      return choice.outcome
    } catch {
      deferredRef.current = null
      setCanInstall(false)
      return 'unavailable'
    }
  }

  return (
    <PwaInstallContext.Provider
      value={{ canInstall, isInstalled, isStandalone, install }}
    >
      {children}
    </PwaInstallContext.Provider>
  )
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext)
  if (!ctx) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider')
  }
  return ctx
}
