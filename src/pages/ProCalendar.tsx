import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Lock,
  Unlink,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import {
  disconnectGoogleCalendar,
  fetchAvailability,
  fetchProBookings,
  hasGoogleCalendarConnected,
  monthRange,
  toLocalDateKey,
  toggleBlockedDate,
  updateBookingStatus,
  type BookingRow,
} from '../lib/bookings'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfWeekMonday(d: Date) {
  const day = (d.getDay() + 6) % 7
  const copy = new Date(d)
  copy.setDate(d.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function ProCalendar() {
  const { user, profile } = useApp()
  const [cursor, setCursor] = useState(() => new Date())
  const [blocked, setBlocked] = useState<Set<string>>(new Set())
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [gcal, setGcal] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isPro =
    profile?.is_professional ||
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company'

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { from, to } = monthRange(year, month)
    const [avail, rows, connected] = await Promise.all([
      fetchAvailability(user.id, from, to),
      fetchProBookings(user.id),
      hasGoogleCalendarConnected(user.id),
    ])
    setBlocked(new Set(avail.blocked))
    setBookings(rows)
    setGcal(connected)
    setLoading(false)
  }, [month, user, year])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const g = params.get('gcal')
    if (g === 'connected') setMessage('Google Calendar connected')
    if (g === 'token_error' || g === 'error') setMessage('Google Calendar connection failed')
  }, [])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`pro-bookings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `professional_id=eq.${user.id}`,
        },
        () => void reload(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [reload, user])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const start = startOfWeekMonday(first)
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }, [month, year])

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingRow[]>()
    for (const b of bookings) {
      const key = toLocalDateKey(b.starts_at)
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return map
  }, [bookings])

  const pending = bookings.filter((b) => b.status === 'pending')
  const upcoming = bookings.filter(
    (b) =>
      (b.status === 'accepted' || b.status === 'pending') &&
      new Date(b.starts_at).getTime() >= Date.now() - 86400000,
  )

  const onToggleBlock = async (dateKey: string) => {
    if (!user || busy) return
    setBusy(true)
    const isBlocked = blocked.has(dateKey)
    const res = await toggleBlockedDate(user.id, dateKey, isBlocked)
    setBusy(false)
    if ('error' in res) {
      setMessage(res.error)
      return
    }
    setBlocked((prev) => {
      const next = new Set(prev)
      if (isBlocked) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })
  }

  const onStatus = async (id: string, status: 'accepted' | 'declined' | 'cancelled') => {
    if (!user) return
    setBusy(true)
    const res = await updateBookingStatus(id, status, user.id)
    setBusy(false)
    if ('error' in res) {
      setMessage(res.error)
      return
    }
    await reload()
  }

  const connectGcal = async () => {
    const base = import.meta.env.VITE_SUPABASE_URL as string
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      navigateTo('/login')
      return
    }
    const res = await fetch(
      `${base.replace(/\/$/, '')}/functions/v1/google-calendar-oauth?action=start`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: anon,
        },
      },
    )
    const json = (await res.json()) as { ok?: boolean; url?: string; error?: string }
    if (json.url) {
      window.location.href = json.url
      return
    }
    setMessage(json.error || 'Google Calendar not configured')
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-[#8a8178]" />
        <p className="mt-4 text-[15px] text-[#2f2a24]">Sign in to manage your calendar</p>
        <button
          type="button"
          className="mt-6 rounded-full bg-[#2f2a24] px-5 py-2.5 text-[13px] font-semibold text-white"
          onClick={() => navigateTo('/login')}
        >
          Log in
        </button>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[15px] text-[#2f2a24]">Booking calendar is for professionals.</p>
        <button
          type="button"
          className="mt-6 rounded-full border border-[rgba(148,163,184,0.35)] px-5 py-2.5 text-[13px] font-semibold"
          onClick={() => navigateTo('/for-professionals')}
        >
          Become a professional
        </button>
      </div>
    )
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#f3f0ea]">
      <div className="border-b border-[rgba(148,163,184,0.22)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[#2f2a24]">
              Booking calendar
            </h1>
            <p className="text-[13px] text-[#8a8178]">
              Block dates, accept requests, sync Google Calendar
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/pro/dashboard')}
              className="rounded-full border border-[rgba(148,163,184,0.35)] px-4 py-2 text-[12px] font-semibold text-[#2f2a24]"
            >
              Dashboard
            </button>
            {gcal ? (
              <button
                type="button"
                onClick={() =>
                  void disconnectGoogleCalendar(user.id).then(() => {
                    setGcal(false)
                    setMessage('Google Calendar disconnected')
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.35)] px-4 py-2 text-[12px] font-semibold"
              >
                <Unlink className="h-3.5 w-3.5" />
                Disconnect Google
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void connectGcal()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2f2a24] px-4 py-2 text-[12px] font-semibold text-white"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1.4fr_1fr]">
        {message ? (
          <p className="rounded-none bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 lg:col-span-2">
            {message}
          </p>
        ) : null}

        <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-full p-2 hover:bg-[#f3f0ea]"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[16px] font-semibold text-[#2f2a24]">{monthLabel}</h2>
            <button
              type="button"
              className="rounded-full p-2 hover:bg-[#f3f0ea]"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {loading ? (
            <p className="py-10 text-center text-[13px] text-[#8a8178]">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const key = toLocalDateKey(d)
                const inMonth = d.getMonth() === month
                const isBlocked = blocked.has(key)
                const dayBookings = bookingsByDay.get(key) ?? []
                const hasPending = dayBookings.some((b) => b.status === 'pending')
                const hasAccepted = dayBookings.some((b) => b.status === 'accepted')
                return (
                  <button
                    key={key + String(d.getTime())}
                    type="button"
                    disabled={!inMonth}
                    onClick={() => setSelected(key)}
                    className={`min-h-[64px] rounded-none border p-1.5 text-left transition ${
                      !inMonth
                        ? 'border-transparent opacity-30'
                        : isBlocked
                          ? 'border-red-200 bg-red-50'
                          : selected === key
                            ? 'border-[#2f2a24] bg-[#f3f0ea]'
                            : 'border-[#f0f0f2] hover:border-[rgba(148,163,184,0.35)]'
                    }`}
                    title={isBlocked ? 'Blocked' : 'Select day'}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#2f2a24]">
                        {d.getDate()}
                      </span>
                      {isBlocked ? <Lock className="h-3 w-3 text-red-500" /> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {hasPending ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      ) : null}
                      {hasAccepted ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <p className="mt-3 text-[12px] text-[#8a8178]">
            Select a day, then block it below. Amber = pending, green = accepted.
          </p>
          {selected ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-none bg-[#fafafa] p-3">
              <span className="text-[13px] font-semibold text-[#2f2a24]">{selected}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onToggleBlock(selected)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  blocked.has(selected)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {blocked.has(selected) ? 'Unblock date' : 'Block date'}
              </button>
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-sm">
            <h3 className="text-[15px] font-semibold text-[#2f2a24]">
              Pending requests ({pending.length})
            </h3>
            <div className="mt-3 space-y-2">
              {pending.length === 0 ? (
                <p className="text-[13px] text-[#8a8178]">No pending requests</p>
              ) : (
                pending.map((b) => (
                  <div key={b.id} className="rounded-none border border-[#f0f0f2] p-3">
                    <p className="text-[14px] font-semibold text-[#2f2a24]">{b.customer_name}</p>
                    <p className="mt-0.5 text-[12px] text-[#8a8178]">
                      {new Date(b.starts_at).toLocaleString()} –{' '}
                      {new Date(b.ends_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {b.notes ? (
                      <p className="mt-1 text-[12px] text-[#6f665d]">{b.notes}</p>
                    ) : null}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onStatus(b.id, 'accepted')}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onStatus(b.id, 'declined')}
                        className="inline-flex items-center gap-1 rounded-full bg-[#f3f0ea] px-3 py-1.5 text-[12px] font-semibold text-[#2f2a24]"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-sm">
            <h3 className="text-[15px] font-semibold text-[#2f2a24]">Appointments</h3>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
              {upcoming.length === 0 ? (
                <p className="text-[13px] text-[#8a8178]">No upcoming appointments</p>
              ) : (
                upcoming.map((b) => (
                  <div key={b.id} className="rounded-none border border-[#f0f0f2] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-[#2f2a24]">
                          {b.customer_name}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#8a8178]">
                          {new Date(b.starts_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          b.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-[#f3f0ea] text-[#8a8178]'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    {b.status === 'accepted' || b.status === 'pending' ? (
                      <button
                        type="button"
                        className="mt-2 text-[12px] font-semibold text-[#c41e3a]"
                        onClick={() => void onStatus(b.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
