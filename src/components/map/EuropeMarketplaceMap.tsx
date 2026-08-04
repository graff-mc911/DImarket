import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import {
  mapFocusFromGeo,
  type MarketplaceMapMarker,
  type MapMarkerKind,
} from '../../lib/marketplaceMap'
import type { GeoSearchState } from '../../lib/geoSearch'
import { hasActiveLocation } from '../../lib/globalLocation'

type Cluster = {
  id: string
  lat: number
  lng: number
  points: MarketplaceMapMarker[]
}

interface EuropeMarketplaceMapProps {
  markers: MarketplaceMapMarker[]
  geo: GeoSearchState
  loading?: boolean
  className?: string
  /** When true, fit/pan to global location focus */
  followLocation?: boolean
}

function clusterCellForZoom(zoom: number): number {
  if (zoom >= 14) return 0.01
  if (zoom >= 12) return 0.03
  if (zoom >= 10) return 0.08
  if (zoom >= 8) return 0.2
  if (zoom >= 6) return 0.45
  return 0.9
}

function clusterPoints(points: MarketplaceMapMarker[], cell: number): Cluster[] {
  const buckets = new Map<string, MarketplaceMapMarker[]>()
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

function kindGlyph(kind: MapMarkerKind | 'mixed'): string {
  if (kind === 'professional') return 'M'
  if (kind === 'company') return 'C'
  if (kind === 'project') return 'P'
  return '+'
}

function kindColor(kind: MapMarkerKind | 'mixed'): string {
  if (kind === 'professional') return '#1a2330'
  if (kind === 'company') return '#2f6fed'
  if (kind === 'project') return '#c96d2c'
  return '#ff9900'
}

function markerHtml(count: number, kind: MapMarkerKind | 'mixed'): string {
  const color = kindColor(kind)
  const label = count > 1 ? String(count) : kindGlyph(kind)
  return `<span class="home-map-pin dimarket-map-pin" style="--pin:${color}" title="${kind}">${label}</span>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function popupHtml(m: MarketplaceMapMarker, t: (k: string) => string): string {
  const photo = m.photoUrl
    ? `<img class="dimarket-map-popup__photo" src="${escapeHtml(m.photoUrl)}" alt="" width="56" height="56" />`
    : `<span class="dimarket-map-popup__photo dimarket-map-popup__photo--placeholder">${kindGlyph(m.kind)}</span>`

  const rating =
    m.rating != null && m.rating > 0
      ? `<span class="dimarket-map-popup__rating">★ ${m.rating.toFixed(1)}</span>`
      : ''

  const verified = m.verified
    ? `<span class="dimarket-map-popup__badge">${escapeHtml(t('mapExplore.verified'))}</span>`
    : ''

  const place = [m.city, m.country].filter(Boolean).join(', ')
  const cta =
    m.kind === 'project'
      ? t('mapExplore.viewProject')
      : t('mapExplore.viewProfile')

  const extra =
    m.kind === 'project'
      ? [
          m.category ? `<div>${escapeHtml(m.category)}</div>` : '',
          m.budgetLabel ? `<div>${escapeHtml(m.budgetLabel)}</div>` : '',
          m.status ? `<div>${escapeHtml(m.status)}</div>` : '',
        ].join('')
      : [
          m.subtitle ? `<div>${escapeHtml(m.subtitle)}</div>` : '',
          m.description ? `<p>${escapeHtml(m.description)}</p>` : '',
        ].join('')

  return `
    <div class="dimarket-map-popup">
      <div class="dimarket-map-popup__head">
        ${photo}
        <div>
          <strong>${escapeHtml(m.title)}</strong>
          <div class="dimarket-map-popup__meta">${rating}${verified}</div>
          ${place ? `<div class="dimarket-map-popup__place">${escapeHtml(place)}</div>` : ''}
        </div>
      </div>
      <div class="dimarket-map-popup__body">${extra}</div>
      <a class="dimarket-map-popup__cta" data-path="${escapeHtml(m.path)}" href="${escapeHtml(m.path)}">${escapeHtml(cta)}</a>
    </div>
  `
}

/**
 * Full-page Europe marketplace map (Leaflet + OSM).
 * Zoom-aware clustering; rich popups; syncs focus with global location.
 */
export function EuropeMarketplaceMap({
  markers,
  geo,
  loading,
  className = '',
  followLocation = true,
}: EuropeMarketplaceMapProps) {
  const { t } = useApp()
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const zoomRef = useRef(4)

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, {
      center: [50.1, 10.5],
      zoom: 4,
      scrollWheelZoom: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    zoomRef.current = map.getZoom()
    map.on('zoomend', () => {
      zoomRef.current = map.getZoom()
    })
    window.setTimeout(() => map.invalidateSize(), 80)

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  const clusters = useMemo(() => {
    const cell = clusterCellForZoom(zoomRef.current)
    return clusterPoints(markers, cell)
  }, [markers])

  // Re-render markers when clusters/markers change; also on zoom to re-cluster
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    const render = () => {
      layer.clearLayers()
      const cell = clusterCellForZoom(map.getZoom())
      const nextClusters = clusterPoints(markers, cell)

      for (const cluster of nextClusters) {
        const kinds = new Set(cluster.points.map((p) => p.kind))
        const kind: MapMarkerKind | 'mixed' =
          kinds.size === 1 ? cluster.points[0].kind : 'mixed'
        const icon = L.divIcon({
          className: 'home-map-marker',
          html: markerHtml(cluster.points.length, kind),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
        const marker = L.marker([cluster.lat, cluster.lng], { icon })

        if (cluster.points.length === 1) {
          marker.bindPopup(popupHtml(cluster.points[0], t as (k: string) => string), {
            maxWidth: 280,
            className: 'dimarket-map-popup-wrap',
          })
        } else {
          marker.on('click', () => {
            map.setView([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 16), {
              animate: true,
            })
          })
          const list = cluster.points
            .slice(0, 8)
            .map(
              (p) =>
                `<li><a data-path="${escapeHtml(p.path)}" href="${escapeHtml(p.path)}">${escapeHtml(p.title)}</a> <em>${escapeHtml(p.kind)}</em></li>`,
            )
            .join('')
          marker.bindPopup(
            `<strong>${cluster.points.length} ${escapeHtml(t('homePremium.mapNearby'))}</strong>
             <ul class="home-map-popup-list">${list}</ul>
             <button type="button" class="dimarket-map-zoom" data-zoom="1">${escapeHtml(t('mapExplore.zoomCluster'))}</button>`,
            { maxWidth: 280 },
          )
        }

        marker.on('popupopen', () => {
          const popupEl = marker.getPopup()?.getElement()
          popupEl?.querySelectorAll('a[data-path]').forEach((a) => {
            a.addEventListener('click', (ev) => {
              ev.preventDefault()
              const path = (a as HTMLAnchorElement).getAttribute('data-path')
              if (path) navigateTo(path)
            })
          })
          popupEl?.querySelectorAll('[data-zoom]').forEach((btn) => {
            btn.addEventListener('click', (ev) => {
              ev.preventDefault()
              map.setView([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 16), {
                animate: true,
              })
              map.closePopup()
            })
          })
        })

        marker.addTo(layer)
      }
    }

    render()
    map.on('zoomend', render)
    return () => {
      map.off('zoomend', render)
    }
  }, [markers, clusters, t])

  // Sync map focus with global location
  useEffect(() => {
    const map = mapRef.current
    if (!map || !followLocation) return
    const focus = mapFocusFromGeo(geo)
    if (focus && hasActiveLocation(geo)) {
      map.setView(focus.center, focus.zoom, { animate: true })
      return
    }
    if (markers.length > 0 && !hasActiveLocation(geo)) {
      const bounds = L.latLngBounds(markers.map((p) => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.18), { maxZoom: 7, animate: true })
    }
  }, [
    geo.country,
    geo.region,
    geo.province,
    geo.city,
    geo.radius,
    geo.originLat,
    geo.originLng,
    followLocation,
    markers.length,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    window.setTimeout(() => map.invalidateSize(), 60)
  }, [markers.length, loading])

  return (
    <div className={`home-map dimarket-map ${className}`.trim()}>
      {loading ? <p className="home-map__status">{t('homePremium.mapLoading')}</p> : null}
      {!loading && markers.length === 0 ? (
        <p className="home-map__status">{t('mapExplore.empty')}</p>
      ) : null}
      <div ref={mapEl} className="home-map__canvas dimarket-map__canvas" role="presentation" />
    </div>
  )
}
