import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { supabase } from '../../lib/supabase'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  savePushSubscription,
  vapidPublicKey,
  type AppNotification,
} from '../../lib/notifications/notifications'

export function NotificationCenter() {
  const { user, t } = useApp()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const unread = items.filter((n) => !n.is_read).length

  const load = async () => {
    if (!user) return
    setLoading(true)
    const rows = await fetchNotifications(user.id)
    setItems(rows)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications:${user.id}`)
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
          setItems((prev) => [row, ...prev].slice(0, 40))
          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' &&
            document.visibilityState !== 'visible'
          ) {
            try {
              const n = new Notification(row.title || 'DImarket', {
                body: row.body || '',
                icon: '/favicon.ico',
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
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      await savePushSubscription(user.id, sub)
    } catch (e) {
      console.error('push subscribe:', e)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          void load()
        }}
        className="relative rounded-full p-2 hover:bg-[rgba(0,0,0,0.05)]"
        aria-label={t('notifications.title')}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-bold text-sm">{t('notifications.title')}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-indigo-600"
                onClick={() => void enablePush()}
              >
                {t('notifications.enablePush')}
              </button>
              <button
                type="button"
                className="text-xs text-slate-500"
                onClick={() => void markAllNotificationsRead(user.id).then(load)}
              >
                <Check className="inline h-3.5 w-3.5" /> {t('notifications.markAll')}
              </button>
            </div>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading && <li className="p-4 text-sm text-slate-500">{t('common.loading')}</li>}
            {!loading && items.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-500">{t('notifications.empty')}</li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${!n.is_read ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => {
                    void markNotificationRead(n.id)
                    setItems((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
                    )
                    if (n.link_path) navigateTo(n.link_path)
                    setOpen(false)
                  }}
                >
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.body}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}
