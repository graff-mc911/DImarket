import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureException } from '../lib/monitoring'
import { isChunkLoadError, recoverFromStaleChunks, reloadOnceForStaleChunk } from '../lib/chunkLoadError'

type Props = {
  children: ReactNode
  /** Optional label for logs */
  name?: string
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
  /** When this changes, clear a previous error (e.g. route path). */
  resetKey?: string | number
}

type State = {
  error: Error | null
}

/**
 * Catches React render errors so users never see a blank white screen.
 * Stale Vite chunks after deploy auto-reload once; other errors show recovery UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  private autoReloadAttempted = false

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.state.error &&
      prevProps.resetKey !== undefined &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ error: null })
      this.autoReloadAttempted = false
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const scope = this.props.name || 'ErrorBoundary'
    console.error(`[${scope}]`, error, info.componentStack)
    captureException(error, {
      tags: {
        boundary: scope,
        chunkLoad: isChunkLoadError(error) ? '1' : '0',
      },
      extra: { componentStack: info.componentStack },
    })

    if (!this.autoReloadAttempted && isChunkLoadError(error)) {
      this.autoReloadAttempted = true
      if (!reloadOnceForStaleChunk()) {
        void recoverFromStaleChunks()
      }
    }
  }

  private reset = () => {
    if (this.state.error && isChunkLoadError(this.state.error)) {
      void recoverFromStaleChunks().then((did) => {
        if (!did) window.location.reload()
      })
      return
    }
    this.setState({ error: null })
    this.autoReloadAttempted = false
    this.props.onReset?.()
  }

  private goHome = () => {
    this.setState({ error: null })
    this.autoReloadAttempted = false
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  render() {
    if (!this.state.error) return this.props.children

    const title = this.props.fallbackTitle || 'Something went wrong'
    const chunk = isChunkLoadError(this.state.error)
    const message =
      this.props.fallbackMessage ||
      (chunk
        ? 'A newer version of the app is available. Tap Try again to reload.'
        : 'This page hit an unexpected error. You can try again or return home.')

    const detail = this.state.error?.message?.trim()

    return (
      <div className="layout-page-content flex min-h-[50vh] items-center justify-center py-12">
        <div
          className="mx-auto max-w-md rounded-none border border-[rgba(221,138,120,0.35)] bg-white p-8 text-center shadow-[0_20px_50px_rgba(89,63,48,0.08)]"
          role="alert"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a44a3a]">Error</p>
          <h1 className="mt-2 text-xl font-bold text-[#2f2a24]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f665d]">{message}</p>
          {detail ? (
            <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-[#2f2a24] p-3 text-left text-[11px] text-[#ffd7c8]">
              {detail.slice(0, 500)}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.reset}
              className="btn-primary rounded-full px-5 py-2.5 text-sm"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.goHome}
              className="btn-secondary rounded-full px-5 py-2.5 text-sm"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
