import { useMemo } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useMarketplaceMapMarkers } from '../../hooks/useMarketplaceMapMarkers'
import type { MapMarkerKind } from '../../lib/marketplaceMap'
import { EuropeMarketplaceMap } from '../map/EuropeMarketplaceMap'
import { navigateTo } from '../../lib/navigation'

type Props = {
  /** Trade labels / kinds hint — filters map markers loosely */
  preferKinds?: MapMarkerKind[]
  /** Primary subcategory from estimate for map filter SSoT */
  subcategorySlug?: string
  /** Free-text service query (trade label) */
  serviceQuery?: string
  heightClassName?: string
}

/**
 * Estimator results map — reuses EuropeMarketplaceMap SSoT (no second Leaflet).
 */
export function EstimatorResultsMap({
  preferKinds,
  subcategorySlug = '',
  serviceQuery = '',
  heightClassName = 'min-h-[280px] h-[320px]',
}: Props) {
  const { t, location } = useApp()

  const filters = useMemo(
    () => ({
      kinds:
        preferKinds && preferKinds.length > 0
          ? new Set<MapMarkerKind>(preferKinds)
          : ('all' as const),
      subcategorySlug: subcategorySlug || '',
      serviceQuery: serviceQuery || subcategorySlug || '',
    }),
    [preferKinds, subcategorySlug, serviceQuery],
  )

  const { visible, loading } = useMarketplaceMapMarkers({
    limit: 120,
    geo: location,
    filters,
  })

  const markers = useMemo(() => visible.slice(0, 80), [visible])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-[#6f665d]">{t('costEstimator.mapHint')}</p>
        <button
          type="button"
          className="rounded-full bg-[#f3f0ea] px-3 py-1.5 text-[12px] font-semibold text-[#2f2a24] hover:bg-[#ebebed]"
          onClick={() => navigateTo('/map')}
        >
          {t('costEstimator.openFullMap')}
        </button>
      </div>
      <div className={`overflow-hidden rounded-none border border-[rgba(148,163,184,0.22)] ${heightClassName}`}>
        <EuropeMarketplaceMap
          markers={markers}
          geo={location}
          loading={loading}
          followLocation
          scrollWheelZoom={false}
          className="!h-full !min-h-[280px] !rounded-none !border-0"
        />
      </div>
    </div>
  )
}
