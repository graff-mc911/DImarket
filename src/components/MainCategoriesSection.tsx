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
import { serviyaLabel } from '../config/categoriesI18n'
import type { TranslationKey } from '../lib/i18n'
import type { MarketplaceCategory } from '../lib/marketplaceCategories'
import { supabase } from '../lib/supabase'
import {
  findServiceBySlug,
  matchesServiceProfile,
  servicesPath,
} from '../lib/serviceTaxonomy'

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
  return serviyaLabel(slug, languageCode, value[languageCode] ?? value.en)
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
  _category: ServiceCategory,
  subcategory: ServiceSubcategory,
  locationId: string,
): string {
  return servicesPath(subcategory.slug, {
    location: locationId !== 'all-europe' ? locationId : undefined,
  })
}

/**
 * Serviya-inspired category browser for DImarket.
 * Main category click expands; subcategory navigates to /services/:slug results.
 */
export function MainCategoriesSection({
  id = 'choose-category',
  title,
  subtitle,
  eyebrow,
  className = '',
}: MainCategoriesSectionProps) {
  const { language, t } = useApp()
  const [query, setQuery] = useState('')
  const [locationId, setLocationId] = useState(categoryLocationOptions[0]?.id ?? 'all-europe')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statsByCategory, setStatsByCategory] = useState<Record<string, CategoryStats>>({})
  const lang = language.code

  const filtered = useMemo(() => {
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

  const sectionTitle = title ?? t('serviya.title')
  const sectionSubtitle = subtitle ?? t('serviya.subtitle')
  const sectionEyebrow = eyebrow ?? t('serviya.eyebrow')

  const handleSubcategoryClick = (category: ServiceCategory, subcategory: ServiceSubcategory) => {
    navigateTo(professionalPath(category, subcategory, locationId))
  }

  const handlePopularClick = (itemId: string) => {
    const resolved = findServiceBySlug(itemId)
    if (resolved) {
      navigateTo(servicesPath(resolved.subcategory.slug, {
        location: locationId !== 'all-europe' ? locationId : undefined,
      }))
      return
    }
    const popular = popularCategorySearches.find((p) => p.id === itemId)
    if (popular) setQuery(popular.query)
  }

  const formatCategoryStats = (category: ServiceCategory): string => {
    const stats = statsByCategory[category.id]
    if (!stats) {
      return `${category.serviceCount} ${t('serviya.servicesLabel')}`
    }
    return t('services.statsSpecialistsCompanies')
      .replace('{specialists}', String(stats.specialists))
      .replace('{companies}', String(stats.companies))
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
            placeholder={t('serviya.searchPlaceholder')}
            aria-label={t('serviya.searchPlaceholder')}
          />
        </label>
        <label className="serviya-search__location">
          <MapPin className="h-5 w-5" aria-hidden />
          <span>{t('serviya.locationLabel')}</span>
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            aria-label={t('serviya.locationLabel')}
          >
            {categoryLocationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {t(`serviya.loc.${option.id}` as TranslationKey)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="serviya-popular" aria-label={t('serviya.popularSearchesLabel')}>
        <span>{t('serviya.popularSearchesLabel')}</span>
        <div>
          {popularCategorySearches.map((item) => (
            <button key={item.id} type="button" onClick={() => handlePopularClick(item.id)}>
              {t(`serviya.popular.${item.id}` as TranslationKey)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="serviya-categories__empty">{t('serviya.noResults')}</p>
      ) : (
        <LazyMotion features={domAnimation}>
          <m.div className="serviya-category-grid" layout>
            {filtered.map((category) => {
              const expanded = expandedId === category.id
              const categoryTitle = localizedTitle(category.title, lang, category.slug)
              return (
                <m.article key={category.id} className="serviya-category-card" layout>
                  <button
                    type="button"
                    className="serviya-category-card__button"
                    onClick={() => setExpandedId(expanded ? null : category.id)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? t('serviya.closeCategory') : t('serviya.openCategory')}: ${categoryTitle}`}
                  >
                    <span className="serviya-category-card__icon" aria-hidden>
                      {category.icon}
                    </span>
                    <span className="serviya-category-card__body">
                      <strong>{categoryTitle}</strong>
                      <span>{formatCategoryStats(category)}</span>
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
