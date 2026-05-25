import { supabase } from '../supabase'

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  link_path: string | null
  is_read: boolean
  created_at: string
}

export async function fetchNotifications(userId: string, limit = 40): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link_path, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') return []
    console.error('fetchNotifications:', error)
    return []
  }
  return (data ?? []) as AppNotification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
}

export async function savePushSubscription(
  userId: string,
  sub: PushSubscription,
): Promise<void> {
  const json = sub.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return
  await supabase.from('notification_tokens').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    },
    { onConflict: 'user_id,endpoint' },
  )
}

export function vapidPublicKey(): string | undefined {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
}
