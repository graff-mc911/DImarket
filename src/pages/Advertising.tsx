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
// Всі тексти локалізовані через t() — підтримує 25 мов.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarRange,
  ChevronDown,
  Film,
  Globe2,
  ImagePlus,
  Link2,
  LogIn,
  MapPin,
  Megaphone,
  Pencil,
  Play,
  type LucideIcon,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { navigateTo }  from '../lib/navigation'
import { useApp }      from '../contexts/AppContext'
import { AdCampaign }  from '../lib/types'
import { createCheckoutSession, eurosToCents } from '../lib/stripe'
import { AdPlacementSitePreview } from '../components/AdPlacementSitePreview'
import { AdGeoTargeting } from '../components/AdGeoTargeting'
import { sanitizeSlotsForPurchase } from '../lib/adPlacementCatalog'
import { AdPerSlotMediaEditor } from '../components/ads/AdPerSlotMediaEditor'
import { AdImageAdaptPanel } from '../components/ads/AdImageAdaptPanel'
import { mediaStateFromCampaign } from '../lib/adCampaignMedia'
import {
  buildFullCampaignMediaFields,
  ensureSlotMediaForSelection,
  selectedSlotsHaveMedia,
  slotMediaMapFromCampaign,
  type SlotMediaMap,
} from '../lib/adSlotMedia'
import { AdCampaignDraftPreview, AdCopyField } from '../components/AdCopyFields'
import { DEFAULT_AD_MEDIA_STYLE, type AdMediaStyle } from '../lib/adMediaStyle'
import {
  allCitiesFromCatalog,
  billingCityUnits,
  fetchAdGeoCatalog,
  isGeoSelectionValid,
  resolveTargetCities,
  type AdGeoCountry,
  type GeoMode,
} from '../lib/adGeoCatalog'
import { isSiteOwner } from '../lib/siteOwner'
import { ownerManagedReviewNote } from '../lib/ownerAdCampaign'
import { formatSupabaseError } from '../lib/supabaseErrors'
import {
  formatSlotLabel,
  sideSlotId,
  slotToLegacyPlacement,
  type AdPageKey,
} from '../lib/adPlacementSlots'

// ── Типи ──────────────────────────────────────────────────────────────────────
type MediaType      = 'image' | 'gif' | 'video'
type FeedbackState = { type: 'success' | 'error'; text: string }
// ── Константи ──────────────────────────────────────────────────────────────────

const PRICE_PER_CITY_PER_WEEK = 25

function pageKeyFromSlots(slots: string[]): AdPageKey {
  for (const p of ['home', 'listings', 'professionals', 'default'] as AdPageKey[]) {
    if (slots.some((id) => id.startsWith(`${p}_`))) return p
  }
  return 'home'
}

// ── Головний компонент ─────────────────────────────────────────────────────────

export function Advertising() {
  const { user, profile, t } = useApp()

  // Поля форми
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl]         = useState('')
  const [startsAt, setStartsAt]       = useState('')
  const [endsAt, setEndsAt]           = useState('')

  // Гранульовані слоти показу (мінімум один)
  const [selectedSlots, setSelectedSlots] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('dimarket_ad_preset_slots')
      if (raw) {
        sessionStorage.removeItem('dimarket_ad_preset_slots')
        return sanitizeSlotsForPurchase(JSON.parse(raw) as string[])
      }
    } catch { /* ignore */ }
    return [sideSlotId('home', 'right', 1)]
  })
  const [placementPreviewPage, setPlacementPreviewPage] = useState<AdPageKey>('home')

  const handleSlotsChange = useCallback((slots: string[]) => {
    const clean = sanitizeSlotsForPurchase(slots)
    setSelectedSlots(clean)
    setSlotMedia((prev) => ensureSlotMediaForSelection(clean, prev))
    setPlacementPreviewPage(pageKeyFromSlots(clean))
  }, [])

  // Геотаргетинг
  const [geoMode, setGeoMode]                   = useState<GeoMode>('global')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions]     = useState<string[]>([])
  const [selectedCities, setSelectedCities]       = useState<string[]>([])
  const [durationWeeks, setDurationWeeks]         = useState(1)

  // Медіа
  const [mediaType, setMediaType]   = useState<MediaType>('image')
  const [mediaUrl, setMediaUrl]     = useState('')
  const [slideUrls, setSlideUrls]   = useState<string[]>([])
  const [mediaStyle, setMediaStyle] = useState<AdMediaStyle>(DEFAULT_AD_MEDIA_STYLE)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [slotMedia, setSlotMedia] = useState<SlotMediaMap>({})

  const hasBannerMedia = Boolean(mediaUrl.trim() || slideUrls.length)

  // Географія з бази — завантажується автоматично
  const [geoData, setGeoData] = useState<AdGeoCountry[]>([])
  const [geoLoading, setGeoLoading] = useState(true)

  // Кампанії
  const [campaigns, setCampaigns]               = useState<AdCampaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [saving, setSaving]                     = useState(false)
  const [feedback, setFeedback]                 = useState<FeedbackState | null>(null)

  const createdAtFormatter = useMemo(() =>
    new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }), [])

  const targetCities = useMemo(
    () => resolveTargetCities(geoMode, geoData, selectedCountries, selectedRegions, selectedCities),
    [geoMode, geoData, selectedCountries, selectedRegions, selectedCities],
  )

  const billingUnits = useMemo(
    () => billingCityUnits(geoMode, geoData, targetCities),
    [geoMode, geoData, targetCities],
  )

  const catalogCityCount = useMemo(() => allCitiesFromCatalog(geoData).length, [geoData])

  const totalPrice = billingUnits * PRICE_PER_CITY_PER_WEEK * selectedSlots.length * durationWeeks

  const ownerAccount = useMemo(
    () => isSiteOwner(profile, user?.email),
    [profile, user?.email],
  )

  // Завантажуємо географію з бази при старті
  useEffect(() => {
    void loadGeoData()
  }, [])

  // Завантажуємо кампанії при авторизації
  useEffect(() => {
    if (user) void loadOwnCampaigns()
    else setCampaigns([])
  }, [user])

  const loadGeoData = async () => {
    setGeoLoading(true)
    try {
      const result = await fetchAdGeoCatalog()
      setGeoData(result)
    } catch (e) {
      console.error('Помилка завантаження географії:', e)
      setGeoData([])
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
    if (mode === 'global') {
      setSelectedCountries([])
      setSelectedRegions([])
      setSelectedCities([])
      return
    }
    if (mode === 'countries') {
      setSelectedRegions([])
      setSelectedCities([])
      return
    }
    if (mode === 'regions') {
      setSelectedCities([])
      return
    }
    // cities: зберегти країни та регіони
  }

  const toLocalInput = (iso: string | null | undefined): string => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const loadCampaignIntoForm = (campaign: AdCampaign) => {
    const data = campaign as AdCampaign & {
      placements?: string[]
      geo_scope?: GeoMode
      countries?: string[]
      cities?: string[]
      regions?: string[]
    }
    setEditingCampaignId(campaign.id)
    setTitle(campaign.title)
    setDescription(campaign.description || '')
    setLinkUrl(campaign.link_url)
    const slots =
      data.placements && data.placements.length > 0
        ? sanitizeSlotsForPurchase(data.placements)
        : [sideSlotId('home', 'right', 1)]
    setSelectedSlots(slots)
    setSlotMedia(slotMediaMapFromCampaign(campaign as AdCampaign & { slot_media?: unknown }))
    setPlacementPreviewPage(pageKeyFromSlots(slots))
    const media = mediaStateFromCampaign(campaign)
    setMediaUrl(media.mediaUrl)
    setSlideUrls(media.slideUrls)
    setMediaStyle(media.mediaStyle)
    setMediaType(media.mediaType)
    setGeoMode((data.geo_scope as GeoMode) || 'global')
    setSelectedCountries(data.countries ?? [])
    setSelectedRegions(data.regions ?? [])
    setSelectedCities(data.cities ?? [])
    setStartsAt(toLocalInput(campaign.starts_at))
    setEndsAt(toLocalInput(campaign.ends_at))
    setFeedback(null)
    document.getElementById('ad-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingCampaignId(null)
    setTitle(''); setDescription(''); setLinkUrl('')
    setSelectedSlots([sideSlotId('home', 'right', 1)])
    setSlotMedia({})
    setPlacementPreviewPage('home')
    setGeoMode('global'); setSelectedCountries([]); setSelectedRegions([]); setSelectedCities([])
    setDurationWeeks(1)
    setMediaType('image')
    setMediaUrl('')
    setSlideUrls([])
    setMediaStyle(DEFAULT_AD_MEDIA_STYLE)
    setStartsAt(''); setEndsAt('')
  }

  const ensureAdvertiserProfile = async () => {
    if (!user) return
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name:
          profile?.full_name ??
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split('@')[0] ??
          'Advertiser',
      },
      { onConflict: 'id' },
    )
    if (error) throw error
  }

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user)          { setFeedback({ type: 'error', text: t('advertising.error.noAuth') }); return }
    const fallbackMedia = {
      mediaUrl,
      slideUrls,
      mediaStyle,
      mediaType,
    }
    if (!selectedSlotsHaveMedia(slotMedia, selectedSlots, fallbackMedia)) {
      setFeedback({ type: 'error', text: t('advertising.error.noMedia') })
      return
    }
    if (!linkUrl.trim()){ setFeedback({ type: 'error', text: t('advertising.error.noLink') }); return }
    if (!isGeoSelectionValid(geoMode, selectedCountries, selectedRegions, selectedCities)) {
      setFeedback({ type: 'error', text: t('advertising.error.noGeo') })
      return
    }
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      setFeedback({ type: 'error', text: t('advertising.dates.error') }); return
    }

    setSaving(true); setFeedback(null)

    try {
      await ensureAdvertiserProfile()

      const now       = new Date()
      const startDate = startsAt ? new Date(startsAt) : now
      const endDate   = endsAt
        ? new Date(endsAt)
        : new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)

      const campaignStatus = ownerAccount ? 'active' : 'pending_payment'
      const nowIso = now.toISOString()
      const mediaFields = buildFullCampaignMediaFields(
        ensureSlotMediaForSelection(selectedSlots, slotMedia),
        selectedSlots,
        fallbackMedia,
      )

      const row = {
        title:       title.trim(),
        description: description.trim() || null,
        link_url:    linkUrl.trim(),
        placement:   slotToLegacyPlacement(selectedSlots[0]),
        placements:  selectedSlots,
        geo_scope:   geoMode,
        countries:   selectedCountries,
        cities:      targetCities,
        country_name: selectedCountries[0] ?? null,
        city_name:   targetCities[0] ?? null,
        country_code: null,
        region_name: selectedRegions.length > 0 ? selectedRegions.join(', ') : null,
        ...mediaFields,
        starts_at:   startDate.toISOString(),
        ends_at:     endDate.toISOString(),
        updated_at:  nowIso,
      }

      if (editingCampaignId) {
        const { error } = await supabase
          .from('ad_campaigns')
          .update(row)
          .eq('id', editingCampaignId)
          .eq('advertiser_id', user.id)
        if (error) throw error
        setFeedback({ type: 'success', text: t('advertising.successUpdated') })
        resetForm()
        await loadOwnCampaigns()
        setSaving(false)
        return
      }

      const { error } = await supabase.from('ad_campaigns').insert({
        advertiser_id: user.id,
        ...row,
        status: campaignStatus,
        ...(ownerAccount
          ? {
              approved_by: user.id,
              approved_at: nowIso,
              price_paid: 0,
              currency_paid: 'eur',
              review_note: ownerManagedReviewNote('from /advertising'),
            }
          : {}),
      })

      if (error) throw error

      if (ownerAccount) {
        setFeedback({ type: 'success', text: t('advertising.successOwner') })
        resetForm()
        await loadOwnCampaigns()
        setSaving(false)
        return
      }

      const { data: newCampaign } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('advertiser_id', user.id)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const stripeResult = await createCheckoutSession({
        payment_type: 'ad_campaign',
        reference_id: newCampaign?.id || '',
        user_id:      user.id,
        amount:       eurosToCents(totalPrice),
        currency:     'eur',
        description:  'DImarket реклама: ' + title.trim(),
      })

      window.location.href = stripeResult.url

    } catch (err) {
      console.error('Помилка:', err)
      setFeedback({
        type: 'error',
        text: formatSupabaseError(err, t('advertising.error.save')),
      })
      setSaving(false)
    }
  }

  const geoSummary = getGeoSummary(geoMode, selectedCountries, selectedRegions, targetCities, billingUnits, t)

  return (
    <div className="py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl">

        {/* ===== Hero секція (компактна ~50% висоти) ===== */}
        <section className="glass-panel p-4 md:p-5">
          <div>
            <div>
              <div className="eyebrow px-3 py-1 text-xs">
                <Megaphone className="h-3.5 w-3.5" />
                <span>{t('advertising.selfService.eyebrow')}</span>
              </div>

              <h1 className="mt-2 max-w-4xl text-2xl font-extrabold tracking-tight text-[#2f2a24] md:text-3xl">
                {t('advertising.selfService.title')}
              </h1>

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
              <div className="mt-5 space-y-6">
                <div className="rounded-[22px] border border-white/40 bg-[rgba(255,255,255,0.18)] p-4 md:p-5">
                  <h3 className="text-sm font-extrabold text-[#2f2a24]">{t('advertising.catalog.previewTitle')}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#6f665d]">{t('advertising.catalog.previewDesc')}</p>
                  <div className="mt-4">
                    <AdPlacementSitePreview
                      selected={selectedSlots}
                      onChange={handleSlotsChange}
                      page={placementPreviewPage}
                      onPageChange={setPlacementPreviewPage}
                      draftMediaUrl={hasBannerMedia ? slideUrls[0] || mediaUrl.trim() : null}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Форма нової кампанії ===== */}
            <div id="ad-form" className="glass-card p-6">
              <h2 className="text-2xl font-extrabold text-[#2f2a24]">
                {editingCampaignId ? t('advertising.form.editTitle') : t('advertising.form.title')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                {editingCampaignId ? t('advertising.form.editDesc') : t('advertising.form.desc')}
              </p>

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

                  <div className="rounded-[22px] border border-white/40 bg-[rgba(255,255,255,0.18)] p-4 md:p-5">
                    <AdPerSlotMediaEditor
                      selectedSlots={selectedSlots}
                      slotMedia={slotMedia}
                      onSlotMediaChange={setSlotMedia}
                      fallbackMediaUrl={mediaUrl}
                      fallbackSlideUrls={slideUrls}
                      fallbackMediaType={mediaType}
                      fallbackMediaStyle={mediaStyle}
                      onFallbackMediaUrl={setMediaUrl}
                      onFallbackSlideUrls={setSlideUrls}
                      onFallbackMediaType={setMediaType}
                      onFallbackMediaStyle={setMediaStyle}
                    />
                  </div>

                  {/* Назва, опис, посилання — у стилі карток застосунку */}
                  <div className="grid gap-3">
                    <AdCopyField
                      icon={<Megaphone className="h-4 w-4" />}
                      label={t('advertising.form.nameLabel')}
                      required
                    >
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="input-glass"
                        placeholder={t('advertising.form.namePlaceholder')}
                      />
                    </AdCopyField>

                    <AdCopyField
                      icon={<Building2 className="h-4 w-4" />}
                      label={t('advertising.form.descLabel')}
                    >
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        className="input-glass min-h-[5.5rem] resize-y"
                        placeholder={t('advertising.form.descPlaceholder')}
                      />
                    </AdCopyField>

                    <AdCopyField
                      icon={<Link2 className="h-4 w-4" />}
                      label={t('advertising.form.linkLabel')}
                      required
                    >
                      <input
                        type="url"
                        required
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        className="input-glass"
                        placeholder={t('advertising.form.linkPlaceholder')}
                      />
                    </AdCopyField>
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

                    {geoLoading ? (
                      <p className="mt-3 text-sm text-[#6f665d]">{t('advertising.geo.loading')}</p>
                    ) : geoData.length === 0 ? (
                      <p className="mt-3 text-sm text-[#b45309]">{t('advertising.geo.loadFailed')}</p>
                    ) : (
                      <p className="mt-3 text-xs text-[#9a8776]">
                        {t('advertising.geo.catalogHint').replace('{countries}', String(geoData.length)).replace('{cities}', String(catalogCityCount))}
                      </p>
                    )}

                    {geoMode === 'global' && !geoLoading && geoData.length > 0 && (
                      <p className="mt-3 text-sm text-[#6f665d]">{t('advertising.geo.globalHint')}</p>
                    )}

                    {geoMode !== 'global' && (
                      <div className="mt-5">
                        <AdGeoTargeting
                          geoMode={geoMode}
                          geoData={geoData}
                          selectedCountries={selectedCountries}
                          selectedRegions={selectedRegions}
                          selectedCities={selectedCities}
                          onCountriesChange={(values) => {
                            setSelectedCountries(values)
                            if (geoMode === 'countries') {
                              setSelectedRegions([])
                              setSelectedCities([])
                            }
                          }}
                          onRegionsChange={setSelectedRegions}
                          onCitiesChange={setSelectedCities}
                        />
                      </div>
                    )}

                    {/* Розрахунок ціни */}
                    <div className="mt-5 rounded-[20px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.50)] p-4">
                      <div className="text-sm font-bold text-[#2f2a24]">{t('advertising.price.title')}</div>
                      <div className="mt-3 space-y-1 text-sm text-[#6f665d]">
                        <div>{t('advertising.price.geo')}: <b>{geoSummary}</b></div>
                        <div>{t('advertising.price.cities')}: <b>{billingUnits}</b></div>
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
                    {editingCampaignId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="btn-secondary rounded-full"
                      >
                        {t('advertising.form.cancelEdit')}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? t('advertising.submitting')
                        : editingCampaignId
                          ? t('advertising.form.saveChanges')
                          : ownerAccount
                            ? t('advertising.submitOwner')
                            : t('advertising.submit') + ' — ' + totalPrice + '€'}
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

              <div className="mt-5 flex flex-col items-center gap-4">
                {user && (mediaType === 'image' || mediaType === 'gif') && (
                  <AdImageAdaptPanel userId={user.id} />
                )}
                <AdCampaignDraftPreview
                  title={title}
                  description={description}
                  linkUrl={linkUrl}
                  mediaUrl={mediaUrl}
                  mediaType={mediaType}
                  mediaReady={hasBannerMedia}
                  placeholderTitle={t('advertising.preview.placeholder')}
                  mediaStyle={mediaStyle}
                  slideUrls={slideUrls}
                />

                <div className="glass-card w-full max-w-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-500)]">
                    {selectedSlots.length > 1
                      ? selectedSlots.length + ' ' + t('advertising.preview.positions')
                      : formatSlotLabel(selectedSlots[0], t)}
                  </p>
                  <div className="mt-3 grid gap-2">
                    <PreviewRow label={t('advertising.preview.link')} value={linkUrl.trim() || 'https://your-site.com'} />
                    <PreviewRow label={t('advertising.preview.geoLabel')} value={geoSummary} />
                    <PreviewRow label={t('advertising.preview.cost')} value={totalPrice + '€ / ' + durationWeeks + ' wk'} />
                    <PreviewRow
                      label={t('advertising.preview.media')}
                      value={
                        mediaType === 'image'
                          ? t('advertising.preview.mediaImage')
                          : mediaType === 'gif'
                            ? t('advertising.preview.mediaGif')
                            : t('advertising.preview.mediaVideo')
                      }
                    />
                  </div>
                  <p className="muted-text mt-3 text-[11px]">
                    {billingUnits} {t('advertising.preview.citiesCount')}
                  </p>
                </div>
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
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      formatter={createdAtFormatter}
                      t={t}
                      onEdit={() => loadCampaignIntoForm(campaign)}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#6f665d]">{t('advertising.myCampaigns.empty')}</p>
              )}
            </div>

          </div>
        </section>
      </div>
    </div>
  )
}

// ── Підкомпоненти ──────────────────────────────────────────────────────────────

function CampaignCard({ campaign, formatter, t, onEdit }: {
  campaign:        AdCampaign
  formatter:       Intl.DateTimeFormat
  t:               (key: string) => string
  onEdit:          () => void
}) {
  const data      = campaign as any
  const displayPlacements = (data.placements?.length ? data.placements : [campaign.placement]) as string[]
  const countries  = data.countries  ?? (campaign.country_name ? [campaign.country_name] : [])
  const regions    = data.regions    ?? (campaign.region_name  ? [campaign.region_name]  : [])
  const cities     = data.cities     ?? (campaign.city_name    ? [campaign.city_name]    : [])

  return (
    <div className="glass-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold tracking-[-0.02em] text-[var(--ink-900)]">{campaign.title}</h3>
          {campaign.description?.trim() && (
            <p className="muted-text mt-1 line-clamp-2 text-[11px] leading-snug">{campaign.description}</p>
          )}
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
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={campaign.status} t={t} />
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(99,102,241,0.12)] px-3 py-1.5 text-xs font-semibold text-[#4338ca]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('advertising.myCampaigns.edit')}
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-[#6f665d]">
        <p><span className="font-medium text-[#5f5a54]">{t('advertising.myCampaigns.geo')}: </span>
          {getGeoSummary((data.geo_scope ?? 'global') as GeoMode, countries, regions, cities, undefined, t)}
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

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[var(--glass-border)] bg-[rgba(255,248,241,0.34)] px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-500)]">{label}</span>
      <span className="truncate text-right text-xs font-semibold text-[var(--ink-900)]">{value}</span>
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
function getGeoSummary(
  geoMode: GeoMode,
  countries: string[],
  regions: string[],
  cities: string[],
  billingUnits: number | undefined,
  t: (k: string) => string,
): string {
  const cityCount = geoMode === 'global' ? (billingUnits ?? Math.max(cities.length, 1)) : cities.length
  if (geoMode === 'global') return t('advertising.geo.worldwide') + ' · ' + cityCount + ' ' + t('advertising.geo.citiesCount')
  if (geoMode === 'countries') return countries.length === 0 ? t('advertising.geo.noCountries') : countries.join(', ') + ' · ' + cityCount + ' ' + t('advertising.geo.citiesCount')
  if (geoMode === 'regions')   return regions.length  === 0 ? t('advertising.geo.noRegions')   : regions.join(', ')  + ' · ' + cityCount + ' ' + t('advertising.geo.citiesCount')
  return cities.length === 0 ? t('advertising.geo.noCities') : cities.join(', ')
}