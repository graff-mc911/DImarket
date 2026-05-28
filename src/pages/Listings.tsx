// ============================================================
// Listings.tsx — Каталог оголошень
//
// Додано порівняно з оригіналом:
// 1. Фільтр типу оголошення (всі / послуга / продаж / шукаю)
// 2. Сортування (новіші / дешевші / дорожчі / більше переглядів)
// 3. Фільтр максимальної ціни
// 4. Promoted оголошення показуються вгорі
// Весь оригінальний код пошуку і категорій збережено.
// ============================================================

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  MapPin,
  PlusCircle,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { supabase }            from '../lib/supabase'
import { useApp }              from '../contexts/AppContext'
import { navigateTo }          from '../lib/navigation'
import { ListingCard }         from '../components/ListingCard'
import { CenterPageAd }        from '../components/CenterPageAd'
import { MobileAdBanner }      from '../components/MobileAdBanner'
import type { Category, ListingWithImages } from '../lib/types'
import {
  SITE_CATEGORY_CONFIG,
  categoryPagePath,
  type SiteCategorySlug,
} from '../lib/siteCategories'
import { ConstructionWorkTypesPanel } from '../components/ConstructionWorkTypesPanel'
import {
  categoryHasWorkSubcategories,
  subcategorySlugsForGroup,
} from '../lib/categoryCatalog'

// Типи оголошень для фільтру
const LISTING_TYPES = [
  { value: '',                label: 'Всі типи' },
  { value: 'service_request', label: 'Потрібна послуга' },
  { value: 'service_offer',   label: 'Пропоную послугу' },
  { value: 'item_sale',       label: 'Продаж' },
  { value: 'item_wanted',     label: 'Шукаю / Куплю' },
]

// Варіанти сортування
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Новіші' },
  { value: 'oldest',    label: 'Старіші' },
  { value: 'price_asc', label: 'Дешевші' },
  { value: 'price_desc',label: 'Дорожчі' },
  { value: 'views',     label: 'Популярні' },
]

type ListingsProps = {
  /** Фіксована категорія для окремих сторінок (/vacancies, /sell-rent). */
  fixedCategorySlug?: SiteCategorySlug
}

export function Listings({ fixedCategorySlug }: ListingsProps = {}) {
  const { t } = useApp()

  const [allListings, setAllListings]   = useState<ListingWithImages[]>([])
  const [categories, setCategories]     = useState<Category[]>([])
  const [loading, setLoading]           = useState(true)

  // Фільтри
  const [searchQuery, setSearchQuery]         = useState('')
  const [locationQuery, setLocationQuery]     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType]       = useState('')
  const [maxPrice, setMaxPrice]               = useState('')
  const [sortBy, setSortBy]                   = useState('newest')
  const [showFilters, setShowFilters]         = useState(false)
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

  // Синхронізація фільтрів з URL при навігації
  useEffect(() => {
    const syncFiltersFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      setSearchQuery(params.get('search') || '')
      setLocationQuery(params.get('location') || '')
      setSelectedCategory(fixedCategorySlug || params.get('category') || '')
      setSelectedType(params.get('type') || '')
      const workGroup = params.get('work')
      if (workGroup) {
        const cat = fixedCategorySlug || params.get('category') || 'construction'
        if (!fixedCategorySlug) setSelectedCategory(cat)
        setSelectedSubcategories(subcategorySlugsForGroup(cat, workGroup))
      } else {
        const subs = params.getAll('sub').filter(Boolean)
        setSelectedSubcategories(subs)
      }
    }

    syncFiltersFromUrl()
    window.addEventListener('popstate', syncFiltersFromUrl)
    return () => window.removeEventListener('popstate', syncFiltersFromUrl)
  }, [fixedCategorySlug])

  const categoryPageMeta = useMemo(() => {
    if (!fixedCategorySlug) return null
    const cfg = SITE_CATEGORY_CONFIG[fixedCategorySlug]
    if (!cfg.pageTitleKey) return null
    return {
      title: t(cfg.pageTitleKey),
      description: cfg.pageDescriptionKey ? t(cfg.pageDescriptionKey) : '',
    }
  }, [fixedCategorySlug, t])

  useEffect(() => {
    void loadInitialData()
  }, [])

  // Завантаження всіх оголошень і категорій
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()

      const [categoriesResult, listingsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),

        supabase
          .from('listings')
          .select('*, images:listing_images(*), category:categories(*)')
          .eq('status', 'active')
          .gte('expires_at', now)
          .order('created_at', { ascending: false }),
      ])

      setCategories(categoriesResult.data ?? [])
      setAllListings((listingsResult.data as ListingWithImages[] | null) ?? [])
    } finally {
      setLoading(false)
    }
  }

  // Переклад назви категорії з fallback
  const translateCategory = (category: Category) => {
    const newKey   = 'category.name.' + category.slug
    const newValue = t(newKey)
    if (newValue !== newKey) return newValue

    const legacyKey   = 'category.' + category.slug
    const legacyValue = t(legacyKey)
    if (legacyValue !== legacyKey) return legacyValue

    return category.name
  }

  // Фільтрація і сортування оголошень
  const filteredListings = useMemo(() => {
    let result = [...allListings]

    const normSearch   = searchQuery.trim().toLowerCase()
    const normLocation = locationQuery.trim().toLowerCase()
    const maxPriceNum  = maxPrice ? parseFloat(maxPrice) : null

    // Фільтр категорії
    if (selectedCategory) {
      result = result.filter(l =>
        l.category?.slug === selectedCategory || l.category_id === selectedCategory
      )
    }

    if (selectedSubcategories.length > 0) {
      result = result.filter((l) => {
        const subs = (l as ListingWithImages & { subcategory_slugs?: string[] }).subcategory_slugs ?? []
        return selectedSubcategories.some((s) => subs.includes(s))
      })
    }

    // Фільтр типу оголошення
    if (selectedType) {
      result = result.filter(l => l.listing_type === selectedType)
    }

    // Фільтр пошуку (назва, опис, категорія)
    if (normSearch) {
      result = result.filter(l =>
        (l.title?.toLowerCase() || '').includes(normSearch) ||
        (l.description?.toLowerCase() || '').includes(normSearch) ||
        (l.category?.name?.toLowerCase() || '').includes(normSearch)
      )
    }

    // Фільтр локації
    if (normLocation) {
      result = result.filter(l =>
        (l.location?.toLowerCase() || '').includes(normLocation)
      )
    }

    // Фільтр максимальної ціни
    if (maxPriceNum !== null) {
      result = result.filter(l => l.price === null || l.price <= maxPriceNum)
    }

    // Promoted оголошення завжди вгорі
    const promoted   = result.filter(l => (l as any).is_promoted === true)
    const regular    = result.filter(l => (l as any).is_promoted !== true)

    // Сортування звичайних оголошень
    const sortFn = (a: ListingWithImages, b: ListingWithImages) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price_asc':
          return (a.price ?? Infinity) - (b.price ?? Infinity)
        case 'price_desc':
          return (b.price ?? -1) - (a.price ?? -1)
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0)
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    }

    return [...promoted, ...regular.sort(sortFn)]
  }, [allListings, searchQuery, locationQuery, selectedCategory, selectedSubcategories, selectedType, maxPrice, sortBy])

  // Кількість активних фільтрів для індикатора
  const activeFiltersCount = [
    searchQuery,
    locationQuery,
    fixedCategorySlug ? '' : selectedCategory,
    selectedType,
    maxPrice,
  ].filter(Boolean).length

  const listingsBasePath = fixedCategorySlug
    ? categoryPagePath(fixedCategorySlug)
    : '/listings'

  // Застосовуємо фільтри до URL
  const applyFiltersToUrl = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim())   params.set('search',   searchQuery.trim())
    if (locationQuery.trim()) params.set('location', locationQuery.trim())
    if (selectedCategory && !fixedCategorySlug) params.set('category', selectedCategory)
    if (selectedType)         params.set('type',     selectedType)
    const query = params.toString()
    const base = listingsBasePath.split('?')[0]
    navigateTo(query ? `${base}?${query}` : base)
  }

  // Скидаємо всі фільтри
  const resetFilters = () => {
    setSearchQuery('')
    setLocationQuery('')
    setSelectedCategory(fixedCategorySlug || '')
    setSelectedType('')
    setMaxPrice('')
    setSortBy('newest')
    setSelectedSubcategories([])
    navigateTo(listingsBasePath.split('?')[0])
  }

  return (
    <div className="py-8 pb-24 lg:pb-8">
            {/* Шапка з пошуком */}
            <section className="glass-panel mb-6 p-6 md:p-7 xl:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <h1 className="font-[var(--font-display)] text-[1.72rem] font-bold leading-[1.08] tracking-[-0.035em] text-[var(--ink-900)] md:text-[2rem] xl:text-[2.2rem]">
                    {categoryPageMeta?.title ?? t('listings.simpleTitle')}
                  </h1>
                </div>
                <button
                  onClick={() => navigateTo('/create-ad')}
                  type="button"
                  className="btn-primary rounded-full px-5 text-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t('header.createAd')}
                </button>
              </div>

              {/* Рядок пошуку */}
              <form
                onSubmit={e => { e.preventDefault(); applyFiltersToUrl() }}
                className="mt-7 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_156px_156px]"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('listings.whatNeedsToBeDone')}
                    className="input-glass h-[50px] pl-11"
                  />
                </div>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    placeholder={t('listings.cityOrCountry')}
                    className="input-glass h-[50px] pl-11"
                  />
                </div>
                <button type="submit" className="btn-primary h-[50px] rounded-full px-5 text-sm">
                  {t('listings.findRequests')}
                </button>
                <button
                  onClick={() => setShowFilters(v => !v)}
                  type="button"
                  className="btn-secondary h-[50px] rounded-full px-5 text-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFiltersCount > 0
                    ? t('listings.filtersButton') + ' (' + activeFiltersCount + ')'
                    : t('listings.filtersButton')}
                </button>
              </form>

              {(() => {
                const cat = fixedCategorySlug || selectedCategory
                if (!cat || !categoryHasWorkSubcategories(cat)) return null
                return (
                  <ConstructionWorkTypesPanel
                    categorySlug={cat}
                    selected={selectedSubcategories}
                    onChange={setSelectedSubcategories}
                  />
                )
              })()}

              {/* Розширені фільтри */}
              {showFilters && (
                <div className="mt-4 rounded-[24px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.34)] p-4 backdrop-blur-md">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {!fixedCategorySlug && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[var(--ink-700)]">
                          {t('listings.categoryLabel')}
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                          className="select-glass"
                        >
                          <option value="">{t('listings.allCategoriesSimple')}</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>
                              {translateCategory(cat)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Тип оголошення */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--ink-700)]">
                        Тип оголошення
                      </label>
                      <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="select-glass"
                      >
                        {LISTING_TYPES.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Максимальна ціна */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--ink-700)]">
                        Максимальна ціна
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        placeholder="Без обмеження"
                        className="input-glass"
                      />
                    </div>

                    {/* Сортування */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--ink-700)]">
                        Сортування
                      </label>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="select-glass"
                      >
                        {SORT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Кнопка скидання */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={resetFilters}
                      type="button"
                      className="btn-ghost rounded-full px-0 text-sm"
                    >
                      <X className="h-4 w-4" />
                      {t('listings.clearFiltersSimple')}
                    </button>
                  </div>
                </div>
              )}

              {/* Активні фільтри — теги */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchQuery && (
                    <FilterTag
                      label={'Пошук: ' + searchQuery}
                      onRemove={() => setSearchQuery('')}
                    />
                  )}
                  {locationQuery && (
                    <FilterTag
                      label={'Місто: ' + locationQuery}
                      onRemove={() => setLocationQuery('')}
                    />
                  )}
                  {selectedCategory && !fixedCategorySlug && (
                    <FilterTag
                      label={'Категорія: ' + (categories.find(c => c.slug === selectedCategory)?.name || selectedCategory)}
                      onRemove={() => setSelectedCategory('')}
                    />
                  )}
                  {selectedType && (
                    <FilterTag
                      label={'Тип: ' + (LISTING_TYPES.find(t => t.value === selectedType)?.label || selectedType)}
                      onRemove={() => setSelectedType('')}
                    />
                  )}
                  {maxPrice && (
                    <FilterTag
                      label={'Макс. ціна: ' + maxPrice}
                      onRemove={() => setMaxPrice('')}
                    />
                  )}
                </div>
              )}
            </section>

            <CenterPageAd page="listings" className="my-4" />

            <MobileAdBanner variant="horizontal" page="listings" />

            {/* Лічильник результатів */}
            <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[13px] font-semibold text-[var(--ink-700)] md:text-sm">
                {loading
                  ? t('listings.loadingRequests')
                  : filteredListings.length + ' ' + t('listings.countSuffix')}
              </div>
              {activeFiltersCount > 0 && !loading && (
                <button
                  onClick={resetFilters}
                  type="button"
                  className="btn-ghost rounded-full px-0 text-[13px] md:text-sm"
                >
                  {t('listings.clearFiltersSimple')}
                </button>
              )}
            </div>

            {/* Список оголошень */}
            {loading ? (
              <div className="glass-card p-8 text-center text-[var(--ink-500)]">
                {t('listings.loadingRequests')}
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filteredListings.map((listing, index) => (
                  <Fragment key={listing.id}>
                    <ListingCard listing={listing} />
                    {(index + 1) % 4 === 0 && index < filteredListings.length - 1 && (
                      <MobileAdBanner
                        variant="inline"
                        page="listings"
                        inlineIndex={((((index + 1) / 4) | 0) % 4) + 1 as 1 | 2 | 3 | 4}
                        outerClassName="col-span-2 sm:col-span-3 lg:col-span-4 2xl:col-span-5"
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            ) : (
              <div className="glass-card p-10 text-center">
                <h2 className="font-[var(--font-display)] text-[1.25rem] font-bold tracking-[-0.02em] text-[var(--ink-900)] md:text-[1.45rem]">
                  {t('listings.emptyTitle')}
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-6 text-[var(--ink-700)] md:text-[14px]">
                  {t('listings.emptyText')}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    onClick={resetFilters}
                    type="button"
                    className="btn-secondary rounded-full text-sm"
                  >
                    {t('listings.clearFiltersSimple')}
                  </button>
                  <button
                    onClick={() => navigateTo('/create-ad')}
                    type="button"
                    className="btn-primary rounded-full text-sm"
                  >
                    {t('header.createAd')}
                  </button>
                </div>
              </div>
            )}

            <MobileAdBanner variant="inline" page="listings" inlineIndex={2} outerClassName="mt-6" />
    </div>
  )
}

// Тег активного фільтру з кнопкою видалення
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background:  'rgba(199,138,96,0.12)',
        color:       'var(--accent-700)',
        border:      '1px solid rgba(199,138,96,0.25)',
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-[rgba(199,138,96,0.2)]"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}