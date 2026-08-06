import { useEffect, useMemo, useState } from 'react'
import {
  attachDistances,
  EMPTY_MAP_FILTERS,
  fetchMarketplaceMapMarkers,
  filterMapMarkers,
  type MapExploreFilters,
  type MarketplaceMapMarker,
} from '../lib/marketplaceMap'
import type { GeoSearchState } from '../lib/geoSearch'
import type { MapBounds } from '../components/map/EuropeMarketplaceMap'

export type UseMarketplaceMapMarkersOptions = {
  /** Max markers to fetch (Home 80, Estimator 120, MapExplore 400). */
  limit: number
  geo: GeoSearchState
  filters?: Partial<MapExploreFilters>
  /** When true, attach distanceKm from geo origin. */
  withDistances?: boolean
  /** Optional viewport bounds filter. */
  bounds?: MapBounds | null
  /** When true with bounds, filter to viewport. */
  viewportFilter?: boolean
}

/**
 * Shared fetch → filter → optional distances for all map surfaces.
 * Data SSoT remains marketplaceMap.ts; this only removes duplicated orchestration.
 */
export function useMarketplaceMapMarkers({
  limit,
  geo,
  filters,
  withDistances = false,
  bounds = null,
  viewportFilter = false,
}: UseMarketplaceMapMarkersOptions) {
  const [markers, setMarkers] = useState<MarketplaceMapMarker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchMarketplaceMapMarkers(limit).then((rows) => {
      if (cancelled) return
      setMarkers(rows)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [limit])

  const activeFilters: MapExploreFilters = useMemo(
    () => ({ ...EMPTY_MAP_FILTERS, ...filters }),
    [filters],
  )

  const origin =
    geo.originLat != null && geo.originLng != null
      ? { lat: geo.originLat, lon: geo.originLng }
      : null

  const visible = useMemo(() => {
    const filtered = filterMapMarkers(
      markers,
      geo,
      activeFilters,
      viewportFilter ? bounds : null,
    )
    return withDistances ? attachDistances(filtered, origin) : filtered
  }, [markers, geo, activeFilters, bounds, viewportFilter, withDistances, origin])

  return { markers, visible, loading, setMarkers }
}
