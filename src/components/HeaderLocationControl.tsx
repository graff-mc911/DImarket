import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelBox, setPanelBox] = useState({ top: 0, left: 0, width: 352 })

  useLayoutEffect(() => {
    if (!open) return

    const sync = () => {
      const trigger = buttonRef.current?.getBoundingClientRect()
      if (!trigger) return
      const width = Math.min(352, Math.max(280, window.innerWidth - 32))
      let left = trigger.left
      if (left + width > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - 16 - width)
      }
      if (left < 16) left = 16
      setPanelBox({ top: trigger.bottom + 8, left, width })
    }

    sync()
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
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

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className="header-location__panel"
            role="dialog"
            aria-label={t('header.deliverTo')}
            style={{ top: panelBox.top, left: panelBox.left, width: panelBox.width }}
          >
            <p className="header-location__panel-title">
              {hasActiveLocation(location)
                ? formatGlobalLocationLabel(location)
                : t('dimarket.loc.all-europe')}
            </p>
            <GeoSearchFilters value={location} onChange={setLocation} />
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={`header-location relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="amazon-header-block hidden shrink-0 lg:flex"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="amazon-header-block__top">{t('header.deliverTo')}</span>
        <span className="amazon-header-block__bottom flex items-center gap-0.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[9.5rem] overflow-x-hidden text-ellipsis whitespace-nowrap leading-normal">
            {label}
          </span>
        </span>
      </button>
      {panel}
    </div>
  )
}
