import { useEffect, useMemo, useState } from 'react'
import {
  attachDistances,
  EMPTY_MAP_FILTERS,
  fetchMarketplaceMapMarkers,
  filterMapMarkers,
  type MapExploreFilters,
  type MarketplaceMapMarker,
} from '../lib/marketplaceMap'
import { EMPTY_GEO_SEARCH, type GeoSearchState } from '../lib/geoSearch'
import type { MapBounds } from '../components/map/EuropeMarketplaceMap'

export type UseMarketplaceMapMarkersOptions = {
  /** Caps listing markers only. Public businesses load independently (see marketplaceMap). */
  limit: number
  geo: GeoSearchState
  filters?: Partial<MapExploreFilters>
  /**
   * When false, city/GPS/radius does not hide pins. Directory maps show every
   * public business; geo still attaches distances and can pan the camera.
   */
  geoFilter?: boolean
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
  geoFilter = true,
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

  const origin = useMemo(
    () =>
      geo.originLat != null && geo.originLng != null
        ? { lat: geo.originLat, lon: geo.originLng }
        : null,
    [geo.originLat, geo.originLng],
  )

  const visible = useMemo(() => {
    const filtered = filterMapMarkers(
      markers,
      geoFilter ? geo : EMPTY_GEO_SEARCH,
      activeFilters,
      viewportFilter ? bounds : null,
    )
    return withDistances ? attachDistances(filtered, origin) : filtered
  }, [markers, geo, geoFilter, activeFilters, bounds, viewportFilter, withDistances, origin])

  return { markers, visible, loading, setMarkers }
}
