import { verificationLevelClass, verificationLevelLabel } from '../lib/verificationLevel'
import type { VerificationLevel } from '../lib/types'

export function MatchScoreBadge({ score, className = '' }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)))
  const tone =
    pct >= 90
      ? 'bg-[#067d62] text-white'
      : pct >= 75
        ? 'bg-[#ff9900] text-[#0f1111]'
        : 'bg-[#e7e9ec] text-[#0f1111]'

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold tabular-nums ${tone} ${className}`}
    >
      {pct}% match
    </span>
  )
}

export function VerificationBadge({
  level,
}: {
  level: VerificationLevel | null | undefined
}) {
  if (!level || level === 'none') return null
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${verificationLevelClass(level)}`}
    >
      {verificationLevelLabel(level)}
    </span>
  )
}
