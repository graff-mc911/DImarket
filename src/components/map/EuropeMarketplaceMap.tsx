import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import {
  DEFAULT_EUROPE_VIEW,
  formatMapDistance,
  MAP_KIND_COLORS,
  MAP_KIND_GLYPH,
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

export type MapBounds = { south: number; west: number; north: number; east: number }

interface EuropeMarketplaceMapProps {
  markers: MarketplaceMapMarker[]
  geo: GeoSearchState
  loading?: boolean
  className?: string
  followLocation?: boolean
  /** Home preview disables wheel zoom; full /map keeps it on. */
  scrollWheelZoom?: boolean
  selectedId?: string | null
  onSelectMarker?: (id: string | null) => void
  onBoundsChange?: (bounds: MapBounds) => void
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
  return MAP_KIND_GLYPH[kind]
}

function kindColor(kind: MapMarkerKind | 'mixed', online?: boolean): string {
  if (kind === 'professional' && online) return '#16a34a'
  if (kind === 'professional' && !online) return '#15803d'
  return MAP_KIND_COLORS[kind]
}

function markerHtml(count: number, kind: MapMarkerKind | 'mixed', online?: boolean): string {
  const color = kindColor(kind, online)
  const label = count > 1 ? String(count) : kindGlyph(kind)
  const pulse = count === 1 && kind === 'professional' && online ? ' is-online' : ''
  return `<span class="home-map-pin dimarket-map-pin${pulse}" style="--pin:${color}" title="${kind}">${label}</span>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function ctaLabel(m: MarketplaceMapMarker, t: (k: string) => string): string {
  if (m.kind === 'project') return t('mapExplore.viewProject')
  if (m.kind === 'job') return t('mapExplore.viewJob')
  if (m.kind === 'marketplace') return t('mapExplore.viewListing')
  if (m.kind === 'manufacturer') return t('mapExplore.viewManufacturer')
  return t('mapExplore.viewProfile')
}

function popupHtml(m: MarketplaceMapMarker, t: (k: string) => string): string {
  const photo = m.photoUrl
    ? `<img class="dimarket-map-popup__photo" src="${escapeHtml(m.photoUrl)}" alt="" width="56" height="56" loading="lazy" />`
    : `<span class="dimarket-map-popup__photo dimarket-map-popup__photo--placeholder" style="background:${kindColor(m.kind, m.online)}">${kindGlyph(m.kind)}</span>`

  const rating =
    m.rating != null && m.rating > 0
      ? `<span class="dimarket-map-popup__rating">★ ${m.rating.toFixed(1)}</span>`
      : ''

  const verified = m.verified
    ? `<span class="dimarket-map-popup__badge">${escapeHtml(t('mapExplore.verified'))}</span>`
    : ''

  const online =
    m.kind === 'professional' && m.online
      ? `<span class="dimarket-map-popup__online">${escapeHtml(t('mapExplore.online'))}</span>`
      : ''

  const place = [m.city, m.country].filter(Boolean).join(', ')
  const dist = formatMapDistance(m.distanceKm)
  const distHtml = dist
    ? `<div class="dimarket-map-popup__place">${escapeHtml(dist)} · ${escapeHtml(t('mapExplore.distance'))}</div>`
    : ''

  const extra =
    m.kind === 'project' || m.kind === 'job' || m.kind === 'marketplace'
      ? [
          m.subtitle ? `<div>${escapeHtml(m.subtitle)}</div>` : '',
          m.budgetLabel ? `<div>${escapeHtml(m.budgetLabel)}</div>` : '',
          m.status ? `<div>${escapeHtml(m.status)}</div>` : '',
          m.description ? `<p>${escapeHtml(m.description)}</p>` : '',
        ].join('')
      : [
          m.subtitle ? `<div>${escapeHtml(m.subtitle)}</div>` : '',
          m.description ? `<p>${escapeHtml(m.description)}</p>` : '',
          m.availability ? `<div>${escapeHtml(m.availability)}</div>` : '',
        ].join('')

  return `
    <div class="dimarket-map-popup" data-marker-id="${escapeHtml(m.id)}">
      <div class="dimarket-map-popup__head">
        ${photo}
        <div>
          <strong>${escapeHtml(m.title)}</strong>
          <div class="dimarket-map-popup__meta">${rating}${verified}${online}</div>
          ${place ? `<div class="dimarket-map-popup__place">${escapeHtml(place)}</div>` : ''}
          ${distHtml}
        </div>
      </div>
      <div class="dimarket-map-popup__body">${extra}</div>
      <a class="dimarket-map-popup__cta" data-path="${escapeHtml(m.path)}" href="${escapeHtml(m.path)}">${escapeHtml(ctaLabel(m, t))}</a>
    </div>
  `
}

/**
 * Full-page Europe marketplace map (Leaflet + OSM).
 * Original DImarket implementation — zoom clustering, rich popups, location sync.
 */
export function EuropeMarketplaceMap({
  markers,
  geo,
  loading,
  className = '',
  followLocation = true,
  scrollWheelZoom = true,
  selectedId = null,
  onSelectMarker,
  onBoundsChange,
}: EuropeMarketplaceMapProps) {
  const { t } = useApp()
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markerById = useRef<Map<string, L.Marker>>(new Map())
  const zoomRef = useRef(DEFAULT_EUROPE_VIEW.zoom)

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, {
      center: DEFAULT_EUROPE_VIEW.center,
      zoom: DEFAULT_EUROPE_VIEW.zoom,
      scrollWheelZoom,
      touchZoom: true,
      dragging: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    zoomRef.current = map.getZoom()

    const emitBounds = () => {
      const b = map.getBounds()
      onBoundsChange?.({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      })
    }

    map.on('zoomend', () => {
      zoomRef.current = map.getZoom()
      emitBounds()
    })
    map.on('moveend', emitBounds)
    window.setTimeout(() => {
      map.invalidateSize()
      emitBounds()
    }, 80)

    return () => {
      map.off('zoomend')
      map.off('moveend')
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markerById.current.clear()
    }
    // onBoundsChange identity intentionally omitted — parent should stabilize via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clusters = useMemo(() => {
    const cell = clusterCellForZoom(zoomRef.current)
    return clusterPoints(markers, cell)
  }, [markers])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    const render = () => {
      layer.clearLayers()
      markerById.current.clear()
      const cell = clusterCellForZoom(map.getZoom())
      const nextClusters = clusterPoints(markers, cell)

      for (const cluster of nextClusters) {
        const kinds = new Set(cluster.points.map((p) => p.kind))
        const kind: MapMarkerKind | 'mixed' =
          kinds.size === 1 ? cluster.points[0].kind : 'mixed'
        const online = cluster.points.length === 1 && cluster.points[0].online
        const icon = L.divIcon({
          className: 'home-map-marker',
          html: markerHtml(cluster.points.length, kind, online),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
        const marker = L.marker([cluster.lat, cluster.lng], { icon })

        if (cluster.points.length === 1) {
          const point = cluster.points[0]
          markerById.current.set(point.id, marker)
          marker.bindPopup(popupHtml(point, t as (k: string) => string), {
            maxWidth: 300,
            className: 'dimarket-map-popup-wrap',
          })
          marker.on('click', () => onSelectMarker?.(point.id))
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
                `<li><a data-path="${escapeHtml(p.path)}" data-marker-id="${escapeHtml(p.id)}" href="${escapeHtml(p.path)}">${escapeHtml(p.title)}</a> <em>${escapeHtml(p.kind)}</em></li>`,
            )
            .join('')
          marker.bindPopup(
            `<strong>${cluster.points.length} ${escapeHtml(t('homePremium.mapNearby'))}</strong>
             <ul class="home-map-popup-list">${list}</ul>
             <button type="button" class="dimarket-map-zoom" data-zoom="1">${escapeHtml(t('mapExplore.zoomCluster'))}</button>`,
            { maxWidth: 300 },
          )
        }

        marker.on('popupopen', () => {
          const popupEl = marker.getPopup()?.getElement()
          popupEl?.querySelectorAll('a[data-path]').forEach((a) => {
            a.addEventListener('click', (ev) => {
              ev.preventDefault()
              const path = (a as HTMLAnchorElement).getAttribute('data-path')
              const mid = (a as HTMLAnchorElement).getAttribute('data-marker-id')
              if (mid) onSelectMarker?.(mid)
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
  }, [markers, clusters, t, onSelectMarker])

  // Open popup when sidebar selects a marker
  useEffect(() => {
    if (!selectedId) return
    const map = mapRef.current
    const point = markers.find((m) => m.id === selectedId)
    if (!map || !point) return
    map.setView([point.lat, point.lng], Math.max(map.getZoom(), 12), { animate: true })
    window.setTimeout(() => {
      markerById.current.get(selectedId)?.openPopup()
    }, 280)
  }, [selectedId, markers])

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
  }, [markers.length, loading, className])

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
