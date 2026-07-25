import { Filter, Search } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

interface CategorySearchFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  minRating: number
  onMinRatingChange: (value: number) => void
  verifiedOnly: boolean
  onVerifiedOnlyChange: (value: boolean) => void
}

export function CategorySearchFilters({
  search,
  onSearchChange,
  minRating,
  onMinRatingChange,
  verifiedOnly,
  onVerifiedOnlyChange,
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
