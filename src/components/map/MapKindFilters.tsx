import {
  Briefcase,
  Building2,
  Globe2,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { MAP_KIND_COLORS, type MapMarkerKind } from '../../lib/marketplaceMap'

export type MapKindFilterId = 'all' | MapMarkerKind

export type MapKindCounts = Record<MapKindFilterId, number>

type Labels = {
  all: string
  professional: string
  company: string
  project: string
  marketplace: string
  job: string
  filtersAria: string
}

type Props = {
  value: MapKindFilterId
  onChange: (next: MapKindFilterId) => void
  counts: MapKindCounts
  labels: Labels
}

const KIND_META: Array<{
  id: MapKindFilterId
  icon: LucideIcon
  color?: string
  labelKey: keyof Labels
}> = [
  { id: 'all', icon: Globe2, labelKey: 'all' },
  {
    id: 'professional',
    icon: UserRound,
    color: MAP_KIND_COLORS.professional,
    labelKey: 'professional',
  },
  {
    id: 'company',
    icon: Building2,
    color: MAP_KIND_COLORS.company,
    labelKey: 'company',
  },
  {
    id: 'project',
    icon: Briefcase,
    color: MAP_KIND_COLORS.project,
    labelKey: 'project',
  },
  {
    id: 'marketplace',
    icon: ShoppingBag,
    color: MAP_KIND_COLORS.marketplace,
    labelKey: 'marketplace',
  },
  {
    id: 'job',
    icon: Briefcase,
    color: MAP_KIND_COLORS.job,
    labelKey: 'job',
  },
]

/**
 * Kind chip row shared by Home map + MapExplore (UI SSoT for map kind filters).
 */
export function MapKindFilters({ value, onChange, counts, labels }: Props) {
  return (
    <div className="home-map__filters map-kind-filters" role="group" aria-label={labels.filtersAria}>
      {KIND_META.map((f) => {
        const Icon = f.icon
        const label = labels[f.labelKey]
        return (
          <button
            key={f.id}
            type="button"
            className={`home-map__filter map-kind-filter ${value === f.id ? 'is-active' : ''}`}
            style={f.color ? ({ '--kind-color': f.color } as CSSProperties) : undefined}
            onClick={() => onChange(f.id)}
          >
            {f.color ? (
              <span className="map-kind-filter__dot" aria-hidden />
            ) : (
              <Icon className="h-4 w-4" aria-hidden />
            )}
            {label}
            <span className="map-kind-filter__count">{counts[f.id]}</span>
          </button>
        )
      })}
    </div>
  )
}

export function emptyMapKindCounts(): MapKindCounts {
  return {
    all: 0,
    professional: 0,
    company: 0,
    project: 0,
    marketplace: 0,
    job: 0,
  }
}

export function countMapKinds(
  markers: Array<{ kind: MapMarkerKind }>,
): MapKindCounts {
  const counts = emptyMapKindCounts()
  counts.all = markers.length
  for (const m of markers) {
    counts[m.kind] += 1
  }
  return counts
}
