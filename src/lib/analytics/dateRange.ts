export type DatePreset = 'today' | '7d' | '30d' | '90d' | '365d' | 'custom'

export type AnalyticsDateRange = {
  preset: DatePreset
  from: Date
  to: Date
  /** Inclusive day count */
  days: number
  label: string
}

const PRESET_DAYS: Record<Exclude<DatePreset, 'custom' | 'today'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
}

export const DATE_PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '365d', label: 'Last Year' },
  { id: 'custom', label: 'Custom Range' },
]

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function dayCount(from: Date, to: Date): number {
  const a = startOfDay(from).getTime()
  const b = startOfDay(to).getTime()
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1)
}

export function rangeFromPreset(
  preset: DatePreset,
  customFrom?: string | null,
  customTo?: string | null,
): AnalyticsDateRange {
  const now = new Date()
  if (preset === 'today') {
    return {
      preset,
      from: startOfDay(now),
      to: endOfDay(now),
      days: 1,
      label: 'Today',
    }
  }
  if (preset === 'custom') {
    const from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(new Date(now.getTime() - 29 * 86_400_000))
    const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now)
    const days = dayCount(from, to)
    return {
      preset,
      from: from <= to ? from : startOfDay(to),
      to: from <= to ? to : endOfDay(from),
      days: Math.min(366, days),
      label: 'Custom Range',
    }
  }
  const n = PRESET_DAYS[preset]
  const from = startOfDay(new Date(now.getTime() - (n - 1) * 86_400_000))
  return {
    preset,
    from,
    to: endOfDay(now),
    days: n,
    label: DATE_PRESET_OPTIONS.find((o) => o.id === preset)?.label || `${n}d`,
  }
}

export function lastNDayKeys(n: number, end = new Date()): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = []
  const base = startOfDay(end)
  const count = Math.min(366, Math.max(1, n))
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    out.push({
      iso: d.toISOString().slice(0, 10),
      label:
        count <= 14
          ? d.toLocaleDateString(undefined, { weekday: 'short' })
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    })
  }
  return out
}

export function sparseLabels(labels: string[], maxTicks = 8): string[] {
  if (labels.length <= maxTicks) return labels
  const step = Math.ceil(labels.length / maxTicks)
  return labels.map((l, i) => (i % step === 0 ? l : ''))
}
