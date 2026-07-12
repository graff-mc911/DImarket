import { ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

export function TrustStrip() {
  const { t } = useApp()

  const items = [
    t('trust.freeForPros'),
    t('trust.verified'),
    t('trust.reviews'),
    t('trust.markets'),
  ]

  return (
    <div className="trust-strip w-full py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 text-center">
        {items.map((item, index) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            {index === 0 ? (
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-verified)]" />
            ) : index === 2 ? (
              <Star className="h-3.5 w-3.5 fill-[var(--brand-copper-light)] text-[var(--brand-copper)]" />
            ) : (
              <span className="text-[var(--brand-verified)]">✓</span>
            )}
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
