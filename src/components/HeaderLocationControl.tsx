import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { GeoSearchFilters } from './GeoSearchFilters'
import {
  formatGlobalLocationLabel,
  hasActiveLocation,
} from '../lib/globalLocation'

/**
 * Header "Work in / Deliver to" control — same visual block, wired to global location.
 */
export function HeaderLocationControl({ className = '' }: { className?: string }) {
  const { t, location, setLocation } = useApp()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = formatGlobalLocationLabel(
    location,
    t('dimarket.loc.all-europe'),
  )

  return (
    <div ref={rootRef} className={`header-location relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="amazon-header-block hidden shrink-0 lg:flex"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="amazon-header-block__top">{t('header.deliverTo')}</span>
        <span className="amazon-header-block__bottom flex items-center gap-0.5">
          <MapPin className="h-3.5 w-3.5" />
          <span className="max-w-[9.5rem] truncate">{label}</span>
        </span>
      </button>

      {open ? (
        <div
          className="header-location__panel absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[var(--adv-line,#e8e2d9)] bg-white p-3 shadow-lg"
          role="dialog"
          aria-label={t('header.deliverTo')}
        >
          <p className="mb-2 text-xs font-semibold text-[var(--adv-muted,#6b645c)]">
            {hasActiveLocation(location)
              ? formatGlobalLocationLabel(location)
              : t('dimarket.loc.all-europe')}
          </p>
          <GeoSearchFilters value={location} onChange={setLocation} />
        </div>
      ) : null}
    </div>
  )
}
