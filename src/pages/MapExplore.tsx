import { useCallback, useEffect, useMemo, useState } from 'react'
import { Globe2, List, Map as MapIcon } from 'lucide-react'
import { EuropeMarketplaceMap, type MapBounds } from '../components/map/EuropeMarketplaceMap'
import { MapResultsSidebar } from '../components/map/MapResultsSidebar'
import {
  countMapKinds,
  MapKindFilters,
  type MapKindFilterId,
} from '../components/map/MapKindFilters'
import { GeoSearchFilters } from '../components/GeoSearchFilters'
import { useApp } from '../contexts/AppContext'
import { useMarketplaceMapMarkers } from '../hooks/useMarketplaceMapMarkers'
import {
  attachDistances,
  EMPTY_MAP_FILTERS,
  filterMapMarkers,
  MAP_KIND_COLORS,
  nextWiderRadius,
  type MapExploreFilters,
  type MapMarkerKind,
} from '../lib/marketplaceMap'
import { serviceCategories } from '../config/categories'
import { dimarketLabel } from '../config/categoriesI18n'
import { navigateTo } from '../lib/navigation'

type ViewMode = 'map' | 'list' | 'split'

export function MapExplore() {
  const { t, language, location, setLocation, patchLocation } = useApp()
  const lang = language.code

  const [kind, setKind] = useState<MapKindFilterId>('all')
  const [filters, setFilters] = useState<MapExploreFilters>({ ...EMPTY_MAP_FILTERS })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [serviceQuery, setServiceQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'map' : 'split',
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [viewportFilter, setViewportFilter] = useState(false)

  useEffect(() => {
    document.title = `${t('mapExplore.title')} | DImarket`
  }, [t])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') || params.get('search') || ''
    if (q) {
      setServiceQuery(q)
      setFilters((f) => ({ ...f, serviceQuery: q }))
    }
    const view = params.get('view')
    if (view === 'map' || view === 'list' || view === 'split') setViewMode(view)
  }, [])

  const activePartial = useMemo(
    () => ({
      ...filters,
      serviceQuery,
      kinds: kind === 'all' ? ('all' as const) : new Set<MapMarkerKind>([kind]),
    }),
    [filters, kind, serviceQuery],
  )

  const { markers, visible, loading } = useMarketplaceMapMarkers({
    limit: 400,
    geo: location,
    filters: activePartial,
    withDistances: true,
    bounds,
    viewportFilter,
  })

  const origin =
    location.originLat != null && location.originLng != null
      ? { lat: location.originLat, lon: location.originLng }
      : null

  const counts = useMemo(() => {
    const base = attachDistances(
      filterMapMarkers(markers, location, {
        ...EMPTY_MAP_FILTERS,
        serviceQuery,
      }),
      origin,
    )
    return countMapKinds(base)
  }, [markers, location, serviceQuery, origin])

  const expandRadius = () => {
    patchLocation({ radius: nextWiderRadius(location.radius) })
  }

  const onBoundsChange = useCallback((b: MapBounds) => {
    setBounds(b)
  }, [])

  const onSelectMarker = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const showMap = viewMode === 'map' || viewMode === 'split'
  const showList = viewMode === 'list' || viewMode === 'split'

  const legendItems: Array<{ kind: MapMarkerKind; label: string }> = [
    { kind: 'professional', label: t('mapExplore.legendPro') },
    { kind: 'company', label: t('mapExplore.legendCompany') },
    { kind: 'manufacturer', label: t('mapExplore.legendManufacturer') },
    { kind: 'project', label: t('mapExplore.legendProject') },
    { kind: 'job', label: t('mapExplore.legendJob') },
    { kind: 'marketplace', label: t('mapExplore.legendShop') },
  ]

  return (
    <div className="directory-page map-explore-page pb-24 lg:pb-8">
      <section className="directory-hero amazon-section-card mb-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
              {t('mapExplore.eyebrow')}
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-[var(--ink-900)] sm:text-2xl">
              <MapIcon className="h-6 w-6 text-[var(--accent,#c48a4a)]" aria-hidden />
              {t('mapExplore.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-600)]">{t('mapExplore.subtitle')}</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="inline-flex rounded-full border border-[var(--ink-200,#d2d2d7)] bg-white p-1">
              {(
                [
                  { id: 'map' as const, icon: MapIcon, label: t('mapExplore.viewMap') },
                  { id: 'list' as const, icon: List, label: t('mapExplore.viewList') },
                  { id: 'split' as const, icon: Globe2, label: t('mapExplore.viewSplit') },
                ] as const
              ).map((v) => {
                const Icon = v.icon
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                      viewMode === v.id
                        ? 'bg-[#1a2330] text-white'
                        : 'text-[var(--ink-700)] hover:bg-[#f5f5f7]'
                    }`}
                    onClick={() => setViewMode(v.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {v.label}
                  </button>
                )
              })}
            </div>
            <MapKindFilters
              value={kind}
              onChange={setKind}
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
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setMobileFiltersOpen((v) => !v)}
        className="btn-secondary mb-4 w-full py-2 text-sm lg:hidden"
      >
        {t('professionals.filtersButton')}
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside
          className={`amazon-filter-sidebar w-full lg:w-[240px] lg:shrink-0 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <h2 className="text-base font-bold text-[var(--ink-900)]">
            {t('professionals.filtersButton')}
          </h2>
          <div className="mt-3 space-y-0">
            <div className="amazon-filter-group">
              <label>{t('mapExplore.searchLabel')}</label>
              <input
                type="search"
                className="input-glass h-9 text-sm"
                value={serviceQuery}
                placeholder={t('mapExplore.searchPlaceholder')}
                onChange={(e) => setServiceQuery(e.target.value)}
              />
            </div>

            <GeoSearchFilters value={location} onChange={setLocation} />

            <div className="amazon-filter-group">
              <label>{t('mapExplore.category')}</label>
              <select
                className="select-glass h-9 text-sm"
                value={filters.categorySlug}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    categorySlug: e.target.value,
                    subcategorySlug: '',
                  }))
                }
              >
                <option value="">{t('mapExplore.anyCategory')}</option>
                {serviceCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {dimarketLabel(c.slug, lang, c.title.en)}
                  </option>
                ))}
              </select>
            </div>

            {filters.categorySlug ? (
              <div className="amazon-filter-group">
                <label>{t('mapExplore.subcategory')}</label>
                <select
                  className="select-glass h-9 text-sm"
                  value={filters.subcategorySlug}
                  onChange={(e) => {
                    const slug = e.target.value
                    setFilters((f) => ({ ...f, subcategorySlug: slug }))
                    if (slug) setServiceQuery(slug)
                  }}
                >
                  <option value="">{t('mapExplore.anySubcategory')}</option>
                  {(
                    serviceCategories.find((c) => c.slug === filters.categorySlug)?.subcategories ??
                    []
                  ).map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {dimarketLabel(s.slug, lang, s.title.en)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="amazon-filter-group">
              <label>{t('advancedSearch.rating')}</label>
              <select
                className="select-glass h-9 text-sm"
                value={filters.minRating}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minRating: Number(e.target.value) }))
                }
              >
                <option value={0}>{t('advancedSearch.anyRating')}</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </div>

            <label className="amazon-filter-group flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))
                }
              />
              {t('advancedSearch.verifiedOnly')}
            </label>

            <label className="amazon-filter-group flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, availableOnly: e.target.checked }))
                }
              />
              {t('mapExplore.availableOnly')}
            </label>

            <label className="amazon-filter-group flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={viewportFilter}
                onChange={(e) => setViewportFilter(e.target.checked)}
              />
              {t('mapExplore.viewportOnly')}
            </label>
          </div>

          <div className="mt-4 space-y-2 border-t border-[var(--ink-100,#eee)] pt-3 text-[12px] text-[var(--ink-600)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-500)]">
              {t('mapExplore.legendTitle')}
            </p>
            {legendItems.map((item) => (
              <p key={item.kind} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MAP_KIND_COLORS[item.kind] }}
                />{' '}
                {item.label}
              </p>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div
            className={`grid gap-4 ${
              showMap && showList ? 'xl:grid-cols-[1.4fr_0.9fr]' : 'grid-cols-1'
            }`}
          >
            {showMap ? (
              <EuropeMarketplaceMap
                markers={visible}
                geo={location}
                loading={loading}
                selectedId={selectedId}
                onSelectMarker={onSelectMarker}
                onBoundsChange={onBoundsChange}
                className={viewMode === 'map' ? 'map-explore-fullscreen' : ''}
              />
            ) : null}

            {showList ? (
              <MapResultsSidebar
                markers={visible}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id)
                  if (viewMode === 'list') {
                    const m = visible.find((x) => x.id === id)
                    if (m) navigateTo(m.path)
                  }
                }}
                labels={{
                  title: t('mapExplore.resultsTitle'),
                  empty: t('mapExplore.empty'),
                  online: t('mapExplore.online'),
                  verified: t('mapExplore.verified'),
                  view: t('mapExplore.openResult'),
                }}
              />
            ) : null}
          </div>

          {!loading && visible.length === 0 ? (
            <div className="amazon-section-card mt-4 p-6 text-center">
              <p className="text-sm text-[var(--ink-700)]">{t('mapExplore.empty')}</p>
              <button type="button" className="btn-primary mt-4 text-sm" onClick={expandRadius}>
                {t('mapExplore.expandRadius')}
              </button>
            </div>
          ) : null}

          {!loading && visible.length > 0 ? (
            <p className="mt-3 text-xs text-[var(--ink-500)]">
              {t('mapExplore.resultsCount').replace('{count}', String(visible.length))}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
