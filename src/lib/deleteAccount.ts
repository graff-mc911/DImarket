import { supabase } from './supabase'

/** Delete the signed-in user via edge function, then clear local session. */
export async function deleteCurrentAccount(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  if (!session?.access_token) throw new Error('No active session')

  const { error } = await supabase.functions.invoke('delete-account', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) throw error

  await supabase.auth.signOut({ scope: 'local' })
}
