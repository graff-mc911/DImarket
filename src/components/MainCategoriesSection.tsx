import { useMemo, useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
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
  type ServiceSubcategory,
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

function professionalPath(category: ServiceCategory, subcategory: ServiceSubcategory, locationId: string): string {
  const params = new URLSearchParams()
  params.set('work', subcategory.slug)
  params.set('category', category.slug)
  if (locationId !== 'all-europe') params.set('location', locationId)
  return `/professionals?${params.toString()}`
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const handleSubcategoryClick = (category: ServiceCategory, subcategory: ServiceSubcategory) => {
    navigateTo(professionalPath(category, subcategory, locationId))
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
              const expanded = expandedId === category.id
              return (
                <m.article key={category.id} className="serviya-category-card" layout>
                  <button
                    type="button"
                    className="serviya-category-card__button"
                    onClick={() => setExpandedId(expanded ? null : category.id)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? localized(categoriesUiText.closeCategory, lang) : localized(categoriesUiText.openCategory, lang)}: ${localized(category.title, lang)}`}
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

                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <m.div
                        className="serviya-subcategories"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <div>
                          {category.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              className="serviya-subcategory-chip"
                              onClick={() => handleSubcategoryClick(category, subcategory)}
                              title={localized(subcategory.description, lang)}
                            >
                              <span aria-hidden>{subcategory.icon}</span>
                              {localized(subcategory.title, lang)}
                            </button>
                          ))}
                        </div>
                      </m.div>
                    ) : null}
                  </AnimatePresence>
                </m.article>
              )
            })}
          </m.div>
        </LazyMotion>
      )}
    </section>
  )
}
