import type { TranslationKey } from './i18n'

export function getAuthErrorMessage(
  err: unknown,
  t: (key: TranslationKey) => string,
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err)

  const msg = raw.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return t('auth.error.invalidCredentials')
  }
  if (msg.includes('email not confirmed')) {
    return t('auth.error.emailNotConfirmed')
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return t('auth.error.alreadyRegistered')
  }
  if (msg.includes('password') && (msg.includes('least') || msg.includes('short'))) {
    return t('auth.error.passwordTooShort')
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) {
    return t('auth.error.invalidEmail')
  }
  if (msg.includes('duplicate key') || msg.includes('profiles_pkey')) {
    return t('auth.error.profileExists')
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return t('auth.error.rateLimit')
  }
  if (
    msg.includes('missing oauth client id') ||
    msg.includes('unsupported provider') ||
    msg.includes('provider is not enabled')
  ) {
    return t('auth.error.oauthNotConfigured')
  }
  if (msg.includes('oauth') && msg.includes('session')) {
    return t('auth.error.oauthNoSession')
  }
  if (msg.includes('reauthentication') || msg.includes('reauth')) {
    return t('settings.error.reauthRequired')
  }
  if (msg.includes('same password') || msg.includes('different from')) {
    return t('settings.error.samePassword')
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return t('settings.error.wrongCurrentPassword')
  }

  return raw || t('common.error')
}

export function getChangePasswordMessage(
  code: string,
  t: (key: TranslationKey) => string,
): string {
  switch (code) {
    case 'password_too_short':
      return t('auth.error.passwordTooShort')
    case 'no_email':
      return t('settings.error.noEmailForPassword')
    case 'oauth_only':
      return t('settings.error.oauthPasswordOnly')
    case 'reauth_email_sent':
      return t('settings.reauthEmailSent')
    default:
      return getAuthErrorMessage({ message: code }, t)
  }
}

export function getPostLoginPath(
  profile: {
    user_role?: string | null
    is_site_owner?: boolean | null
  } | null,
  options?: { intendedRole?: string | null },
): string {
  if (profile?.is_site_owner) return '/dashboard'
  const role = options?.intendedRole ?? profile?.user_role
  if (role === 'advertiser') return '/advertising'
  if (role === 'client') return '/listings'
  return '/settings'
}
