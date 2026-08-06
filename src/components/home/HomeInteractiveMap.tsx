import { Briefcase, Building2, Globe2, ShoppingBag, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  EMPTY_MAP_FILTERS,
  fetchMarketplaceMapMarkers,
  filterMapMarkers,
  MAP_KIND_COLORS,
  type MapMarkerKind,
  type MarketplaceMapMarker,
} from '../../lib/marketplaceMap'
import { navigateTo } from '../../lib/navigation'
import { EuropeMarketplaceMap } from '../map/EuropeMarketplaceMap'

type MapFilter = 'all' | MapMarkerKind

interface HomeInteractiveMapProps {
  /** @deprecated Home map loads from marketplaceMap SSoT; kept for call-site compat. */
  points?: unknown
  loading?: boolean
}

/**
 * Home map section — UI chrome only.
 * Leaflet rendering + marker data come from the single map SSoT:
 * EuropeMarketplaceMap + fetchMarketplaceMapMarkers (same as /map).
 */
export function HomeInteractiveMap({ loading: parentLoading }: HomeInteractiveMapProps) {
  const { t, location } = useApp()
  const [filter, setFilter] = useState<MapFilter>('all')
  const [markers, setMarkers] = useState<MarketplaceMapMarker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const next = await fetchMarketplaceMapMarkers(80)
        if (!cancelled) setMarkers(next)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const kinds: MapExploreKinds = filter === 'all' ? 'all' : new Set<MapMarkerKind>([filter])
    return filterMapMarkers(markers, location, { ...EMPTY_MAP_FILTERS, kinds })
  }, [markers, location, filter])

  const counts = useMemo(
    () => ({
      all: markers.length,
      professional: markers.filter((p) => p.kind === 'professional').length,
      company: markers.filter((p) => p.kind === 'company').length,
      project: markers.filter((p) => p.kind === 'project').length,
      marketplace: markers.filter((p) => p.kind === 'marketplace').length,
      job: markers.filter((p) => p.kind === 'job').length,
    }),
    [markers],
  )

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

  const busy = loading || Boolean(parentLoading)

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
                  style={f.color ? ({ '--kind-color': f.color } as CSSProperties) : undefined}
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
          <button type="button" className="btn-secondary text-sm" onClick={() => navigateTo('/map')}>
            {t('homePremium.mapOpenFull')}
          </button>
        </div>
      </div>

      <EuropeMarketplaceMap
        markers={filtered}
        geo={location}
        loading={busy}
        followLocation
        scrollWheelZoom={false}
        className="home-map--embedded"
      />
    </section>
  )
}

type MapExploreKinds = 'all' | Set<MapMarkerKind>
