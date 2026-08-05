import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Building2, Globe2, Map as MapIcon, ShoppingBag, UserRound } from 'lucide-react'
import { EuropeMarketplaceMap } from '../components/map/EuropeMarketplaceMap'
import { GeoSearchFilters } from '../components/GeoSearchFilters'
import { useApp } from '../contexts/AppContext'
import {
  EMPTY_MAP_FILTERS,
  fetchMarketplaceMapMarkers,
  filterMapMarkers,
  nextWiderRadius,
  type MapExploreFilters,
  type MapMarkerKind,
  type MarketplaceMapMarker,
} from '../lib/marketplaceMap'
import { serviceCategories } from '../config/categories'
import { serviyaLabel } from '../config/categoriesI18n'

type KindFilter = 'all' | MapMarkerKind

export function MapExplore() {
  const { t, language, location, setLocation, patchLocation } = useApp()
  const lang = language.code

  const [markers, setMarkers] = useState<MarketplaceMapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState<KindFilter>('all')
  const [filters, setFilters] = useState<MapExploreFilters>({ ...EMPTY_MAP_FILTERS })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [serviceQuery, setServiceQuery] = useState('')

  useEffect(() => {
    document.title = `${t('mapExplore.title')} | DImarket`
    let cancelled = false
    setLoading(true)
    void fetchMarketplaceMapMarkers(300).then((rows) => {
      if (cancelled) return
      setMarkers(rows)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [t])

  // Sync service query from URL ?q=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') || params.get('search') || ''
    if (q) {
      setServiceQuery(q)
      setFilters((f) => ({ ...f, serviceQuery: q }))
    }
  }, [])

  const activeFilters: MapExploreFilters = useMemo(
    () => ({
      ...filters,
      serviceQuery,
      kinds:
        kind === 'all'
          ? 'all'
          : new Set<MapMarkerKind>([kind]),
    }),
    [filters, kind, serviceQuery],
  )

  const visible = useMemo(
    () => filterMapMarkers(markers, location, activeFilters),
    [markers, location, activeFilters],
  )

  const counts = useMemo(() => {
    const base = filterMapMarkers(markers, location, {
      ...EMPTY_MAP_FILTERS,
      serviceQuery,
    })
    return {
      all: base.length,
      professional: base.filter((m) => m.kind === 'professional').length,
      company: base.filter((m) => m.kind === 'company').length,
      project: base.filter((m) => m.kind === 'project').length,
      marketplace: base.filter((m) => m.kind === 'marketplace').length,
      job: base.filter((m) => m.kind === 'job').length,
    }
  }, [markers, location, serviceQuery])

  const expandRadius = () => {
    patchLocation({ radius: nextWiderRadius(location.radius) })
  }

  const kindFilters: Array<{ id: KindFilter; label: string; icon: typeof UserRound; count: number }> = [
    { id: 'all', label: t('homePremium.mapAll'), icon: Globe2, count: counts.all },
    { id: 'professional', label: t('homePremium.mapPros'), icon: UserRound, count: counts.professional },
    { id: 'company', label: t('homePremium.mapCompanies'), icon: Building2, count: counts.company },
    { id: 'project', label: t('homePremium.mapProjects'), icon: Briefcase, count: counts.project },
    { id: 'marketplace', label: t('mapExplore.kind.marketplace'), icon: ShoppingBag, count: counts.marketplace },
    { id: 'job', label: t('mapExplore.kind.job'), icon: Briefcase, count: counts.job },
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
          <div className="home-map__filters" role="group" aria-label={t('homePremium.mapFilters')}>
            {kindFilters.map((f) => {
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`home-map__filter ${kind === f.id ? 'is-active' : ''}`}
                  onClick={() => setKind(f.id)}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {f.label}
                  <span className="opacity-60">{f.count}</span>
                </button>
              )
            })}
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
          <h2 className="text-base font-bold text-[var(--ink-900)]">{t('professionals.filtersButton')}</h2>
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
                    {serviyaLabel(c.slug, lang, c.title.en)}
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
                      {serviyaLabel(s.slug, lang, s.title.en)}
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
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <EuropeMarketplaceMap markers={visible} geo={location} loading={loading} />

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
