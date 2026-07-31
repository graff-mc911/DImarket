import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../../contexts/AppContext'
import type { CompanyMapPoint } from '../../lib/companies/types'
import { navigateTo } from '../../lib/navigation'

type Props = {
  points: CompanyMapPoint[]
  loading?: boolean
}

type Cluster = {
  id: string
  lat: number
  lng: number
  points: CompanyMapPoint[]
}

function clusterPoints(points: CompanyMapPoint[], cell = 0.4): Cluster[] {
  const buckets = new Map<string, CompanyMapPoint[]>()
  for (const p of points) {
    const key = `${Math.round(p.lat / cell)}_${Math.round(p.lng / cell)}`
    const list = buckets.get(key) ?? []
    list.push(p)
    buckets.set(key, list)
  }
  return Array.from(buckets.entries()).map(([id, list]) => ({
    id,
    lat: list.reduce((s, x) => s + x.lat, 0) / list.length,
    lng: list.reduce((s, x) => s + x.lng, 0) / list.length,
    points: list,
  }))
}

function markerHtml(count: number): string {
  const label = count > 1 ? String(count) : 'C'
  return `<span class="home-map-pin" style="--pin:#2f6fed">${label}</span>`
}

export function CompaniesMap({ points, loading }: Props) {
  const { t } = useApp()
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const clusters = useMemo(() => clusterPoints(points), [points])

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, {
      center: [50.1, 10.5],
      zoom: 4,
      scrollWheelZoom: false,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    for (const cluster of clusters) {
      const icon = L.divIcon({
        className: 'home-map-marker',
        html: markerHtml(cluster.points.length),
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      const marker = L.marker([cluster.lat, cluster.lng], { icon })
      if (cluster.points.length === 1) {
        const p = cluster.points[0]
        marker.bindPopup(
          `<div class="home-map-popup-list"><strong>${p.name}</strong><br/>${
            p.city || ''
          } · ★ ${p.rating.toFixed(1)}<br/><button type="button" data-slug="${
            p.slug
          }" class="amazon-link">${t('companiesDir.viewCompany')}</button></div>`,
        )
        marker.on('popupopen', () => {
          const btn = document.querySelector(`button[data-slug="${p.slug}"]`)
          btn?.addEventListener('click', () => navigateTo(`/companies/${p.slug}`), {
            once: true,
          })
        })
      } else {
        const list = cluster.points
          .slice(0, 8)
          .map(
            (p) =>
              `<li><button type="button" data-slug="${p.slug}" class="amazon-link text-left">${p.name}</button></li>`,
          )
          .join('')
        marker.bindPopup(
          `<div class="home-map-popup-list"><strong>${cluster.points.length} ${t(
            'companiesDir.countSuffix',
          )}</strong><ul>${list}</ul></div>`,
        )
        marker.on('popupopen', () => {
          document.querySelectorAll('button[data-slug]').forEach((el) => {
            el.addEventListener(
              'click',
              () => {
                const slug = (el as HTMLElement).getAttribute('data-slug')
                if (slug) navigateTo(`/companies/${slug}`)
              },
              { once: true },
            )
          })
        })
      }
      marker.addTo(layer)
    }

    if (points.length) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.2), { maxZoom: 10 })
    }
    window.setTimeout(() => map.invalidateSize(), 60)
  }, [clusters, points, t])

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#e8e8ed] bg-white">
      {loading ? (
        <div className="absolute inset-x-0 top-0 z-[500] bg-white/80 px-3 py-2 text-center text-[12px] font-semibold text-[#6e6e73]">
          {t('common.loading')}
        </div>
      ) : null}
      <div
        ref={mapEl}
        className="h-[420px] w-full"
        role="region"
        aria-label={t('companiesDir.mapView')}
      />
      {!loading && points.length === 0 ? (
        <p className="absolute inset-0 z-[400] flex items-center justify-center bg-white/70 text-[13px] text-[#6e6e73]">
          {t('companiesDir.mapEmpty')}
        </p>
      ) : null}
    </div>
  )
}
