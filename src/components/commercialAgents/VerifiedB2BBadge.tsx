import { BadgeCheck } from 'lucide-react'
import type { TranslateFn } from '../../lib/i18n'
import type { VerificationStatus } from '../../lib/commercialAgents/types'

export function VerifiedB2BBadge({
  status,
  kind,
  t,
}: {
  status: VerificationStatus
  kind: 'manufacturer' | 'agent'
  t: TranslateFn
}) {
  if (status !== 'verified') return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(36,138,61,0.35)] bg-[rgba(36,138,61,0.1)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#248a3d]">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      {kind === 'manufacturer'
        ? t('commercialAgents.verifiedManufacturer')
        : t('commercialAgents.verifiedAgent')}
    </span>
  )
}
