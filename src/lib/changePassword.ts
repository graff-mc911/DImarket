import { supabase } from './supabase'

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; needsNonce: boolean; message: string }

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return String(err)
}

/** Чи є в акаунті вхід email+пароль (не лише Google/Apple). */
export function userHasEmailPassword(authUser: {
  identities?: { provider: string }[] | null
  app_metadata?: Record<string, unknown>
}): boolean {
  if (authUser.identities?.some((i) => i.provider === 'email')) return true
  const provider = authUser.app_metadata?.provider
  return provider === 'email'
}

export async function changeUserPassword(options: {
  newPassword: string
  currentPassword?: string
  nonce?: string
}): Promise<ChangePasswordResult> {
  const newPassword = options.newPassword.trim()
  if (newPassword.length < 6) {
    return { ok: false, needsNonce: false, message: 'password_too_short' }
  }

  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !authUser?.email) {
    return { ok: false, needsNonce: false, message: userError?.message || 'no_email' }
  }

  if (!userHasEmailPassword(authUser)) {
    return { ok: false, needsNonce: false, message: 'oauth_only' }
  }

  if (options.nonce?.trim()) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      nonce: options.nonce.trim(),
    })
    if (error) {
      return { ok: false, needsNonce: false, message: errorMessage(error) }
    }
    return { ok: true }
  }

  const current = options.currentPassword?.trim()
  if (current) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: current,
    })
    if (signInError) {
      return { ok: false, needsNonce: false, message: errorMessage(signInError) }
    }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    const msg = errorMessage(error).toLowerCase()
    if (msg.includes('reauthentication') || msg.includes('reauth')) {
      const { error: reauthError } = await supabase.auth.reauthenticate()
      if (reauthError) {
        return { ok: false, needsNonce: false, message: errorMessage(reauthError) }
      }
      return { ok: false, needsNonce: true, message: 'reauth_email_sent' }
    }
    return { ok: false, needsNonce: false, message: errorMessage(error) }
  }

  return { ok: true }
}
