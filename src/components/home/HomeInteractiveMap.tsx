import { useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useMarketplaceMapMarkers } from '../../hooks/useMarketplaceMapMarkers'
import type { MapMarkerKind } from '../../lib/marketplaceMap'
import { navigateTo } from '../../lib/navigation'
import { EuropeMarketplaceMap } from '../map/EuropeMarketplaceMap'
import {
  countMapKinds,
  MapKindFilters,
  type MapKindFilterId,
} from '../map/MapKindFilters'

interface HomeInteractiveMapProps {
  /** @deprecated Home map loads from marketplaceMap SSoT; kept for call-site compat. */
  points?: unknown
  loading?: boolean
}

/**
 * Home map section — UI chrome only.
 * Leaflet + marker data: EuropeMarketplaceMap + useMarketplaceMapMarkers (map SSoT).
 */
export function HomeInteractiveMap({ loading: parentLoading }: HomeInteractiveMapProps) {
  const { t, location } = useApp()
  const [filter, setFilter] = useState<MapKindFilterId>('all')

  const filters = useMemo(
    () => ({
      kinds: filter === 'all' ? ('all' as const) : new Set<MapMarkerKind>([filter]),
    }),
    [filter],
  )

  const { markers, visible, loading } = useMarketplaceMapMarkers({
    limit: 400,
    geo: location,
    filters,
  })

  const counts = useMemo(() => countMapKinds(markers), [markers])
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
          <MapKindFilters
            value={filter}
            onChange={setFilter}
            counts={counts}
            labels={{
              all: t('homePremium.mapAll'),
              professional: t('homePremium.mapPros'),
              company: t('homePremium.mapCompanies'),
              manufacturer: t('mapExplore.kindManufacturers'),
              agent: t('mapExplore.kindAgents'),
              project: t('homePremium.mapProjects'),
              marketplace: t('mapExplore.kindMarketplace'),
              job: t('mapExplore.kindJobs'),
              filtersAria: t('homePremium.mapFilters'),
            }}
          />
          <button type="button" className="btn-secondary text-sm" onClick={() => navigateTo('/map')}>
            {t('homePremium.mapOpenFull')}
          </button>
        </div>
      </div>

      <EuropeMarketplaceMap
        markers={visible}
        geo={location}
        loading={busy}
        followLocation
        scrollWheelZoom={false}
        className="home-map--embedded"
      />
    </section>
  )
}
