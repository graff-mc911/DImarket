/**
 * Optional client error reporting.
 * Loads @sentry/react only when VITE_SENTRY_DSN is set — zero cost otherwise.
 */

type CaptureContext = {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

let sentryReady = false

export async function initMonitoring(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn?.trim()) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.init({
      dsn: dsn.trim(),
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.05,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      ignoreErrors: [
        'ResizeObserver loop',
        'Non-Error promise rejection',
        /Loading chunk \d+ failed/,
      ],
    })
    sentryReady = true
  } catch (err) {
    console.warn('[monitoring] Sentry init failed', err)
  }
}

export function captureException(error: unknown, context?: CaptureContext): void {
  if (!sentryReady) return
  void import('@sentry/react').then((Sentry) => {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        for (const [k, v] of Object.entries(context.tags)) scope.setTag(k, v)
      }
      if (context?.extra) {
        for (const [k, v] of Object.entries(context.extra)) scope.setExtra(k, v)
      }
      Sentry.captureException(error)
    })
  })
}
