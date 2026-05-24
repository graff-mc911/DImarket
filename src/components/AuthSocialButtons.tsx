import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { getAuthErrorMessage } from '../lib/authMessages'
import { signInWithOAuthProvider, type OAuthProvider } from '../lib/oauth'

type AuthSocialButtonsProps = {
  onBeforeOAuth?: () => void
  disabled?: boolean
}

export function AuthSocialButtons({ onBeforeOAuth, disabled }: AuthSocialButtonsProps) {
  const { t } = useApp()
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState('')

  const handleOAuth = async (provider: OAuthProvider) => {
    setError('')
    onBeforeOAuth?.()
    setLoadingProvider(provider)
    try {
      await signInWithOAuthProvider(provider)
    } catch (err) {
      setError(getAuthErrorMessage(err, t))
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-[16px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-3 py-2 text-sm text-[#a44a3a]">
          {error}
        </div>
      )}

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[rgba(148,163,184,0.28)]" />
        </div>
        <p className="relative mx-auto w-fit bg-[rgba(255,255,255,0.55)] px-3 text-xs font-medium text-[#7a7168]">
          {t('auth.oauthOr')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled || loadingProvider !== null}
          onClick={() => void handleOAuth('google')}
          className="btn-secondary w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingProvider === 'google' ? t('auth.oauthLoading') : t('auth.continueGoogle')}
        </button>
        <button
          type="button"
          disabled={disabled || loadingProvider !== null}
          onClick={() => void handleOAuth('apple')}
          className="btn-secondary w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingProvider === 'apple' ? t('auth.oauthLoading') : t('auth.continueApple')}
        </button>
      </div>
    </div>
  )
}
