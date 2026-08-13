import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdPerSlotMediaEditor } from './ads/AdPerSlotMediaEditor'
import { AdGeoTargeting } from './AdGeoTargeting'
import { AdCampaignDraftPreview } from './AdCopyFields'
import {
  emptyCampaignMediaState,
  mediaStateFromCampaign,
  type AdCampaignMediaState,
} from '../lib/adCampaignMedia'
import { DEFAULT_AD_MEDIA_STYLE, type AdMediaStyle } from '../lib/adMediaStyle'
import {
  formatSlotLabel,
  centerSlotId,
} from '../lib/adPlacementSlots'
import { editorPageFromSlots, type PlacementEditorPageId } from '../lib/adPlacementPages'
import { formatSupabaseError } from '../lib/supabaseErrors'
import {
  buildOwnerCampaignPayload,
  campaignToOwnerForm,
  getOwnerCampaignGeoLabel,
  getOwnerCampaignScheduleLabel,
  isOwnerCampaignExpiredInSchedule,
  isOwnerManagedCampaign,
  ownerManagedReviewNote,
  OWNER_SLOT_PRESETS,
  toOwnerLocalInput,
  type OwnerAdFormValues,
} from '../lib/ownerAdCampaign'
import {
  clearOwnerAdFormDraft,
  ownerAdDraftHasUnsavedContent,
  readOwnerAdFormDraft,
  readOwnerAdsUrlState,
  syncOwnerAdsUrlState,
  writeOwnerAdFormDraft,
  type OwnerAdFormDraft,
} from '../lib/ownerAdFormDraft'
import {
  fallbackAdGeoCatalog,
  fetchAdGeoCatalog,
  isGeoSelectionValid,
  resolveTargetCities,
  type AdGeoCountry,
  type GeoMode,
} from '../lib/adGeoCatalog'
import type { AdCampaign } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { isDemoAdCampaign } from '../lib/demoAdCampaigns'
import {
  ensureSlotMediaForSelection,
  selectedSlotsHaveMedia,
  slotMediaMapFromCampaign,
  type SlotMediaMap,
} from '../lib/adSlotMedia'

type OwnerAdManagerProps = {
  ownerId: string
  campaigns: AdCampaign[]
  onRefresh: () => Promise<void>
  onNotice: (text: string) => void
  onError: (text: string) => void
  campaignActionId: string | null
  setCampaignActionId: (id: string | null) => void
}

const EMPTY_FORM: OwnerAdFormValues = {
  title: '',
  description: '',
  linkUrl: '',
  mediaUrl: '',
  mediaType: 'image',
  selectedSlots: [centerSlotId('home')],
  geoScope: 'global',
  selectedCountries: [],
  selectedRegions: [],
  selectedCities: [],
  status: 'active',
  startsAt: '',
  endsAt: '',
}

export function OwnerAdManager({
  ownerId,
  campaigns,
  onRefresh,
  onNotice,
  onError,
  campaignActionId,
  setCampaignActionId,
}: OwnerAdManagerProps) {
  const { t } = useApp()
  const { refresh: refreshPublicAds } = usePaidAds()
  const draftHydratedRef = useRef(false)
  const skipPersistRef = useRef(true)
  const pendingScrollToFormRef = useRef(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OwnerAdFormValues>(EMPTY_FORM)
  const [mediaUrl, setMediaUrl] = useState('')
  const [slideUrls, setSlideUrls] = useState<string[]>([])
  const [mediaStyle, setMediaStyle] = useState<AdMediaStyle>(DEFAULT_AD_MEDIA_STYLE)
  const [bannerMediaType, setBannerMediaType] = useState<AdCampaignMediaState['mediaType']>('image')
  const [saving, setSaving] = useState(false)
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )
  const [placementPreviewPage, setPlacementPreviewPage] = useState<PlacementEditorPageId>('home')
  const [slotMedia, setSlotMedia] = useState<SlotMediaMap>({})
  const [geoData, setGeoData] = useState<AdGeoCountry[]>([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [draftBanner, setDraftBanner] = useState<OwnerAdFormDraft | null>(null)

  const reportError = (text: string) => {
    setFormFeedback({ type: 'error', text })
    onError(text)
  }

  const reportNotice = (text: string) => {
    setFormFeedback({ type: 'success', text })
    onNotice(text)
  }

  useEffect(() => {
    let cancelled = false
    setGeoLoading(true)
    void fetchAdGeoCatalog()
      .then((data) => {
        if (!cancelled) setGeoData(data.length > 0 ? data : fallbackAdGeoCatalog())
      })
      .catch(() => {
        if (!cancelled) setGeoData(fallbackAdGeoCatalog())
      })
      .finally(() => {
        if (!cancelled) setGeoLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function previewEditorPageFromSlots(slots: string[]): PlacementEditorPageId {
    return editorPageFromSlots(slots)
  }

  const ownerCampaigns = useMemo(
    () => campaigns.filter((c) => !isDemoAdCampaign(c)),
    [campaigns],
  )
  const demoCampaigns = useMemo(() => campaigns.filter(isDemoAdCampaign), [campaigns])

  const editingCampaign = useMemo(
    () => ownerCampaigns.find((c) => c.id === editingId) ?? null,
    [ownerCampaigns, editingId],
  )

  const applyMediaState = (state: AdCampaignMediaState) => {
    setMediaUrl(state.mediaUrl)
    setSlideUrls(state.slideUrls)
    setMediaStyle(state.mediaStyle)
    setBannerMediaType(state.mediaType)
    setForm((prev) => ({
      ...prev,
      mediaUrl: state.mediaUrl,
      mediaType: state.mediaType,
    }))
  }

  const applyDraftToForm = (draft: OwnerAdFormDraft) => {
    skipPersistRef.current = true
    setEditingId(draft.editingId)
    setForm(draft.form)
    setPlacementPreviewPage(draft.placementPreviewPage)
    setSlotMedia(draft.slotMedia)
    applyMediaState({
      mediaUrl: draft.mediaUrl,
      slideUrls: draft.slideUrls,
      mediaStyle: draft.mediaStyle,
      mediaType: draft.bannerMediaType,
    })
    setFormOpen(draft.formOpen)
    setFormFeedback(null)
    if (draft.formOpen) pendingScrollToFormRef.current = true
    window.setTimeout(() => {
      skipPersistRef.current = false
    }, 0)
  }

  // Restore composer from sessionStorage + URL (?ads=create|edit)
  useEffect(() => {
    if (draftHydratedRef.current) return
    draftHydratedRef.current = true

    const urlState = readOwnerAdsUrlState()
    const draft = readOwnerAdFormDraft(ownerId)

    if (draft?.formOpen) {
      applyDraftToForm(draft)
      setDraftBanner(null)
      syncOwnerAdsUrlState({ formOpen: true, editingId: draft.editingId })
      skipPersistRef.current = false
      return
    }

    if (urlState.formOpen) {
      if (urlState.editingId) {
        const campaign = campaigns.find((c) => c.id === urlState.editingId)
        if (campaign) {
          skipPersistRef.current = true
          setEditingId(campaign.id)
          const nextForm = campaignToOwnerForm(campaign)
          setForm(nextForm)
          setPlacementPreviewPage(previewEditorPageFromSlots(nextForm.selectedSlots))
          setSlotMedia(slotMediaMapFromCampaign(campaign))
          applyMediaState(mediaStateFromCampaign(campaign))
          setFormFeedback(null)
          setFormOpen(true)
          pendingScrollToFormRef.current = true
          window.setTimeout(() => {
            skipPersistRef.current = false
          }, 0)
        } else {
          // Campaign list not loaded yet — keep URL; retry when campaigns arrive
          draftHydratedRef.current = false
        }
      } else {
        skipPersistRef.current = true
        setEditingId(null)
        setForm({ ...EMPTY_FORM, startsAt: toOwnerLocalInput(new Date().toISOString()) })
        setPlacementPreviewPage('home')
        setSlotMedia({})
        applyMediaState(emptyCampaignMediaState())
        setFormFeedback(null)
        setFormOpen(true)
        pendingScrollToFormRef.current = true
        window.setTimeout(() => {
          skipPersistRef.current = false
        }, 0)
      }
      setDraftBanner(null)
      return
    }

    if (draft && ownerAdDraftHasUnsavedContent(draft)) {
      setDraftBanner(draft)
    }
    skipPersistRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, campaigns])

  // Autosave open composer (URLs only — no File blobs / secrets)
  useEffect(() => {
    if (skipPersistRef.current || !draftHydratedRef.current) return
    syncOwnerAdsUrlState({ formOpen, editingId })
    if (!formOpen) {
      clearOwnerAdFormDraft()
      return
    }
    const tmr = window.setTimeout(() => {
      writeOwnerAdFormDraft({
        ownerId,
        formOpen,
        editingId,
        form,
        mediaUrl,
        slideUrls,
        mediaStyle,
        bannerMediaType,
        slotMedia,
        placementPreviewPage,
      })
    }, 300)
    return () => window.clearTimeout(tmr)
  }, [
    ownerId,
    formOpen,
    editingId,
    form,
    mediaUrl,
    slideUrls,
    mediaStyle,
    bannerMediaType,
    slotMedia,
    placementPreviewPage,
  ])

  // After restore, scroll the composer into view (not the page footer).
  useEffect(() => {
    if (!formOpen || !pendingScrollToFormRef.current) return
    pendingScrollToFormRef.current = false
    const el = document.getElementById('owner-ad-form')
    if (!el) return
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'auto', block: 'start' })
      html.style.scrollBehavior = prev
    })
  }, [formOpen])

  const openCreate = () => {
    setDraftBanner(null)
    setEditingId(null)
    setForm({ ...EMPTY_FORM, startsAt: toOwnerLocalInput(new Date().toISOString()) })
    setPlacementPreviewPage('home')
    setSlotMedia({})
    applyMediaState(emptyCampaignMediaState())
    setFormFeedback(null)
    setFormOpen(true)
    pendingScrollToFormRef.current = true
    syncOwnerAdsUrlState({ formOpen: true, editingId: null })
  }

  const openEdit = (campaign: AdCampaign) => {
    setDraftBanner(null)
    setEditingId(campaign.id)
    const nextForm = campaignToOwnerForm(campaign)
    setForm(nextForm)
    setPlacementPreviewPage(previewEditorPageFromSlots(nextForm.selectedSlots))
    setSlotMedia(slotMediaMapFromCampaign(campaign))
    applyMediaState(mediaStateFromCampaign(campaign))
    setFormFeedback(null)
    setFormOpen(true)
    pendingScrollToFormRef.current = true
    syncOwnerAdsUrlState({ formOpen: true, editingId: campaign.id })
  }

  const closeForm = (opts?: { keepFeedback?: boolean }) => {
    skipPersistRef.current = true
    clearOwnerAdFormDraft()
    setDraftBanner(null)
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    if (!opts?.keepFeedback) setFormFeedback(null)
    applyMediaState(emptyCampaignMediaState())
    syncOwnerAdsUrlState({ formOpen: false, editingId: null })
    window.setTimeout(() => {
      skipPersistRef.current = false
    }, 0)
  }

  const continueDraft = () => {
    if (!draftBanner) return
    applyDraftToForm(draftBanner)
    setDraftBanner(null)
    syncOwnerAdsUrlState({ formOpen: true, editingId: draftBanner.editingId })
  }

  const discardDraft = () => {
    clearOwnerAdFormDraft()
    setDraftBanner(null)
    syncOwnerAdsUrlState({ formOpen: false, editingId: null })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      reportError('Вкажіть назву реклами')
      return
    }
    const mediaState: AdCampaignMediaState = {
      mediaUrl,
      slideUrls,
      mediaStyle,
      mediaType: bannerMediaType,
    }
    if (!selectedSlotsHaveMedia(slotMedia, form.selectedSlots, mediaState)) {
      reportError('Додайте зображення хоча б для одного банера або базове медіа')
      return
    }
    if (!form.linkUrl.trim()) {
      reportError('Вкажіть посилання')
      return
    }
    if (form.selectedSlots.length === 0) {
      reportError('Оберіть хоча б один блок для показу')
      return
    }
    if (
      !isGeoSelectionValid(
        form.geoScope,
        form.selectedCountries,
        form.selectedRegions,
        form.selectedCities,
      )
    ) {
      reportError('Оберіть географію показу реклами')
      return
    }
    if (form.startsAt && form.endsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
      reportError('Дата завершення не може бути раніше початку')
      return
    }

    setSaving(true)
    setFormFeedback(null)
    try {
      const targetCities = resolveTargetCities(
        form.geoScope,
        geoData,
        form.selectedCountries,
        form.selectedRegions,
        form.selectedCities,
      )
      const payload = buildOwnerCampaignPayload(
        { ...form, slotMedia: ensureSlotMediaForSelection(form.selectedSlots, slotMedia) },
        ownerId,
        editingCampaign,
        mediaState,
        targetCities,
      )

      if (editingId) {
        const { error } = await (supabase.from('ad_campaigns') as any).update(payload).eq('id', editingId)
        if (error) throw error
        closeForm({ keepFeedback: true })
        reportNotice('Рекламу оновлено.')
      } else {
        // Insert without .select(): RETURNING can fail RLS even when the row was written
        // (owner email bypass in UI ≠ is_site_owner() in DB until migration is applied).
        const { error } = await (supabase.from('ad_campaigns') as any).insert({
          ...payload,
          impressions: 0,
          clicks: 0,
        })
        if (error) throw error
        closeForm({ keepFeedback: true })
        reportNotice('Рекламу створено.')
      }

      await onRefresh()
      await refreshPublicAds()
    } catch (err) {
      reportError(formatSupabaseError(err, 'Не вдалося зберегти рекламу'))
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (campaignId: string) => {
    setCampaignActionId(campaignId)
    try {
      const { error } = await (supabase.from('ad_campaigns') as any)
        .update({
          status: 'active',
          approved_by: ownerId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
      if (error) throw error
      reportNotice('Рекламу активовано.')
      await onRefresh()
      await refreshPublicAds()
    } catch {
      reportError('Не вдалося активувати рекламу.')
    } finally {
      setCampaignActionId(null)
    }
  }

  const handleReject = async (campaignId: string) => {
    setCampaignActionId(campaignId)
    const campaign = ownerCampaigns.find((c) => c.id === campaignId)
    try {
      const { error } = await (supabase.from('ad_campaigns') as any)
        .update({
          status: 'rejected',
          review_note: isOwnerManagedCampaign(campaign ?? ({} as AdCampaign))
            ? ownerManagedReviewNote('скасовано власником')
            : 'Відхилено власником',
        })
        .eq('id', campaignId)
      if (error) throw error
      reportNotice('Рекламу вимкнено.')
      await onRefresh()
      await refreshPublicAds()
    } catch {
      reportError('Не вдалося вимкнути рекламу.')
    } finally {
      setCampaignActionId(null)
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!window.confirm('Видалити цю рекламу назавжди?')) return
    setCampaignActionId(campaignId)
    try {
      const { error } = await supabase.from('ad_campaigns').delete().eq('id', campaignId)
      if (error) throw error
      reportNotice('Рекламу видалено.')
      if (editingId === campaignId) closeForm()
      await onRefresh()
      await refreshPublicAds()
    } catch {
      reportError('Не вдалося видалити рекламу.')
    } finally {
      setCampaignActionId(null)
    }
  }

  const handleDeleteAllDemo = async () => {
    if (demoCampaigns.length === 0) {
      reportNotice('Демо-реклами не знайдено.')
      return
    }
    if (
      !window.confirm(
        `Видалити ${demoCampaigns.length} демо-кампаній (Knauf, DEWALT, GREE тощо)? Цю дію не можна скасувати.`,
      )
    ) {
      return
    }

    setCampaignActionId('demo-bulk')
    try {
      const ids = demoCampaigns.map((c) => c.id)
      const { error } = await supabase.from('ad_campaigns').delete().in('id', ids)
      if (error) throw error
      reportNotice(`Видалено ${ids.length} демо-кампаній.`)
      if (editingId && ids.includes(editingId)) closeForm()
      await onRefresh()
      await refreshPublicAds()
    } catch (err) {
      reportError(formatSupabaseError(err, 'Не вдалося видалити демо-рекламу'))
    } finally {
      setCampaignActionId(null)
    }
  }

  return (
    <section className="glass-card mt-6 p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#2f2a24]">Реклама на блоках і банерах</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f665d]">
            Додавайте, редагуйте та видаляйте банери для конкретних місць на сайті.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[rgba(148,163,184,0.14)] px-4 py-2 text-sm font-semibold text-[#475569]">
            Усього: {ownerCampaigns.length}
          </span>
          {demoCampaigns.length > 0 && (
            <button
              type="button"
              onClick={() => void handleDeleteAllDemo()}
              disabled={campaignActionId === 'demo-bulk'}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-4 py-2 text-sm font-semibold text-[#b91c1c] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Видалити демо ({demoCampaigns.length})
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary inline-flex items-center gap-2 rounded-full"
          >
            <Plus className="h-4 w-4" />
            Нова реклама
          </button>
        </div>
      </div>

      {formFeedback && !formOpen && (
        <div
          className={`mt-4 rounded-[18px] px-4 py-3 text-sm ${
            formFeedback.type === 'error'
              ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
              : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]'
          }`}
        >
          {formFeedback.text}
        </div>
      )}

      {draftBanner && !formOpen && (
        <div className="mt-4 rounded-[18px] border border-[rgba(99,102,241,0.28)] bg-[rgba(238,242,255,0.92)] px-4 py-3 text-sm text-[#3730a3]">
          <p className="font-semibold">Є незбережені зміни</p>
          <p className="mt-1 text-[#4338ca]">{draftBanner.editingId ? 'Чернетка редагування реклами.' : 'Чернетка нової реклами.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={continueDraft}
              className="btn-primary rounded-full px-4 py-1.5 text-xs"
            >
              Продовжити редагування
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="btn-secondary rounded-full px-4 py-1.5 text-xs"
            >
              Відхилити чернетку
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <form
          id="owner-ad-form"
          onSubmit={handleSave}
          className="mt-5 scroll-mt-24 rounded-[24px] border border-[rgba(99,102,241,0.22)] bg-[rgba(255,255,255,0.35)] p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-extrabold text-[#2f2a24]">
              {editingId ? 'Редагування реклами' : 'Нова реклама'}
            </h3>
            <button
              type="button"
              onClick={() => closeForm()}
              className="rounded-full p-1 text-[#6f665d] hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formFeedback && (
            <div
              className={`mt-4 rounded-[18px] px-4 py-3 text-sm ${
                formFeedback.type === 'error'
                  ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
                  : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]'
              }`}
              role="alert"
            >
              {formFeedback.text}
            </div>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9a8776]">
              Швидкий вибір місця
            </p>
            <div className="flex flex-wrap gap-2">
              {OWNER_SLOT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, selectedSlots: preset.slots }))}
                  className="rounded-full border border-white/45 bg-[rgba(255,255,255,0.35)] px-3 py-1.5 text-xs font-semibold text-[#4338ca] transition hover:bg-[rgba(238,242,255,0.75)]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold text-[#2f2a24]">Назва *</span>
              <input
                className="input-glass mt-1.5 w-full"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-[#2f2a24]">Посилання *</span>
              <input
                className="input-glass mt-1.5 w-full"
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
                placeholder="https://"
                required
              />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="font-semibold text-[#2f2a24]">Опис</span>
            <textarea
              className="input-glass mt-1.5 min-h-[72px] w-full"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold text-[#2f2a24]">Початок показу</span>
              <input
                type="datetime-local"
                className="input-glass mt-1.5 w-full"
                value={form.startsAt}
                onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-[#2f2a24]">Кінець показу</span>
              <input
                type="datetime-local"
                className="input-glass mt-1.5 w-full"
                value={form.endsAt}
                onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
              />
              <span className="mt-1 block text-xs text-[#7a7168]">
                Залиште порожнім — показ до скасування власником
              </span>
            </label>
          </div>

          <div className="mt-5 rounded-[18px] border border-white/40 bg-[rgba(255,255,255,0.2)] p-3 md:p-4">
            <p className="text-sm font-semibold text-[#2f2a24]">Географія показу</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['global', 'countries', 'regions', 'cities'] as GeoMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      geoScope: mode,
                      selectedCountries: mode === 'global' ? [] : p.selectedCountries,
                      selectedRegions: mode === 'global' || mode === 'countries' ? [] : p.selectedRegions,
                      selectedCities: mode === 'cities' ? p.selectedCities : [],
                    }))
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.geoScope === mode
                      ? 'bg-[rgba(99,102,241,0.16)] text-[#4338ca]'
                      : 'bg-[rgba(148,163,184,0.12)] text-[#64748b]'
                  }`}
                >
                  {mode === 'global'
                    ? 'Увесь світ'
                    : mode === 'countries'
                      ? 'Країни'
                      : mode === 'regions'
                        ? 'Регіони'
                        : 'Міста'}
                </button>
              ))}
            </div>
            {geoLoading ? (
              <p className="mt-3 text-sm text-[#7a7168]">Завантаження каталогу локацій…</p>
            ) : form.geoScope === 'global' ? (
              <p className="mt-3 text-sm text-[#7a7168]">Реклама показується відвідувачам з усіх регіонів.</p>
            ) : (
              <div className="mt-3">
                <AdGeoTargeting
                  geoMode={form.geoScope}
                  geoData={geoData}
                  selectedCountries={form.selectedCountries}
                  selectedRegions={form.selectedRegions}
                  selectedCities={form.selectedCities}
                  onCountriesChange={(values) =>
                    setForm((p) => ({ ...p, selectedCountries: values }))
                  }
                  onRegionsChange={(values) => setForm((p) => ({ ...p, selectedRegions: values }))}
                  onCitiesChange={(values) => setForm((p) => ({ ...p, selectedCities: values }))}
                />
              </div>
            )}
          </div>

          <label className="mt-4 block text-sm md:max-w-xs">
            <span className="font-semibold text-[#2f2a24]">Статус</span>
            <select
              className="input-glass mt-1.5 w-full"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as OwnerAdFormValues['status'],
                }))
              }
            >
              <option value="active">Активна (показується)</option>
              <option value="paused">Призупинена</option>
              <option value="pending_review">На модерації</option>
              <option value="draft">Чернетка</option>
              <option value="rejected">Відхилена</option>
            </select>
          </label>

          <div className="mt-5 rounded-[18px] border border-white/40 bg-[rgba(255,255,255,0.2)] p-3 md:p-4">
            <AdPerSlotMediaEditor
              cardTitle={t('advertising.placementsSection.title')}
              selectedSlots={form.selectedSlots}
              onSelectedSlotsChange={(slots) => {
                setForm((p) => ({ ...p, selectedSlots: slots }))
                setSlotMedia((prev) => ensureSlotMediaForSelection(slots, prev))
              }}
              editorPage={placementPreviewPage}
              onEditorPageChange={setPlacementPreviewPage}
              slotMedia={slotMedia}
              onSlotMediaChange={setSlotMedia}
              fallbackMediaUrl={mediaUrl}
              fallbackSlideUrls={slideUrls}
              fallbackMediaType={bannerMediaType}
              fallbackMediaStyle={mediaStyle}
              onFallbackMediaUrl={(url) => {
                setMediaUrl(url)
                setForm((p) => ({ ...p, mediaUrl: url }))
              }}
              onFallbackSlideUrls={setSlideUrls}
              onFallbackMediaType={(type) => {
                setBannerMediaType(type)
                setForm((p) => ({ ...p, mediaType: type }))
              }}
              onFallbackMediaStyle={setMediaStyle}
            />
          </div>

          {(mediaUrl || slideUrls.length) && form.title && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a8776]">
                Попередній перегляд
              </p>
              <AdCampaignDraftPreview
                title={form.title}
                description={form.description}
                mediaUrl={slideUrls[0] || mediaUrl}
                linkUrl={form.linkUrl}
                mediaType={bannerMediaType}
                mediaStyle={mediaStyle}
                slideUrls={slideUrls}
                mediaReady
                placeholderTitle="Реклама"
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="btn-primary rounded-full">
              {saving ? 'Збереження…' : editingId ? 'Зберегти зміни' : 'Опублікувати рекламу'}
            </button>
            <button type="button" onClick={() => closeForm()} className="btn-secondary rounded-full">
              Скасувати
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-4">
        {ownerCampaigns.length === 0 ? (
          <p className="text-sm text-[#7a7168]">Рекламних кампаній ще немає.</p>
        ) : (
          ownerCampaigns.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              busy={campaignActionId === campaign.id}
              t={t}
              onEdit={() => openEdit(campaign)}
              onApprove={() => void handleApprove(campaign.id)}
              onReject={() => void handleReject(campaign.id)}
              onDelete={() => void handleDelete(campaign.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}

function CampaignRow({
  campaign,
  busy,
  t,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: {
  campaign: AdCampaign
  busy: boolean
  t: (key: import('../lib/i18n').TranslationKey) => string
  onEdit: () => void
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
}) {
  const slots = (campaign.placements || []).filter(Boolean) as string[]
  const thumb = campaign.image_url || campaign.media_url
  const scheduleExpired = isOwnerCampaignExpiredInSchedule(campaign)
  const scheduleLabel = getOwnerCampaignScheduleLabel(campaign)
  const geoLabel = getOwnerCampaignGeoLabel(campaign)

  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {thumb && (
          <img src={thumb} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-[#2f2a24]">{campaign.title}</h3>
            <StatusChip status={campaign.status} scheduleExpired={scheduleExpired} />
          </div>
          {campaign.description && (
            <p className="mt-2 line-clamp-2 text-sm text-[#6f665d]">{campaign.description}</p>
          )}
          <p
            className={`mt-2 text-xs font-medium ${
              scheduleExpired ? 'text-[#b45309]' : 'text-[#7a7168]'
            }`}
          >
            {scheduleLabel}
            {scheduleExpired && ' — не показується на сайті'}
          </p>
          <p className="mt-1 text-xs text-[#7a7168]">Географія: {geoLabel}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <span
                  key={slot}
                  className="rounded-full bg-[rgba(99,102,241,0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[#4338ca]"
                >
                  {formatSlotLabel(slot, t)}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#7a7168]">Слоти не вказані</span>
            )}
          </div>
          <p className="mt-2 break-all text-xs text-[#7a7168]">{campaign.link_url}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <ActionBtn onClick={onEdit} disabled={busy} className="text-[#4338ca] bg-[rgba(99,102,241,0.12)]">
            <Pencil className="h-4 w-4" />
            Редагувати
          </ActionBtn>
          {campaign.status !== 'active' && (
            <ActionBtn
              onClick={onApprove}
              disabled={busy}
              className="text-[#15803d] bg-[rgba(34,197,94,0.14)]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Активувати
            </ActionBtn>
          )}
          {campaign.status !== 'rejected' && (
            <ActionBtn
              onClick={onReject}
              disabled={busy}
              className="text-[#b91c1c] bg-[rgba(239,68,68,0.12)]"
            >
              <XCircle className="h-4 w-4" />
              Скасувати показ
            </ActionBtn>
          )}
          <ActionBtn
            onClick={onDelete}
            disabled={busy}
            className="text-[#475569] bg-[rgba(100,116,139,0.14)]"
          >
            <Trash2 className="h-4 w-4" />
            Видалити
          </ActionBtn>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

function StatusChip({
  status,
  scheduleExpired = false,
}: {
  status: AdCampaign['status']
  scheduleExpired?: boolean
}) {
  if (scheduleExpired) {
    return (
      <span className="rounded-full bg-[rgba(245,158,11,0.14)] px-2.5 py-0.5 text-xs font-semibold text-[#b45309]">
        Термін закінчився
      </span>
    )
  }
  const styles: Record<string, string> = {
    active: 'bg-[rgba(34,197,94,0.14)] text-[#15803d]',
    pending_review: 'bg-[rgba(245,158,11,0.14)] text-[#b45309]',
    paused: 'bg-[rgba(100,116,139,0.14)] text-[#475569]',
    rejected: 'bg-[rgba(239,68,68,0.14)] text-[#b91c1c]',
    draft: 'bg-[rgba(148,163,184,0.14)] text-[#475569]',
    expired: 'bg-[rgba(148,163,184,0.14)] text-[#64748b]',
    deleted: 'bg-[rgba(148,163,184,0.14)] text-[#64748b]',
  }
  const labels: Record<string, string> = {
    active: 'Активна',
    pending_review: 'Модерація',
    paused: 'Пауза',
    rejected: 'Вимкнена',
    draft: 'Чернетка',
    expired: 'Завершена',
    deleted: 'Видалена',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  )
}
