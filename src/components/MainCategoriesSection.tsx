import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  categoryLocationOptions,
  isDocumentsProceduresPublicCategory,
  popularCategorySearches,
  serviceCategories,
  type LocalizedText,
  type ServiceCategory,
  type ServiceSubcategory,
} from '../config/categories'
import { dimarketLabel } from '../config/categoriesI18n'
import type { TranslationKey } from '../lib/i18n'
import type { MarketplaceCategory } from '../lib/marketplaceCategories'
import { homeCategoryPath } from '../lib/homeCategoryAdapter'
import { findServiceBySlug, servicesPath } from '../lib/serviceTaxonomy'
import {
  appendLocationToPath,
  countrySlugFromGeo,
  geoFromCountrySlug,
  hasActiveLocation,
} from '../lib/globalLocation'

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

function localizedTitle(
  value: LocalizedText,
  languageCode: string,
  slug: string,
): string {
  return dimarketLabel(slug, languageCode, value[languageCode] ?? value.en)
}

function categorySearchText(category: ServiceCategory, languageCode: string): string {
  return [
    category.slug,
    localizedTitle(category.title, languageCode, category.slug),
    category.description.en,
    ...category.subcategories.flatMap((item) => [
      item.slug,
      localizedTitle(item.title, languageCode, item.slug),
      item.description.en,
    ]),
  ]
    .join(' ')
    .toLowerCase()
}

function professionalPath(
  category: ServiceCategory,
  subcategory: ServiceSubcategory,
): string {
  return homeCategoryPath(category, subcategory)
}

/**
 * DImarket category browser: 4-column text grid with click-to-open subcategory menus.
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  subtitle,
  eyebrow,
  showSearch = true,
  className = '',
}: MainCategoriesSectionProps) {
  const { language, t, location, setLocation } = useApp()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const lang = language.code

  useEffect(() => {
    if (!expandedId) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      const item = target instanceof Element ? target.closest('.dimarket-cat-item') : null
      if (item?.classList.contains('is-open')) return
      setExpandedId(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expandedId])

  const countrySlug = countrySlugFromGeo(location)
  const locationDisplay = location.country || t('dimarket.loc.all-europe')
  const selectValue = categoryLocationOptions.some((o) => o.id === countrySlug)
    ? countrySlug
    : 'all-europe'

  const filtered = useMemo(() => {
    const publicCategories = serviceCategories.filter(
      (category) => !isDocumentsProceduresPublicCategory(category.slug),
    )
    const q = query.trim().toLowerCase()
    if (!q) return publicCategories
    return publicCategories.filter((category) =>
      categorySearchText(category, lang).includes(q),
    )
  }, [query, lang])

  const sectionTitle = title ?? t('dimarket.title')
  const sectionSubtitle = subtitle ?? t('dimarket.subtitle')
  const sectionEyebrow = eyebrow ?? t('dimarket.eyebrow')

  const handleSubcategoryClick = (category: ServiceCategory, subcategory: ServiceSubcategory) => {
    setExpandedId(null)
    if (category.slug === 'documents-procedures' || category.slug === 'official-documents') {
      navigateTo(appendLocationToPath(`/documents/${subcategory.slug}`, location))
      return
    }
    navigateTo(appendLocationToPath(professionalPath(category, subcategory), location))
  }

  const handlePopularClick = (itemId: string) => {
    if (itemId === 'buy-sell' || itemId === 'sellRent' || itemId === 'buySell') {
      navigateTo(appendLocationToPath(homeCategoryPath({ slug: 'buy-sell', href: '/sell-rent' }), location))
      return
    }
    if (itemId === 'jobs') {
      navigateTo(appendLocationToPath(homeCategoryPath({ slug: 'jobs', href: '/vacancies' }), location))
      return
    }
    const resolved = findServiceBySlug(itemId)
    if (resolved) {
      navigateTo(appendLocationToPath(servicesPath(resolved.subcategory.slug), location))
      return
    }
    const popular = popularCategorySearches.find((p) => p.id === itemId)
    if (popular) setQuery(popular.query)
  }

  const openCategory = (category: ServiceCategory) => {
    setExpandedId(null)
    navigateTo(appendLocationToPath(homeCategoryPath(category), location))
  }

  const handleCategoryActivate = (event: MouseEvent<HTMLAnchorElement>, category: ServiceCategory) => {
    if (category.subcategories.length > 0) {
      event.preventDefault()
      setExpandedId((current) => (current === category.id ? null : category.id))
      return
    }
    openCategory(category)
  }

  return (
    <section
      id={id}
      className={`dimarket-categories home-section layout-page-gutter ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="dimarket-categories__head">
        {showSearch ? <p className="dimarket-categories__eyebrow">{sectionEyebrow}</p> : null}
        <h2 id={`${id}-title`} className="dimarket-categories__title">
          {sectionTitle}
        </h2>
        {showSearch ? <p>{sectionSubtitle}</p> : null}
      </div>

      {showSearch ? (
        <>
          <div className="dimarket-search" role="search">
            <label className="dimarket-search__input">
              <Search className="h-5 w-5" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('dimarket.searchPlaceholder')}
                aria-label={t('dimarket.searchPlaceholder')}
              />
            </label>
            <label className="dimarket-search__location">
              <MapPin className="h-5 w-5" aria-hidden />
              <span>{t('dimarket.locationLabel')}</span>
              <select
                value={selectValue}
                onChange={(event) => setLocation(geoFromCountrySlug(event.target.value, location))}
                aria-label={t('dimarket.locationLabel')}
                title={locationDisplay}
              >
                <option value="all-europe">
                  {hasActiveLocation(location) && selectValue === 'all-europe'
                    ? locationDisplay
                    : t('dimarket.loc.all-europe')}
                </option>
                {categoryLocationOptions
                  .filter((option) => option.id !== 'all-europe')
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {selectValue === option.id && hasActiveLocation(location)
                        ? locationDisplay
                        : t(`dimarket.loc.${option.id}` as TranslationKey)}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="dimarket-popular" aria-label={t('dimarket.popularSearchesLabel')}>
            <span>{t('dimarket.popularSearchesLabel')}</span>
            <div>
              {popularCategorySearches.map((item) => (
                <button key={item.id} type="button" onClick={() => handlePopularClick(item.id)}>
                  {t(`dimarket.popular.${item.id}` as TranslationKey)}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {filtered.length === 0 ? (
        <p className="dimarket-categories__empty">{t('dimarket.noResults')}</p>
      ) : (
        <ul
          className="dimarket-cat-grid"
          data-category-count={filtered.length}
          data-includes-buy-sell={filtered.some((c) => c.id === 'buy-sell') ? '1' : '0'}
          data-includes-jobs={filtered.some((c) => c.id === 'jobs') ? '1' : '0'}
        >
          {filtered.map((category) => {
            const expanded = expandedId === category.id
            const categoryTitle = localizedTitle(category.title, lang, category.slug)
            const categoryHref = appendLocationToPath(homeCategoryPath(category), location)
            const hasSubs = category.subcategories.length > 0
            return (
              <li
                key={category.id}
                className={`dimarket-cat-item${expanded ? ' is-open' : ''}`}
              >
                <a
                  href={categoryHref}
                  className="dimarket-cat-item__link"
                  aria-haspopup={hasSubs ? 'menu' : undefined}
                  aria-expanded={hasSubs ? expanded : undefined}
                  aria-controls={hasSubs ? `${id}-subs-${category.id}` : undefined}
                  onClick={(event) => handleCategoryActivate(event, category)}
                >
                  {categoryTitle}
                </a>
                {hasSubs ? (
                  <ul
                    id={`${id}-subs-${category.id}`}
                    className="dimarket-cat-item__menu"
                    role="menu"
                    aria-label={categoryTitle}
                  >
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="dimarket-cat-item__all"
                        onClick={() => openCategory(category)}
                      >
                        {categoryTitle}
                      </button>
                    </li>
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleSubcategoryClick(category, subcategory)}
                        >
                          {localizedTitle(subcategory.title, lang, subcategory.slug)}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
