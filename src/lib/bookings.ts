import { supabase } from './supabase'
import { createNotification } from './notifications/notifications'

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

export type BookingRow = {
  id: string
  professional_id: string
  customer_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  starts_at: string
  ends_at: string
  status: BookingStatus
  notes: string | null
  google_event_id: string | null
  created_at: string
  updated_at?: string
}

export type BusySlot = {
  starts_at: string
  ends_at: string
  status: string
}

export type AvailabilityPayload = {
  blocked: string[]
  busy: BusySlot[]
}

export const BOOKING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const
export const DEFAULT_DURATION_HOURS = 2

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toLocalDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return ymd(d)
}

export function monthRange(year: number, monthIndex: number): { from: string; to: string } {
  const from = new Date(year, monthIndex, 1)
  const to = new Date(year, monthIndex + 1, 0)
  return { from: ymd(from), to: ymd(to) }
}

export async function fetchAvailability(
  professionalId: string,
  from: string,
  to: string,
): Promise<AvailabilityPayload> {
  const { data, error } = await supabase.rpc('get_professional_booking_availability', {
    p_professional_id: professionalId,
    p_from: from,
    p_to: to,
  })
  if (error) {
    console.error('fetchAvailability:', error)
    return { blocked: [], busy: [] }
  }
  const raw = data as { blocked?: unknown; busy?: unknown }
  const blocked = Array.isArray(raw?.blocked)
    ? (raw.blocked as string[]).map((d) => String(d).slice(0, 10))
    : []
  const busy = Array.isArray(raw?.busy) ? (raw.busy as BusySlot[]) : []
  return { blocked, busy }
}

export async function fetchBlockedDates(
  professionalId: string,
  from: string,
  to: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('booking_blocked_dates')
    .select('blocked_date')
    .eq('professional_id', professionalId)
    .gte('blocked_date', from)
    .lte('blocked_date', to)
  if (error) {
    console.error('fetchBlockedDates:', error)
    return []
  }
  return (data ?? []).map((r) => String((r as { blocked_date: string }).blocked_date).slice(0, 10))
}

export async function toggleBlockedDate(
  professionalId: string,
  date: string,
  currentlyBlocked: boolean,
  reason?: string,
): Promise<{ ok: true } | { error: string }> {
  if (currentlyBlocked) {
    const { error } = await supabase
      .from('booking_blocked_dates')
      .delete()
      .eq('professional_id', professionalId)
      .eq('blocked_date', date)
    if (error) return { error: error.message }
    return { ok: true }
  }
  const { error } = await supabase.from('booking_blocked_dates').insert({
    professional_id: professionalId,
    blocked_date: date,
    reason: reason || null,
  } as never)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function fetchProBookings(
  professionalId: string,
): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('professional_id', professionalId)
    .order('starts_at', { ascending: true })
  if (error) {
    console.error('fetchProBookings:', error)
    return []
  }
  return (data ?? []) as BookingRow[]
}

export async function fetchCustomerBookings(customerId: string): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customerId)
    .order('starts_at', { ascending: true })
  if (error) {
    console.error('fetchCustomerBookings:', error)
    return []
  }
  return (data ?? []) as BookingRow[]
}

export function buildSlotIso(dateKey: string, hour: number, durationHours = DEFAULT_DURATION_HOURS) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = new Date(y, m - 1, d, hour, 0, 0, 0)
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)
  return { starts_at: start.toISOString(), ends_at: end.toISOString() }
}

export function isHourTaken(
  dateKey: string,
  hour: number,
  busy: BusySlot[],
  durationHours = DEFAULT_DURATION_HOURS,
): boolean {
  const { starts_at, ends_at } = buildSlotIso(dateKey, hour, durationHours)
  const startMs = new Date(starts_at).getTime()
  const endMs = new Date(ends_at).getTime()
  return busy.some((b) => {
    if (b.status === 'declined' || b.status === 'cancelled') return false
    const bs = new Date(b.starts_at).getTime()
    const be = new Date(b.ends_at).getTime()
    return startMs < be && endMs > bs
  })
}

export async function requestBooking(input: {
  professionalId: string
  customerId: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  dateKey: string
  hour: number
  notes?: string
  durationHours?: number
}): Promise<{ booking: BookingRow } | { error: string }> {
  const avail = await fetchAvailability(
    input.professionalId,
    input.dateKey,
    input.dateKey,
  )
  if (avail.blocked.includes(input.dateKey)) {
    return { error: 'date_blocked' }
  }
  const duration = input.durationHours ?? DEFAULT_DURATION_HOURS
  if (isHourTaken(input.dateKey, input.hour, avail.busy, duration)) {
    return { error: 'slot_taken' }
  }

  const { starts_at, ends_at } = buildSlotIso(input.dateKey, input.hour, duration)
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      professional_id: input.professionalId,
      customer_id: input.customerId,
      customer_name: input.customerName,
      customer_email: input.customerEmail || null,
      customer_phone: input.customerPhone || null,
      starts_at,
      ends_at,
      status: 'pending',
      notes: input.notes?.trim() || null,
    } as never)
    .select('*')
    .single()

  if (error || !data) return { error: error?.message || 'create_failed' }

  await createNotification({
    userId: input.professionalId,
    type: 'booking',
    title: 'New booking request',
    body: `${input.customerName} requested ${input.dateKey} at ${input.hour}:00`,
    linkPath: '/pro/calendar',
  })

  return { booking: data as BookingRow }
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  actorId: string,
): Promise<{ booking: BookingRow } | { error: string }> {
  const { data: existing } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle()

  if (!existing) return { error: 'not_found' }
  const row = existing as BookingRow

  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq('id', bookingId)
    .select('*')
    .single()

  if (error || !data) return { error: error?.message || 'update_failed' }

  const updated = data as BookingRow
  const notifyUser =
    actorId === row.professional_id ? row.customer_id : row.professional_id
  if (notifyUser) {
    await createNotification({
      userId: notifyUser,
      type: 'booking',
      title: `Booking ${status}`,
      body: `${row.customer_name} · ${new Date(row.starts_at).toLocaleString()}`,
      linkPath:
        actorId === row.professional_id ? '/customer/dashboard' : '/pro/calendar',
    })
  }

  if (status === 'accepted') {
    void syncBookingToGoogle(bookingId)
  }

  return { booking: updated }
}

/** Deep link for customers (no OAuth required). */
export function googleCalendarAddUrl(booking: BookingRow, title?: string): string {
  const start = new Date(booking.starts_at)
  const end = new Date(booking.ends_at)
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || `DImarket booking with ${booking.customer_name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: booking.notes || 'Booked via DImarket',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('google_calendar_connections')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await supabase.from('google_calendar_connections').delete().eq('user_id', userId)
}

export function googleCalendarConnectUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!base) return ''
  return `${base.replace(/\/$/, '')}/functions/v1/google-calendar-oauth?action=start`
}

async function syncBookingToGoogle(bookingId: string): Promise<void> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!base || !anon) return
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    await fetch(`${base.replace(/\/$/, '')}/functions/v1/google-calendar-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || anon}`,
        apikey: anon,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    })
  } catch (e) {
    console.error('syncBookingToGoogle:', e)
  }
}
