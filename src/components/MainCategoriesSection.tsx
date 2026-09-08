import { useMemo, useState } from 'react'
import { ChevronRight, MapPin, Search } from 'lucide-react'
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
import { resolveCategoryIcon } from '../lib/categoryIcons'
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
  /** When set, shows «Усі категорії» linking to this path (e.g. /categories). */
  seeAllHref?: string
  /** Page `/categories` needs h1; home embed uses h2. */
  headingAs?: 'h1' | 'h2'
  /** Preloaded categories (skip internal fetch) — kept for call-site compat. */
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

/**
 * Full static catalog (`serviceCategories`) painted as cabinet cards —
 * same UI language as «Знайти підрядника» city tiles.
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  subtitle,
  eyebrow,
  showSearch = true,
  seeAllHref,
  headingAs = 'h2',
  className = '',
}: MainCategoriesSectionProps) {
  const { language, t, location, setLocation } = useApp()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const lang = language.code
  const TitleTag = headingAs

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

  const openCategory = (category: ServiceCategory) => {
    setExpandedId(null)
    navigateTo(appendLocationToPath(homeCategoryPath(category), location))
  }

  const handleSubcategoryClick = (category: ServiceCategory, subcategory: ServiceSubcategory) => {
    setExpandedId(null)
    if (category.slug === 'documents-procedures' || category.slug === 'official-documents') {
      navigateTo(appendLocationToPath(`/documents/${subcategory.slug}`, location))
      return
    }
    navigateTo(appendLocationToPath(homeCategoryPath(category, subcategory), location))
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

  const toggle = (category: ServiceCategory) => {
    if (category.subcategories.length === 0) {
      openCategory(category)
      return
    }
    setExpandedId((current) => (current === category.id ? null : category.id))
  }

  return (
    <section
      id={id}
      className={`dimarket-categories home-section layout-page-gutter py-6 ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="cabinet-sheet">
        <div className="cabinet-sheet__head">
          <div className="dimarket-categories__head mb-0" style={{ textAlign: 'left' }}>
            <div className="dimarket-categories__head-row dimarket-categories__head-row--start">
              <div>
                <p className="dimarket-categories__eyebrow" style={{ textAlign: 'left' }}>
                  {sectionEyebrow}
                </p>
                <TitleTag
                  id={`${id}-title`}
                  className="dimarket-categories__title"
                  style={{ textAlign: 'left' }}
                >
                  {sectionTitle}
                </TitleTag>
                {showSearch ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 md:text-base">{sectionSubtitle}</p>
                ) : null}
              </div>
              {seeAllHref ? (
                <button
                  type="button"
                  className="home-section__link"
                  onClick={() => navigateTo(seeAllHref)}
                >
                  {t('homePremium.seeAllCategories')}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {showSearch ? (
          <>
            <div className="dimarket-search mb-4" role="search">
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

            <div className="dimarket-popular mb-4" aria-label={t('dimarket.popularSearchesLabel')}>
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
        ) : (
          <label className="dimarket-search__input mb-4 max-w-xl">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('mega.searchPlaceholder')}
              aria-label={t('mega.searchPlaceholder')}
            />
          </label>
        )}

        {filtered.length === 0 ? (
          <p className="dimarket-categories__empty">{t('dimarket.noResults')}</p>
        ) : (
          <div
            className="cabinet-sheet__grid"
            data-category-count={filtered.length}
            data-includes-buy-sell={filtered.some((c) => c.id === 'buy-sell') ? '1' : '0'}
            data-includes-jobs={filtered.some((c) => c.id === 'jobs') ? '1' : '0'}
          >
            {filtered.map((category) => {
              const expanded = expandedId === category.id
              const categoryTitle = localizedTitle(category.title, lang, category.slug)
              const Icon = resolveCategoryIcon(category.slug)
              const countHint =
                category.subcategories.length > 0
                  ? `${category.subcategories.length} ${t('dimarket.servicesLabel')}`
                  : t('dimarket.openCategory')
              const sub = expanded
                ? `${category.subcategories.length} · ${t('marketplace.viewServices')}`
                : countHint

              return (
                <article
                  key={category.id}
                  className={`dimarket-category-card${expanded ? ' cabinet-sheet__cell--span' : ''}`}
                >
                  <button
                    type="button"
                    className="dimarket-category-card__button"
                    onClick={() => toggle(category)}
                    onDoubleClick={() => openCategory(category)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? t('dimarket.closeCategory') : t('dimarket.openCategory')}: ${categoryTitle}`}
                  >
                    <span className="dimarket-category-card__icon" aria-hidden>
                      <Icon className="h-8 w-8 text-[color:var(--icon-well-ink)]" />
                    </span>
                    <span className="dimarket-category-card__body">
                      <strong>{categoryTitle}</strong>
                      <span>{sub}</span>
                    </span>
                    <ChevronRight className="dimarket-category-card__chevron h-5 w-5" aria-hidden />
                  </button>

                  {expanded ? (
                    <div className="dimarket-subcategories">
                      <div>
                        <button
                          type="button"
                          className="dimarket-subcategory-chip dimarket-subcategory-chip--primary"
                          onClick={() => openCategory(category)}
                        >
                          {t('marketplace.viewServices')}
                        </button>
                        {category.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            type="button"
                            className="dimarket-subcategory-chip"
                            onClick={() => handleSubcategoryClick(category, subcategory)}
                          >
                            {localizedTitle(subcategory.title, lang, subcategory.slug)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
