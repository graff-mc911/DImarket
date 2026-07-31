import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { AdvancedSearchFilters } from '../components/search/AdvancedSearchFilters'
import { SearchAutocomplete } from '../components/search/SearchAutocomplete'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { ListingCard } from '../components/ListingCard'
import { MarketplaceCategoryCard } from '../components/MarketplaceCategoryCard'
import { useApp } from '../contexts/AppContext'
import {
  buildSearchUrl,
  EMPTY_SEARCH_FILTERS,
  parseSearchParams,
  runAdvancedSearch,
  type AdvancedSearchResults,
  type SearchFilters,
  type SearchSort,
} from '../lib/advancedSearch'
import { marketplaceCategoryLabel, marketplaceServiceProsPath } from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'
import { pushRecentSearch } from '../lib/searchHistory'
import { FavoriteButton } from '../components/favorites/FavoriteButton'
import { searchKeyFrom } from '../lib/favorites'

type ResultTab = 'all' | 'professionals' | 'categories' | 'services' | 'projects' | 'cities'

const EMPTY_RESULTS: AdvancedSearchResults = {
  professionals: [],
  categories: [],
  services: [],
  projects: [],
  cities: [],
}

const POPULAR_FALLBACK = [
  'Electrician',
  'Plumber',
  'Painter',
  'Tiling',
  'Roofing',
  'HVAC',
]

export function SearchPage() {
  const { t, language } = useApp()
  const initial = useMemo(() => parseSearchParams(window.location.search), [])

  const [query, setQuery] = useState(initial.q)
  const [filters, setFilters] = useState<SearchFilters>(initial.filters)
  const [sort, setSort] = useState<SearchSort>(initial.sort)
  const [tab, setTab] = useState<ResultTab>('all')
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<AdvancedSearchResults>(EMPTY_RESULTS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const syncUrl = (q: string, nextFilters: SearchFilters, nextSort: SearchSort) => {
    const url = buildSearchUrl(q, nextFilters, nextSort)
    window.history.replaceState({}, '', url)
  }

  const runSearch = async (
    q: string,
    nextFilters: SearchFilters = filters,
    nextSort: SearchSort = sort,
  ) => {
    setLoading(true)
    syncUrl(q, nextFilters, nextSort)
    if (q.trim()) pushRecentSearch(q)
    try {
      const data = await runAdvancedSearch(q, nextFilters, nextSort, language.code)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = `${t('advancedSearch.title')} | DImarket`
    void runSearch(initial.q, initial.filters, initial.sort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onPop = () => {
      const parsed = parseSearchParams(window.location.search)
      setQuery(parsed.q)
      setFilters(parsed.filters)
      setSort(parsed.sort)
      void runSearch(parsed.q, parsed.filters, parsed.sort)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = {
    professionals: results.professionals.length,
    categories: results.categories.length,
    services: results.services.length,
    projects: results.projects.length,
    cities: results.cities.length,
  }
  const total =
    counts.professionals +
    counts.categories +
    counts.services +
    counts.projects +
    counts.cities

  const tabs: Array<{ id: ResultTab; label: string; count: number }> = [
    { id: 'all', label: t('advancedSearch.tabAll'), count: total },
    { id: 'professionals', label: t('advancedSearch.tabPros'), count: counts.professionals },
    { id: 'categories', label: t('advancedSearch.tabCategories'), count: counts.categories },
    { id: 'services', label: t('advancedSearch.tabServices'), count: counts.services },
    { id: 'projects', label: t('advancedSearch.tabProjects'), count: counts.projects },
    { id: 'cities', label: t('advancedSearch.tabCities'), count: counts.cities },
  ]

  const show = (section: ResultTab) => tab === 'all' || tab === section

  return (
    <div className="adv-search">
      <header className="adv-search__hero layout-page-gutter">
        <p className="adv-search__eyebrow">{t('advancedSearch.eyebrow')}</p>
        <h1>{t('advancedSearch.title')}</h1>
        <p className="adv-search__subtitle">{t('advancedSearch.subtitle')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <SearchAutocomplete
              value={query}
              onChange={setQuery}
              onSubmit={(q) => {
                setQuery(q)
                setTab('all')
                void runSearch(q)
              }}
              autoFocus={!initial.q}
              popularFallback={POPULAR_FALLBACK}
            />
          </div>
          <FavoriteButton
            itemType="search"
            label
            title={query.trim() || 'Saved search'}
            search={{
              search_key: searchKeyFrom({
                query,
                path: buildSearchUrl(query, filters, sort),
                city: filters.city,
                country: filters.country,
              }),
              query,
              path: buildSearchUrl(query, filters, sort),
              city: filters.city || undefined,
              country: filters.country || undefined,
            }}
          />
        </div>
      </header>

      <div className="adv-search__layout layout-page-gutter">
        <button
          type="button"
          className="adv-search__filters-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? t('advancedSearch.hideFilters') : t('advancedSearch.showFilters')}
        </button>

        <div className={`adv-search__sidebar ${filtersOpen ? 'is-open' : ''}`}>
          <AdvancedSearchFilters
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onApply={() => {
              setFiltersOpen(false)
              void runSearch(query, filters, sort)
            }}
            onReset={() => {
              setFilters({ ...EMPTY_SEARCH_FILTERS })
              setSort('best_match')
              void runSearch(query, EMPTY_SEARCH_FILTERS, 'best_match')
            }}
          />
        </div>

        <div className="adv-search__main">
          <div className="adv-search__tabs" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'is-active' : ''}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                <span>{item.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <p className="adv-search__status">{t('advancedSearch.loading')}</p>
          ) : total === 0 ? (
            <p className="adv-search__status">{t('advancedSearch.noResults')}</p>
          ) : (
            <>
              {show('professionals') && counts.professionals > 0 && (
                <section className="adv-search__section">
                  <h2>{t('advancedSearch.tabPros')}</h2>
                  <div className="adv-search__grid adv-search__grid--pros">
                    {results.professionals.map((p) => (
                      <ProfessionalCard key={p.id} professional={p} showStatusBadges />
                    ))}
                  </div>
                </section>
              )}

              {show('categories') && counts.categories > 0 && (
                <section className="adv-search__section">
                  <h2>{t('advancedSearch.tabCategories')}</h2>
                  <div className="adv-search__grid adv-search__grid--cats">
                    {results.categories.map((c) => (
                      <MarketplaceCategoryCard key={c.id} category={c} />
                    ))}
                  </div>
                </section>
              )}

              {show('services') && counts.services > 0 && (
                <section className="adv-search__section">
                  <h2>{t('advancedSearch.tabServices')}</h2>
                  <div className="adv-search__service-list">
                    {results.services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="adv-search__service-row"
                        onClick={() =>
                          navigateTo(marketplaceServiceProsPath(s.slug, s.parentSlug))
                        }
                      >
                        <span>{marketplaceCategoryLabel(s, language.code)}</span>
                        <em>{t('advancedSearch.viewProfessionals')}</em>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {show('projects') && counts.projects > 0 && (
                <section className="adv-search__section">
                  <h2>{t('advancedSearch.tabProjects')}</h2>
                  <div className="adv-search__grid adv-search__grid--projects">
                    {results.projects.map((l) => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                </section>
              )}

              {show('cities') && counts.cities > 0 && (
                <section className="adv-search__section">
                  <h2>{t('advancedSearch.tabCities')}</h2>
                  <div className="adv-search__city-list">
                    {results.cities.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="adv-search__city"
                        onClick={() => navigateTo(c.path)}
                      >
                        <MapPin className="h-4 w-4" aria-hidden />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
