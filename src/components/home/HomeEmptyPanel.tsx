import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface HomeEmptyPanelProps {
  icon: LucideIcon
  title: string
  description?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  children?: ReactNode
}

/** Compact framed empty state for cabinet-sheet home rails. */
export function HomeEmptyPanel({
  icon: Icon,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: HomeEmptyPanelProps) {
  return (
    <div className="home-empty-panel" role="status">
      <span className="home-empty-panel__icon" aria-hidden>
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <div className="home-empty-panel__copy">
        <p className="home-empty-panel__title">{title}</p>
        {description ? <p className="home-empty-panel__desc">{description}</p> : null}
      </div>
      <div className="home-empty-panel__actions">
        <button type="button" className="home-btn home-btn--primary home-btn--sm" onClick={onPrimary}>
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button type="button" className="home-section__link" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
