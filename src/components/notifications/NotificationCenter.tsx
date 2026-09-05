import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  MessageSquare,
  ShieldCheck,
  Star,
  CalendarDays,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { supabase } from '../../lib/supabase'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  savePushSubscription,
  urlBase64ToUint8Array,
  vapidPublicKey,
  type AppNotification,
} from '../../lib/notifications/notifications'

const FILTERS: { id: string; labelKey: string }[] = [
  { id: 'all', labelKey: 'notifications.filter.all' },
  { id: 'project', labelKey: 'notifications.filter.project' },
  { id: 'message', labelKey: 'notifications.filter.message' },
  { id: 'review', labelKey: 'notifications.filter.review' },
  { id: 'payment', labelKey: 'notifications.filter.payment' },
  { id: 'verification', labelKey: 'notifications.filter.verification' },
  { id: 'booking', labelKey: 'notifications.filter.booking' },
]

function TypeIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4 shrink-0'
  if (type === 'message') return <MessageSquare className={cls} />
  if (type === 'review') return <Star className={cls} />
  if (type === 'payment') return <CreditCard className={cls} />
  if (type === 'verification') return <ShieldCheck className={cls} />
  if (type === 'booking') return <CalendarDays className={cls} />
  if (type === 'quote' || type === 'project' || type === 'lead' || type === 'listing' || type === 'match') {
    return <FileText className={cls} />
  }
  return <Bell className={cls} />
}

function typeLabel(type: string, t: (key: never) => string) {
  if (type === 'quote' || type === 'lead' || type === 'listing' || type === 'match' || type === 'project') {
    return t('notifications.type.project' as never)
  }
  if (type === 'message') return t('notifications.type.message' as never)
  if (type === 'review') return t('notifications.type.review' as never)
  if (type === 'payment') return t('notifications.type.payment' as never)
  if (type === 'verification') return t('notifications.type.verification' as never)
  if (type === 'booking') return t('notifications.type.booking' as never)
  return t('notifications.type.update' as never)
}

type Props = {
  /** Compact dropdown for Header */
  compact?: boolean
}

export function NotificationCenter({ compact = true }: Props) {
  const { user, t } = useApp()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [pushOk, setPushOk] = useState(false)

  const unread = useMemo(() => items.filter((n) => !n.is_read).length, [items])

  const load = async (typeFilter = filter) => {
    if (!user) return
    setLoading(true)
    const rows = await fetchNotifications(user.id, 50, typeFilter)
    setItems(rows)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications-center:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as AppNotification
          setItems((prev) => {
            if (prev.some((x) => x.id === row.id)) return prev
            return [row, ...prev].slice(0, 50)
          })
          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' &&
            document.visibilityState !== 'visible'
          ) {
            try {
              const n = new Notification(row.title || 'DImarket', {
                body: row.body || '',
                icon: '/icon-192.png',
                tag: row.id,
              })
              n.onclick = () => {
                window.focus()
                if (row.link_path) navigateTo(row.link_path)
                n.close()
              }
            } catch {
              /* ignore */
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as AppNotification
          setItems((prev) => prev.map((x) => (x.id === row.id ? { ...x, ...row } : x)))
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id])

  const enablePush = async () => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    const key = vapidPublicKey()
    if (!key) return
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      const reg = await navigator.serviceWorker.register('/sw.js?v=8')
      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        }))
      await savePushSubscription(user.id, sub)
      setPushOk(true)
    } catch (e) {
      console.error('push subscribe:', e)
    }
  }

  if (!user) return null

  const panel = (
    <div
      className={
        compact
          ? 'absolute right-0 z-[70] mt-2 w-[min(400px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.22)] bg-white shadow-xl'
          : 'mx-auto max-w-2xl overflow-hidden rounded-none border border-[rgba(148,163,184,0.22)] bg-white shadow-sm'
      }
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#f0f0f2] px-4 py-3">
        <div>
          <p className="text-[14px] font-semibold text-[#2f2a24]">{t('notifications.title')}</p>
          <p className="text-[11px] text-[#8a8178]">
            {t('notifications.channelsHint')}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="text-[11px] font-semibold text-indigo-600"
            onClick={() => void enablePush()}
          >
            {pushOk ? t('notifications.pushOn') : t('notifications.enablePush')}
          </button>
          <button
            type="button"
            className="text-[11px] font-semibold text-[#8a8178]"
            onClick={() => void markAllNotificationsRead(user.id).then(() => load())}
          >
            <CheckCheck className="mr-0.5 inline h-3.5 w-3.5" />
            {t('notifications.markAll')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#f0f0f2] px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id)
              void load(f.id)
            }}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              filter === f.id
                ? 'bg-[#2f2a24] text-white'
                : 'bg-[#f3f0ea] text-[#2f2a24] hover:bg-[rgba(148,163,184,0.22)]'
            }`}
          >
            {t(f.labelKey as never)}
          </button>
        ))}
      </div>

      <ul className="max-h-[min(420px,60vh)] overflow-y-auto">
        {loading && <li className="p-4 text-sm text-slate-500">{t('common.loading')}</li>}
        {!loading && items.length === 0 && (
          <li className="p-8 text-center text-sm text-slate-500">{t('notifications.empty')}</li>
        )}
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-[#fafafa] ${
                !n.is_read ? 'bg-indigo-50/40' : ''
              }`}
              onClick={() => {
                void markNotificationRead(n.id)
                setItems((prev) =>
                  prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
                )
                if (n.link_path) navigateTo(n.link_path)
                if (compact) setOpen(false)
              }}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                  !n.is_read ? 'bg-indigo-100 text-indigo-700' : 'bg-[#f3f0ea] text-[#8a8178]'
                }`}
              >
                <TypeIcon type={n.type} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8a8178]">
                    {typeLabel(n.type, t)}
                  </span>
                  {!n.is_read ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold text-[#2f2a24]">
                  {n.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12px] text-[#6f665d]">
                  {n.body}
                </span>
                <span className="mt-1 block text-[10px] text-[#a1a1a6]">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-[#f0f0f2] px-4 py-2.5">
        <button
          type="button"
          className="text-[12px] font-semibold text-[#0066cc]"
          onClick={() => {
            setOpen(false)
            navigateTo('/settings')
          }}
        >
          Notification settings
        </button>
        {!compact ? null : (
          <button
            type="button"
            className="text-[12px] font-semibold text-[#8a8178]"
            onClick={() => {
              setOpen(false)
              navigateTo('/notifications')
            }}
          >
            {t('notifications.openFull')}
          </button>
        )}
      </div>
    </div>
  )

  if (!compact) {
    return (
      <div className="px-4 py-8">
        <h1 className="mb-4 text-[22px] font-semibold text-[#2f2a24]">{t('notifications.centerTitle')}</h1>
        {panel}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          void load()
        }}
        className="relative rounded-full p-2 text-white/90 hover:bg-white/10"
        aria-label={t('notifications.title')}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ff9900] px-1 text-[10px] font-bold text-[#2f2a24]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open ? panel : null}
    </div>
  )
}

/** Full-page wrapper */
export function NotificationsPage() {
  const { user, t } = useApp()
  if (!user) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-[14px] text-[#6f665d]">{t('notifications.signIn')}</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-[#2f2a24] px-5 py-2.5 text-[13px] font-semibold text-white"
          onClick={() => navigateTo('/login')}
        >
          {t('notifications.logIn')}
        </button>
      </div>
    )
  }
  return <NotificationCenter compact={false} />
}
