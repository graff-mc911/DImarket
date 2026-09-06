import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MiniCalendar({
  marks,
  dark,
}: {
  marks: Record<string, number>
  dark: boolean
}) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const { weeks, monthLabel, todayIso } = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ day: number | null; iso: string | null }> = []
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, iso: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, iso })
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, iso: null })
    const weeks: Array<Array<{ day: number | null; iso: string | null }>> = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    const t = new Date()
    const todayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    return { weeks, monthLabel, todayIso }
  }, [cursor])

  const muted = dark ? 'text-white/40' : 'text-[#8a8178]'
  const cell = dark ? 'hover:bg-white/10' : 'hover:bg-black/5'
  const todayCls = dark ? 'bg-blue-500 text-white' : 'bg-[#2f2a24] text-white'
  const markCls = dark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800'

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className={`rounded-none p-1.5 ${cell}`}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[13px] font-semibold capitalize">{monthLabel}</p>
        <button
          type="button"
          className={`rounded-none p-1.5 ${cell}`}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={`mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase ${muted}`}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((c, i) => {
          if (!c.day || !c.iso) return <span key={i} />
          const count = marks[c.iso] || 0
          const isToday = c.iso === todayIso
          return (
            <div
              key={c.iso}
              title={count ? `${count} events` : undefined}
              className={`flex h-8 items-center justify-center rounded-none text-[12px] font-medium ${
                isToday ? todayCls : count ? markCls : cell
              }`}
            >
              {c.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
