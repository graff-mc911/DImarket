import { supabase } from './supabase'

export type OAuthProvider = 'google' | 'apple'

export function getOAuthRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`
}

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthRedirectUrl(),
    },
  })

  if (error) throw error
}

export function isOAuthCallbackUrl(): boolean {
  if (window.location.pathname === '/auth/callback') return true
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('access_token') ||
    hash.includes('error=') ||
    search.includes('code=') ||
    search.includes('error=')
  )
}
