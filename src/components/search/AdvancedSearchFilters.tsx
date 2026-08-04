import { LocateFixed, SlidersHorizontal } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  EMPTY_SEARCH_FILTERS,
  type SearchFilters,
  type SearchSort,
} from '../../lib/advancedSearch'
import { LocationAutocompleteField } from './LocationAutocompleteField'

const LANG_OPTIONS = ['en', 'uk', 'ru', 'de', 'pl', 'fr', 'es', 'it', 'pt', 'ro'] as const

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  sort: SearchSort
  onFiltersChange: (next: SearchFilters) => void
  onSortChange: (sort: SearchSort) => void
  onApply: () => void
  onReset: () => void
}

export function AdvancedSearchFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onApply,
  onReset,
}: AdvancedSearchFiltersProps) {
  const { t } = useApp()

  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onFiltersChange({
          ...filters,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          distanceKm: filters.distanceKm ?? 50,
        })
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const toggleLang = (code: string) => {
    const has = filters.languages.includes(code)
    set(
      'languages',
      has ? filters.languages.filter((l) => l !== code) : [...filters.languages, code],
    )
  }

  return (
    <aside className="adv-search__filters" aria-label={t('advancedSearch.filters')}>
      <div className="adv-search__filters-head">
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        <h2>{t('advancedSearch.filters')}</h2>
      </div>

      <label className="adv-search__field">
        <span>{t('advancedSearch.sort')}</span>
        <select value={sort} onChange={(e) => onSortChange(e.target.value as SearchSort)}>
          <option value="best_match">{t('advancedSearch.sortBestMatch')}</option>
          <option value="closest">{t('advancedSearch.sortClosest')}</option>
          <option value="newest">{t('advancedSearch.sortNewest')}</option>
          <option value="highest_rated">{t('advancedSearch.sortHighestRated')}</option>
        </select>
      </label>

      <label className="adv-search__field">
        <span>{t('advancedSearch.country')}</span>
        <input
          type="text"
          value={filters.country}
          onChange={(e) => set('country', e.target.value)}
          placeholder={t('advancedSearch.countryPlaceholder')}
        />
      </label>

      <div className="adv-search__field">
        <span>{t('advancedSearch.city')}</span>
        <LocationAutocompleteField
          value={filters.city}
          onChange={(city) => onFiltersChange({ ...filters, city })}
          onSelect={(s) =>
            onFiltersChange({
              ...filters,
              city: s.name || '',
              country: s.country || filters.country,
              lat: s.lat ?? filters.lat,
              lng: s.lon ?? filters.lng,
              distanceKm: filters.distanceKm ?? 25,
            })
          }
          placeholder={t('advancedSearch.cityPlaceholder')}
        />
      </div>

      <label className="adv-search__field">
        <span>{t('advancedSearch.distance')}</span>
        <select
          value={filters.distanceKm ?? ''}
          onChange={(e) =>
            set('distanceKm', e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">{t('advancedSearch.anyDistance')}</option>
          <option value="10">10 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
          <option value="100">100 km</option>
          <option value="200">200 km</option>
        </select>
      </label>

      <button type="button" className="adv-search__locate" onClick={useMyLocation}>
        <LocateFixed className="h-4 w-4" aria-hidden />
        {filters.lat != null
          ? t('advancedSearch.locationSet')
          : t('advancedSearch.useMyLocation')}
      </button>

      <label className="adv-search__field">
        <span>{t('advancedSearch.rating')}</span>
        <select
          value={filters.minRating}
          onChange={(e) => set('minRating', Number(e.target.value))}
        >
          <option value={0}>{t('advancedSearch.anyRating')}</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </select>
      </label>

      <label className="adv-search__field">
        <span>{t('advancedSearch.availability')}</span>
        <select
          value={filters.availability}
          onChange={(e) =>
            set('availability', e.target.value as SearchFilters['availability'])
          }
        >
          <option value="">{t('advancedSearch.anyAvailability')}</option>
          <option value="available">{t('advancedSearch.available')}</option>
          <option value="limited">{t('advancedSearch.limited')}</option>
          <option value="busy">{t('advancedSearch.busy')}</option>
        </select>
      </label>

      <div className="adv-search__field-row">
        <label className="adv-search__field">
          <span>{t('advancedSearch.priceMin')}</span>
          <input
            type="number"
            min={0}
            value={filters.priceMin ?? ''}
            onChange={(e) =>
              set('priceMin', e.target.value ? Number(e.target.value) : null)
            }
            placeholder="€"
          />
        </label>
        <label className="adv-search__field">
          <span>{t('advancedSearch.priceMax')}</span>
          <input
            type="number"
            min={0}
            value={filters.priceMax ?? ''}
            onChange={(e) =>
              set('priceMax', e.target.value ? Number(e.target.value) : null)
            }
            placeholder="€"
          />
        </label>
      </div>

      <fieldset className="adv-search__langs">
        <legend>{t('advancedSearch.languages')}</legend>
        <div className="adv-search__lang-grid">
          {LANG_OPTIONS.map((code) => (
            <label key={code} className="adv-search__lang">
              <input
                type="checkbox"
                checked={filters.languages.includes(code)}
                onChange={() => toggleLang(code)}
              />
              {code.toUpperCase()}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="adv-search__check">
        <input
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={(e) => set('verifiedOnly', e.target.checked)}
        />
        {t('advancedSearch.verifiedOnly')}
      </label>

      <div className="adv-search__filter-actions">
        <button type="button" className="adv-search__apply" onClick={onApply}>
          {t('advancedSearch.apply')}
        </button>
        <button
          type="button"
          className="adv-search__reset"
          onClick={() => {
            onFiltersChange({ ...EMPTY_SEARCH_FILTERS })
            onSortChange('best_match')
            onReset()
          }}
        >
          {t('advancedSearch.reset')}
        </button>
      </div>
    </aside>
  )
}
