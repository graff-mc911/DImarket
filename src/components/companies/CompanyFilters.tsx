import { useApp } from '../../contexts/AppContext'
import { COMPANY_CATEGORIES } from '../../lib/companies/categories'
import type { CompanyFilters as Filters, CompanySort } from '../../lib/companies/types'

type Props = {
  filters: Filters
  onChange: (next: Filters) => void
  cities: string[]
  countries: Array<{ code: string; name: string }>
  languages: string[]
}

export function CompanyFiltersPanel({
  filters,
  onChange,
  cities,
  countries,
  languages,
}: Props) {
  const { t } = useApp()

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <aside
      className="amazon-filter-sidebar space-y-4"
      aria-label={t('companiesDir.filters')}
    >
      <div className="amazon-filter-group">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#565959]">
          {t('companiesDir.category')}
        </p>
        <select
          className="select-glass w-full text-sm"
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
          aria-label={t('companiesDir.category')}
        >
          <option value="">{t('companiesDir.allCategories')}</option>
          {COMPANY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="amazon-filter-group space-y-2">
        <label className="flex items-center gap-2 text-[13px] text-[#1d1d1f]">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => set('verifiedOnly', e.target.checked)}
          />
          {t('companiesDir.verified')}
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[#1d1d1f]">
          <input
            type="checkbox"
            checked={filters.premiumOnly}
            onChange={(e) => set('premiumOnly', e.target.checked)}
          />
          {t('companiesDir.premium')}
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[#1d1d1f]">
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={(e) => set('openNow', e.target.checked)}
          />
          {t('companiesDir.openNow')}
        </label>
      </div>

      <div className="amazon-filter-group">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#565959]">
          {t('companiesDir.minRating')}
        </p>
        <select
          className="select-glass w-full text-sm"
          value={filters.minRating}
          onChange={(e) => set('minRating', Number(e.target.value))}
          aria-label={t('companiesDir.minRating')}
        >
          <option value={0}>{t('companiesDir.anyRating')}</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </select>
      </div>

      <div className="amazon-filter-group">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#565959]">
          {t('companiesDir.country')}
        </p>
        <select
          className="select-glass w-full text-sm"
          value={filters.country}
          onChange={(e) => set('country', e.target.value)}
          aria-label={t('companiesDir.country')}
        >
          <option value="">{t('companiesDir.allCountries')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="amazon-filter-group">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#565959]">
          {t('companiesDir.city')}
        </p>
        <select
          className="select-glass w-full text-sm"
          value={filters.city}
          onChange={(e) => set('city', e.target.value)}
          aria-label={t('companiesDir.city')}
        >
          <option value="">{t('companiesDir.allCities')}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="amazon-filter-group">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#565959]">
          {t('companiesDir.languages')}
        </p>
        <select
          className="select-glass w-full text-sm"
          value={filters.language}
          onChange={(e) => set('language', e.target.value)}
          aria-label={t('companiesDir.languages')}
        >
          <option value="">{t('companiesDir.anyLanguage')}</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="amazon-filter-group">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#565959]">
          {t('companiesDir.sort')}
        </p>
        <select
          className="select-glass w-full text-sm"
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value as CompanySort)}
          aria-label={t('companiesDir.sort')}
        >
          <option value="highest_rated">{t('companiesDir.sortRated')}</option>
          <option value="newest">{t('companiesDir.sortNewest')}</option>
          <option value="most_projects">{t('companiesDir.sortProjects')}</option>
          <option value="alphabetically">{t('companiesDir.sortAlpha')}</option>
        </select>
      </div>
    </aside>
  )
}
