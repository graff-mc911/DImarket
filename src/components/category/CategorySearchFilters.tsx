import { Filter, Search } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

interface CategorySearchFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  minRating: number
  onMinRatingChange: (value: number) => void
  verifiedOnly: boolean
  onVerifiedOnlyChange: (value: boolean) => void
  city: string
  onCityChange: (value: string) => void
  country: string
  onCountryChange: (value: string) => void
  maxPrice: string
  onMaxPriceChange: (value: string) => void
  availability: string
  onAvailabilityChange: (value: string) => void
  languageFilter: string
  onLanguageFilterChange: (value: string) => void
}

export function CategorySearchFilters({
  search,
  onSearchChange,
  minRating,
  onMinRatingChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  city,
  onCityChange,
  country,
  onCountryChange,
  maxPrice,
  onMaxPriceChange,
  availability,
  onAvailabilityChange,
  languageFilter,
  onLanguageFilterChange,
}: CategorySearchFiltersProps) {
  const { t } = useApp()

  return (
    <div className="cat-toolbar">
      <label className="cat-toolbar__search">
        <Search className="h-4 w-4 text-[#b07e55]" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('marketplace.searchInCategory')}
          aria-label={t('marketplace.searchInCategory')}
        />
      </label>
      <div className="cat-toolbar__filters">
        <Filter className="h-4 w-4 text-[#b07e55]" aria-hidden />
        <input
          type="search"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder={t('advancedSearch.city')}
          aria-label={t('advancedSearch.city')}
        />
        <input
          type="search"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          placeholder={t('advancedSearch.country')}
          aria-label={t('advancedSearch.country')}
        />
        <select
          value={minRating}
          onChange={(e) => onMinRatingChange(Number(e.target.value))}
          aria-label={t('marketplace.minRating')}
        >
          <option value={0}>{t('marketplace.anyRating')}</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </select>
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          placeholder={t('advancedSearch.priceMax')}
          aria-label={t('advancedSearch.priceMax')}
        />
        <select
          value={availability}
          onChange={(e) => onAvailabilityChange(e.target.value)}
          aria-label={t('advancedSearch.availability')}
        >
          <option value="">{t('advancedSearch.anyAvailability')}</option>
          <option value="available">{t('advancedSearch.available')}</option>
          <option value="limited">{t('advancedSearch.limited')}</option>
          <option value="busy">{t('advancedSearch.busy')}</option>
        </select>
        <input
          type="search"
          value={languageFilter}
          onChange={(e) => onLanguageFilterChange(e.target.value)}
          placeholder={t('advancedSearch.languages')}
          aria-label={t('advancedSearch.languages')}
        />
        <label className="cat-toolbar__check">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
          />
          {t('marketplace.verifiedOnly')}
        </label>
      </div>
    </div>
  )
}
