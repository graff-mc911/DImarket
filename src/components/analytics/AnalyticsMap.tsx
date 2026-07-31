import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapPoint } from '../../lib/analytics/bundles'

type Filter = 'all' | 'professional' | 'project' | 'company'

function pinHtml(kind: MapPoint['kind'], heat: boolean): string {
  const color =
    kind === 'professional' ? '#1d1d1f' : kind === 'project' ? '#c2410c' : '#2563eb'
  const size = heat ? 14 : 10
  return `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};opacity:${heat ? 0.55 : 0.9};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25)"></span>`
}

export function AnalyticsMap({
  points,
  loading,
}: {
  points: MapPoint[]
  loading?: boolean
}) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [heatmap, setHeatmap] = useState(true)

  const filtered = useMemo(() => {
    if (filter === 'all') return points
    return points.filter((p) => p.kind === filter)
  }, [points, filter])

  useEffect(() => {
    if (!el.current || mapRef.current) return
    const map = L.map(el.current, {
      center: [50.1, 10.5],
      zoom: 4,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const t = window.setTimeout(() => map.invalidateSize(), 100)
    return () => {
      window.clearTimeout(t)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    const map = mapRef.current
    if (!layer || !map) return
    layer.clearLayers()
    const bounds: L.LatLngExpression[] = []
    for (const p of filtered) {
      const icon = L.divIcon({
        className: '',
        html: pinHtml(p.kind, heatmap),
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      L.marker([p.lat, p.lng], { icon })
        .bindPopup(`<strong>${p.label}</strong><br/><span style="color:#86868b">${p.kind}</span>`)
        .addTo(layer)
      bounds.push([p.lat, p.lng])
    }
    if (bounds.length) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [28, 28], maxZoom: 10 })
    }
  }, [filtered, heatmap])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(
          [
            ['all', 'All'],
            ['professional', 'Professionals'],
            ['project', 'Projects'],
            ['company', 'Companies'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              filter === id
                ? 'bg-[#1d1d1f] text-white'
                : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setHeatmap((h) => !h)}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            heatmap
              ? 'bg-[#e0f2f1] text-[#00695c]'
              : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'
          }`}
        >
          Heatmap style
        </button>
        <span className="text-[11px] text-[#86868b]">
          {loading ? 'Loading…' : `${filtered.length} points`}
        </span>
      </div>
      <div
        ref={el}
        className="h-[320px] w-full overflow-hidden rounded-2xl border border-[#e8e8ed] md:h-[420px]"
      />
    </div>
  )
}
