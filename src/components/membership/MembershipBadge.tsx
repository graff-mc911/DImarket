import { resolveMembershipBadges } from '../../lib/monetization/badges'

export function MembershipBadge({
  planId,
  isPremium,
  isVerified,
  verificationLevel,
  className = '',
}: {
  planId?: string | null
  isPremium?: boolean | null
  isVerified?: boolean | null
  verificationLevel?: string | null
  className?: string
}) {
  const badges = resolveMembershipBadges({
    planId,
    isPremium,
    isVerified,
    verificationLevel,
  })

  if (!badges.length) return null

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {badges.map((b) => (
        <span
          key={b.id}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${b.className}`}
        >
          {b.label}
        </span>
      ))}
    </span>
  )
}
