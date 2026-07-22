/** Lightweight SVG charts — no chart library dependency */

export function BarChart({
  values,
  labels,
  color = '#3b82f6',
  height = 140,
}: {
  values: number[]
  labels: string[]
  color?: string
  height?: number
}) {
  const max = Math.max(1, ...values)
  const w = 280
  const pad = 8
  const barW = (w - pad * 2) / Math.max(values.length, 1) - 6

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label="Bar chart">
      {values.map((v, i) => {
        const h = (v / max) * (height - 36)
        const x = pad + i * (barW + 6)
        const y = height - 24 - h
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={4}
              fill={color}
              opacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-current"
              style={{ fontSize: 10, opacity: 0.55 }}
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
  height = 120,
}: {
  values: number[]
  color?: string
  height?: number
}) {
  const w = 280
  const max = Math.max(1, ...values)
  const min = 0
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w
    const y = height - 8 - ((v - min) / (max - min || 1)) * (height - 20)
    return `${x},${y}`
  })
  const line = pts.join(' ')
  const area = `0,${height} ${line} ${w},${height}`

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label="Trend">
      <defs>
        <linearGradient id="pdArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#pdArea)" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DonutProgress({
  percent,
  size = 88,
  stroke = 8,
  color = '#3b82f6',
  track = 'currentColor',
}: {
  percent: number
  size?: number
  stroke?: number
  color?: string
  track?: string
}) {
  const pct = Math.max(0, Math.min(100, percent))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
          opacity={0.15}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold tabular-nums">
        {pct}%
      </span>
    </div>
  )
}
