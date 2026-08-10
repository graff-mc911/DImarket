// ============================================================
// Listings.tsx — Каталог оголошень (Amazon-style sidebar + grid)
// ============================================================

import { Fragment, useEffect, useMemo, useState } from 'react'
import { PlusCircle, X } from 'lucide-react'
import { supabase }            from '../lib/supabase'
import { useApp }              from '../contexts/AppContext'
import { listingLocationMatches, parseListingLocation } from '../lib/listingLocation'
import { navigateTo }          from '../lib/navigation'
import { ListingCard }         from '../components/ListingCard'
import { MobileAdBanner }      from '../components/MobileAdBanner'
import type { Category, ListingWithImages } from '../lib/types'
import {
  SITE_CATEGORY_CONFIG,
  categoryPagePath,
  type SiteCategorySlug,
} from '../lib/siteCategories'
import { subcategorySlugsForGroup } from '../lib/categoryCatalog'
import {
  excludeSuppressedFromQuery,
  filterSuppressedListings,
} from '../lib/suppressedListings'

type ListingsProps = {
  fixedCategorySlug?: SiteCategorySlug
}

export function Listings({ fixedCategorySlug }: ListingsProps = {}) {
  const { t, user, profile, location } = useApp()

  const listingTypes = useMemo(
    () => [
      { value: '', label: t('listings.allTypes') },
      { value: 'service_request', label: t('listings.typeServiceRequest') },
      { value: 'service_offer', label: t('listings.typeServiceOffer') },
      { value: 'item_sale', label: t('listings.typeItemSale') },
      { value: 'item_wanted', label: t('listings.typeItemWanted') },
    ],
    [t],
  )

  const sortOptions = useMemo(
    () => [
      { value: 'newest', label: t('listings.sortNewest') },
      { value: 'oldest', label: t('listings.sortOldest') },
      { value: 'price_asc', label: t('listings.sortPriceAsc') },
      { value: 'price_desc', label: t('listings.sortPriceDesc') },
      { value: 'views', label: t('listings.sortViews') },
    ],
    [t],
  )

  const [allListings, setAllListings]   = useState<ListingWithImages[]>([])
  const [categories, setCategories]     = useState<Category[]>([])
  const [loading, setLoading]           = useState(true)

  const [searchQuery, setSearchQuery]         = useState('')
  const [locationQuery, setLocationQuery]     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType]       = useState('')
  const [maxPrice, setMaxPrice]               = useState('')
  const [sortBy, setSortBy]                   = useState('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

  useEffect(() => {
    const syncFiltersFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      setSearchQuery(params.get('search') || '')
      const urlLoc = params.get('location') || params.get('city') || ''
      setLocationQuery(urlLoc)
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

  useEffect(() => {
    if (locationQuery) return
    const label = location.city || location.region || location.country
    if (label) setLocationQuery(label)
  }, [location.city, location.region, location.country, locationQuery])

  const categoryPageMeta = useMemo(() => {
    if (!fixedCategorySlug) return null
    const cfg = SITE_CATEGORY_CONFIG[fixedCategorySlug]
    if (!cfg?.pageTitleKey) return null
    return {
      title: t(cfg.pageTitleKey),
      description: cfg.pageDescriptionKey ? t(cfg.pageDescriptionKey) : '',
    }
  }, [fixedCategorySlug, t])

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    if (!user || !profile?.location) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('location')) return
    const parsed = parseListingLocation(profile.location)
    if (parsed?.city) setLocationQuery(parsed.city)
  }, [user?.id, profile?.location])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()

      const [categoriesResult, listingsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        excludeSuppressedFromQuery(
          supabase
            .from('listings')
            .select('*, images:listing_images(*), category:categories(*)')
            .eq('status', 'active')
            .gte('expires_at', now)
            .order('created_at', { ascending: false }),
        ),
      ])

      setCategories(categoriesResult.data ?? [])
      setAllListings(
        filterSuppressedListings((listingsResult.data as ListingWithImages[] | null) ?? []),
      )
    } finally {
      setLoading(false)
    }
  }

  const translateCategory = (category: Category) => {
    const newKey   = 'category.name.' + category.slug
    const newValue = t(newKey)
    if (newValue !== newKey) return newValue

    const legacyKey   = 'category.' + category.slug
    const legacyValue = t(legacyKey)
    if (legacyValue !== legacyKey) return legacyValue

    return category.name
  }

  const filteredListings = useMemo(() => {
    let result = [...allListings]

    const normSearch   = searchQuery.trim().toLowerCase()
    const normLocation = locationQuery.trim().toLowerCase()
    const maxPriceNum  = maxPrice ? parseFloat(maxPrice) : null

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

    if (selectedType) {
      result = result.filter(l => l.listing_type === selectedType)
    }

    if (normSearch) {
      result = result.filter(l =>
        (l.title?.toLowerCase() || '').includes(normSearch) ||
        (l.description?.toLowerCase() || '').includes(normSearch) ||
        (l.category?.name?.toLowerCase() || '').includes(normSearch)
      )
    }

    if (normLocation) {
      result = result.filter((l) =>
        listingLocationMatches(normLocation, l.location || ''),
      )
    }

    if (maxPriceNum !== null) {
      result = result.filter(l => l.price === null || l.price <= maxPriceNum)
    }

    const promoted   = result.filter(l => (l as any).is_promoted === true)
    const regular    = result.filter(l => (l as any).is_promoted !== true)

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
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    }

    return [...promoted, ...regular.sort(sortFn)]
  }, [allListings, searchQuery, locationQuery, selectedCategory, selectedSubcategories, selectedType, maxPrice, sortBy])

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

  const applyFiltersToUrl = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim())   params.set('search',   searchQuery.trim())
    if (locationQuery.trim()) params.set('location', locationQuery.trim())
    if (selectedCategory && !fixedCategorySlug) params.set('category', selectedCategory)
    if (selectedType)         params.set('type',     selectedType)
    const query = params.toString()
    const base = listingsBasePath.split('?')[0]
    navigateTo(query ? `${base}?${query}` : base)
    setMobileFiltersOpen(false)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setLocationQuery('')
    setSelectedCategory(fixedCategorySlug || '')
    setSelectedType('')
    setMaxPrice('')
    setSortBy('newest')
    setSelectedSubcategories([])
    navigateTo(listingsBasePath.split('?')[0])
    setMobileFiltersOpen(false)
  }

  const filtersPanel = (
    <>
      <h2 className="text-base font-bold text-[var(--ink-900)]">{t('listings.filtersButton')}</h2>

      <form
        onSubmit={(e) => { e.preventDefault(); applyFiltersToUrl() }}
        className="mt-3 space-y-0"
      >
        <div className="amazon-filter-group">
          <label>{t('listings.whatNeedsToBeDone')}</label>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('home.headerSearchPlaceholder')}
            className="input-glass h-9 text-sm"
          />
        </div>

        <div className="amazon-filter-group">
          <label>{t('listings.cityOrCountry')}</label>
          <input
            type="text"
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            placeholder={t('listings.cityOrCountry')}
            className="input-glass h-9 text-sm"
          />
        </div>

        {!fixedCategorySlug && (
          <div className="amazon-filter-group">
            <label>{t('listings.categoryLabel')}</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="select-glass h-9 text-sm"
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

        <div className="amazon-filter-group">
          <label>{t('listings.filterTypePrefix').replace(/:\s*$/, '') || 'Тип'}</label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="select-glass h-9 text-sm"
          >
            {listingTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="amazon-filter-group">
          <label>{t('listings.maxPrice')}</label>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder={t('listings.noPriceLimit')}
            className="input-glass h-9 text-sm"
          />
        </div>

        <div className="amazon-filter-group">
          <label>{t('listings.sortNewest').split(' ').slice(-1).join(' ') || 'Сортування'}</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="select-glass h-9 text-sm"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary mt-3 w-full py-2 text-sm">
          {t('listings.findRequests')}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-secondary mt-2 w-full py-2 text-sm"
          >
            {t('listings.clearFiltersSimple')}
          </button>
        )}
      </form>
    </>
  )

  return (
    <div className="py-6 pb-24 lg:pb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-900)] md:text-2xl">
            {categoryPageMeta?.title ?? t('listings.simpleTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-600)]">
            {loading
              ? t('listings.loadingRequests')
              : `${filteredListings.length} ${t('listings.countSuffix')}`}
          </p>
        </div>
        <button
          onClick={() => navigateTo('/create-ad')}
          type="button"
          className="btn-primary px-4 py-2 text-sm"
        >
          <PlusCircle className="h-4 w-4" />
          {t('header.createAd')}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMobileFiltersOpen(v => !v)}
        className="btn-secondary mb-4 w-full py-2 text-sm lg:hidden"
      >
        {t('listings.filtersButton')}
        {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside className={`amazon-filter-sidebar w-full lg:w-[220px] lg:shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          {filtersPanel}
        </aside>

        <main className="min-w-0 flex-1">
          {activeFiltersCount > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {searchQuery && (
                <FilterTag label={'Пошук: ' + searchQuery} onRemove={() => setSearchQuery('')} />
              )}
              {locationQuery && (
                <FilterTag label={'Місто: ' + locationQuery} onRemove={() => setLocationQuery('')} />
              )}
              {selectedCategory && !fixedCategorySlug && (
                <FilterTag
                  label={t('listings.categoryChip').replace(
                    '{name}',
                    translateCategory(
                      categories.find((c) => c.slug === selectedCategory) ??
                        ({ slug: selectedCategory, name: selectedCategory } as Category),
                    ),
                  )}
                  onRemove={() => setSelectedCategory('')}
                />
              )}
              {selectedType && (
                <FilterTag
                  label={listingTypes.find(opt => opt.value === selectedType)?.label || selectedType}
                  onRemove={() => setSelectedType('')}
                />
              )}
              {maxPrice && (
                <FilterTag label={'Макс. ціна: ' + maxPrice} onRemove={() => setMaxPrice('')} />
              )}
            </div>
          )}

          <MobileAdBanner variant="horizontal" page="listings" outerClassName="mb-4" />

          {loading ? (
            <div className="amazon-section-card p-8 text-center text-[var(--ink-500)]">
              {t('listings.loadingRequests')}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="product-grid">
              {filteredListings.map((listing, index) => (
                <Fragment key={listing.id}>
                  <ListingCard listing={listing} />
                  {(index + 1) % 8 === 0 && index < filteredListings.length - 1 && (
                    <div className="col-span-full py-2">
                      <MobileAdBanner
                        variant="inline"
                        page="listings"
                        inlineIndex={2}
                      />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="amazon-section-card p-10 text-center">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">
                {t('listings.emptyTitle')}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--ink-600)]">
                {t('listings.emptyText')}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button onClick={resetFilters} type="button" className="btn-secondary text-sm">
                  {t('listings.clearFiltersSimple')}
                </button>
                <button onClick={() => navigateTo('/create-ad')} type="button" className="btn-primary text-sm">
                  {t('header.createAd')}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#d5d9d9] bg-white px-2 py-1 text-xs font-medium text-[var(--ink-700)]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-sm hover:bg-[#f7fafa]"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}
