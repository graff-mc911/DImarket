import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { supabase } from '../../lib/supabase'
import {
  archiveNotification,
  CENTER_FILTERS,
  countUnreadNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
  notificationTypeLabel,
  savePushSubscription,
  urlBase64ToUint8Array,
  vapidPublicKey,
  type AppNotification,
  type NotificationFilterId,
} from '../../lib/notifications/notifications'

type Mode = 'compact' | 'page'

function relativeWhen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function TypeIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4 shrink-0'
  if (type === 'message') return <MessageSquare className={cls} />
  if (type === 'review') return <Star className={cls} />
  if (type === 'payment') return <CreditCard className={cls} />
  if (
    type === 'quote' ||
    type === 'project' ||
    type === 'lead' ||
    type === 'listing' ||
    type === 'match' ||
    type === 'application'
  ) {
    return <FileText className={cls} />
  }
  return <Bell className={cls} />
}

function typeAccent(type: string): string {
  switch (type) {
    case 'message':
      return 'bg-sky-50 text-sky-800 border-sky-100'
    case 'review':
      return 'bg-amber-50 text-amber-900 border-amber-100'
    case 'match':
      return 'bg-emerald-50 text-emerald-900 border-emerald-100'
    case 'application':
      return 'bg-violet-50 text-violet-900 border-violet-100'
    case 'payment':
      return 'bg-teal-50 text-teal-900 border-teal-100'
    case 'system':
      return 'bg-stone-100 text-stone-800 border-stone-200'
    default:
      return 'bg-[#f5f5f7] text-[#1d1d1f] border-black/10'
  }
}

export function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <NotificationPanel mode="page" />
      </div>
    </div>
  )
}

/** Header bell + dropdown (default). Pass compact={false} for a full-width panel. */
export function NotificationCenter({ compact = true }: { compact?: boolean }) {
  const { user, t } = useApp()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnread(0)
      return
    }
    setUnread(await countUnreadNotifications(user.id))
  }, [user])

  useEffect(() => {
    void refreshUnread()
  }, [refreshUnread])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notif-bell:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshUnread()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, refreshUnread])

  useEffect(() => {
    if (!open || !compact) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, compact])

  if (!user) return null

  if (!compact) {
    return <NotificationPanel mode="page" onUnreadChange={setUnread} />
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-[#1d1d1f]/80 transition-colors hover:bg-black/[0.04]"
        aria-label={t('notifications.title')}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-[#1d1d1f] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-[70] mt-2 w-[min(400px,calc(100vw-1.5rem))]">
          <NotificationPanel
            mode="compact"
            onClose={() => setOpen(false)}
            onUnreadChange={setUnread}
          />
        </div>
      )}
    </div>
  )
}

function NotificationPanel({
  mode,
  onClose,
  onUnreadChange,
}: {
  mode: Mode
  onClose?: () => void
  onUnreadChange?: (n: number) => void
}) {
  const { user, t } = useApp()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotificationFilterId>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMsg, setPushMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 280)
    return () => window.clearTimeout(id)
  }, [search])

  const activeFilter: NotificationFilterId = showArchived
    ? 'archived'
    : unreadOnly
      ? 'unread'
      : filter

  const load = useCallback(async () => {
    if (!user) {
      setItems([])
      setUnreadTotal(0)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [rows, unread] = await Promise.all([
        fetchNotifications(user.id, {
          limit: mode === 'compact' ? 25 : 100,
          filter: activeFilter,
          search: debouncedSearch || null,
        }),
        countUnreadNotifications(user.id),
      ])
      setItems(rows)
      setUnreadTotal(unread)
      onUnreadChange?.(unread)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user, activeFilter, debouncedSearch, mode, onUnreadChange])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notif-center:${user.id}:${mode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as AppNotification
          if (showArchived) return
          if (unreadOnly && row.is_read) return
          if (filter !== 'all') {
            const allowed =
              filter === 'match'
                ? ['match']
                : filter === 'project'
                  ? ['project', 'quote', 'lead', 'listing']
                  : [filter]
            if (!allowed.includes(row.type)) return
          }
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            if (!`${row.title} ${row.body ?? ''}`.toLowerCase().includes(q)) return
          }
          setItems((prev) => [row, ...prev.filter((x) => x.id !== row.id)].slice(0, mode === 'compact' ? 25 : 100))
          void countUnreadNotifications(user.id).then((c) => {
            setUnreadTotal(c)
            onUnreadChange?.(c)
          })

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
                navigateTo(notificationHref(row))
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
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as AppNotification
          setItems((prev) => {
            const archived = Boolean(row.is_archived)
            if (!showArchived && archived) return prev.filter((x) => x.id !== row.id)
            if (showArchived && !archived) return prev.filter((x) => x.id !== row.id)
            return prev.map((x) => (x.id === row.id ? { ...x, ...row } : x))
          })
          void countUnreadNotifications(user.id).then((c) => {
            setUnreadTotal(c)
            onUnreadChange?.(c)
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const old = payload.old as { id?: string }
          if (old?.id) setItems((prev) => prev.filter((x) => x.id !== old.id))
          void countUnreadNotifications(user.id).then((c) => {
            setUnreadTotal(c)
            onUnreadChange?.(c)
          })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, mode, filter, debouncedSearch, showArchived, unreadOnly, onUnreadChange])

  const list = useMemo(() => items, [items])

  const openItem = async (n: AppNotification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      const next = Math.max(0, unreadTotal - 1)
      setUnreadTotal(next)
      onUnreadChange?.(next)
    }
    const href = notificationHref(n)
    onClose?.()
    navigateTo(href)
  }

  const onMarkAll = async () => {
    if (!user) return
    await markAllNotificationsRead(user.id)
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })))
    setUnreadTotal(0)
    onUnreadChange?.(0)
  }

  const onArchive = async (id: string) => {
    setBusyId(id)
    try {
      await archiveNotification(id)
      if (!showArchived) setItems((prev) => prev.filter((x) => x.id !== id))
      if (user) {
        const c = await countUnreadNotifications(user.id)
        setUnreadTotal(c)
        onUnreadChange?.(c)
      }
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id: string) => {
    setBusyId(id)
    try {
      await deleteNotification(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      if (user) {
        const c = await countUnreadNotifications(user.id)
        setUnreadTotal(c)
        onUnreadChange?.(c)
      }
    } finally {
      setBusyId(null)
    }
  }

  const onEnablePush = async () => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushMsg(t('notifications.pushUnavailable'))
      return
    }
    const key = vapidPublicKey()
    if (!key) {
      setPushMsg(t('notifications.pushUnavailable'))
      return
    }
    setPushBusy(true)
    setPushMsg(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setPushMsg(t('notifications.pushDenied'))
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        }))
      await savePushSubscription(user.id, sub)
      setPushMsg(t('notifications.pushEnabled'))
    } catch (e) {
      console.error('push subscribe:', e)
      setPushMsg(e instanceof Error ? e.message : t('notifications.pushUnavailable'))
    } finally {
      setPushBusy(false)
    }
  }

  const shell =
    mode === 'compact'
      ? 'overflow-hidden rounded-2xl border border-[#e8e8ed] bg-white shadow-xl'
      : 'overflow-hidden rounded-[22px] border border-[#e8e8ed] bg-white shadow-sm'

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-3 border-b border-[#f0f0f2] px-4 py-3 sm:px-5">
        <div>
          <p className={`${mode === 'page' ? 'text-2xl sm:text-3xl' : 'text-[14px]'} font-semibold tracking-tight text-[#1d1d1f]`}>
            {t('notifications.title')}
          </p>
          <p className="mt-0.5 text-[11px] text-[#86868b] sm:text-xs">
            {unreadTotal > 0
              ? `${unreadTotal} ${t('notifications.unread')}`
              : t('notifications.allCaughtUp')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg p-2 text-[#86868b] hover:bg-black/[0.04]"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {mode === 'compact' && (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose?.()
                  navigateTo('/notifications')
                }}
                className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#1d1d1f] hover:bg-black/[0.04]"
              >
                {t('notifications.viewAll')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-black/[0.04]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3 border-b border-[#f0f0f2] px-4 py-3 sm:px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1d1d1f]/35" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('notifications.searchPlaceholder')}
            className="w-full rounded-xl border border-black/10 bg-[#f5f5f7]/80 py-2 pl-9 pr-3 text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/40 focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/15"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {CENTER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setShowArchived(false)
                setUnreadOnly(false)
                setFilter(f.id)
              }}
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                !showArchived && !unreadOnly && filter === f.id
                  ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                  : 'border-black/10 bg-white text-[#1d1d1f]/70 hover:border-black/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowArchived(false)
              setUnreadOnly((v) => !v)
            }}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${
              unreadOnly ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white' : 'border-black/10 text-[#1d1d1f]/70'
            }`}
          >
            {t('notifications.unread')}
          </button>
          {mode === 'page' && (
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(false)
                setShowArchived((v) => !v)
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                showArchived ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white' : 'border-black/10 text-[#1d1d1f]/70'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              {t('notifications.archived')}
            </button>
          )}
          <button
            type="button"
            onClick={() => void onMarkAll()}
            disabled={unreadTotal === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-[#1d1d1f]/70 hover:bg-black/[0.03] disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('notifications.markAll')}
          </button>
          <button
            type="button"
            onClick={() => void onEnablePush()}
            disabled={pushBusy}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-[#1d1d1f]/70 hover:bg-black/[0.03] disabled:opacity-40"
          >
            {pushBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
            {t('notifications.enablePush')}
          </button>
        </div>
        {pushMsg && <p className="text-xs text-[#86868b]">{pushMsg}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className={mode === 'compact' ? 'max-h-[min(70vh,28rem)] overflow-y-auto' : ''}>
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#86868b]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-[#1d1d1f]/25" />
            <p className="text-sm font-medium text-[#1d1d1f]">
              {showArchived ? t('notifications.emptyArchived') : t('notifications.empty')}
            </p>
            <p className="mt-1 max-w-xs text-xs text-[#86868b]">{t('notifications.emptyHint')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {list.map((n) => (
              <li key={n.id} className={`group relative ${n.is_read ? 'bg-white' : 'bg-[#f5f5f7]/80'}`}>
                <button
                  type="button"
                  onClick={() => void openItem(n)}
                  className="w-full px-4 py-3.5 pr-24 text-left transition-colors hover:bg-black/[0.02] sm:px-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${typeAccent(n.type)}`}
                    >
                      <TypeIcon type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeAccent(n.type)}`}
                        >
                          {notificationTypeLabel(n.type)}
                        </span>
                        {!n.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1d1d1f]" aria-label="Unread" />
                        )}
                        <span className="text-[11px] text-[#86868b]">{relativeWhen(n.created_at)}</span>
                      </div>
                      <p className={`text-sm text-[#1d1d1f] ${n.is_read ? 'font-medium' : 'font-semibold'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-[#86868b]">{n.body}</p>}
                    </div>
                  </div>
                </button>
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {!showArchived && (
                    <button
                      type="button"
                      title={t('notifications.archive')}
                      disabled={busyId === n.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        void onArchive(n.id)
                      }}
                      className="rounded-lg p-2 text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f]"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title={t('notifications.delete')}
                    disabled={busyId === n.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      void onDelete(n.id)
                    }}
                    className="rounded-lg p-2 text-[#86868b] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {mode === 'page' && (
        <div className="border-t border-[#f0f0f2] px-4 py-3 text-[11px] text-[#86868b] sm:px-5">
          {t('notifications.realtimeHint')}
        </div>
      )}
    </div>
  )
}
