import { verificationLevelClass, verificationLevelLabel } from '../lib/verificationLevel'
import type { VerificationLevel } from '../lib/types'
import { BadgeCheck } from 'lucide-react'

export function MatchScoreBadge({
  score,
  className = '',
  large = false,
}: {
  score: number
  className?: string
  large?: boolean
}) {
  const pct = Math.max(0, Math.min(100, Math.round(score)))
  const tone =
    pct >= 92
      ? 'bg-[#248a3d] text-white'
      : pct >= 80
        ? 'bg-[#ff9900] text-[#0f1111]'
        : 'bg-[#e7e9ec] text-[#0f1111]'

  return (
    <span
      className={`inline-flex items-center font-bold tabular-nums ${tone} ${
        large
          ? 'rounded-full px-3 py-1 text-[13px]'
          : 'rounded-sm px-2 py-0.5 text-xs'
      } ${className}`}
    >
      {pct}% match
    </span>
  )
}

export function VerificationBadge({
  level,
  size = 'sm',
  showIcon = true,
  className = '',
}: {
  level: VerificationLevel | null | undefined
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}) {
  if (!level || level === 'none') return null
  const label = verificationLevelLabel(level)
  return (
    <span
      className={`inline-flex items-center gap-0.5 border font-bold uppercase tracking-wide ${verificationLevelClass(
        level,
      )} ${
        size === 'md'
          ? 'rounded-full px-2.5 py-1 text-[11px]'
          : 'rounded-sm px-1.5 py-0.5 text-[10px]'
      } ${className}`}
      title={`${label} verified`}
    >
      {showIcon ? <BadgeCheck className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} /> : null}
      {label}
    </span>
  )
}
