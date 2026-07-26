import { verificationLevelClass, verificationLevelLabel } from '../lib/verificationLevel'
import type { VerificationLevel } from '../lib/types'
import { BadgeCheck, Building2, Crown, Mail, Phone, Shield, ShieldCheck } from 'lucide-react'
import {
  activeTrustBadges,
  type TrustBadgeSource,
} from '../lib/verification/trustBadges'
import { trustLevelLabel } from '../lib/verification/trustLevels'

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
        large ? 'rounded-full px-3 py-1 text-[13px]' : 'rounded-sm px-2 py-0.5 text-xs'
      } ${className}`}
    >
      {pct}% match
    </span>
  )
}

export function VerificationBadge({
  level,
  trustLevel,
  size = 'sm',
  showIcon = true,
  className = '',
}: {
  level?: VerificationLevel | null
  trustLevel?: number | null
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}) {
  if (typeof trustLevel === 'number' && trustLevel > 0) {
    const label = trustLevelLabel(trustLevel)
    return (
      <span
        className={`inline-flex items-center gap-0.5 border font-bold tracking-wide bg-[#f5f5f7] text-[#1d1d1f] border-black/10 ${
          size === 'md' ? 'rounded-full px-2.5 py-1 text-[11px]' : 'rounded-full px-1.5 py-0.5 text-[10px]'
        } ${className}`}
        title={label}
      >
        {showIcon ? <ShieldCheck className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} /> : null}
        L{trustLevel} · {label}
      </span>
    )
  }

  if (!level || level === 'none') return null
  const label = verificationLevelLabel(level)
  return (
    <span
      className={`inline-flex items-center gap-0.5 border font-bold uppercase tracking-wide ${verificationLevelClass(
        level,
      )} ${
        size === 'md' ? 'rounded-full px-2.5 py-1 text-[11px]' : 'rounded-sm px-1.5 py-0.5 text-[10px]'
      } ${className}`}
      title={`${label} verified`}
    >
      {showIcon ? <BadgeCheck className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} /> : null}
      {label}
    </span>
  )
}

function TrustBadgeIcon({ id, className }: { id: string; className?: string }) {
  if (id === 'email') return <Mail className={className} />
  if (id === 'phone') return <Phone className={className} />
  if (id === 'business') return <Building2 className={className} />
  if (id === 'premium') return <Crown className={className} />
  if (id === 'trusted') return <Shield className={className} />
  if (id === 'identity') return <BadgeCheck className={className} />
  return <ShieldCheck className={className} />
}

/** Named trust badges for cards, profiles, search, applications */
export function TrustBadges({
  source,
  size = 'sm',
  max = 4,
  className = '',
}: {
  source: TrustBadgeSource | null | undefined
  size?: 'sm' | 'md'
  max?: number
  className?: string
}) {
  const badges = activeTrustBadges(source, max)
  if (!badges.length) return null

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {badges.map((b) => (
        <span
          key={b.id}
          className={`inline-flex items-center gap-0.5 border font-bold tracking-wide ${b.tone} ${
            size === 'md'
              ? 'rounded-full px-2.5 py-1 text-[11px]'
              : 'rounded-full px-1.5 py-0.5 text-[10px]'
          }`}
          title={b.label}
        >
          <TrustBadgeIcon id={b.id} className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
          {b.label}
        </span>
      ))}
    </div>
  )
}

export function TrustScorePill({
  score,
  size = 'sm',
}: {
  score: number | null | undefined
  size?: 'sm' | 'md'
}) {
  if (score == null || Number.isNaN(Number(score))) return null
  const n = Math.max(0, Math.min(100, Math.round(Number(score))))
  return (
    <span
      className={`inline-flex items-center gap-1 border border-black/10 bg-white font-bold tabular-nums text-[#1d1d1f] ${
        size === 'md' ? 'rounded-full px-2.5 py-1 text-[12px]' : 'rounded-full px-2 py-0.5 text-[10px]'
      }`}
      title="Trust Score"
    >
      <ShieldCheck className="h-3 w-3 text-emerald-600" />
      Trust {n}
    </span>
  )
}
