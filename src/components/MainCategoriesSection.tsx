import { useMemo, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { ChevronRight, MapPin, Search } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  categoryLocationOptions,
  categoriesUiText,
  popularCategorySearches,
  serviceCategories,
  type LocalizedText,
  type ServiceCategory,
} from '../config/categories'
import type { MarketplaceCategory } from '../lib/marketplaceCategories'

export interface MainCategoriesSectionProps {
  id?: string
  title?: string
  subtitle?: string
  eyebrow?: string
  showSearch?: boolean
  /** Preloaded categories (skip internal fetch) */
  categories?: MarketplaceCategory[]
  loading?: boolean
  className?: string
}

function localized(value: LocalizedText, languageCode: string): string {
  return value[languageCode as keyof LocalizedText] ?? value.en
}

function categorySearchText(category: ServiceCategory, languageCode: string): string {
  return [
    category.slug,
    localized(category.title, languageCode),
    localized(category.description, languageCode),
    ...category.subcategories.flatMap((item) => [
      item.slug,
      localized(item.title, languageCode),
      localized(item.description, languageCode),
    ]),
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * Serviya-inspired category browser for DImarket.
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  subtitle,
  eyebrow,
  className = '',
}: MainCategoriesSectionProps) {
  const { language } = useApp()
  const [query, setQuery] = useState('')
  const [locationId, setLocationId] = useState(categoryLocationOptions[0]?.id ?? 'all-europe')
  const lang = language.code

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return serviceCategories
    return serviceCategories.filter((category) =>
      categorySearchText(category, lang).includes(q),
    )
  }, [query, lang])

  const sectionTitle = title ?? localized(categoriesUiText.title, lang)
  const sectionSubtitle = subtitle ?? localized(categoriesUiText.subtitle, lang)
  const sectionEyebrow = eyebrow ?? localized(categoriesUiText.eyebrow, lang)

  const handleCategoryClick = (category: ServiceCategory) => {
    const params = new URLSearchParams()
    if (locationId !== 'all-europe') params.set('location', locationId)
    const suffix = params.toString() ? `?${params.toString()}` : ''
    navigateTo(`/category/${encodeURIComponent(category.slug)}${suffix}`)
  }

  return (
    <section
      id={id}
      className={`serviya-categories home-section layout-page-gutter ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="serviya-categories__head">
        <p className="serviya-categories__eyebrow">{sectionEyebrow}</p>
        <h2 id={`${id}-title`}>{sectionTitle}</h2>
        <p>{sectionSubtitle}</p>
      </div>

      <div className="serviya-search" role="search">
        <label className="serviya-search__input">
          <Search className="h-5 w-5" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={localized(categoriesUiText.searchPlaceholder, lang)}
            aria-label={localized(categoriesUiText.searchPlaceholder, lang)}
          />
        </label>
        <label className="serviya-search__location">
          <MapPin className="h-5 w-5" aria-hidden />
          <span>{localized(categoriesUiText.locationLabel, lang)}</span>
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            aria-label={localized(categoriesUiText.locationLabel, lang)}
          >
            {categoryLocationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {localized(option.label, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="serviya-popular" aria-label={localized(categoriesUiText.popularSearchesLabel, lang)}>
        <span>{localized(categoriesUiText.popularSearchesLabel, lang)}</span>
        <div>
          {popularCategorySearches.map((item) => (
            <button key={item.id} type="button" onClick={() => setQuery(item.query)}>
              {localized(item.label, lang)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="serviya-categories__empty">{localized(categoriesUiText.noResults, lang)}</p>
      ) : (
        <LazyMotion features={domAnimation}>
          <m.div className="serviya-category-grid" layout>
            {filtered.map((category) => {
              return (
                <m.article key={category.id} className="serviya-category-card" layout>
                  <button
                    type="button"
                    className="serviya-category-card__button"
                    onClick={() => handleCategoryClick(category)}
                    aria-label={`${localized(categoriesUiText.openCategory, lang)}: ${localized(category.title, lang)}`}
                  >
                    <span className="serviya-category-card__icon" aria-hidden>
                      {category.icon}
                    </span>
                    <span className="serviya-category-card__body">
                      <strong>{localized(category.title, lang)}</strong>
                      <span>{category.serviceCount} {localized(categoriesUiText.servicesLabel, lang)}</span>
                    </span>
                    <ChevronRight className="serviya-category-card__chevron" aria-hidden />
                  </button>
                </m.article>
              )
            })}
          </m.div>
        </LazyMotion>
      )}
    </section>
  )
}
