import { LocateFixed } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LocationSuggestion } from '../../lib/geocoding'
import { autocompleteLocations, resolveLocationDetails } from '../../lib/locationAutocomplete'

type LocationStepProps = {
  country: string
  city: string
  postalCode: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
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
    current: string
    map: string
  }
  errors?: Partial<Record<'country' | 'city' | 'postalCode', string>>
}

const fieldClass = (hasError?: string) =>
  'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition focus:bg-white ' +
  (hasError
    ? 'border-[#c41e3a]'
    : 'border-[#e8e8ed] focus:border-[#1d1d1f] focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]')

export function LocationStep({
  country,
  city,
  postalCode,
  locationLabel,
  latitude,
  longitude,
  onChange,
  labels,
  errors = {},
}: LocationStepProps) {
  const [query, setQuery] = useState(locationLabel)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [geoBusy, setGeoBusy] = useState(false)
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

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

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const center: [number, number] =
      latitude != null && longitude != null ? [latitude, longitude] : [50.1, 10.5]
    const map = L.map(mapEl.current, {
      center,
      zoom: latitude != null ? 12 : 4,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const patch = onChangeRef.current
      patch({ latitude: e.latlng.lat, longitude: e.latlng.lng })
      void reverseFill(e.latlng.lat, e.latlng.lng, (p) => onChangeRef.current(p), setQuery)
    })
    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Initialize once; lat/lng sync is handled in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || latitude == null || longitude == null) return
    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map)
    } else {
      markerRef.current.setLatLng([latitude, longitude])
    }
    map.setView([latitude, longitude], Math.max(map.getZoom(), 11))
  }, [latitude, longitude])

  const useCurrent = async () => {
    setGeoBusy(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 12000,
          enableHighAccuracy: false,
        })
      })
      const { latitude: lat, longitude: lng } = pos.coords
      onChange({ latitude: lat, longitude: lng })
      await reverseFill(lat, lng, onChange, setQuery)
    } catch {
      /* ignore */
    } finally {
      setGeoBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
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
        {loading && <p className="mt-1 text-[12px] text-[#86868b]">Searching…</p>}
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-[16px] border border-[#e8e8ed] bg-white py-1 shadow-xl">
            {suggestions.map((s) => (
              <li key={s.placeId || s.displayName}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-[14px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
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

      <button
        type="button"
        onClick={() => void useCurrent()}
        disabled={geoBusy}
        className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-4 py-2 text-[13px] font-semibold text-[#1d1d1f] disabled:opacity-50"
      >
        <LocateFixed className="h-4 w-4" aria-hidden />
        {geoBusy ? 'Locating…' : labels.current}
      </button>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
          {labels.map}
        </p>
        <div
          ref={mapEl}
          className="h-56 w-full overflow-hidden rounded-[18px] border border-[#e8e8ed]"
          role="application"
          aria-label={labels.map}
        />
        <p className="mt-1 text-[11px] text-[#86868b]">Tap the map to set the exact pin.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
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
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
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
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
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

async function reverseFill(
  lat: number,
  lng: number,
  onChange: LocationStepProps['onChange'],
  setQuery: (v: string) => void,
) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    )
    const data = (await res.json()) as {
      display_name?: string
      address?: {
        city?: string
        town?: string
        village?: string
        country?: string
        postcode?: string
      }
    }
    const city =
      data.address?.city || data.address?.town || data.address?.village || ''
    setQuery(data.display_name || '')
    onChange({
      locationLabel: data.display_name || '',
      city: city || undefined,
      country: data.address?.country || undefined,
      postalCode: data.address?.postcode || undefined,
      latitude: lat,
      longitude: lng,
    })
  } catch {
    onChange({ latitude: lat, longitude: lng })
  }
}
