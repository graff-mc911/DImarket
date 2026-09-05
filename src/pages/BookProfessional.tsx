import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import {
  BOOKING_HOURS,
  DEFAULT_DURATION_HOURS,
  fetchAvailability,
  googleCalendarAddUrl,
  isHourTaken,
  monthRange,
  requestBooking,
  toLocalDateKey,
  type AvailabilityPayload,
  type BookingRow,
} from '../lib/bookings'

type BookingHour = (typeof BOOKING_HOURS)[number]
type Props = { profileId: string }

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfWeekMonday(d: Date) {
  const day = (d.getDay() + 6) % 7
  const copy = new Date(d)
  copy.setDate(d.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function BookProfessional({ profileId }: Props) {
  const { user, profile } = useApp()
  const [proName, setProName] = useState('Professional')
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hour, setHour] = useState<BookingHour>(10)
  const [notes, setNotes] = useState('')
  const [avail, setAvail] = useState<AvailabilityPayload>({ blocked: [], busy: [] })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<BookingRow | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const todayKey = toLocalDateKey(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profileId)
      .maybeSingle()
    if (data && typeof data === 'object' && 'full_name' in data && (data as { full_name?: string }).full_name) {
      setProName(String((data as { full_name: string }).full_name))
    }

    const { from, to } = monthRange(year, month)
    const a = await fetchAvailability(profileId, from, to)
    setAvail(a)
    setLoading(false)
  }, [month, profileId, year])

  useEffect(() => {
    void load()
  }, [load])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const start = startOfWeekMonday(first)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month, year])

  const openHours = useMemo(() => {
    if (!selectedDate) return []
    if (avail.blocked.includes(selectedDate)) return []
    return BOOKING_HOURS.filter((h) => !isHourTaken(selectedDate, h, avail.busy))
  }, [avail, selectedDate])

  useEffect(() => {
    if (openHours.length && !openHours.includes(hour)) {
      setHour(openHours[0] as BookingHour)
    }
  }, [hour, openHours])

  const onSubmit = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    if (!selectedDate) return
    setSubmitting(true)
    setError(null)
    const res = await requestBooking({
      professionalId: profileId,
      customerId: user.id,
      customerName: profile?.full_name || user.email || 'Customer',
      customerEmail: user.email,
      customerPhone: profile?.phone,
      dateKey: selectedDate,
      hour,
      notes,
      durationHours: DEFAULT_DURATION_HOURS,
    })
    setSubmitting(false)
    if ('error' in res) {
      setError(
        res.error === 'date_blocked'
          ? 'This date is blocked'
          : res.error === 'slot_taken'
            ? 'This time is no longer available'
            : res.error,
      )
      return
    }
    setCreated(res.booking)
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  if (created) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-[22px] font-semibold text-[#2f2a24]">Request sent</h1>
        <p className="mt-2 text-[14px] text-[#6f665d]">
          {proName} will confirm {new Date(created.starts_at).toLocaleString()}.
        </p>
        <a
          href={googleCalendarAddUrl(created, `Booking with ${proName}`)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.35)] px-4 py-2 text-[13px] font-semibold text-[#2f2a24]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Add to Google Calendar
        </a>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigateTo(`/professional/${profileId}`)}
            className="text-[13px] font-semibold text-[#0066cc]"
          >
            Back to profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f0ea]">
      <div className="border-b border-[rgba(148,163,184,0.22)] bg-white backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            type="button"
            onClick={() => navigateTo(`/professional/${profileId}`)}
            className="text-[12px] font-semibold text-[#0066cc]"
          >
            ← Back
          </button>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-[#2f2a24]">
            Book {proName}
          </h1>
          <p className="text-[13px] text-[#8a8178]">
            Pick a date and time · {DEFAULT_DURATION_HOURS}h appointment
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-full p-2 hover:bg-[#f3f0ea]"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[16px] font-semibold">{monthLabel}</h2>
            <button
              type="button"
              className="rounded-full p-2 hover:bg-[#f3f0ea]"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-[#8a8178]">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {loading ? (
            <p className="py-8 text-center text-[13px] text-[#8a8178]">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const key = toLocalDateKey(d)
                const inMonth = d.getMonth() === month
                const past = key < todayKey
                const isBlocked = avail.blocked.includes(key)
                const disabled = !inMonth || past || isBlocked
                return (
                  <button
                    key={key + d.getTime()}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDate(key)}
                    className={`min-h-[48px] rounded-xl border text-[13px] font-semibold transition ${
                      disabled
                        ? 'border-transparent text-[rgba(148,163,184,0.35)]'
                        : selectedDate === key
                          ? 'border-[#2f2a24] bg-[#2f2a24] text-white'
                          : isBlocked
                            ? 'border-red-100 bg-red-50 text-red-300'
                            : 'border-[#f0f0f2] text-[#2f2a24] hover:border-[rgba(148,163,184,0.35)]'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-[15px] font-semibold text-[#2f2a24]">Time</h3>
          {!selectedDate ? (
            <p className="mt-2 text-[13px] text-[#8a8178]">Select a date first</p>
          ) : openHours.length === 0 ? (
            <p className="mt-2 text-[13px] text-[#8a8178]">No open slots this day</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {openHours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHour(h)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    hour === h
                      ? 'bg-[#2f2a24] text-white'
                      : 'bg-[#f3f0ea] text-[#2f2a24] hover:bg-[rgba(148,163,184,0.22)]'
                  }`}
                >
                  {String(h).padStart(2, '0')}:00
                </button>
              ))}
            </div>
          )}

          <label className="mt-4 block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
              Notes (optional)
            </span>
            <textarea
              className="mt-1 w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-[#fafafa] px-3 py-2.5 text-[14px] outline-none focus:border-[#2f2a24] focus:bg-white"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Project details, address, access notes…"
            />
          </label>

          {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}

          <button
            type="button"
            disabled={!selectedDate || !openHours.length || submitting}
            onClick={() => void onSubmit()}
            className="mt-4 w-full rounded-full bg-[#2f2a24] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {!user
              ? 'Log in to request'
              : submitting
                ? 'Sending…'
                : 'Request booking'}
          </button>
        </section>
      </div>
    </div>
  )
}
