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
  | 'application'

/** UI filter buckets for the Notification Center */
export type NotificationFilterId =
  | 'all'
  | 'message'
  | 'review'
  | 'match'
  | 'application'
  | 'payment'
  | 'system'
  | 'project'
  | 'booking'
  | 'verification'
  | 'unread'
  | 'archived'

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  link_path: string | null
  is_read: boolean
  is_archived?: boolean
  archived_at?: string | null
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
    application: true,
  },
}

export const NOTIFICATION_CATEGORIES: { id: NotificationType; label: string }[] = [
  { id: 'message', label: 'Messages' },
  { id: 'project', label: 'Project updates' },
  { id: 'quote', label: 'Quotes' },
  { id: 'review', label: 'Reviews' },
  { id: 'payment', label: 'Payments' },
  { id: 'verification', label: 'Verification' },
  { id: 'booking', label: 'Bookings' },
  { id: 'match', label: 'Matches' },
  { id: 'application', label: 'Applications' },
  { id: 'lead', label: 'Leads' },
  { id: 'system', label: 'System' },
]

export const CENTER_FILTERS: { id: NotificationFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'message', label: 'Messages' },
  { id: 'review', label: 'Reviews' },
  { id: 'match', label: 'Matches' },
  { id: 'application', label: 'Applications' },
  { id: 'payment', label: 'Payments' },
  { id: 'system', label: 'System' },
  { id: 'project', label: 'Projects' },
  { id: 'booking', label: 'Bookings' },
  { id: 'verification', label: 'Verification' },
]

export function notificationHref(n: Pick<AppNotification, 'link_path' | 'type'>): string {
  if (n.link_path) return n.link_path
  if (n.type === 'message') return '/messages'
  if (n.type === 'payment') return '/dashboard'
  if (n.type === 'application' || n.type === 'match' || n.type === 'project' || n.type === 'quote') {
    return '/dashboard'
  }
  if (n.type === 'review') return '/dashboard'
  return '/notifications'
}

function typesForFilter(filter: NotificationFilterId | string | null | undefined): string[] | null {
  if (!filter || filter === 'all' || filter === 'unread' || filter === 'archived') return null
  if (filter === 'project') return ['project', 'quote', 'lead', 'listing']
  if (filter === 'match') return ['match']
  if (filter === 'application') return ['application']
  return [filter]
}

export async function createNotification(input: {
  userId: string
  type: string
  title: string
  body: string
  linkPath?: string | null
  referenceType?: string | null
  referenceId?: string | null
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_notification' as never, {
    p_user_id: input.userId,
    p_type: input.type,
    p_title: input.title,
    p_body: input.body,
    p_link_path: input.linkPath ?? null,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
  } as never)
  if (error) {
    console.error('create_notification:', error)
    return null
  }
  return data as string | null
}

export type FetchNotificationsOpts = {
  limit?: number
  filter?: NotificationFilterId | string | null
  search?: string | null
  includeArchived?: boolean
}

export async function fetchNotifications(
  userId: string,
  limitOrOpts: number | FetchNotificationsOpts = 50,
  typeFilter?: string | null,
): Promise<AppNotification[]> {
  const opts: FetchNotificationsOpts =
    typeof limitOrOpts === 'number'
      ? { limit: limitOrOpts, filter: typeFilter }
      : limitOrOpts

  const limit = opts.limit ?? 80
  const filter = opts.filter ?? 'all'
  const search = opts.search?.trim() || ''
  const archivedOnly = filter === 'archived'
  const includeArchived = Boolean(opts.includeArchived || archivedOnly)

  let q = supabase
    .from('notifications')
    .select(
      'id, type, title, body, link_path, is_read, is_archived, archived_at, created_at, email_sent, push_sent',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (archivedOnly) {
    q = q.eq('is_archived', true)
  } else if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (filter === 'unread') {
    q = q.eq('is_read', false)
  }

  const types = typesForFilter(filter)
  if (types?.length === 1) q = q.eq('type', types[0])
  else if (types && types.length > 1) q = q.in('type', types)

  if (search) {
    const safe = search.replace(/[%_,]/g, '')
    if (safe) q = q.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`)
  }

  const { data, error } = await q
  if (error) {
    if (error.code === '42P01') return []
    // Retry without archive columns
    if (error.message?.includes('is_archived') || error.code === '42703') {
      return fetchNotificationsLegacy(userId, limit, filter, search)
    }
    console.error('fetchNotifications:', error)
    return []
  }
  return (data ?? []) as AppNotification[]
}

async function fetchNotificationsLegacy(
  userId: string,
  limit: number,
  filter: string,
  search: string,
): Promise<AppNotification[]> {
  let q = supabase
    .from('notifications')
    .select('id, type, title, body, link_path, is_read, created_at, email_sent, push_sent')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filter === 'unread') q = q.eq('is_read', false)
  const types = typesForFilter(filter)
  if (types?.length === 1) q = q.eq('type', types[0])
  else if (types && types.length > 1) q = q.in('type', types)
  if (search) {
    const safe = search.replace(/[%_,]/g, '')
    if (safe) q = q.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`)
  }

  const { data, error } = await q
  if (error) {
    console.error('fetchNotifications legacy:', error)
    return []
  }
  return ((data ?? []) as AppNotification[]).map((n) => ({ ...n, is_archived: false }))
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('count_unread_notifications' as never, {
      p_user_id: userId,
    } as never)
    if (!error && typeof data === 'number') return data
  } catch {
    /* fall through */
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .or('is_archived.is.null,is_archived.eq.false')

  if (error) {
    const retry = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    return retry.count ?? 0
  }
  return count ?? 0
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true } as never).eq('id', id)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true } as never)
    .eq('user_id', userId)
    .eq('is_read', false)
}

export async function archiveNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_archived: true, archived_at: new Date().toISOString(), is_read: true } as never)
    .eq('id', id)
  if (error) {
    // Fallback: mark read only
    if (error.code === '42703') {
      await markNotificationRead(id)
      return { ok: true }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function unarchiveNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_archived: false, archived_at: null } as never)
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
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
    } as never,
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

export function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'message':
      return 'Message'
    case 'review':
      return 'Review'
    case 'match':
      return 'Match'
    case 'application':
      return 'Application'
    case 'payment':
      return 'Payment'
    case 'system':
      return 'System'
    case 'quote':
      return 'Quote'
    case 'lead':
      return 'Lead'
    case 'listing':
    case 'project':
      return 'Project'
    case 'verification':
      return 'Verification'
    case 'booking':
      return 'Booking'
    default:
      return 'Update'
  }
}
