import { useEffect, useRef, useState } from 'react'

interface AnimatedStatProps {
  value: number
  label: string
  durationMs?: number
  className?: string
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`
  }
  if (n >= 1_000) {
    const v = n / 1_000
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`
  }
  return String(Math.round(n))
}

export function AnimatedStat({
  value,
  label,
  durationMs = 1400,
  className = '',
}: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, value, durationMs])

  return (
    <div ref={ref} className={`home-stat ${className}`}>
      <p className="home-stat__value">{formatCompact(display)}</p>
      <p className="home-stat__label">{label}</p>
    </div>
  )
}
