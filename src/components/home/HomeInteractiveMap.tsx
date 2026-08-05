import { Briefcase, Building2, Globe2, ShoppingBag, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../../contexts/AppContext'
import type { HomeMapPoint } from '../../lib/homeMarketplace'
import { MAP_KIND_COLORS, MAP_KIND_GLYPH } from '../../lib/marketplaceMap'
import { navigateTo } from '../../lib/navigation'

type MapFilter = 'all' | HomeMapPoint['kind']

interface HomeInteractiveMapProps {
  points: HomeMapPoint[]
  loading?: boolean
}

type Cluster = {
  id: string
  lat: number
  lng: number
  points: HomeMapPoint[]
}

function clusterPoints(points: HomeMapPoint[], cell = 0.45): Cluster[] {
  const buckets = new Map<string, HomeMapPoint[]>()
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

function markerHtml(count: number, kind: HomeMapPoint['kind'] | 'mixed'): string {
  const color = kind === 'mixed' ? MAP_KIND_COLORS.mixed : MAP_KIND_COLORS[kind]
  const label = count > 1 ? String(count) : MAP_KIND_GLYPH[kind === 'mixed' ? 'mixed' : kind]
  return `<span class="home-map-pin" style="--pin:${color}">${label}</span>`
}

export function HomeInteractiveMap({ points, loading }: HomeInteractiveMapProps) {
  const { t } = useApp()
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [filter, setFilter] = useState<MapFilter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return points
    return points.filter((p) => p.kind === filter)
  }, [points, filter])

  const clusters = useMemo(() => clusterPoints(filtered), [filtered])

  const counts = useMemo(
    () => ({
      all: points.length,
      professional: points.filter((p) => p.kind === 'professional').length,
      company: points.filter((p) => p.kind === 'company').length,
      project: points.filter((p) => p.kind === 'project').length,
      marketplace: points.filter((p) => p.kind === 'marketplace').length,
      job: points.filter((p) => p.kind === 'job').length,
    }),
    [points],
  )

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
      const kinds = new Set(cluster.points.map((p) => p.kind))
      const kind =
        kinds.size === 1 ? (cluster.points[0].kind as HomeMapPoint['kind']) : 'mixed'
      const icon = L.divIcon({
        className: 'home-map-marker',
        html: markerHtml(cluster.points.length, kind === 'mixed' ? 'mixed' : kind),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      const marker = L.marker([cluster.lat, cluster.lng], { icon })

      if (cluster.points.length === 1) {
        const p = cluster.points[0]
        marker.bindPopup(
          `<strong>${p.title}</strong><br/><span>${p.subtitle || ''}</span><br/><a data-path="${p.path}" href="${p.path}">Open</a>`,
        )
      } else {
        const list = cluster.points
          .slice(0, 6)
          .map(
            (p) =>
              `<li><a data-path="${p.path}" href="${p.path}">${p.title}</a> <em>${p.kind}</em></li>`,
          )
          .join('')
        marker.bindPopup(
          `<strong>${cluster.points.length} ${t('homePremium.mapNearby')}</strong><ul class="home-map-popup-list">${list}</ul>`,
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
      })
      marker.addTo(layer)
    }

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map((p) => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.2), { maxZoom: 7, animate: true })
    }
  }, [clusters, filtered, t])

  const filters: Array<{
    id: MapFilter
    label: string
    icon: typeof UserRound
    count: number
    color?: string
  }> = [
    { id: 'all', label: t('homePremium.mapAll'), icon: Globe2, count: counts.all },
    {
      id: 'professional',
      label: t('homePremium.mapPros'),
      icon: UserRound,
      count: counts.professional,
      color: MAP_KIND_COLORS.professional,
    },
    {
      id: 'company',
      label: t('homePremium.mapCompanies'),
      icon: Building2,
      count: counts.company,
      color: MAP_KIND_COLORS.company,
    },
    {
      id: 'project',
      label: t('homePremium.mapProjects'),
      icon: Briefcase,
      count: counts.project,
      color: MAP_KIND_COLORS.project,
    },
    {
      id: 'marketplace',
      label: t('mapExplore.kindMarketplace'),
      icon: ShoppingBag,
      count: counts.marketplace,
      color: MAP_KIND_COLORS.marketplace,
    },
    {
      id: 'job',
      label: t('mapExplore.kindJobs'),
      icon: Briefcase,
      count: counts.job,
      color: MAP_KIND_COLORS.job,
    },
  ]

  return (
    <section
      className="home-section home-section--muted home-section--tight layout-page-gutter"
      aria-labelledby="home-map-title"
    >
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.mapEyebrow')}</p>
          <h2 id="home-map-title" className="home-section__title">
            {t('homePremium.mapTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.mapSubtitle')}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="home-map__filters map-kind-filters" role="group" aria-label={t('homePremium.mapFilters')}>
            {filters.map((f) => {
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`home-map__filter map-kind-filter ${filter === f.id ? 'is-active' : ''}`}
                  style={
                    f.color ? ({ '--kind-color': f.color } as CSSProperties) : undefined
                  }
                  onClick={() => setFilter(f.id)}
                >
                  {f.color ? (
                    <span className="map-kind-filter__dot" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                  {f.label}
                  <span className="map-kind-filter__count">{f.count}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => navigateTo('/map')}
          >
            {t('homePremium.mapOpenFull')}
          </button>
        </div>
      </div>

      <div className="home-map">
        {loading ? <p className="home-map__status">{t('homePremium.mapLoading')}</p> : null}
        {!loading && filtered.length === 0 ? (
          <p className="home-map__status">{t('homePremium.mapEmpty')}</p>
        ) : null}
        <div ref={mapEl} className="home-map__canvas" role="presentation" />
      </div>
    </section>
  )
}
