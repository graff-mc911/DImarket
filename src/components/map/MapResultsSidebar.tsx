import {
  Briefcase,
  Building2,
  MapPin,
  ShoppingBag,
  Star,
  UserRound,
} from 'lucide-react'
import { navigateTo } from '../../lib/navigation'
import {
  formatMapDistance,
  MAP_KIND_COLORS,
  type MarketplaceMapMarker,
  type MapMarkerKind,
} from '../../lib/marketplaceMap'

type MapResultsSidebarProps = {
  markers: MarketplaceMapMarker[]
  selectedId: string | null
  onSelect: (id: string) => void
  labels: {
    title: string
    empty: string
    online: string
    verified: string
    view: string
  }
}

const KIND_ICON: Record<MapMarkerKind, typeof UserRound> = {
  professional: UserRound,
  company: Building2,
  manufacturer: Building2,
  agent: UserRound,
  project: Briefcase,
  job: Briefcase,
  marketplace: ShoppingBag,
}

export function MapResultsSidebar({
  markers,
  selectedId,
  onSelect,
  labels,
}: MapResultsSidebarProps) {
  if (markers.length === 0) {
    return (
      <div className="map-results-sidebar amazon-section-card p-4">
        <h2 className="text-sm font-bold text-[var(--ink-900)]">{labels.title}</h2>
        <p className="mt-3 text-sm text-[var(--ink-600)]">{labels.empty}</p>
      </div>
    )
  }

  return (
    <div className="map-results-sidebar amazon-section-card flex max-h-[70vh] flex-col overflow-hidden p-0 lg:max-h-[calc(100vh-12rem)]">
      <div className="border-b border-[var(--ink-100,#e8e8ed)] px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--ink-900)]">
          {labels.title}{' '}
          <span className="font-medium text-[var(--ink-500)]">({markers.length})</span>
        </h2>
      </div>
      <ul className="flex-1 space-y-0 overflow-y-auto overscroll-contain">
        {markers.map((m) => {
          const Icon = KIND_ICON[m.kind]
          const active = selectedId === m.id
          const dist = formatMapDistance(m.distanceKm)
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className={`flex w-full gap-3 border-b border-[var(--ink-100,#f0f0f2)] px-4 py-3 text-left transition hover:bg-[#fafafa] ${
                  active ? 'bg-[#fff8f0] ring-1 ring-inset ring-[var(--brand-primary,#ff9900)]' : ''
                }`}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: MAP_KIND_COLORS[m.kind] }}
                >
                  {m.photoUrl ? (
                    <img
                      src={m.photoUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold text-[var(--ink-900)]">
                      {m.title}
                    </span>
                    {m.rating != null && m.rating > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
                        <Star className="h-3 w-3 fill-current" />
                        {m.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-[var(--ink-600)]">
                    {m.subtitle || m.category}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ink-500)]">
                    {(m.city || m.country) && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {[m.city, m.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {dist ? <span>· {dist}</span> : null}
                    {m.verified ? (
                      <span className="rounded-full bg-[#ecfdf5] px-1.5 py-0.5 font-semibold text-[#047857]">
                        {labels.verified}
                      </span>
                    ) : null}
                    {m.online ? (
                      <span className="rounded-full bg-[#dcfce7] px-1.5 py-0.5 font-semibold text-[#15803d]">
                        {labels.online}
                      </span>
                    ) : null}
                    {m.budgetLabel ? <span>· {m.budgetLabel}</span> : null}
                  </span>
                  <span className="mt-2 inline-flex text-[12px] font-semibold text-[var(--accent-600,#007185)]">
                    {labels.view} →
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {selectedId ? (
        <div className="border-t border-[var(--ink-100,#e8e8ed)] p-3">
          <button
            type="button"
            className="btn-primary w-full text-sm"
            onClick={() => {
              const m = markers.find((x) => x.id === selectedId)
              if (m) navigateTo(m.path)
            }}
          >
            {labels.view}
          </button>
        </div>
      ) : null}
    </div>
  )
}
