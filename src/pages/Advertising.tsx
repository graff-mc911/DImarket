// ============================================================
// Advertising.tsx — Самостійне розміщення реклами
//
// Дозволяє рекламодавцю:
// - Завантажити медіа (фото, GIF, відео)
// - Вибрати кілька позицій показу
// - Налаштувати геотаргетинг (світ / країни / регіони / міста)
// - Розрахувати вартість автоматично
// - Створити кампанію зі статусом "очікує оплати" та перейти до Stripe Checkout
//
// Всі тексти локалізовані через t() — підтримує 24 мови.
// ============================================================

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
import { createCheckoutSession, eurosToCents } from '../lib/stripe'

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
const PRICE_PER_CITY_PER_WEEK = 25

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
  { value: 'global', labelKey: 'advertising.geo.global' },
  { value: 'countries', labelKey: 'advertising.geo.countries' },
  { value: 'regions', labelKey: 'advertising.geo.regions' },
  { value: 'cities', labelKey: 'advertising.geo.cities' },
]

const DURATION_OPTIONS: Array<{ weeks: number; labelKey: TranslationKey }> = [
  { weeks: 1, labelKey: 'advertising.price.week1' },
  { weeks: 2, labelKey: 'advertising.price.week2' },
  { weeks: 4, labelKey: 'advertising.price.week4' },
  { weeks: 12, labelKey: 'advertising.price.week12' },
]

function localeFromLanguageCode(code: string): string {
  const map: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    de: 'de-DE',
    pl: 'pl-PL',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    cs: 'cs-CZ',
    sk: 'sk-SK',
    hu: 'hu-HU',
    bg: 'bg-BG',
    ro: 'ro-RO',
    tr: 'tr-TR',
    ar: 'ar',
    zh: 'zh-CN',
    ja: 'ja-JP',
    kk: 'kk-KZ',
  }
  return map[code] ?? 'en-US'
}

function safeDateFormatter(locale: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }
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
  const [geoData, setGeoData] = useState<GeoCountry[]>([])
  const [geoLoading, setGeoLoading] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const placementOptions = useMemo<PlacementOption[]>(
    () => [
      {
        value: 'home',
        title: t('advertising.placement.home.title'),
        text: t('advertising.placement.home.text'),
        icon: PanelsTopLeft,
      },
      {
        value: 'listings',
        title: t('advertising.placement.listings.title'),
        text: t('advertising.placement.listings.text'),
        icon: Newspaper,
      },
      {
        value: 'sidebar',
        title: t('advertising.placement.sidebar.title'),
        text: t('advertising.placement.sidebar.text'),
        icon: MonitorSmartphone,
      },
      {
        value: 'footer',
        title: t('advertising.placement.footer.title'),
        text: t('advertising.placement.footer.text'),
        icon: Layers3,
      },
      {
        value: 'mobile_sticky',
        title: t('advertising.placement.mobile.title'),
        text: t('advertising.placement.mobile.text'),
        icon: MonitorSmartphone,
      },
    ],
    [t],
  )

  const createdAtFormatter = useMemo(
    () => safeDateFormatter(localeFromLanguageCode(language.code)),
    [language.code],
  )

  const allCities = useMemo(
    () => geoData.flatMap((country) => country.regions.flatMap((region) => region.cities)),
    [geoData],
  )

  const availableRegions = useMemo(
    () =>
      geoData.filter((country) => selectedCountries.includes(country.name)).flatMap((country) =>
        country.regions.map((region) => ({
          country: country.name,
          name: region.name,
          cities: region.cities,
        })),
      ),
    [geoData, selectedCountries],
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
      return geoData.filter((country) => selectedCountries.includes(country.name)).flatMap(
        (country) => country.regions.flatMap((region) => region.cities),
      )
    }
    if (geoMode === 'regions') {
      return availableRegions
        .filter((region) => selectedRegions.includes(region.name))
        .flatMap((region) => region.cities)
    }
    return selectedCities
  }, [geoMode, geoData, allCities, selectedCountries, availableRegions, selectedRegions, selectedCities])

  const selectedCitiesCount = calculatedCities.length
  const totalPrice =
    selectedCitiesCount * PRICE_PER_CITY_PER_WEEK * selectedPlacements.length * durationWeeks

  const geoSummary = useMemo(
    () => getGeoSummary(geoMode, selectedCountries, selectedRegions, calculatedCities, t),
    [geoMode, selectedCountries, selectedRegions, calculatedCities, t],
  )

  const previewMediaLabel = useMemo(() => {
    if (mediaType === 'gif') return t('advertising.preview.mediaGif')
    if (mediaType === 'video') return t('advertising.preview.mediaVideo')
    return t('advertising.preview.mediaImage')
  }, [mediaType, t])

  useEffect(() => {
    void loadGeoData()
  }, [])

  useEffect(() => {
    if (user) {
      void loadOwnCampaigns()
    } else {
      setCampaigns([])
    }
  }, [user])

  const loadGeoData = async () => {
    setGeoLoading(true)
    try {
      const { data, error } = await supabase
        .from('active_geo')
        .select('country, region, city, user_count')
        .order('country')

      if (error || !data) return

      const grouped: Record<string, Record<string, string[]>> = {}

      for (const row of data) {
        if (!row.country || !row.city) continue
        if (!grouped[row.country]) grouped[row.country] = {}
        const regionName = row.region || t('advertising.geo.regionFallback')
        if (!grouped[row.country][regionName]) grouped[row.country][regionName] = []
        if (!grouped[row.country][regionName].includes(row.city)) {
          grouped[row.country][regionName].push(row.city)
        }
      }

      const result: GeoCountry[] = Object.entries(grouped).map(([country, regions]) => ({
        name: country,
        regions: Object.entries(regions).map(([region, cities]) => ({
          name: region,
          cities,
        })),
      }))

      setGeoData(result)
    } catch (err) {
      console.error('Помилка завантаження географії:', err)
    } finally {
      setGeoLoading(false)
    }
  }

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
          error: t('advertising.form.errorMime'),
        })
        return
      }

      if (file.size > MAX_FILE_BYTES) {
        setUploadState({
          status: 'error',
          progress: 0,
          error: tf(t, 'advertising.form.errorSize', { maxMb: MAX_FILE_MB }),
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
          error: t('advertising.form.errorUpload'),
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
      setFeedback({ type: 'error', text: t('advertising.error.noAuth') })
      return
    }

    if (!mediaUrl) {
      setFeedback({ type: 'error', text: t('advertising.error.noMedia') })
      return
    }

    if (!linkUrl.trim()) {
      setFeedback({ type: 'error', text: t('advertising.error.noLink') })
      return
    }

    if (selectedCitiesCount === 0) {
      setFeedback({ type: 'error', text: t('advertising.error.noGeo') })
      return
    }

    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      setFeedback({ type: 'error', text: t('advertising.dates.error') })
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

      const { data: newCampaign, error: fetchError } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('advertiser_id', user.id)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError

      const stripeResult = await createCheckoutSession({
        payment_type: 'ad_campaign',
        reference_id: newCampaign?.id ?? '',
        user_id: user.id,
        amount: eurosToCents(totalPrice),
        currency: 'eur',
        description: tf(t, 'advertising.checkout.description', { title: title.trim() }),
      })

      window.location.href = stripeResult.url
    } catch (err) {
      console.error('Помилка створення кампанії:', err)
      setFeedback({
        type: 'error',
        text:
          err instanceof Error && err.message.includes('Checkout')
            ? t('advertising.error.checkout')
            : t('advertising.error.save'),
      })
      setSaving(false)
    }
  }

  const previewCostLine = useMemo(
    () =>
      tf(t, 'advertising.preview.costLine', {
        amount: tf(t, 'advertising.price.totalValue', { amount: totalPrice }),
        weeks: tf(t, 'advertising.price.weeksShort', { count: durationWeeks }),
      }),
    [t, totalPrice, durationWeeks],
  )

  const selectedPlacementTitle =
    placementOptions.find((p) => p.value === selectedPlacements[0])?.title ?? ''

  return (
    <motion.div className="page-bg min-h-screen px-4 py-8 md:px-6 xl:px-8 2xl:px-10">