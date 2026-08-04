import { MapPin, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  autocompleteLocations,
  resolveLocationDetails,
} from '../../lib/locationAutocomplete'
import type { LocationSuggestion } from '../../lib/geocoding'

interface LocationAutocompleteFieldProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: LocationSuggestion) => void
  placeholder?: string
  label?: string
  className?: string
}

/**
 * LOCATION INDEX UI — Nominatim / Google Places only.
 * Do not reuse for profession search.
 */
export function LocationAutocompleteField({
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  className = '',
}: LocationAutocompleteFieldProps) {
  const { t } = useApp()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      void autocompleteLocations(q)
        .then((rows) => {
          if (cancelled) return
          setSuggestions(rows)
          setLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setSuggestions([])
          setLoading(false)
        })
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = async (s: LocationSuggestion) => {
    const detailed = await resolveLocationDetails(s)
    onChange(detailed.name)
    onSelect(detailed)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={rootRef} className={`adv-search__loc ${className}`}>
      {label ? <span className="adv-search__loc-label">{label}</span> : null}
      <div className="adv-search__loc-bar">
        <MapPin className="adv-search__bar-icon" aria-hidden />
        <input
          type="text"
          value={value}
          placeholder={placeholder || t('advancedSearch.cityPlaceholder')}
          aria-label={label || placeholder || t('advancedSearch.cityPlaceholder')}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {value ? (
          <button
            type="button"
            className="adv-search__clear"
            aria-label={t('advancedSearch.clear')}
            onClick={() => {
              onChange('')
              onSelect({ name: '', displayName: '', lat: undefined, lon: undefined, country: undefined })
              setSuggestions([])
            }}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {open && value.trim().length >= 2 && (
        <div id={listId} className="adv-search__dropdown adv-search__dropdown--loc" role="listbox">
          <div className="adv-search__group">
            <p className="adv-search__group-title">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {loading ? t('advancedSearch.loading') : t('advancedSearch.locationSuggestions')}
            </p>
            {!loading && suggestions.length === 0 && (
              <p className="adv-search__empty">{t('advancedSearch.noLocationSuggestions')}</p>
            )}
            {suggestions.map((s) => (
              <button
                key={s.placeId || s.displayName || s.name}
                type="button"
                role="option"
                className="adv-search__hint"
                onClick={() => void pick(s)}
              >
                <MapPin className="h-4 w-4 opacity-60" aria-hidden />
                <span className="adv-search__hint-text">
                  <strong>{s.name}</strong>
                  {s.displayName && s.displayName !== s.name ? <em>{s.displayName}</em> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
