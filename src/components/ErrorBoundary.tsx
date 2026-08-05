import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Optional label for logs */
  name?: string
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

type State = {
  error: Error | null
}

/**
 * Catches React render errors so users never see a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const scope = this.props.name || 'ErrorBoundary'
    console.error(`[${scope}]`, error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  private goHome = () => {
    this.setState({ error: null })
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  render() {
    if (!this.state.error) return this.props.children

    const title = this.props.fallbackTitle || 'Something went wrong'
    const message =
      this.props.fallbackMessage ||
      'This page hit an unexpected error. You can try again or return home.'

    return (
      <div className="layout-page-content flex min-h-[50vh] items-center justify-center py-12">
        <div
          className="mx-auto max-w-md rounded-[24px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,250,246,0.96)] p-8 text-center shadow-[0_20px_50px_rgba(89,63,48,0.08)]"
          role="alert"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a44a3a]">Error</p>
          <h1 className="mt-2 text-xl font-bold text-[#2f2a24]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f665d]">{message}</p>
          {import.meta.env.DEV && this.state.error?.message ? (
            <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-[#2f2a24] p-3 text-left text-[11px] text-[#ffd7c8]">
              {this.state.error.message}
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
