import { useEffect, useState } from 'react'
import { Loader2, MapPin, Upload, X } from 'lucide-react'
import { runMatchingForListing, listingCityFromLocation } from '../lib/matching/persistMatches'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { Category, Listing } from '../lib/types'
import { getCurrentLocation, searchLocations, LocationSuggestion } from '../lib/geocoding'
import { navigateTo } from '../lib/navigation'
import {
  CategorySubcategoryPicker,
  syncPickerWithCategoryId,
} from '../components/CategorySubcategoryPicker'
import {
  categorySlugForSubcategory,
  emptyPickerValue,
  getCategoryDef,
  type CategoryPickerValue,
} from '../lib/categoryCatalog'

type VisibilityRadius =
  | 'city'
  | 'district'
  | 'region'
  | 'country'
  | 'state'
  | 'land'
  | 'global'

export function CreateAd() {
  const { user, profile, currency, t } = useApp()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryPicker, setCategoryPicker] = useState<CategoryPickerValue>(emptyPickerValue())
  const [listingType, setListingType] = useState<
    'service_request' | 'service_offer' | 'item_sale' | 'item_wanted' | 'job_vacancy'
  >('service_request')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [duration, setDuration] = useState(30)
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [error, setError] = useState('')

  const [itemCondition, setItemCondition] = useState<'new' | 'used' | ''>('')
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'sold' | 'reserved'>(
    'available',
  )
  const [companyName, setCompanyName] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [workArrangement, setWorkArrangement] = useState('')
  const [jobLanguages, setJobLanguages] = useState('')
  const [requirements, setRequirements] = useState('')
  const [benefits, setBenefits] = useState('')

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)

  const [visibilityRadius, setVisibilityRadius] = useState<VisibilityRadius>('city')

  const selectedCategorySlug = categories.find((c) => c.id === categoryId)?.slug ?? ''
  const isMarketplace = selectedCategorySlug === 'sell-rent' || listingType === 'item_sale' || listingType === 'item_wanted'
  const isJob = selectedCategorySlug === 'vacancies' || listingType === 'job_vacancy'

  useEffect(() => {
    void loadCategories()
  }, [])

  useEffect(() => {
    if (!contactName && profile?.full_name) {
      setContactName(profile.full_name)
    }

    if (!contactEmail && user?.email) {
      setContactEmail(user.email)
    }
  }, [contactEmail, contactName, profile?.full_name, user?.email])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (location.trim().length >= 2) {
        void handleLocationSearch(location)
      } else {
        setLocationSuggestions([])
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [location])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
  }

  const getCategoryTranslation = (category: Category) => {
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

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true)

    try {
      const result = await getCurrentLocation()

      if (result) {
        setLocation(result.city)
        setShowSuggestions(false)
      } else {
        setError(t('createAd.locationDetectError'))
      }
    } catch {
      setError(t('createAd.locationLookupError'))
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleLocationSearch = async (query: string) => {
    const suggestions = await searchLocations(query)
    setLocationSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
  }

  const selectLocationSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.name)
    setShowSuggestions(false)
    setLocationSuggestions([])
  }

  const addImageField = () => {
    setImageUrls((current) => [...current, ''])
  }

  const updateImageUrl = (index: number, value: string) => {
    setImageUrls((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  const removeImageField = (index: number) => {
    setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!contactPhone.trim() && !contactEmail.trim()) {
        throw new Error(t('createAd.contactRequired'))
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + duration)

      let resolvedType = listingType
      if (selectedCategorySlug === 'vacancies') resolvedType = 'job_vacancy'
      else if (selectedCategorySlug === 'sell-rent' && resolvedType === 'service_request') {
        resolvedType = 'item_sale'
      }

      const listingData: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        subcategory_slugs: categoryPicker.subcategorySlugs,
        listing_type: resolvedType,
        price: price ? parseFloat(price) : null,
        currency: currency.code,
        location: location.trim(),
        visibility_radius: visibilityRadius,
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        author_id: user?.id || null,
        duration_days: duration,
        expires_at: expiresAt.toISOString(),
        is_premium: false,
        status: availabilityStatus === 'sold' ? 'sold' : 'active',
      }

      if (resolvedType === 'item_sale' || resolvedType === 'item_wanted') {
        listingData.item_condition = itemCondition || null
        listingData.availability_status = availabilityStatus
      }

      if (resolvedType === 'job_vacancy') {
        listingData.company_name = companyName.trim() || profile?.full_name || null
        listingData.employment_type = employmentType || null
        listingData.experience_level = experienceLevel || null
        listingData.work_arrangement = workArrangement || null
        listingData.job_languages = jobLanguages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        listingData.requirements = requirements.trim() || null
        listingData.benefits = benefits.trim() || null
        listingData.availability_status = 'available'
      }

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .maybeSingle<Listing>()

      if (listingError) {
        throw listingError
      }

      if (!listing) {
        throw new Error(t('createAd.publishError'))
      }

      const validImageUrls = imageUrls
        .map((url) => url.trim())
        .filter((url) => url !== '')

      if (validImageUrls.length > 0) {
        const imageInserts = validImageUrls.map((url, index) => ({
          listing_id: listing.id,
          image_url: url,
          display_order: index,
        }))

        const { error: imagesError } = await supabase
          .from('listing_images')
          .insert(imageInserts)

        if (imagesError) {
          console.error('Image insert failed:', imagesError)
        }
      }

      const categorySlug =
        categories.find((c) => c.id === categoryId)?.slug ||
        categorySlugForSubcategory(categoryPicker.subcategorySlugs[0] ?? '')

      void runMatchingForListing(listing.id, {
        city: listingCityFromLocation(listing.location),
        categorySlug,
        subcategorySlugs: categoryPicker.subcategorySlugs,
      })

      setSuccess(true)

      setTimeout(() => {
        if (resolvedType === 'job_vacancy') navigateTo('/jobs')
        else if (resolvedType === 'item_sale' || resolvedType === 'item_wanted') navigateTo('/buy-sell')
        else navigateTo('/listings')
      }, 1200)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t('createAd.publishError')
      )
    } finally {
      setLoading(false)
    }
  }

  const durationLabel = (days: number) => `${days} ${t('createAd.days')}`

  return (
    <div className="py-8 pb-24 lg:pb-8">
            <section className="glass-panel p-5 md:p-6 xl:p-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#2f2a24] md:text-4xl">
                {t('createAd.heroTitle')}
              </h1>

              {error && (
                <div className="mt-6 rounded-[22px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-4 py-3 text-sm text-[#a44a3a]">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-6 rounded-[22px] border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] px-4 py-3 text-sm text-[#3d7a52]">
                  {t('createAd.success')}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#2f2a24]">
                        {t('createAd.detailsTitle')}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                        {t('createAd.detailsText')}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.taskPlaceholder')} *
                      </label>
                      <input
                        required
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="input-glass"
                        placeholder={t('createAd.titleHint')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.descriptionLabel')} *
                      </label>
                      <textarea
                        required
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={7}
                        className="input-glass min-h-[180px] resize-y"
                        placeholder={t('createAd.descriptionHint')}
                      />
                    </div>
                  </div>

                  <div className="space-y-5 rounded-[28px] border border-white/70 bg-white/45 p-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.listingType')}
                      </label>
                      <select
                        value={listingType}
                        onChange={(event) =>
                          setListingType(
                            event.target.value as
                              | 'service_request'
                              | 'service_offer'
                              | 'item_sale'
                              | 'item_wanted'
                              | 'job_vacancy',
                          )
                        }
                        className="select-glass bg-white/80"
                      >
                        <option value="service_request">{t('createAd.needService')}</option>
                        <option value="service_offer">{t('createAd.offerService')}</option>
                        <option value="item_sale">{t('createAd.sellItem')}</option>
                        <option value="item_wanted">{t('createAd.wantItem')}</option>
                        <option value="job_vacancy">{t('createAd.jobVacancy')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.categoryLabel')}
                      </label>
                      <select
                        value={categoryId}
                        onChange={(event) => {
                          const id = event.target.value
                          setCategoryId(id)
                          setCategoryPicker(syncPickerWithCategoryId(categories, id, emptyPickerValue()))
                          const slug = categories.find((c) => c.id === id)?.slug
                          if (slug === 'vacancies') setListingType('job_vacancy')
                          if (slug === 'sell-rent' && listingType === 'service_request') {
                            setListingType('item_sale')
                          }
                        }}
                        className="select-glass bg-white/80"
                      >
                        <option value="">{t('createAd.selectCategory')}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {getCategoryTranslation(category)}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const slug = categories.find((c) => c.id === categoryId)?.slug ?? ''
                        const subs = getCategoryDef(slug)?.subcategories.length ?? 0
                        if (!slug || subs === 0) return null
                        return (
                          <div className="mt-4">
                            <CategorySubcategoryPicker
                              value={{
                                categorySlug: slug,
                                subcategorySlugs: categoryPicker.subcategorySlugs,
                              }}
                              onChange={(next) => setCategoryPicker(next)}
                              fixedCategorySlug={slug}
                              allowMultiple
                            />
                          </div>
                        )
                      })()}
                    </div>

                    {isMarketplace && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.condition')}
                          </label>
                          <select
                            value={itemCondition}
                            onChange={(e) => setItemCondition(e.target.value as 'new' | 'used' | '')}
                            className="select-glass bg-white/80"
                          >
                            <option value="">—</option>
                            <option value="new">{t('createAd.conditionNew')}</option>
                            <option value="used">{t('createAd.conditionUsed')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.availability')}
                          </label>
                          <select
                            value={availabilityStatus}
                            onChange={(e) =>
                              setAvailabilityStatus(e.target.value as 'available' | 'sold' | 'reserved')
                            }
                            className="select-glass bg-white/80"
                          >
                            <option value="available">{t('createAd.available')}</option>
                            <option value="sold">{t('createAd.sold')}</option>
                            <option value="reserved">{t('createAd.reserved')}</option>
                          </select>
                        </div>
                      </>
                    )}

                    {isJob && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.companyName')}
                          </label>
                          <input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="input-glass"
                            placeholder={profile?.full_name || ''}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.employmentType')}
                          </label>
                          <select
                            value={employmentType}
                            onChange={(e) => setEmploymentType(e.target.value)}
                            className="select-glass bg-white/80"
                          >
                            <option value="">—</option>
                            <option value="full_time">{t('createAd.employment.full_time')}</option>
                            <option value="part_time">{t('createAd.employment.part_time')}</option>
                            <option value="contract">{t('createAd.employment.contract')}</option>
                            <option value="temporary">{t('createAd.employment.temporary')}</option>
                            <option value="internship">{t('createAd.employment.internship')}</option>
                            <option value="freelance">{t('createAd.employment.freelance')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.experience')}
                          </label>
                          <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="select-glass bg-white/80"
                          >
                            <option value="">—</option>
                            <option value="none">{t('createAd.experience.none')}</option>
                            <option value="junior">{t('createAd.experience.junior')}</option>
                            <option value="mid">{t('createAd.experience.mid')}</option>
                            <option value="senior">{t('createAd.experience.senior')}</option>
                            <option value="lead">{t('createAd.experience.lead')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.workArrangement')}
                          </label>
                          <select
                            value={workArrangement}
                            onChange={(e) => setWorkArrangement(e.target.value)}
                            className="select-glass bg-white/80"
                          >
                            <option value="">—</option>
                            <option value="onsite">{t('createAd.work.onsite')}</option>
                            <option value="hybrid">{t('createAd.work.hybrid')}</option>
                            <option value="remote">{t('createAd.work.remote')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                            {t('createAd.jobLanguages')}
                          </label>
                          <input
                            value={jobLanguages}
                            onChange={(e) => setJobLanguages(e.target.value)}
                            className="input-glass"
                            placeholder="EN, ES, UK"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {isJob ? t('createAd.salaryLabel') : t('createAd.priceLabel')} ({currency.symbol})
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        className="input-glass"
                        placeholder={t('createAd.budgetPlaceholder')}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.durationLabel')}
                      </label>
                      <select
                        value={duration}
                        onChange={(event) => setDuration(Number(event.target.value))}
                        className="select-glass bg-white/80"
                      >
                        <option value={14}>{durationLabel(14)}</option>
                        <option value={30}>{durationLabel(30)}</option>
                        <option value={60}>{durationLabel(60)}</option>
                        <option value={90}>{durationLabel(90)}</option>
                      </select>
                    </div>
                  </div>
                </section>

                {isJob && (
                  <section className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.requirements')}
                      </label>
                      <textarea
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        rows={4}
                        className="input-glass min-h-[120px] resize-y"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.benefits')}
                      </label>
                      <textarea
                        value={benefits}
                        onChange={(e) => setBenefits(e.target.value)}
                        rows={3}
                        className="input-glass min-h-[100px] resize-y"
                      />
                    </div>
                  </section>
                )}

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#2f2a24]">
                        {t('createAd.locationTitle')}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                        {t('createAd.locationText')}
                      </p>
                    </div>

                    <div className="relative">
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.locationLabel')} *
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                          <input
                            required
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            onFocus={() => setShowSuggestions(locationSuggestions.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="input-glass"
                            placeholder={t('createAd.locationPlaceholder')}
                          />

                          {showSuggestions && locationSuggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[22px] border border-white/70 bg-[rgba(255,250,246,0.96)] p-2 shadow-[0_20px_50px_rgba(89,63,48,0.12)]">
                              {locationSuggestions.map((suggestion, index) => (
                                <button
                                  key={`${suggestion.name}-${index}`}
                                  type="button"
                                  onClick={() => selectLocationSuggestion(suggestion)}
                                  className="block w-full rounded-[18px] px-4 py-3 text-left transition hover:bg-white/80"
                                >
                                  <div className="font-semibold text-[#2f2a24]">
                                    {suggestion.name}
                                  </div>
                                  <div className="text-xs text-[#7a7168]">
                                    {suggestion.displayName}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={loadingLocation}
                          className="flex h-12 w-full items-center justify-center rounded-[18px] border border-white/70 bg-white/70 px-4 text-[#5f5a54] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-12 sm:px-0"
                          title={t('createAd.currentLocation')}
                        >
                          {loadingLocation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-[#7a7168]">
                        {t('createAd.locationHelp')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 rounded-[28px] border border-white/70 bg-white/45 p-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.visibilityRadius')}
                      </label>
                      <select
                        value={visibilityRadius}
                        onChange={(event) =>
                          setVisibilityRadius(event.target.value as VisibilityRadius)
                        }
                        className="select-glass bg-white/80"
                      >
                        <option value="city">{t('createAd.radius.city')}</option>
                        <option value="district">{t('createAd.radius.district')}</option>
                        <option value="region">{t('createAd.radius.region')}</option>
                        <option value="country">{t('createAd.radius.country')}</option>
                        <option value="state">{t('createAd.radius.state')}</option>
                        <option value="land">{t('createAd.radius.land')}</option>
                        <option value="global">{t('createAd.radius.global')}</option>
                      </select>
                      <p className="mt-2 text-xs text-[#7a7168]">
                        {t('createAd.visibilityRadiusDesc')}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      {t('createAd.contactTitle')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                      {t('createAd.contactText')}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.yourName')} *
                      </label>
                      <input
                        required
                        value={contactName}
                        onChange={(event) => setContactName(event.target.value)}
                        className="input-glass"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.phone')}
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(event) => setContactPhone(event.target.value)}
                        className="input-glass"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('createAd.email')}
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        className="input-glass"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-[#7a7168]">{t('createAd.contactRule')}</p>
                </section>

                <section className="space-y-5">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#2f2a24]">
                      <Upload className="h-5 w-5 text-[#c96d2c]" />
                      {t('createAd.imagesTitle')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                      {t('createAd.imagesText')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="url"
                          value={url}
                          onChange={(event) => updateImageUrl(index, event.target.value)}
                          className="input-glass flex-1"
                          placeholder={t('createAd.imagePlaceholder')}
                        />

                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="flex h-12 w-full items-center justify-center rounded-[18px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a] transition hover:bg-[rgba(255,230,223,0.96)] sm:w-12"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addImageField}
                      className="btn-ghost justify-start rounded-full px-0"
                    >
                      {t('createAd.addImage')}
                    </button>
                  </div>

                  <p className="text-xs text-[#7a7168]">{t('createAd.imageHelp')}</p>
                </section>

                <button
                  type="submit"
                  disabled={loading || success}
                  className="btn-primary w-full justify-center rounded-[24px] py-4 text-base disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? t('createAd.creating') : t('createAd.createButton')}
                </button>
              </form>
            </section>
    </div>
  )
}
