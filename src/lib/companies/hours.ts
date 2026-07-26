import type { CompanyOpeningHours } from './types'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function parseHm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** Format opening hours for display, e.g. "Mon–Fri 08:00–18:00". */
export function formatOpeningHoursSummary(
  hours: CompanyOpeningHours | null | undefined,
  t: (key: string) => string,
): string {
  const days = hours?.days
  if (!days) return t('companiesDir.hoursUnavailable')

  const parts: string[] = []
  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  for (const key of order) {
    const slots = days[key]
    if (!slots?.length) continue
    const label = t(`companiesDir.day.${key}`)
    const ranges = slots.map(([a, b]) => `${a}–${b}`).join(', ')
    parts.push(`${label} ${ranges}`)
  }
  return parts.length ? parts.join(' · ') : t('companiesDir.hoursUnavailable')
}

export function isCompanyOpenNow(
  hours: CompanyOpeningHours | null | undefined,
  now = new Date(),
): boolean {
  const days = hours?.days
  if (!days) return false

  let local = now
  if (hours.timezone) {
    try {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: hours.timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      const parts = fmt.formatToParts(now)
      const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() || ''
      const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0)
      const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0)
      const map: Record<string, (typeof DAY_KEYS)[number]> = {
        sun: 'sun',
        mon: 'mon',
        tue: 'tue',
        wed: 'wed',
        thu: 'thu',
        fri: 'fri',
        sat: 'sat',
      }
      const dayKey = map[weekday.slice(0, 3)]
      if (!dayKey) return false
      const slots = days[dayKey] || []
      const mins = hour * 60 + minute
      return slots.some(([start, end]) => {
        const a = parseHm(start)
        const b = parseHm(end)
        if (a == null || b == null) return false
        return mins >= a && mins < b
      })
    } catch {
      local = now
    }
  }

  const dayKey = DAY_KEYS[local.getDay()]
  const slots = days[dayKey] || []
  const mins = local.getHours() * 60 + local.getMinutes()
  return slots.some(([start, end]) => {
    const a = parseHm(start)
    const b = parseHm(end)
    if (a == null || b == null) return false
    return mins >= a && mins < b
  })
}
