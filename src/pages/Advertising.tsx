// ============================================================
// Advertising.tsx — Самостійне розміщення реклами
//
// Дозволяє рекламодавцю:
// - Завантажити медіа (фото, GIF, відео)
// - Вибрати кілька позицій показу
// - Налаштувати геотаргетинг (світ / країни / регіони / міста)
// - Розрахувати вартість автоматично
// - Створити кампанію зі статусом "очікує оплати"
//
// Всі тексти локалізовані через t() — підтримує 24 мови.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Film,
  Globe2,
  ImagePlus,
  Link2,
  LogIn,
  MapPin,
  Megaphone,
  Play,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { navigateTo }  from '../lib/navigation'
import { useApp }      from '../contexts/AppContext'
import { AdCampaign }  from '../lib/types'
import { createCheckoutSession, eurosToCents } from '../lib/stripe'
import { AdPlacementPicker } from '../components/AdPlacementPicker'
import {
  formatSlotLabel,
  sideSlotId,
  slotToLegacyPlacement,
} from '../lib/adPlacementSlots'

// ── Типи ──────────────────────────────────────────────────────────────────────
type MediaType      = 'image' | 'gif' | 'video'
type GeoMode        = 'global' | 'countries' | 'regions' | 'cities'

type FeedbackState = { type: 'success' | 'error'; text: string }
type UploadState   = { status: 'idle' | 'uploading' | 'done' | 'error'; progress: number; error?: string }

type GeoCountry = {
  name: string
  regions: Array<{ name: string; cities: string[] }>
}

// ── Константи ──────────────────────────────────────────────────────────────────

const ACCEPTED_MIME: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  gif:   ['image/gif'],
  video: ['video/mp4', 'video/webm'],
}

const MAX_FILE_MB    = 20
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024
const PRICE_PER_CITY_PER_WEEK = 25

// GEO_DATA завантажується динамічно з бази даних
// Заповнюється автоматично коли користувачі реєструються з різних міст
const GEO_DATA: GeoCountry[] = []

// ── Головний компонент ─────────────────────────────────────────────────────────

export function Advertising() {
  const { user, t } = useApp()

  // Поля форми
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl]         = useState('')
  const [startsAt, setStartsAt]       = useState('')
  const [endsAt, setEndsAt]           = useState('')

  // Гранульовані слоти показу (мінімум один)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([sideSlotId('home', 'right', 1)])

  // Геотаргетинг
  const [geoMode, setGeoMode]                   = useState<GeoMode>('global')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions]     = useState<string[]>([])
  const [selectedCities, setSelectedCities]       = useState<string[]>([])
  const [durationWeeks, setDurationWeeks]         = useState(1)

  // Медіа
  const [mediaType, setMediaType]   = useState<MediaType>('image')
  const [mediaUrl, setMediaUrl]     = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 })
  const [isDragOver, setIsDragOver] = useState(false)

  // Географія з бази — завантажується автоматично
  const [geoData, setGeoData] = useState<GeoCountry[]>([])
  const [geoLoading, setGeoLoading] = useState(true)

  // Кампанії
  const [campaigns, setCampaigns]               = useState<AdCampaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [saving, setSaving]                     = useState(false)
  const [feedback, setFeedback]                 = useState<FeedbackState | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const createdAtFormatter = useMemo(() =>
    new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }), [])

  // Всі міста в GEO_DATA
  const allCities = useMemo(() =>
    geoData.flatMap(c => c.regions.flatMap(r => r.cities)), [geoData])

  // Доступні регіони для вибраних країн
  const availableRegions = useMemo(() =>
    geoData
      .filter(c => selectedCountries.includes(c.name))
      .flatMap(c => c.regions.map(r => ({ country: c.name, name: r.name, cities: r.cities }))),
    [selectedCountries, geoData])

  // Доступні міста для вибраних регіонів
  const availableCities = useMemo(() => {
    if (selectedRegions.length > 0) {
      return availableRegions
        .filter(r => selectedRegions.includes(r.name))
        .flatMap(r => r.cities)
    }
    return availableRegions.flatMap(r => r.cities)
  }, [availableRegions, selectedRegions])

  // Міста що потраплять в таргетинг
  const calculatedCities = useMemo(() => {
    if (geoMode === 'global')    return allCities
    if (geoMode === 'countries') return geoData.filter(c => selectedCountries.includes(c.name)).flatMap(c => c.regions.flatMap(r => r.cities))
    if (geoMode === 'regions')   return availableRegions.filter(r => selectedRegions.includes(r.name)).flatMap(r => r.cities)
    return selectedCities
  }, [geoMode, allCities, selectedCountries, availableRegions, selectedRegions, selectedCities])

  const selectedCitiesCount = calculatedCities.length

  // Автоматичний розрахунок ціни
  const totalPrice = selectedCitiesCount * PRICE_PER_CITY_PER_WEEK * selectedSlots.length * durationWeeks

  // Завантажуємо географію з бази при старті
  useEffect(() => {
    void loadGeoData()
  }, [])

  // Завантажуємо кампанії при авторизації
  useEffect(() => {
    if (user) void loadOwnCampaigns()
    else setCampaigns([])
  }, [user])

  // Завантаження унікальних країн/регіонів/міст з бази
  const loadGeoData = async () => {
    setGeoLoading(true)
    try {
      const { data, error } = await supabase
        .from('active_geo')
        .select('country, region, city, user_count')
        .order('country')

      if (error || !data) return

      // Групуємо по країнах і регіонах
      const grouped: Record<string, Record<string, string[]>> = {}

      for (const row of data) {
        if (!row.country || !row.city) continue
        if (!grouped[row.country]) grouped[row.country] = {}
        const reg = row.region || 'Інші'
        if (!grouped[row.country][reg]) grouped[row.country][reg] = []
        if (!grouped[row.country][reg].includes(row.city)) {
          grouped[row.country][reg].push(row.city)
        }
      }

      // Перетворюємо в масив GeoCountry
      const result: GeoCountry[] = Object.entries(grouped).map(([country, regions]) => ({
        name: country,
        regions: Object.entries(regions).map(([region, cities]) => ({
          name: region,
          cities,
        })),
      }))

      setGeoData(result)
    } catch (e) {
      console.error('Помилка завантаження географії:', e)
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
      console.error('Помилка завантаження кампаній:', err)
      setCampaigns([])
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const handleGeoModeChange = (mode: GeoMode) => {
    setGeoMode(mode)
    setSelectedCountries([])
    setSelectedRegions([])
    setSelectedCities([])
  }

  // Завантаження файлу в Supabase Storage
  const uploadFile = useCallback(async (file: File) => {
    const allAccepted = Object.values(ACCEPTED_MIME).flat()
    if (!allAccepted.includes(file.type)) {
      setUploadState({ status: 'error', progress: 0, error: 'JPG, PNG, WebP, GIF, MP4, WebM' })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadState({ status: 'error', progress: 0, error: `Max ${MAX_FILE_MB} MB` })
      return
    }

    if (ACCEPTED_MIME.video.includes(file.type)) setMediaType('video')
    else if (file.type === 'image/gif') setMediaType('gif')
    else setMediaType('image')

    setUploadState({ status: 'uploading', progress: 10 })
    setMediaUrl('')

    try {
      const ext      = file.name.split('.').pop() ?? 'bin'
      const fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
      const path     = 'campaigns/' + fileName

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
      console.error('Помилка завантаження:', err)
      setUploadState({ status: 'error', progress: 0, error: 'Upload failed. Try again.' })
    }
  }, [])

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
    setTitle(''); setDescription(''); setLinkUrl('')
    setSelectedSlots([sideSlotId('home', 'right', 1)])
    setGeoMode('global'); setSelectedCountries([]); setSelectedRegions([]); setSelectedCities([])
    setDurationWeeks(1)
    setMediaType('image'); setMediaUrl('')
    setUploadState({ status: 'idle', progress: 0 })
    setStartsAt(''); setEndsAt('')
  }

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user)          { setFeedback({ type: 'error', text: t('advertising.error.noAuth') }); return }
    if (!mediaUrl)      { setFeedback({ type: 'error', text: t('advertising.error.noMedia') }); return }
    if (!linkUrl.trim()){ setFeedback({ type: 'error', text: t('advertising.error.noLink') }); return }
    if (selectedCitiesCount === 0) { setFeedback({ type: 'error', text: t('advertising.error.noGeo') }); return }
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      setFeedback({ type: 'error', text: t('advertising.dates.error') }); return
    }

    setSaving(true); setFeedback(null)

    try {
      const now       = new Date()
      const startDate = startsAt ? new Date(startsAt) : now
      const endDate   = endsAt
        ? new Date(endsAt)
        : new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)

      const { error } = await supabase.from('ad_campaigns').insert({
        advertiser_id: user.id,
        title:         title.trim(),
        description:   description.trim() || null,
        image_url:     mediaUrl,
        link_url:      linkUrl.trim(),
        placement:     slotToLegacyPlacement(selectedSlots[0]),
        placements:    selectedSlots,
        geo_scope:     geoMode,
        countries:     selectedCountries,
        regions:       selectedRegions,
        cities:        calculatedCities,
        country_name:  selectedCountries[0] ?? null,
        city_name:     calculatedCities[0]  ?? null,
        country_code:  null,
        region_name:   selectedRegions[0]   ?? null,
        media_type:    mediaType,
        media_url:     mediaUrl,
        starts_at:     startDate.toISOString(),
        ends_at:       endDate.toISOString(),
        status:        'pending_payment',
      })

      if (error) throw error

      // Отримуємо ID щойно створеної кампанії
      const { data: newCampaign } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('advertiser_id', user.id)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Перенаправляємо на Stripe Checkout для оплати
      const stripeResult = await createCheckoutSession({
        payment_type: 'ad_campaign',
        reference_id: newCampaign?.id || '',
        user_id:      user.id,
        amount:       eurosToCents(totalPrice),
        currency:     'eur',
        description:  'DImarket реклама: ' + title.trim(),
      })

      // Відкриваємо сторінку оплати Stripe
      window.location.href = stripeResult.url

    } catch (err) {
      console.error('Помилка:', err)
      setFeedback({ type: 'error', text: t('advertising.error.save') })
      setSaving(false)
    }
  }

  // Зведений підпис географії
  const geoSummary = getGeoSummary(geoMode, selectedCountries, selectedRegions, calculatedCities, t)

  return (
    <div className="py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl">

        {/* ===== Hero секція (компактна ~50% висоти) ===== */}
        <section className="glass-panel p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
            <div>
              <div className="eyebrow px-3 py-1 text-xs">
                <Megaphone className="h-3.5 w-3.5" />
                <span>{t('advertising.selfService.eyebrow')}</span>
              </div>

              <h1 className="mt-2 max-w-4xl text-2xl font-extrabold tracking-tight text-[#2f2a24] md:text-3xl">
                {t('advertising.selfService.title')}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-5 text-[#6f665d] md:text-base md:leading-6">
                {t('advertising.selfService.description')}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {!user ? (
                  <button onClick={() => navigateTo('/login')} type="button" className="btn-primary rounded-full px-4 py-2 text-sm">
                    <LogIn className="h-3.5 w-3.5" />
                    {t('advertising.selfService.loginBtn')}
                  </button>
                ) : (
                  <button
                    onClick={() => document.getElementById('ad-form')?.scrollIntoView({ behavior: 'smooth' })}
                    type="button"
                    className="btn-primary rounded-full px-4 py-2 text-sm"
                  >
                    {t('advertising.selfService.createBtn')}
                  </button>
                )}
                <button onClick={() => navigateTo('/')} type="button" className="btn-secondary rounded-full px-4 py-2 text-sm">
                  {t('advertising.selfService.backBtn')}
                </button>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <FeatureCard compact title={t('advertising.feature.placements')} text={t('advertising.feature.placementsText')} />
                <FeatureCard compact title={t('advertising.feature.geo')} text={t('advertising.feature.geoText')} />
                <FeatureCard compact title={t('advertising.feature.price')} text={t('advertising.feature.priceText')} />
              </div>
            </div>

            {/* Як це працює */}
            <div className="glass-card p-4">
              <h2 className="text-lg font-extrabold text-[#2f2a24] md:text-xl">{t('advertising.howTitle')}</h2>
              <div className="mt-3 space-y-2">
                <StepRow compact number="01" title={t('advertising.step1.title')} text={t('advertising.step1.text')} />
                <StepRow compact number="02" title={t('advertising.step2.title')} text={t('advertising.step2.text')} />
                <StepRow compact number="03" title={t('advertising.step3.title')} text={t('advertising.step3.text')} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">

            {/* ===== Вибір позицій ===== */}
            <div className="glass-card p-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#2f2a24]">{t('advertising.placementsSection.title')}</h2>
                <p className="mt-1 text-sm leading-6 text-[#6f665d]">{t('advertising.placementsSection.desc')}</p>
              </div>
              <div className="mt-5">
                <AdPlacementPicker selected={selectedSlots} onChange={setSelectedSlots} />
              </div>
            </div>

            {/* ===== Форма нової кампанії ===== */}
            <div id="ad-form" className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">{t('advertising.form.title')}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665d]">{t('advertising.form.desc')}</p>

              {!user ? (
                <div className="mt-5 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.30)] p-5">
                  <p className="text-sm leading-6 text-[#6f665d]">{t('advertising.form.loginRequired')}</p>
                  <button onClick={() => navigateTo('/login')} type="button" className="btn-primary mt-5 rounded-full">
                    {t('advertising.form.loginBtn')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateCampaign} className="mt-5 space-y-6">

                  {feedback && (
                    <div className={'rounded-[20px] px-4 py-3 text-sm ' + (feedback.type === 'error'
                      ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
                      : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]')}>
                      {feedback.text}
                    </div>
                  )}

                  {/* Медіафайл */}
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                        <ImagePlus className="h-4 w-4" />
                        <span>{t('advertising.form.mediaLabel')}</span>
                        <span className="font-normal text-[#9a8776]">— {t('advertising.form.mediaMax')}</span>
                      </label>
                      <div className="flex gap-1 rounded-full border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.5)] p-0.5">
                        {(['image', 'gif', 'video'] as MediaType[]).map((type) => (
                          <button key={type} type="button" onClick={() => setMediaType(type)}
                            className={'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ' + (mediaType === type ? 'bg-white text-[#2f2a24] shadow-sm' : 'text-[#6f665d] hover:text-[#2f2a24]')}>
                            {type === 'video' && <Film className="h-3 w-3" />}
                            {type === 'gif'   && <Play className="h-3 w-3" />}
                            {type === 'image' && <ImagePlus className="h-3 w-3" />}
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Зона перетягування */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={'relative cursor-pointer rounded-[22px] border-2 border-dashed transition ' + (
                        isDragOver ? 'border-[#6366f1] bg-[rgba(99,102,241,0.05)]' :
                        uploadState.status === 'done'  ? 'border-[rgba(34,197,94,0.4)] bg-[rgba(236,250,240,0.6)]' :
                        uploadState.status === 'error' ? 'border-[rgba(239,68,68,0.4)] bg-[rgba(255,237,232,0.6)]' :
                        'border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.3)] hover:border-[rgba(99,102,241,0.4)]'
                      )}
                    >
                      {mediaUrl && uploadState.status === 'done' ? (
                        <div className="relative">
                          {mediaType === 'video'
                            ? <video src={mediaUrl} className="h-48 w-full rounded-[20px] object-cover" muted playsInline loop autoPlay />
                            : <img src={mediaUrl} alt="Banner" className="h-48 w-full rounded-[20px] object-cover" />}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setMediaUrl(''); setUploadState({ status: 'idle', progress: 0 }) }}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
                            {mediaType.toUpperCase()} • {t('advertising.form.mediaReady')}
                          </div>
                        </div>
                      ) : uploadState.status === 'uploading' ? (
                        <div className="flex flex-col items-center justify-center gap-3 p-10">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(99,102,241,0.2)] border-t-[#6366f1]" />
                          <div className="text-sm font-semibold text-[#6f665d]">{t('advertising.form.uploading')} {uploadState.progress}%</div>
                          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[rgba(148,163,184,0.2)]">
                            <div className="h-full rounded-full bg-[#6366f1] transition-all" style={{ width: uploadState.progress + '%' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-10">
                          <div className={'flex h-14 w-14 items-center justify-center rounded-[20px] ' + (uploadState.status === 'error' ? 'bg-[rgba(239,68,68,0.10)] text-[#ef4444]' : 'bg-[rgba(99,102,241,0.10)] text-[#6366f1]')}>
                            <Upload className="h-6 w-6" />
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-[#2f2a24]">{t('advertising.form.mediaDrop')}</div>
                            <div className="mt-1 text-xs text-[#9a8776]">
                              {mediaType === 'image' && t('advertising.form.mediaImage')}
                              {mediaType === 'gif'   && t('advertising.form.mediaGif')}
                              {mediaType === 'video' && t('advertising.form.mediaVideo')}
                            </div>
                            {uploadState.status === 'error' && (
                              <div className="mt-2 text-xs font-semibold text-[#ef4444]">{uploadState.error}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_MIME[mediaType].join(',')} onChange={handleFileChange} className="hidden" />
                  </div>

                  {/* Назва, опис, посилання */}
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                        {t('advertising.form.nameLabel')} <span className="text-[#ef4444]">*</span>
                      </label>
                      <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="input-glass" placeholder={t('advertising.form.namePlaceholder')} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">{t('advertising.form.descLabel')}</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-glass resize-y" placeholder={t('advertising.form.descPlaceholder')} />
                    </div>
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                        <Link2 className="h-4 w-4" />
                        {t('advertising.form.linkLabel')} <span className="text-[#ef4444]">*</span>
                      </label>
                      <input type="url" required value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="input-glass" placeholder={t('advertising.form.linkPlaceholder')} />
                    </div>
                  </div>

                  {/* Геотаргетинг */}
                  <div className="border-t border-[rgba(148,163,184,0.18)] pt-5">
                    <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                      <Globe2 className="h-4 w-4" />
                      {t('advertising.geo.label')}
                    </label>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      {(['global','countries','regions','cities'] as GeoMode[]).map(mode => (
                        <button key={mode} type="button" onClick={() => handleGeoModeChange(mode)}
                          className={'rounded-[18px] border px-4 py-3 text-sm font-bold transition ' + (geoMode === mode
                            ? 'border-[#6366f1] bg-[rgba(99,102,241,0.12)] text-[#6366f1]'
                            : 'border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.45)] text-[#6f665d]')}>
                          {t('advertising.geo.' + mode)}
                        </button>
                      ))}
                    </div>

                    {geoMode !== 'global' && (
                      <div className="mt-5 space-y-4">
                        <CheckboxDropdown
                          title={t('advertising.geo.selectCountries')}
                          options={geoData.map(c => c.name)}
                          selected={selectedCountries}
                          noneText={t('advertising.geo.noneAvailable')}
                          selectedText={t('advertising.geo.selected')}
                          onChange={values => { setSelectedCountries(values); setSelectedRegions([]); setSelectedCities([]) }}
                        />
                        {(geoMode === 'regions' || geoMode === 'cities') && selectedCountries.length > 0 && (
                          <CheckboxDropdown
                            title={t('advertising.geo.selectRegions')}
                            options={availableRegions.map(r => r.name)}
                            selected={selectedRegions}
                            noneText={t('advertising.geo.noneAvailable')}
                            selectedText={t('advertising.geo.selected')}
                            onChange={values => { setSelectedRegions(values); setSelectedCities([]) }}
                          />
                        )}
                        {geoMode === 'cities' && selectedCountries.length > 0 && (
                          <CheckboxDropdown
                            title={t('advertising.geo.selectCities')}
                            options={availableCities}
                            selected={selectedCities}
                            noneText={t('advertising.geo.noneAvailable')}
                            selectedText={t('advertising.geo.selected')}
                            onChange={setSelectedCities}
                          />
                        )}
                      </div>
                    )}

                    {/* Розрахунок ціни */}
                    <div className="mt-5 rounded-[20px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.50)] p-4">
                      <div className="text-sm font-bold text-[#2f2a24]">{t('advertising.price.title')}</div>
                      <div className="mt-3 space-y-1 text-sm text-[#6f665d]">
                        <div>{t('advertising.price.geo')}: <b>{geoSummary}</b></div>
                        <div>{t('advertising.price.cities')}: <b>{selectedCitiesCount}</b></div>
                        <div>{t('advertising.price.positions')}: <b>{selectedSlots.length}</b></div>
                        <div>{t('advertising.price.duration')}: <b>{durationWeeks} {t('advertising.price.week1').replace('1 ', '')}</b></div>
                        <div>{t('advertising.price.perCity')}: <b>{PRICE_PER_CITY_PER_WEEK}€</b></div>
                      </div>

                      <label className="mt-4 block text-sm font-semibold text-[#5f5a54]">{t('advertising.price.durationLabel')}</label>
                      <select value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} className="input-glass mt-2">
                        <option value={1}>{t('advertising.price.week1')}</option>
                        <option value={2}>{t('advertising.price.week2')}</option>
                        <option value={4}>{t('advertising.price.week4')}</option>
                        <option value={12}>{t('advertising.price.week12')}</option>
                      </select>

                      <div className="mt-4 rounded-[18px] bg-[#6366f1] px-4 py-3 text-white">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{t('advertising.price.total')}</div>
                        <div className="mt-1 text-3xl font-extrabold">{totalPrice}€</div>
                      </div>
                    </div>
                  </div>

                  {/* Дати */}
                  <div className="border-t border-[rgba(148,163,184,0.18)] pt-5">
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                      <CalendarRange className="h-4 w-4" />
                      {t('advertising.dates.label')}
                      <span className="text-xs font-normal text-[#9a8776]">({t('advertising.dates.optional')})</span>
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#6f665d]">{t('advertising.dates.startLabel')}</label>
                        <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="input-glass" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#6f665d]">{t('advertising.dates.endLabel')}</label>
                        <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="input-glass" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button type="submit" disabled={saving || uploadState.status === 'uploading'}
                      className="btn-primary rounded-full disabled:cursor-not-allowed disabled:opacity-60">
                      {saving ? t('advertising.submitting') : t('advertising.submit') + ' — ' + totalPrice + '€'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Права колонка */}
          <div className="space-y-6">

            {/* Превью */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">{t('advertising.preview.title')}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665d]">{t('advertising.preview.desc')}</p>

              <a href={linkUrl || '#'} target="_blank" rel="noopener noreferrer"
                onClick={e => !linkUrl && e.preventDefault()}
                className="group mt-5 block overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.36)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
                {mediaUrl && uploadState.status === 'done' ? (
                  mediaType === 'video'
                    ? <video src={mediaUrl} className="h-48 w-full object-cover" muted playsInline loop autoPlay />
                    : <img src={mediaUrl} alt={title || 'Banner'} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,rgba(248,250,252,0.92),rgba(255,247,240,0.92))]">
                    <div className="text-center text-[#8b7e72]">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(148,163,184,0.14)]">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold">{t('advertising.preview.placeholder')}</div>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[rgba(148,163,184,0.12)] px-3 py-1 text-xs font-semibold text-[#64748b]">
                      {t('advertising.preview.adLabel')}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9a8776] transition group-hover:text-[#6366f1]">
                      {selectedSlots.length > 1
                        ? selectedSlots.length + ' ' + t('advertising.preview.positions')
                        : formatSlotLabel(selectedSlots[0], t)}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-extrabold text-[#2f2a24]">
                    {title.trim() || t('advertising.form.namePlaceholder')}
                  </h3>

                  {description.trim() && (
                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">{description.trim()}</p>
                  )}

                  <div className="mt-4 grid gap-2">
                    <PreviewRow label={t('advertising.preview.link')}    value={linkUrl.trim() || 'https://your-site.com'} />
                    <PreviewRow label={t('advertising.preview.geoLabel')} value={geoSummary} />
                    <PreviewRow label={t('advertising.preview.cost')}    value={totalPrice + '€ / ' + durationWeeks + ' wk'} />
                    <PreviewRow label={t('advertising.preview.media')}   value={
                      mediaType === 'image' ? t('advertising.preview.mediaImage') :
                      mediaType === 'gif'   ? t('advertising.preview.mediaGif')   :
                                              t('advertising.preview.mediaVideo')
                    } />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[#9a8776]">{selectedCitiesCount} {t('advertising.preview.citiesCount')}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6366f1] px-3 py-1.5 text-xs font-bold text-white">
                      {t('advertising.preview.goBtn')}
                    </span>
                  </div>
                </div>
              </a>
            </div>

            {/* Поточний стан */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">{t('advertising.status.title')}</h2>
              <div className="mt-5 space-y-3 text-sm text-[#6f665d]">
                <InfoRow text={t('advertising.status.1')} />
                <InfoRow text={t('advertising.status.2')} />
                <InfoRow text={t('advertising.status.3')} />
                <InfoRow text={t('advertising.status.4')} />
              </div>
            </div>

            {/* Мої кампанії */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">{t('advertising.myCampaigns.title')}</h2>

              {!user ? (
                <p className="mt-4 text-sm leading-6 text-[#6f665d]">{t('advertising.myCampaigns.loginMsg')}</p>
              ) : loadingCampaigns ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#6f665d]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(148,163,184,0.3)] border-t-[#64748b]" />
                  {t('advertising.myCampaigns.loading')}
                </div>
              ) : campaigns.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {campaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} formatter={createdAtFormatter} t={t} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#6f665d]">{t('advertising.myCampaigns.empty')}</p>
              )}
            </div>

            {/* Наступний етап */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">{t('advertising.next.title')}</h2>
              <div className="mt-5 space-y-3 text-sm text-[#6f665d]">
                <InfoRow text={t('advertising.next.1')} />
                <InfoRow text={t('advertising.next.2')} />
                <InfoRow text={t('advertising.next.3')} />
                <InfoRow text={t('advertising.next.4')} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Підкомпоненти ──────────────────────────────────────────────────────────────

function CheckboxDropdown({ title, options, selected, noneText, selectedText, onChange }: {
  title:        string
  options:      string[]
  selected:     string[]
  noneText:     string
  selectedText: string
  onChange:     (value: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(i => i !== value) : [...selected, value])
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)} className="input-glass flex items-center justify-between text-left">
        <span>{selected.length > 0 ? title + ': ' + selected.length + ' ' + selectedText : title}</span>
        <ChevronDown className={'h-4 w-4 transition ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-[18px] border border-[rgba(148,163,184,0.2)] bg-white p-2 shadow-xl">
          {options.length > 0 ? options.map(option => (
            <label key={option} className="flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2 text-sm text-[#2f2a24] hover:bg-[rgba(99,102,241,0.08)]">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
              {option}
            </label>
          )) : (
            <div className="px-3 py-2 text-sm text-[#9a8776]">{noneText}</div>
          )}
        </div>
      )}
    </div>
  )
}

function CampaignCard({ campaign, formatter, t }: {
  campaign:        AdCampaign
  formatter:       Intl.DateTimeFormat
  t:               (key: string) => string
}) {
  const data      = campaign as any
  const displayPlacements = (data.placements?.length ? data.placements : [campaign.placement]) as string[]
  const countries  = data.countries  ?? (campaign.country_name ? [campaign.country_name] : [])
  const regions    = data.regions    ?? (campaign.region_name  ? [campaign.region_name]  : [])
  const cities     = data.cities     ?? (campaign.city_name    ? [campaign.city_name]    : [])

  return (
    <div className="rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[#2f2a24]">{campaign.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {displayPlacements.slice(0, 6).map((p: string) => (
              <span key={p} className="rounded-full bg-[rgba(148,163,184,0.12)] px-2 py-0.5 text-xs text-[#64748b]">
                {formatSlotLabel(p, t as (key: import('../lib/i18n').TranslationKey) => string)}
              </span>
            ))}
            {displayPlacements.length > 6 && (
              <span className="rounded-full bg-[rgba(148,163,184,0.12)] px-2 py-0.5 text-xs text-[#64748b]">
                +{displayPlacements.length - 6}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={campaign.status} t={t} />
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-[#6f665d]">
        <p><span className="font-medium text-[#5f5a54]">{t('advertising.myCampaigns.geo')}: </span>
          {getGeoSummary((data.geo_scope ?? 'global') as GeoMode, countries, regions, cities, t)}
        </p>
        <p><span className="font-medium text-[#5f5a54]">{t('advertising.myCampaigns.amount')}: </span>
          {data.price_total ? data.price_total + ' ' + (data.currency ?? 'EUR') : '—'}
        </p>
        <p><span className="font-medium text-[#5f5a54]">{t('advertising.myCampaigns.created')}: </span>
          {campaign.created_at ? formatter.format(new Date(campaign.created_at)) : '—'}
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'rounded-[16px] border border-white/40 bg-[rgba(255,255,255,0.30)] p-3'
          : 'rounded-[24px] border border-white/40 bg-[rgba(255,255,255,0.30)] p-5'
      }
    >
      <div className={compact ? 'text-sm font-extrabold text-[#2f2a24]' : 'text-lg font-extrabold text-[#2f2a24]'}>
        {title}
      </div>
      <p className={compact ? 'mt-1 text-xs leading-5 text-[#6f665d]' : 'mt-2 text-sm leading-6 text-[#6f665d]'}>
        {text}
      </p>
    </div>
  )
}

function StepRow({
  number,
  title,
  text,
  compact = false,
}: {
  number: string
  title: string
  text: string
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'rounded-[14px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-2.5'
          : 'rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4'
      }
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8776]">{number}</div>
      <div className={compact ? 'mt-0.5 text-sm font-extrabold text-[#2f2a24]' : 'mt-1 text-base font-extrabold text-[#2f2a24]'}>
        {title}
      </div>
      <p className={compact ? 'mt-1 text-xs leading-5 text-[#6f665d]' : 'mt-2 text-sm leading-6 text-[#6f665d]'}>
        {text}
      </p>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.42)] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8776]">{label}</div>
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

function StatusBadge({ status, t }: { status: string | null | undefined; t: (k: string) => string }) {
  const s = status ?? 'draft'
  const styles: Record<string, string> = {
    draft:           'bg-[rgba(148,163,184,0.14)] text-[#475569]',
    pending_payment: 'bg-[rgba(99,102,241,0.14)] text-[#4f46e5]',
    pending_review:  'bg-[rgba(245,158,11,0.14)] text-[#b45309]',
    active:          'bg-[rgba(34,197,94,0.14)] text-[#15803d]',
    paused:          'bg-[rgba(100,116,139,0.14)] text-[#475569]',
    rejected:        'bg-[rgba(239,68,68,0.14)] text-[#b91c1c]',
    expired:         'bg-[rgba(148,163,184,0.14)] text-[#64748b]',
    deleted:         'bg-[rgba(148,163,184,0.14)] text-[#64748b]',
  }
  return (
    <span className={'inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ' + (styles[s] ?? styles.draft)}>
      {t('advertising.status.' + s)}
    </span>
  )
}

// Зведений підпис географії (локалізований)
function getGeoSummary(geoMode: GeoMode, countries: string[], regions: string[], cities: string[], t: (k: string) => string): string {
  if (geoMode === 'global')    return t('advertising.geo.worldwide') + ' · ' + cities.length + ' ' + t('advertising.geo.citiesCount')
  if (geoMode === 'countries') return countries.length === 0 ? t('advertising.geo.noCountries') : countries.join(', ') + ' · ' + cities.length + ' ' + t('advertising.geo.citiesCount')
  if (geoMode === 'regions')   return regions.length  === 0 ? t('advertising.geo.noRegions')   : regions.join(', ')  + ' · ' + cities.length + ' ' + t('advertising.geo.citiesCount')
  return cities.length === 0 ? t('advertising.geo.noCities') : cities.join(', ')
}