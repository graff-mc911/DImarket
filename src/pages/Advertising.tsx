// Self-serve advertising page: multi-placement targeting, geo modes, automatic pricing, media upload, and campaign preview.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Film,
  Globe2,
  ImagePlus,
  Layers3,
  Link2,
  LogIn,
  Megaphone,
  MonitorSmartphone,
  Newspaper,
  PanelsTopLeft,
  Play,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { navigateTo } from '../lib/navigation'
import { useApp } from '../contexts/AppContext'
import { AdCampaign } from '../lib/types'
import type { TranslationKey } from '../lib/i18n'

function tf(
  translate: (key: TranslationKey) => string,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text = translate(key)
  if (!vars) return text
  for (const [name, value] of Object.entries(vars)) {
    text = text.split(`{${name}}`).join(String(value))
  }
  return text
}

type PlacementValue = 'home' | 'listings' | 'sidebar' | 'footer' | 'mobile_sticky'
type MediaType = 'image' | 'gif' | 'video'
type GeoMode = 'global' | 'countries' | 'regions' | 'cities'

type FeedbackState = {
  type: 'success' | 'error'
  text: string
}

type UploadState = {
  status: 'idle' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

type GeoCountry = {
  name: string
  regions: Array<{
    name: string
    cities: string[]
  }>
}

type PlacementOption = {
  value: PlacementValue
  title: string
  text: string
  icon: LucideIcon
}

const ACCEPTED_MIME: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  gif: ['image/gif'],
  video: ['video/mp4', 'video/webm'],
}

const MAX_FILE_MB = 20
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024
const PRICE_PER_CITY_PER_WEEK = 2

const GEO_DATA: GeoCountry[] = [
  {
    name: 'Germany',
    regions: [
      { name: 'Hessen', cities: ['Frankfurt am Main', 'Darmstadt', 'Wiesbaden'] },
      { name: 'Bayern', cities: ['München', 'Nürnberg'] },
      { name: 'Berlin', cities: ['Berlin'] },
    ],
  },
  {
    name: 'Poland',
    regions: [
      { name: 'Mazowieckie', cities: ['Warszawa'] },
      { name: 'Małopolskie', cities: ['Kraków'] },
    ],
  },
  {
    name: 'Spain',
    regions: [
      { name: 'Valencia', cities: ['Alicante', 'Torrevieja', 'Valencia'] },
      { name: 'Catalonia', cities: ['Barcelona'] },
    ],
  },
  {
    name: 'Ukraine',
    regions: [
      { name: 'Kyiv', cities: ['Kyiv'] },
      { name: 'Lviv', cities: ['Lviv'] },
      { name: 'Odesa', cities: ['Odesa'] },
    ],
  },
]

const KNOWN_CAMPAIGN_STATUSES = [
  'draft',
  'pending_payment',
  'pending_review',
  'active',
  'paused',
  'rejected',
  'expired',
  'deleted',
] as const

const GEO_MODE_OPTIONS: Array<{ value: GeoMode; labelKey: TranslationKey }> = [
  { value: 'global', labelKey: 'advertising.selfServeGeo.global' },
  { value: 'countries', labelKey: 'advertising.selfServeGeo.countries' },
  { value: 'regions', labelKey: 'advertising.selfServeGeo.regions' },
  { value: 'cities', labelKey: 'advertising.selfServeGeo.cities' },
]

const DURATION_OPTIONS: Array<{ weeks: number; labelKey: TranslationKey }> = [
  { weeks: 1, labelKey: 'advertising.selfServeDurationWeek1' },
  { weeks: 2, labelKey: 'advertising.selfServeDurationWeek2' },
  { weeks: 4, labelKey: 'advertising.selfServeDurationWeek4' },
  { weeks: 12, labelKey: 'advertising.selfServeDurationWeek12' },
]

function localeFromLanguageCode(code: string): string {
  if (code === 'uk') return 'uk-UA'
  if (code === 'en') return 'en-US'
  if (code === 'de') return 'de-DE'
  return code
}

export function Advertising() {
  const { user, t, language } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [selectedPlacements, setSelectedPlacements] = useState<PlacementValue[]>(['sidebar'])
  const [geoMode, setGeoMode] = useState<GeoMode>('global')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [durationWeeks, setDurationWeeks] = useState(1)
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 })
  const [isDragOver, setIsDragOver] = useState(false)
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const placementOptions = useMemo<PlacementOption[]>(
    () => [
      {
        value: 'home',
        title: t('advertising.selfServePlacement.homeTitle'),
        text: t('advertising.selfServePlacement.homeText'),
        icon: PanelsTopLeft,
      },
      {
        value: 'listings',
        title: t('advertising.selfServePlacement.listingsTitle'),
        text: t('advertising.selfServePlacement.listingsText'),
        icon: Newspaper,
      },
      {
        value: 'sidebar',
        title: t('advertising.selfServePlacement.sidebarTitle'),
        text: t('advertising.selfServePlacement.sidebarText'),
        icon: MonitorSmartphone,
      },
      {
        value: 'footer',
        title: t('advertising.selfServePlacement.footerTitle'),
        text: t('advertising.selfServePlacement.footerText'),
        icon: Layers3,
      },
      {
        value: 'mobile_sticky',
        title: t('advertising.selfServePlacement.mobileTitle'),
        text: t('advertising.selfServePlacement.mobileText'),
        icon: MonitorSmartphone,
      },
    ],
    [t],
  )

  const createdAtFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeFromLanguageCode(language.code), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language.code],
  )

  const allCities = useMemo(
    () => GEO_DATA.flatMap((country) => country.regions.flatMap((region) => region.cities)),
    [],
  )

  const availableRegions = useMemo(
    () =>
      GEO_DATA.filter((country) => selectedCountries.includes(country.name)).flatMap((country) =>
        country.regions.map((region) => ({
          country: country.name,
          name: region.name,
          cities: region.cities,
        })),
      ),
    [selectedCountries],
  )

  const availableCities = useMemo(() => {
    if (selectedRegions.length > 0) {
      return availableRegions
        .filter((region) => selectedRegions.includes(region.name))
        .flatMap((region) => region.cities)
    }
    return availableRegions.flatMap((region) => region.cities)
  }, [availableRegions, selectedRegions])

  const calculatedCities = useMemo(() => {
    if (geoMode === 'global') return allCities
    if (geoMode === 'countries') {
      return GEO_DATA.filter((country) => selectedCountries.includes(country.name)).flatMap(
        (country) => country.regions.flatMap((region) => region.cities),
      )
    }
    if (geoMode === 'regions') {
      return availableRegions
        .filter((region) => selectedRegions.includes(region.name))
        .flatMap((region) => region.cities)
    }
    return selectedCities
  }, [geoMode, allCities, selectedCountries, availableRegions, selectedRegions, selectedCities])

  const selectedCitiesCount = calculatedCities.length
  const totalPrice =
    selectedCitiesCount * PRICE_PER_CITY_PER_WEEK * selectedPlacements.length * durationWeeks

  const geoSummary = useMemo(
    () => getGeoSummary(geoMode, selectedCountries, selectedRegions, calculatedCities, t),
    [geoMode, selectedCountries, selectedRegions, calculatedCities, t],
  )

  const previewMediaLabel = useMemo(() => {
    if (mediaType === 'gif') return t('advertising.selfServePreviewMediaGif')
    if (mediaType === 'video') return t('advertising.selfServePreviewMediaVideo')
    return t('advertising.selfServePreviewMediaImage')
  }, [mediaType, t])

  useEffect(() => {
    if (user) {
      void loadOwnCampaigns()
    } else {
      setCampaigns([])
    }
  }, [user])

  const loadOwnCampaigns = async () => {
    if (!user) return
    setLoadingCampaigns(true)
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setCampaigns((data as AdCampaign[] | null) || [])
    } catch (err) {
      console.error('Failed to load ad campaigns:', err)
      setCampaigns([])
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const togglePlacement = (value: PlacementValue) => {
    setSelectedPlacements((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((p) => p !== value)
          : prev
        : [...prev, value],
    )
  }

  const toggleAllPlacements = () => {
    const allValues = placementOptions.map((p) => p.value)
    if (selectedPlacements.length === allValues.length) {
      setSelectedPlacements([allValues[0]])
    } else {
      setSelectedPlacements(allValues)
    }
  }

  const handleGeoModeChange = (mode: GeoMode) => {
    setGeoMode(mode)
    setSelectedCountries([])
    setSelectedRegions([])
    setSelectedCities([])
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const allAccepted = Object.values(ACCEPTED_MIME).flat()
      if (!allAccepted.includes(file.type)) {
        setUploadState({
          status: 'error',
          progress: 0,
          error: t('advertising.selfServeUploadErrorMime'),
        })
        return
      }

      if (file.size > MAX_FILE_BYTES) {
        setUploadState({
          status: 'error',
          progress: 0,
          error: tf(t, 'advertising.selfServeUploadErrorSize', { maxMb: MAX_FILE_MB }),
        })
        return
      }

      if (ACCEPTED_MIME.video.includes(file.type)) {
        setMediaType('video')
      } else if (file.type === 'image/gif') {
        setMediaType('gif')
      } else {
        setMediaType('image')
      }

      setUploadState({ status: 'uploading', progress: 10 })
      setMediaUrl('')

      try {
        const ext = file.name.split('.').pop() ?? 'bin'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const path = `campaigns/${fileName}`

        setUploadState({ status: 'uploading', progress: 40 })

        const { error: uploadError } = await supabase.storage
          .from('ad-media')
          .upload(path, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        setUploadState({ status: 'uploading', progress: 80 })

        const { data: urlData } = supabase.storage.from('ad-media').getPublicUrl(path)

        setMediaUrl(urlData.publicUrl)
        setUploadState({ status: 'done', progress: 100 })
      } catch (err) {
        console.error('Failed to upload ad media file:', err)
        setUploadState({
          status: 'error',
          progress: 0,
          error: t('advertising.selfServeUploadErrorFailed'),
        })
      }
    },
    [t],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ''
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLinkUrl('')
    setSelectedPlacements(['sidebar'])
    setGeoMode('global')
    setSelectedCountries([])
    setSelectedRegions([])
    setSelectedCities([])
    setDurationWeeks(1)
    setMediaType('image')
    setMediaUrl('')
    setUploadState({ status: 'idle', progress: 0 })
    setStartsAt('')
    setEndsAt('')
  }

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      setFeedback({ type: 'error', text: t('advertising.selfServeErrorLogin') })
      return
    }

    if (!mediaUrl) {
      setFeedback({ type: 'error', text: t('advertising.selfServeErrorMedia') })
      return
    }

    if (!linkUrl.trim()) {
      setFeedback({ type: 'error', text: t('advertising.selfServeErrorLink') })
      return
    }

    if (selectedCitiesCount === 0) {
      setFeedback({ type: 'error', text: t('advertising.selfServeErrorGeo') })
      return
    }

    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      setFeedback({ type: 'error', text: t('advertising.selfServeErrorDate') })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const now = new Date()
      const startDate = startsAt ? new Date(startsAt) : now
      const endDate = endsAt
        ? new Date(endsAt)
        : new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)

      const { error } = await supabase.from('ad_campaigns').insert({
        advertiser_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        image_url: mediaUrl,
        link_url: linkUrl.trim(),
        placement: selectedPlacements[0],
        placements: selectedPlacements,
        geo_scope: geoMode,
        countries: selectedCountries,
        regions: selectedRegions,
        cities: calculatedCities,
        country_name: selectedCountries[0] ?? null,
        city_name: calculatedCities[0] ?? null,
        country_code: null,
        region_name: selectedRegions[0] ?? null,
        media_type: mediaType,
        media_url: mediaUrl,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        duration_weeks: durationWeeks,
        price_total: totalPrice,
        currency: 'EUR',
        payment_status: 'pending_payment',
        status: 'pending_payment',
      })

      if (error) throw error

      setFeedback({ type: 'success', text: t('advertising.selfServeSuccess') })
      resetForm()
      await loadOwnCampaigns()
    } catch (err) {
      console.error('Failed to create ad campaign:', err)
      setFeedback({ type: 'error', text: t('advertising.selfServeErrorCreate') })
    } finally {
      setSaving(false)
    }
  }

  const selectedPlacementTitle =
    placementOptions.find((p) => p.value === selectedPlacements[0])?.title ?? ''

  return (
    <div className="page-bg min-h-screen px-4 py-8 md:px-6 xl:px-8 2xl:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="glass-panel p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/42 bg-[rgba(248,250,252,0.70)] px-4 py-2 text-sm font-semibold text-[#64748b]">
                <Megaphone className="h-4 w-4" />
                <span>{t('advertising.selfServeEyebrow')}</span>
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-[#2f2a24] md:text-5xl">
                {t('advertising.selfServeHeroTitle')}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f665d] md:text-lg">
                {t('advertising.selfServeHeroDescription')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {!user ? (
                  <button
                    onClick={() => navigateTo('/login')}
                    type="button"
                    className="btn-primary rounded-full"
                  >
                    <LogIn className="h-4 w-4" />
                    {t('advertising.selfServeLoginCta')}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      document.getElementById('ad-form')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }
                    type="button"
                    className="btn-primary rounded-full"
                  >
                    {t('advertising.selfServePrimaryButton')}
                  </button>
                )}
                <button
                  onClick={() => navigateTo('/')}
                  type="button"
                  className="btn-secondary rounded-full"
                >
                  {t('advertising.secondaryButton')}
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <FeatureCard
                  title={t('advertising.selfServeFeaturePagesTitle')}
                  text={t('advertising.selfServeFeaturePagesText')}
                />
                <FeatureCard
                  title={t('advertising.selfServeFeatureGeoTitle')}
                  text={t('advertising.selfServeFeatureGeoText')}
                />
                <FeatureCard
                  title={t('advertising.selfServeFeaturePricingTitle')}
                  text={t('advertising.selfServeFeaturePricingText')}
                />
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {t('advertising.selfServeHowItWorksTitle')}
              </h2>
              <div className="mt-5 space-y-4">
                <StepRow
                  number="01"
                  title={t('advertising.selfServeStep1Title')}
                  text={t('advertising.selfServeStep1Text')}
                />
                <StepRow
                  number="02"
                  title={t('advertising.selfServeStep2Title')}
                  text={t('advertising.selfServeStep2Text')}
                />
                <StepRow
                  number="03"
                  title={t('advertising.selfServeStep3Title')}
                  text={t('advertising.selfServeStep3Text')}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                    {t('advertising.selfServePlacementsTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-[#6f665d]">
                    {t('advertising.selfServePlacementsHint')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAllPlacements}
                  className="shrink-0 rounded-full border border-[rgba(148,163,184,0.28)] bg-[rgba(255,255,255,0.46)] px-3 py-1.5 text-xs font-semibold text-[#64748b] transition hover:bg-[rgba(255,255,255,0.7)]"
                >
                  {selectedPlacements.length === placementOptions.length
                    ? t('advertising.selfServeDeselectAll')
                    : t('advertising.selfServeSelectAll')}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {placementOptions.map((item) => {
                  const isSelected = selectedPlacements.includes(item.value)
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => togglePlacement(item.value)}
                      aria-pressed={isSelected}
                      className={`relative rounded-[22px] border p-4 text-left transition ${
                        isSelected
                          ? 'border-[rgba(99,102,241,0.35)] bg-[rgba(238,242,255,0.60)] shadow-[0_8px_20px_rgba(99,102,241,0.08)]'
                          : 'border-white/38 bg-[rgba(255,255,255,0.28)] hover:bg-[rgba(255,255,255,0.40)]'
                      }`}
                    >
                      <span
                        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                          isSelected
                            ? 'border-[#6366f1] bg-[#6366f1]'
                            : 'border-[rgba(148,163,184,0.4)] bg-white/60'
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                            <path
                              d="M1.5 5L4 7.5L8.5 2.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>

                      <div className="flex items-start gap-3 pr-6">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition ${
                            isSelected
                              ? 'bg-[rgba(99,102,241,0.12)] text-[#6366f1]'
                              : 'bg-[rgba(148,163,184,0.12)] text-[#64748b]'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#2f2a24]">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-[#6f665d]">
                            {item.text}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div id="ad-form" className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {t('advertising.selfServeFormTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                {t('advertising.selfServeFormDescription')}
              </p>

              {!user ? (
                <div className="mt-5 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.30)] p-5">
                  <p className="text-sm leading-6 text-[#6f665d]">
                    {t('advertising.selfServeLoginPrompt')}
                  </p>
                  <button
                    onClick={() => navigateTo('/login')}
                    type="button"
                    className="btn-primary mt-5 rounded-full"
                  >
                    {t('advertising.selfServeSignInButton')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateCampaign} className="mt-5 space-y-6">
                  {feedback && (
                    <div
                      className={`rounded-[20px] px-4 py-3 text-sm ${
                        feedback.type === 'error'
                          ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
                          : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]'
                      }`}
                    >
                      {feedback.text}
                    </div>
                  )}

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                        <ImagePlus className="h-4 w-4" />
                        <span>{t('advertising.selfServeMediaLabel')}</span>
                        <span className="font-normal text-[#9a8776]">
                          — {tf(t, 'advertising.selfServeMediaMaxSize', { maxMb: MAX_FILE_MB })}
                        </span>
                      </label>

                      <div className="flex gap-1 rounded-full border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.5)] p-0.5">
                        {(['image', 'gif', 'video'] as MediaType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setMediaType(type)}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              mediaType === type
                                ? 'bg-white text-[#2f2a24] shadow-sm'
                                : 'text-[#6f665d] hover:text-[#2f2a24]'
                            }`}
                          >
                            {type === 'video' && <Film className="h-3 w-3" />}
                            {type === 'gif' && <Play className="h-3 w-3" />}
                            {type === 'image' && <ImagePlus className="h-3 w-3" />}
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-[22px] border-2 border-dashed transition ${
                        isDragOver
                          ? 'border-[#6366f1] bg-[rgba(99,102,241,0.05)]'
                          : uploadState.status === 'done'
                            ? 'border-[rgba(34,197,94,0.4)] bg-[rgba(236,250,240,0.6)]'
                            : uploadState.status === 'error'
                              ? 'border-[rgba(239,68,68,0.4)] bg-[rgba(255,237,232,0.6)]'
                              : 'border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.3)] hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.03)]'
                      }`}
                    >
                      {mediaUrl && uploadState.status === 'done' ? (
                        <div className="relative">
                          {mediaType === 'video' ? (
                            <video
                              src={mediaUrl}
                              className="h-48 w-full rounded-[20px] object-cover"
                              muted
                              playsInline
                              loop
                              autoPlay
                            />
                          ) : (
                            <img
                              src={mediaUrl}
                              alt={t('advertising.selfServeBannerAlt')}
                              className="h-48 w-full rounded-[20px] object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMediaUrl('')
                              setUploadState({ status: 'idle', progress: 0 })
                            }}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
                            {tf(t, 'advertising.selfServeMediaDone', {
                              type: mediaType.toUpperCase(),
                            })}
                          </div>
                        </div>
                      ) : uploadState.status === 'uploading' ? (
                        <div className="flex flex-col items-center justify-center gap-3 p-10">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(99,102,241,0.2)] border-t-[#6366f1]" />
                          <div className="text-sm font-semibold text-[#6f665d]">
                            {tf(t, 'advertising.selfServeUploading', {
                              progress: uploadState.progress,
                            })}
                          </div>
                          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[rgba(148,163,184,0.2)]">
                            <div
                              className="h-full rounded-full bg-[#6366f1] transition-all duration-300"
                              style={{ width: `${uploadState.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-10">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${
                              uploadState.status === 'error'
                                ? 'bg-[rgba(239,68,68,0.10)] text-[#ef4444]'
                                : 'bg-[rgba(99,102,241,0.10)] text-[#6366f1]'
                            }`}
                          >
                            <Upload className="h-6 w-6" />
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-[#2f2a24]">
                              {t('advertising.selfServeUploadPrompt')}
                            </div>
                            <div className="mt-1 text-xs text-[#9a8776]">
                              {mediaType === 'image' && t('advertising.selfServeUploadHintImage')}
                              {mediaType === 'gif' && t('advertising.selfServeUploadHintGif')}
                              {mediaType === 'video' && t('advertising.selfServeUploadHintVideo')}
                            </div>
                            {uploadState.status === 'error' && uploadState.error && (
                              <div className="mt-2 text-xs font-semibold text-[#ef4444]">
                                {uploadState.error}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_MIME[mediaType].join(',')}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('advertising.selfServeCampaignTitleLabel')}{' '}
                        <span className="text-[#ef4444]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-glass"
                        placeholder={t('advertising.selfServeCampaignTitlePlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('advertising.selfServeCampaignDescriptionLabel')}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="input-glass resize-y"
                        placeholder={t('advertising.selfServeCampaignDescriptionPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                        <Link2 className="h-4 w-4" />
                        <span>
                          {t('advertising.selfServeLinkUrlLabel')}{' '}
                          <span className="text-[#ef4444]">*</span>
                        </span>
                      </label>
                      <input
                        type="url"
                        required
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="input-glass"
                        placeholder={t('advertising.selfServeLinkUrlPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="border-t border-[rgba(148,163,184,0.18)] pt-5">
                    <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                      <Globe2 className="h-4 w-4" />
                      <span>{t('advertising.selfServeGeoScopeLabel')}</span>
                    </label>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      {GEO_MODE_OPTIONS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleGeoModeChange(item.value)}
                          className={`rounded-[18px] border px-4 py-3 text-sm font-bold transition ${
                            geoMode === item.value
                              ? 'border-[#6366f1] bg-[rgba(99,102,241,0.12)] text-[#6366f1]'
                              : 'border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.45)] text-[#6f665d]'
                          }`}
                        >
                          {t(item.labelKey)}
                        </button>
                      ))}
                    </div>

                    {geoMode !== 'global' && (
                      <div className="mt-5 space-y-4">
                        <CheckboxDropdown
                          title={t('advertising.selfServeCountryLabel')}
                          options={GEO_DATA.map((country) => country.name)}
                          selected={selectedCountries}
                          t={t}
                          onChange={(values) => {
                            setSelectedCountries(values)
                            setSelectedRegions([])
                            setSelectedCities([])
                          }}
                        />

                        {(geoMode === 'regions' || geoMode === 'cities') &&
                          selectedCountries.length > 0 && (
                            <CheckboxDropdown
                              title={t('advertising.selfServeRegionLabel')}
                              options={availableRegions.map((region) => region.name)}
                              selected={selectedRegions}
                              t={t}
                              onChange={(values) => {
                                setSelectedRegions(values)
                                setSelectedCities([])
                              }}
                            />
                          )}

                        {geoMode === 'cities' && selectedCountries.length > 0 && (
                          <CheckboxDropdown
                            title={t('advertising.selfServeCityLabel')}
                            options={availableCities}
                            selected={selectedCities}
                            t={t}
                            onChange={setSelectedCities}
                          />
                        )}
                      </div>
                    )}

                    <div className="mt-5 rounded-[20px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.50)] p-4">
                      <div className="text-sm font-bold text-[#2f2a24]">
                        {t('advertising.selfServePricingTitle')}
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-[#6f665d]">
                        <div>
                          {t('advertising.selfServePricingGeography')}: <b>{geoSummary}</b>
                        </div>
                        <div>
                          {t('advertising.selfServePricingCities')}: <b>{selectedCitiesCount}</b>
                        </div>
                        <div>
                          {t('advertising.selfServePricingPlacements')}:{' '}
                          <b>{selectedPlacements.length}</b>
                        </div>
                        <div>
                          {t('advertising.selfServePricingPeriod')}:{' '}
                          <b>
                            {tf(t, 'advertising.selfServeWeeksShort', { count: durationWeeks })}
                          </b>
                        </div>
                        <div>
                          {tf(t, 'advertising.selfServePricingUnit', {
                            price: PRICE_PER_CITY_PER_WEEK,
                          })}
                        </div>
                      </div>

                      <label className="mt-4 block text-sm font-semibold text-[#5f5a54]">
                        {t('advertising.selfServeDurationLabel')}
                      </label>
                      <select
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="input-glass mt-2"
                      >
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option.weeks} value={option.weeks}>
                            {t(option.labelKey)}
                          </option>
                        ))}
                      </select>

                      <div className="mt-4 rounded-[18px] bg-[#6366f1] px-4 py-3 text-white">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                          {t('advertising.selfServeTotalLabel')}
                        </div>
                        <div className="mt-1 text-3xl font-extrabold">{totalPrice}€</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[rgba(148,163,184,0.18)] pt-5">
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                      <CalendarRange className="h-4 w-4" />
                      <span>{t('advertising.selfServePeriodLabel')}</span>
                      <span className="text-xs font-normal text-[#9a8776]">
                        {t('advertising.selfServeOptional')}
                      </span>
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#6f665d]">
                          {t('advertising.selfServeStartLabel')}
                        </label>
                        <input
                          type="datetime-local"
                          value={startsAt}
                          onChange={(e) => setStartsAt(e.target.value)}
                          className="input-glass"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#6f665d]">
                          {t('advertising.selfServeEndLabel')}
                        </label>
                        <input
                          type="datetime-local"
                          value={endsAt}
                          onChange={(e) => setEndsAt(e.target.value)}
                          className="input-glass"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      disabled={saving || uploadState.status === 'uploading'}
                      className="btn-primary rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? t('advertising.selfServeSubmitting')
                        : tf(t, 'advertising.selfServeSubmitPayment', { total: totalPrice })}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {t('advertising.selfServePreviewTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                {t('advertising.selfServePreviewDescription')}
              </p>

              <a
                href={linkUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => !linkUrl && e.preventDefault()}
                className="group mt-5 block overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.36)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
              >
                {mediaUrl && uploadState.status === 'done' ? (
                  mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      className="h-48 w-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={title.trim() || t('advertising.selfServeBannerAlt')}
                      className="h-48 w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,rgba(248,250,252,0.92),rgba(255,247,240,0.92))]">
                    <div className="text-center text-[#8b7e72]">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(148,163,184,0.14)]">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold">
                        {t('advertising.selfServePreviewPlaceholder')}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[rgba(148,163,184,0.12)] px-3 py-1 text-xs font-semibold text-[#64748b]">
                      {t('advertising.selfServePreviewAdBadge')}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a8776] transition group-hover:text-[#6366f1]">
                      {selectedPlacements.length > 1
                        ? tf(t, 'advertising.selfServePreviewPlacementsCount', {
                            count: selectedPlacements.length,
                          })
                        : selectedPlacementTitle}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-extrabold text-[#2f2a24]">
                    {title.trim() || t('advertising.selfServePreviewTitlePlaceholder')}
                  </h3>

                  {description.trim() && (
                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">{description.trim()}</p>
                  )}

                  <div className="mt-4 grid gap-2">
                    <PreviewRow
                      label={t('advertising.selfServePreviewLink')}
                      value={linkUrl.trim() || t('advertising.selfServeLinkUrlPlaceholder')}
                    />
                    <PreviewRow label={t('advertising.selfServePreviewGeography')} value={geoSummary} />
                    <PreviewRow
                      label={t('advertising.selfServePreviewCost')}
                      value={`${totalPrice}€ / ${tf(t, 'advertising.selfServeWeeksShort', { count: durationWeeks })}`}
                    />
                    <PreviewRow label={t('advertising.selfServePreviewMedia')} value={previewMediaLabel} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[#9a8776]">
                      {tf(t, 'advertising.selfServePreviewCitiesCount', {
                        count: selectedCitiesCount,
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6366f1] px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-[#4f46e5]">
                      {t('advertising.selfServePreviewGoTo')}
                    </span>
                  </div>
                </div>
              </a>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {t('advertising.selfServeHowItWorksNowTitle')}
              </h2>
              <div className="mt-5 space-y-3 text-sm text-[#6f665d]">
                <InfoRow text={t('advertising.selfServeHowItWorksNow1')} />
                <InfoRow text={t('advertising.selfServeHowItWorksNow2')} />
                <InfoRow text={t('advertising.selfServeHowItWorksNow3')} />
                <InfoRow text={t('advertising.selfServeHowItWorksNow4')} />
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {t('advertising.selfServeCampaignsTitle')}
              </h2>

              {!user ? (
                <p className="mt-4 text-sm leading-6 text-[#6f665d]">
                  {t('advertising.selfServeCampaignsSignIn')}
                </p>
              ) : loadingCampaigns ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#6f665d]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(148,163,184,0.3)] border-t-[#64748b]" />
                  {t('advertising.selfServeCampaignsLoading')}
                </div>
              ) : campaigns.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      formatter={createdAtFormatter}
                      t={t}
                      placementOptions={placementOptions}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#6f665d]">
                  {t('advertising.selfServeCampaignsEmpty')}
                </p>
              )}
            </div>

            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {t('advertising.selfServeNextStepsTitle')}
              </h2>
              <div className="mt-5 space-y-3 text-sm text-[#6f665d]">
                <InfoRow text={t('advertising.selfServeNextSteps1')} />
                <InfoRow text={t('advertising.selfServeNextSteps2')} />
                <InfoRow text={t('advertising.selfServeNextSteps3')} />
                <InfoRow text={t('advertising.selfServeNextSteps4')} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CheckboxDropdown({
  title,
  options,
  selected,
  onChange,
  t,
}: {
  title: string
  options: string[]
  selected: string[]
  onChange: (value: string[]) => void
  t: (key: TranslationKey) => string
}) {
  const [open, setOpen] = useState(false)

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="input-glass flex items-center justify-between text-left"
      >
        <span>
          {selected.length > 0
            ? tf(t, 'advertising.selfServeDropdownSelected', {
                title,
                count: selected.length,
              })
            : title}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-[18px] border border-[rgba(148,163,184,0.2)] bg-white p-2 shadow-xl">
          {options.length > 0 ? (
            options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2 text-sm text-[#2f2a24] hover:bg-[rgba(99,102,241,0.08)]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                {option}
              </label>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-[#9a8776]">
              {t('advertising.selfServeDropdownEmpty')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CampaignCard({
  campaign,
  formatter,
  t,
  placementOptions,
}: {
  campaign: AdCampaign
  formatter: Intl.DateTimeFormat
  t: (key: TranslationKey) => string
  placementOptions: PlacementOption[]
}) {
  const campaignData = campaign as AdCampaign & {
    placements?: string[]
    countries?: string[]
    regions?: string[]
    cities?: string[]
    price_total?: number
    currency?: string
    duration_weeks?: number
    payment_status?: string
    geo_scope?: GeoMode | string
  }

  const placements = campaignData.placements ?? [campaign.placement]
  const countries = campaignData.countries ?? (campaign.country_name ? [campaign.country_name] : [])
  const regions = campaignData.regions ?? (campaign.region_name ? [campaign.region_name] : [])
  const cities = campaignData.cities ?? (campaign.city_name ? [campaign.city_name] : [])
  const geoScope = (campaignData.geo_scope as GeoMode) ?? 'global'

  return (
    <div className="rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[#2f2a24]">{campaign.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {placements.map((placement) => (
              <span
                key={placement}
                className="rounded-full bg-[rgba(148,163,184,0.12)] px-2 py-0.5 text-xs text-[#64748b]"
              >
                {placementOptions.find((option) => option.value === placement)?.title ?? placement}
              </span>
            ))}
          </div>
        </div>
        <StatusBadge status={campaign.status} t={t} />
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-[#6f665d]">
        <p>
          <span className="font-medium text-[#5f5a54]">
            {t('advertising.selfServeGeographyLabel')}:{' '}
          </span>
          {getGeoSummary(geoScope, countries, regions, cities, t)}
        </p>
        <p>
          <span className="font-medium text-[#5f5a54]">
            {t('advertising.selfServeAmountLabel')}:{' '}
          </span>
          {campaignData.price_total
            ? `${campaignData.price_total} ${campaignData.currency ?? 'EUR'}`
            : '—'}
        </p>
        <p>
          <span className="font-medium text-[#5f5a54]">
            {t('advertising.selfServeCreatedAtLabel')}:{' '}
          </span>
          {campaign.created_at ? formatter.format(new Date(campaign.created_at)) : '—'}
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/40 bg-[rgba(255,255,255,0.30)] p-5">
      <div className="text-lg font-extrabold text-[#2f2a24]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#6f665d]">{text}</p>
    </div>
  )
}

function StepRow({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a8776]">
        {number}
      </div>
      <div className="mt-1 text-base font-extrabold text-[#2f2a24]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#6f665d]">{text}</p>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.42)] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8776]">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold text-[#2f2a24]">{value}</div>
    </div>
  )
}

function InfoRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#64748b]" />
      <span>{text}</span>
    </div>
  )
}

function StatusBadge({
  status,
  t,
}: {
  status: string | null | undefined
  t: (key: TranslationKey) => string
}) {
  const normalizedStatus = status ?? 'draft'
  const styles: Record<string, string> = {
    draft: 'bg-[rgba(148,163,184,0.14)] text-[#475569]',
    pending_payment: 'bg-[rgba(99,102,241,0.14)] text-[#4f46e5]',
    pending_review: 'bg-[rgba(245,158,11,0.14)] text-[#b45309]',
    active: 'bg-[rgba(34,197,94,0.14)] text-[#15803d]',
    paused: 'bg-[rgba(100,116,139,0.14)] text-[#475569]',
    rejected: 'bg-[rgba(239,68,68,0.14)] text-[#b91c1c]',
    expired: 'bg-[rgba(148,163,184,0.14)] text-[#64748b]',
    deleted: 'bg-[rgba(148,163,184,0.14)] text-[#64748b]',
  }

  const statusKey = `advertising.selfServeStatus.${normalizedStatus}` as TranslationKey
  const label = KNOWN_CAMPAIGN_STATUSES.includes(
    normalizedStatus as (typeof KNOWN_CAMPAIGN_STATUSES)[number],
  )
    ? t(statusKey)
    : normalizedStatus

  return (
    <span
      className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalizedStatus] ?? styles.draft
      }`}
    >
      {label}
    </span>
  )
}

function getGeoSummary(
  geoMode: GeoMode,
  countries: string[],
  regions: string[],
  cities: string[],
  translate: (key: TranslationKey) => string,
): string {
  if (geoMode === 'global') {
    return tf(translate, 'advertising.selfServeGeoSummaryGlobal', { count: cities.length })
  }

  if (geoMode === 'countries') {
    if (countries.length === 0) {
      return translate('advertising.selfServeGeoSummaryCountriesEmpty')
    }
    return tf(translate, 'advertising.selfServeGeoSummaryWithCount', {
      names: countries.join(', '),
      count: cities.length,
    })
  }

  if (geoMode === 'regions') {
    if (regions.length === 0) {
      return translate('advertising.selfServeGeoSummaryRegionsEmpty')
    }
    return tf(translate, 'advertising.selfServeGeoSummaryWithCount', {
      names: regions.join(', '),
      count: cities.length,
    })
  }

  if (cities.length === 0) {
    return translate('advertising.selfServeGeoSummaryCitiesEmpty')
  }

  return cities.join(', ')
}
