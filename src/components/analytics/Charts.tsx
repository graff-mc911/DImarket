/** Shared chart primitives for Analytics (SVG, responsive) */

import type { ReactNode } from 'react'

export function BarChart({
  values,
  labels,
  color = '#1d1d1f',
  height = 160,
  formatValue,
}: {
  values: number[]
  labels: string[]
  color?: string
  height?: number
  formatValue?: (n: number) => string
}) {
  const max = Math.max(1, ...values)
  const w = Math.max(280, values.length * 36)
  const pad = 10
  const gap = 6
  const barW = (w - pad * 2) / Math.max(values.length, 1) - gap

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label="Bar chart">
      {values.map((v, i) => {
        const h = (v / max) * (height - 40)
        const x = pad + i * (barW + gap)
        const y = height - 28 - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(2, h)} rx={5} fill={color} opacity={0.9} />
            {v > 0 ? (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                style={{ fontSize: 9, fill: '#86868b' }}
              >
                {formatValue ? formatValue(v) : v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v))}
              </text>
            ) : null}
            <text
              x={x + barW / 2}
              y={height - 10}
              textAnchor="middle"
              style={{ fontSize: 10, fill: '#86868b' }}
            >
              {labels[i] || ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function AreaSparkline({
  values,
  color = '#34c759',
  height = 140,
  labels,
}: {
  values: number[]
  color?: string
  height?: number
  labels?: string[]
}) {
  const w = 320
  const max = Math.max(1, ...values)
  const min = 0
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w
    const y = height - 24 - ((v - min) / (max - min || 1)) * (height - 40)
    return { x, y, v }
  })
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `0,${height - 20} ${line} ${w},${height - 20}`
  const gradId = `area-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label="Trend">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
      ))}
      {labels?.length
        ? labels.map((l, i) => {
            const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w
            return (
              <text
                key={l + i}
                x={x}
                y={height - 6}
                textAnchor="middle"
                style={{ fontSize: 9, fill: '#86868b' }}
              >
                {l}
              </text>
            )
          })
        : null}
    </svg>
  )
}

export function FunnelChart({
  steps,
}: {
  steps: Array<{ label: string; value: number; color?: string }>
}) {
  const max = Math.max(1, ...steps.map((s) => s.value))
  return (
    <div className="space-y-2">
      {steps.map((s) => {
        const pct = Math.round((s.value / max) * 100)
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-medium text-[#3a3a3c]">{s.label}</span>
              <span className="tabular-nums text-[#86868b]">{s.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f0f2]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: s.color || '#1d1d1f',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
}) {
  return (
    <div className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">{label}</p>
      <p className="mt-2 text-[24px] font-semibold tracking-tight tabular-nums text-[#1d1d1f]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[12px]" style={{ color: accent || '#6e6e73' }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[12px] text-[#86868b]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}
