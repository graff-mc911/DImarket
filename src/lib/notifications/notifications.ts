import { supabase } from '../supabase'

export type NotificationType =
  | 'message'
  | 'lead'
  | 'verification'
  | 'review'
  | 'listing'
  | 'match'
  | 'system'
  | 'booking'
  | 'payment'
  | 'project'
  | 'quote'

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  link_path: string | null
  is_read: boolean
  created_at: string
  email_sent?: boolean
  push_sent?: boolean
}

export type NotificationPrefs = {
  inapp: boolean
  push: boolean
  email: boolean
  categories: Record<string, boolean>
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  inapp: true,
  push: true,
  email: true,
  categories: {
    message: true,
    project: true,
    review: true,
    payment: true,
    verification: true,
    booking: true,
    match: true,
    lead: true,
    quote: true,
    system: true,
  },
}

export const NOTIFICATION_CATEGORIES: { id: NotificationType; labelKey: string }[] = [
  { id: 'message', labelKey: 'notif.cat.message' },
  { id: 'project', labelKey: 'notif.cat.project' },
  { id: 'quote', labelKey: 'notif.cat.quote' },
  { id: 'review', labelKey: 'notif.cat.review' },
  { id: 'payment', labelKey: 'notif.cat.payment' },
  { id: 'verification', labelKey: 'notif.cat.verification' },
  { id: 'booking', labelKey: 'notif.cat.booking' },
  { id: 'match', labelKey: 'notif.cat.match' },
  { id: 'lead', labelKey: 'notif.cat.lead' },
  { id: 'system', labelKey: 'notif.cat.system' },
]

export async function createNotification(input: {
  userId: string
  type: string
  title: string
  body: string
  linkPath?: string | null
  referenceType?: string | null
  referenceId?: string | null
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: input.userId,
    p_type: input.type,
    p_title: input.title,
    p_body: input.body,
    p_link_path: input.linkPath ?? null,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
  })
  if (error) {
    console.error('create_notification:', error)
    return null
  }
  return data as string | null
}

export async function fetchNotifications(
  userId: string,
  limit = 50,
  typeFilter?: string | null,
): Promise<AppNotification[]> {
  let q = supabase
    .from('notifications')
    .select('id, type, title, body, link_path, is_read, created_at, email_sent, push_sent')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (typeFilter && typeFilter !== 'all') {
    if (typeFilter === 'project') {
      q = q.in('type', ['project', 'quote', 'lead', 'listing', 'match'])
    } else {
      q = q.eq('type', typeFilter)
    }
  }

  const { data, error } = await q
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
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
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

export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  const base: NotificationPrefs = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_PREFS))
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  if (typeof obj.inapp === 'boolean') base.inapp = obj.inapp
  if (typeof obj.push === 'boolean') base.push = obj.push
  if (typeof obj.email === 'boolean') base.email = obj.email
  if (obj.categories && typeof obj.categories === 'object') {
    for (const [k, v] of Object.entries(obj.categories as Record<string, unknown>)) {
      if (typeof v === 'boolean') base.categories[k] = v
    }
  }
  return base
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}
