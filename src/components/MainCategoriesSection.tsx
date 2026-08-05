import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { ChevronRight, MapPin, Search } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  categoryLocationOptions,
  popularCategorySearches,
  serviceCategories,
  type LocalizedText,
  type ServiceCategory,
  type ServiceSubcategory,
} from '../config/categories'
import { dimarketLabel } from '../config/categoriesI18n'
import type { TranslationKey } from '../lib/i18n'
import type { MarketplaceCategory } from '../lib/marketplaceCategories'
import {
  dbOverlayForHome,
  homeCategoryPath,
  marketplaceBySiteSlug,
} from '../lib/homeCategoryAdapter'
import { supabase } from '../lib/supabase'
import {
  findServiceBySlug,
  matchesServiceProfile,
  servicesPath,
} from '../lib/serviceTaxonomy'
import {
  appendLocationToPath,
  countrySlugFromGeo,
  formatGlobalLocationLabel,
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

type CategoryStats = { specialists: number; companies: number }

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
 * DImarket category browser: expand a card, then open matching professionals.
 * Paints marketing tree from serviceCategories; enriches counts from DB mains
 * via homeCategoryAdapter when `categories` prop is provided (SSoT bridge).
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  subtitle,
  eyebrow,
  categories: marketplaceCategories,
  loading: marketplaceLoading,
  className = '',
}: MainCategoriesSectionProps) {
  const { language, t, location, setLocation } = useApp()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statsByCategory, setStatsByCategory] = useState<Record<string, CategoryStats>>({})
  const lang = language.code

  const dbBySite = useMemo(
    () => marketplaceBySiteSlug(marketplaceCategories),
    [marketplaceCategories],
  )

  const countrySlug = countrySlugFromGeo(location)
  const locationDisplay = formatGlobalLocationLabel(
    location,
    t('dimarket.loc.all-europe'),
  )
  const selectValue = categoryLocationOptions.some((o) => o.id === countrySlug)
    ? countrySlug
    : 'all-europe'

  const filtered = useMemo(() => {
    // Intentionally no .slice() / MAX_CATEGORIES — render every serviceCategories entry
    // (including buy-sell and jobs). Search only filters; it never caps the list.
    const q = query.trim().toLowerCase()
    if (!q) return serviceCategories
    return serviceCategories.filter((category) =>
      categorySearchText(category, lang).includes(q),
    )
  }, [query, lang])

  // Lazy-load directory counts once (for category card stats).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_role, bio, full_name, work_subcategory_slugs, professional_categories(category:categories(name, slug))')
        .eq('is_professional', true)
        .in('user_role', ['professional', 'company'])
        .limit(500)

      if (cancelled || !data) return

      const next: Record<string, CategoryStats> = {}
      for (const category of serviceCategories) {
        const specialistIds = new Set<string>()
        const companyIds = new Set<string>()
        for (const sub of category.subcategories) {
          const resolved = findServiceBySlug(sub.slug)
          if (!resolved) continue
          for (const profile of data as Array<{
            id?: string
            user_role?: string
            bio?: string | null
            full_name?: string | null
            work_subcategory_slugs?: string[] | null
            professional_categories?: { category?: { name?: string; slug?: string } | null }[]
          }>) {
            if (!matchesServiceProfile(profile, resolved.matcher)) continue
            const pid = profile.id ?? `${profile.full_name}-${profile.user_role}`
            if (profile.user_role === 'company') companyIds.add(pid)
            else specialistIds.add(pid)
          }
        }
        next[category.id] = {
          specialists: specialistIds.size,
          companies: companyIds.size,
        }
      }
      if (!cancelled) setStatsByCategory(next)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sectionTitle = title ?? t('dimarket.title')
  const sectionSubtitle = subtitle ?? t('dimarket.subtitle')
  const sectionEyebrow = eyebrow ?? t('dimarket.eyebrow')

  const handleSubcategoryClick = (category: ServiceCategory, subcategory: ServiceSubcategory) => {
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

  const handleCategoryCardClick = (category: ServiceCategory) => {
    // Buy & Sell / Jobs: open dedicated listing page immediately.
    if (category.href) {
      navigateTo(appendLocationToPath(homeCategoryPath(category), location))
      return
    }
    setExpandedId(expandedId === category.id ? null : category.id)
  }

  const formatCategoryStats = (category: ServiceCategory): string => {
    const overlay = dbOverlayForHome(category.slug, dbBySite)
    if (overlay.professionalsCount != null && !marketplaceLoading) {
      const companies = statsByCategory[category.id]?.companies ?? 0
      return t('services.statsSpecialistsCompanies')
        .replace('{specialists}', String(overlay.professionalsCount))
        .replace('{companies}', String(companies))
    }
    const stats = statsByCategory[category.id]
    if (!stats) {
      if (overlay.servicesCount != null) {
        return `${overlay.servicesCount} ${t('dimarket.servicesLabel')}`
      }
      return `${category.serviceCount} ${t('dimarket.servicesLabel')}`
    }
    return t('services.statsSpecialistsCompanies')
      .replace('{specialists}', String(stats.specialists))
      .replace('{companies}', String(stats.companies))
  }

  return (
    <section
      id={id}
      className={`dimarket-categories home-section layout-page-gutter ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="dimarket-categories__head">
        <p className="dimarket-categories__eyebrow">{sectionEyebrow}</p>
        <h2 id={`${id}-title`}>{sectionTitle}</h2>
        <p>{sectionSubtitle}</p>
      </div>

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

      {filtered.length === 0 ? (
        <p className="dimarket-categories__empty">{t('dimarket.noResults')}</p>
      ) : (
        <LazyMotion features={domAnimation}>
          <m.div
            className="dimarket-category-grid"
            layout
            data-category-count={filtered.length}
            data-includes-buy-sell={filtered.some((c) => c.id === 'buy-sell') ? '1' : '0'}
            data-includes-jobs={filtered.some((c) => c.id === 'jobs') ? '1' : '0'}
          >
            {filtered.map((category) => {
              const expanded = expandedId === category.id
              const categoryTitle = localizedTitle(category.title, lang, category.slug)
              return (
                <m.article key={category.id} className="dimarket-category-card" layout>
                  <button
                    type="button"
                    className="dimarket-category-card__button"
                    onClick={() => handleCategoryCardClick(category)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? t('dimarket.closeCategory') : t('dimarket.openCategory')}: ${categoryTitle}`}
                  >
                    <span className="dimarket-category-card__icon" aria-hidden>
                      {category.icon}
                    </span>
                    <span className="dimarket-category-card__body">
                      <strong>{categoryTitle}</strong>
                      <span>{formatCategoryStats(category)}</span>
                    </span>
                    <ChevronRight className="dimarket-category-card__chevron" aria-hidden />
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <m.div
                        className="dimarket-subcategories"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <div>
                          {category.href ? (
                            <button
                              type="button"
                              className="dimarket-subcategory-chip dimarket-subcategory-chip--primary"
                              onClick={() =>
                                navigateTo(appendLocationToPath(homeCategoryPath(category), location))
                              }
                            >
                              <span aria-hidden>{category.icon}</span>
                              {categoryTitle}
                            </button>
                          ) : null}
                          {category.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              className="dimarket-subcategory-chip"
                              onClick={() => handleSubcategoryClick(category, subcategory)}
                              title={subcategory.description.en}
                            >
                              <span aria-hidden>{subcategory.icon}</span>
                              {localizedTitle(subcategory.title, lang, subcategory.slug)}
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
