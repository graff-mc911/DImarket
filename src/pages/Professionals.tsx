import { useEffect, useMemo, useState } from 'react'
import { MapPin, Search, SlidersHorizontal, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Profile, Category } from '../lib/types'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { AdBanner } from '../components/AdBanner'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'

interface ProfessionalCategoryLink {
  category_id: string
  category?: Category | null
}

interface ProfessionalWithCategories extends Profile {
  professional_categories?: ProfessionalCategoryLink[]
}

export function Professionals() {
  const { t } = useApp()

  const [professionals, setProfessionals] = useState<ProfessionalWithCategories[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    void loadCategories()
    void loadProfessionals()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
  }

  const loadProfessionals = async () => {
    setLoading(true)

    try {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          professional_categories(
            category_id,
            category:categories(*)
          )
        `)
        .eq('is_professional', true)
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })

      setProfessionals((data as ProfessionalWithCategories[] | null) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const translateCategory = (category: Category) => {
    const newKey = `category.name.${category.slug}`
    const newValue = t(newKey)

    if (newValue !== newKey) {
      return newValue
    }

    const legacyKey = `category.${category.slug}`
    const legacyValue = t(legacyKey)

    if (legacyValue !== legacyKey) {
      return legacyValue
    }

    return category.name
  }

  const filteredProfessionals = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const normalizedLocation = locationFilter.trim().toLowerCase()

    return [...professionals]
      .filter((professional) => {
        const skills = (professional.professional_categories || [])
          .map((item) => item.category?.name?.toLowerCase() || '')
          .join(' ')

        const matchesSearch =
          normalizedSearch === '' ||
          professional.full_name?.toLowerCase().includes(normalizedSearch) ||
          professional.bio?.toLowerCase().includes(normalizedSearch) ||
          skills.includes(normalizedSearch)

        const matchesRating = minRating === 0 || (professional.rating || 0) >= minRating

        const matchesLocation =
          normalizedLocation === '' ||
          professional.location?.toLowerCase().includes(normalizedLocation)

        const matchesCategory =
          selectedCategory === '' ||
          (professional.professional_categories || []).some((item) => {
            const slug = item.category?.slug || ''
            return slug === selectedCategory || item.category_id === selectedCategory
          })

        return matchesSearch && matchesRating && matchesLocation && matchesCategory
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'reviews':
            return (b.total_reviews || 0) - (a.total_reviews || 0)
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'rating':
          default:
            return (b.rating || 0) - (a.rating || 0)
        }
      })
  }, [locationFilter, minRating, professionals, searchQuery, selectedCategory, sortBy])

  const activeFiltersCount = [selectedCategory, minRating > 0 ? 'rating' : '', locationFilter].filter(Boolean).length

  const resetFilters = () => {
    setMinRating(0)
    setLocationFilter('')
    setSortBy('rating')
    setSelectedCategory('')
    setSearchQuery('')
  }

  return (
    <div className="page-bg min-h-screen py-8">
      <div className="w-full px-4 md:px-6 xl:px-8 2xl:px-10">
        <div className="flex gap-6">
          <aside className="hidden xl:block w-[240px] 2xl:w-[280px] flex-shrink-0">
            <AdBanner position="left" sticky={true} />
          </aside>

          <main className="min-w-0 flex-1">
            <section className="glass-panel mb-6 p-5 md:p-6">
              <div className="inline-flex items-center rounded-full border border-[rgba(233,202,177,0.7)] bg-[rgba(255,247,239,0.88)] px-4 py-2 text-sm font-semibold text-[#a26233]">
                {t('professionals.eyebrow')}
              </div>

              <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#2f2a24] md:text-4xl">
                    {t('professionals.simpleTitle')}
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-[#6f665d] md:text-base">
                    {t('professionals.simpleDescription')}
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('/create-ad')}
                  type="button"
                  className="btn-secondary rounded-full"
                >
                  {t('professionals.postJob')}
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_160px]">
                <div className="relative sm:col-span-2 xl:col-span-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b59a84]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t('professionals.nameSkillService')}
                    className="input-glass h-14 pl-12"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b59a84]" />
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(event) => setLocationFilter(event.target.value)}
                    placeholder={t('professionals.cityOrCountry')}
                    className="input-glass h-14 pl-12"
                  />
                </div>

                <button
                  onClick={() => setShowFilters((value) => !value)}
                  type="button"
                  className="btn-outline h-14 rounded-[20px] sm:col-span-2 xl:col-span-1"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFiltersCount > 0
                    ? `${t('professionals.filtersButton')} (${activeFiltersCount})`
                    : t('professionals.filtersButton')}
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 rounded-[26px] border border-white/70 bg-white/45 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('professionals.categoryLabel')}
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        className="select-glass bg-white/80"
                      >
                        <option value="">{t('professionals.allCategoriesSimple')}</option>

                        {categories.map((category) => (
                          <option key={category.id} value={category.slug}>
                            {translateCategory(category)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('professionals.sortLabel')}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(event) =>
                          setSortBy(event.target.value as 'rating' | 'reviews' | 'newest')
                        }
                        className="select-glass bg-white/80"
                      >
                        <option value="rating">{t('professionals.sortRating')}</option>
                        <option value="reviews">{t('professionals.sortReviews')}</option>
                        <option value="newest">{t('professionals.sortNewest')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('professionals.minRatingLabel')}
                      </label>
                      <select
                        value={minRating}
                        onChange={(event) => setMinRating(Number(event.target.value))}
                        className="select-glass bg-white/80"
                      >
                        <option value="0">{t('professionals.anyRatingSimple')}</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="4.5">4.5+</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={resetFilters}
                        type="button"
                        className="btn-ghost justify-start rounded-full px-0 md:justify-center"
                      >
                        {t('professionals.clearFiltersSimple')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="mb-4">
              <MobileAdBanner variant="horizontal" />
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#6f665d]">
              <Star className="h-4 w-4 text-[#c3912c]" />
              <span>
                {loading
                  ? t('professionals.loadingSimple')
                  : `${filteredProfessionals.length} ${t('professionals.countSuffix')}`}
              </span>
            </div>

            {loading ? (
              <div className="glass-card p-8 text-center text-[#7a7168]">
                {t('professionals.loadingSimple')}
              </div>
            ) : filteredProfessionals.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                {filteredProfessionals.map((professional, index) => (
                  <div key={professional.id}>
                    <ProfessionalCard professional={professional} />

                    {(index + 1) % 6 === 0 && index < filteredProfessionals.length - 1 && (
                      <div className="mt-6">
                        <MobileAdBanner variant="inline" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-10 text-center">
                <h2 className="text-xl font-extrabold text-[#2f2a24]">
                  {t('professionals.emptyTitle')}
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#6f665d]">
                  {t('professionals.emptyText')}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    onClick={resetFilters}
                    type="button"
                    className="btn-secondary rounded-full"
                  >
                    {t('professionals.clearFiltersSimple')}
                  </button>
                  <button
                    onClick={() => navigateTo('/register')}
                    type="button"
                    className="btn-primary rounded-full"
                  >
                    {t('professionals.registerAsProfessional')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8">
              <MobileAdBanner variant="inline" />
            </div>
          </main>

          <aside className="hidden xl:block w-[240px] 2xl:w-[280px] flex-shrink-0">
            <AdBanner position="right" sticky={true} />
          </aside>
        </div>
      </div>
    </div>
  )
}
