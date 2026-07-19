import { useEffect, useState } from 'react'
import { searchLocations, type LocationSuggestion } from '../../lib/geocoding'

type LocationStepProps = {
  country: string
  city: string
  postalCode: string
  locationLabel: string
  onChange: (patch: {
    country?: string
    city?: string
    postalCode?: string
    locationLabel?: string
  }) => void
  labels: {
    country: string
    city: string
    postal: string
    search: string
  }
}

export function LocationStep({
  country,
  city,
  postalCode,
  locationLabel,
  onChange,
  labels,
}: LocationStepProps) {
  const [query, setQuery] = useState(locationLabel)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }
    const t = window.setTimeout(() => {
      void searchLocations(query).then(setSuggestions)
    }, 300)
    return () => window.clearTimeout(t)
  }, [query])

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.search}</label>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange({ locationLabel: e.target.value })
          }}
          className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
        />
        {suggestions.length > 0 && (
          <ul className="mt-1 max-h-40 overflow-auto rounded-sm border border-[#d5d9d9] bg-white text-sm shadow">
            {suggestions.slice(0, 6).map((s) => (
              <li key={s.displayName}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-[#f7fafa]"
                  onClick={() => {
                    setQuery(s.displayName)
                    setSuggestions([])
                    const parts = s.displayName.split(',').map((p) => p.trim())
                    onChange({
                      locationLabel: s.displayName,
                      city: s.name || parts[0] || city,
                      country: s.country || parts[parts.length - 1] || country,
                      postalCode: s.postalCode || postalCode,
                    })
                  }}
                >
                  {s.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.country}</label>
          <input
            value={country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.city}</label>
          <input
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.postal}</label>
          <input
            value={postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
          />
        </div>
      </div>
    </div>
  )
}
