import { ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

export function HeroTrustBadges() {
  const { t } = useApp()
  const items = [
    t('trust.freeForPros'),
    t('trust.verified'),
    t('trust.reviews'),
    t('trust.markets'),
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-[var(--ink-700)]">
      {items.map((item, index) => (
        <span key={item} className="inline-flex items-center gap-1.5">
          {index === 2 ? (
            <Star className="h-3.5 w-3.5 fill-[var(--brand-copper-light)] text-[var(--brand-copper)]" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-verified)]" />
          )}
          {item}
        </span>
      ))}
    </div>
  )
}
