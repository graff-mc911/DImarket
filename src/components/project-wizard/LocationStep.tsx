import { useEffect, useState } from 'react'
import type { LocationSuggestion } from '../../lib/geocoding'
import { autocompleteLocations, resolveLocationDetails } from '../../lib/locationAutocomplete'

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
    latitude?: number | null
    longitude?: number | null
  }) => void
  labels: {
    country: string
    city: string
    postal: string
    search: string
  }
  errors?: Partial<Record<'country' | 'city' | 'postalCode', string>>
}

const fieldClass = (hasError?: string) =>
  'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] text-[#2f2a24] outline-none transition focus:bg-white ' +
  (hasError
    ? 'border-[#c41e3a]'
    : 'border-[rgba(148,163,184,0.22)] focus:border-[#2f2a24] focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]')

export function LocationStep({
  country,
  city,
  postalCode,
  locationLabel,
  onChange,
  labels,
  errors = {},
}: LocationStepProps) {
  const [query, setQuery] = useState(locationLabel)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }
    const t = window.setTimeout(() => {
      setLoading(true)
      void autocompleteLocations(query).then((list) => {
        setSuggestions(list)
        setLoading(false)
      })
    }, 280)
    return () => window.clearTimeout(t)
  }, [query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8a8178]">
          {labels.search}
        </label>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange({ locationLabel: e.target.value })
          }}
          placeholder="Start typing an address…"
          className={fieldClass()}
          autoComplete="off"
        />
        {loading && (
          <p className="mt-1 text-[12px] text-[#8a8178]">Searching…</p>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-[16px] border border-[rgba(148,163,184,0.22)] bg-white py-1 shadow-xl">
            {suggestions.map((s) => (
              <li key={s.placeId || s.displayName}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-[14px] text-[#2f2a24] hover:bg-[#f3f0ea]"
                  onClick={() => {
                    void resolveLocationDetails(s).then((detail) => {
                      setQuery(detail.displayName)
                      setSuggestions([])
                      onChange({
                        locationLabel: detail.displayName,
                        city: detail.name || city,
                        country: detail.country || country,
                        postalCode: detail.postalCode || postalCode,
                        latitude: detail.lat ?? null,
                        longitude: detail.lon ?? null,
                      })
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
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8a8178]">
            {labels.country}
          </label>
          <input
            value={country}
            onChange={(e) => onChange({ country: e.target.value })}
            className={fieldClass(errors.country)}
          />
          {errors.country ? <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.country}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8a8178]">
            {labels.city}
          </label>
          <input
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            className={fieldClass(errors.city)}
          />
          {errors.city ? <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.city}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8a8178]">
            {labels.postal}
          </label>
          <input
            value={postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            className={fieldClass(errors.postalCode)}
          />
          {errors.postalCode ? (
            <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.postalCode}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
