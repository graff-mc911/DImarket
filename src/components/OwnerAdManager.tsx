import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdPlacementSitePreview } from './AdPlacementSitePreview'
import { AdCampaignDraftPreview } from './AdCopyFields'
import { formatSlotLabel, sideSlotId } from '../lib/adPlacementSlots'
import { formatSupabaseError } from '../lib/supabaseErrors'
import {
  buildOwnerCampaignPayload,
  OWNER_SLOT_PRESETS,
  type OwnerAdFormValues,
} from '../lib/ownerAdCampaign'
import type { AdCampaign } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { isDemoAdCampaign } from '../lib/demoAdCampaigns'

const ACCEPTED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]
const MAX_FILE_MB = 20

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
  selectedSlots: [sideSlotId('home', 'right', 1)],
  geoScope: 'global',
  status: 'active',
  startsAt: '',
  endsAt: '',
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function campaignToForm(c: AdCampaign): OwnerAdFormValues {
  const slots =
    (c.placements || []).filter(Boolean).length > 0
      ? (c.placements as string[])
      : [sideSlotId('home', 'right', 1)]

  return {
    title: c.title,
    description: c.description || '',
    linkUrl: c.link_url,
    mediaUrl: c.media_url || c.image_url,
    mediaType: (c.media_type as OwnerAdFormValues['mediaType']) || 'image',
    selectedSlots: slots,
    geoScope: 'global',
    status: c.status,
    startsAt: toLocalInput(c.starts_at),
    endsAt: toLocalInput(c.ends_at),
  }
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OwnerAdFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const ownerCampaigns = useMemo(
    () => campaigns.filter((c) => !isDemoAdCampaign(c)),
    [campaigns],
  )
  const demoCampaigns = useMemo(() => campaigns.filter(isDemoAdCampaign), [campaigns])

  const editingCampaign = useMemo(
    () => ownerCampaigns.find((c) => c.id === editingId) ?? null,
    [ownerCampaigns, editingId],
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, startsAt: toLocalInput(new Date().toISOString()) })
    setFormOpen(true)
  }

  const openEdit = (campaign: AdCampaign) => {
    setEditingId(campaign.id)
    setForm(campaignToForm(campaign))
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_MIME.includes(file.type)) {
        onError('Дозволені формати: JPG, PNG, WebP, GIF, MP4, WebM')
        return
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        onError(`Максимальний розмір файлу — ${MAX_FILE_MB} MB`)
        return
      }

      const mediaType: OwnerAdFormValues['mediaType'] = file.type.startsWith('video/')
        ? 'video'
        : file.type === 'image/gif'
          ? 'gif'
          : 'image'

      setUploading(true)
      try {
        const ext = file.name.split('.').pop() ?? 'bin'
        const path = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('ad-media')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('ad-media').getPublicUrl(path)
        setForm((prev) => ({ ...prev, mediaUrl: urlData.publicUrl, mediaType }))
      } catch (err) {
        onError(formatSupabaseError(err, 'Не вдалося завантажити файл'))
      } finally {
        setUploading(false)
      }
    },
    [onError],
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      onError('Вкажіть назву реклами')
      return
    }
    if (!form.mediaUrl.trim()) {
      onError('Додайте зображення або URL банера')
      return
    }
    if (!form.linkUrl.trim()) {
      onError('Вкажіть посилання')
      return
    }
    if (form.selectedSlots.length === 0) {
      onError('Оберіть хоча б один блок для показу')
      return
    }

    setSaving(true)
    try {
      const payload = buildOwnerCampaignPayload(form, ownerId, editingCampaign)

      if (editingId) {
        const { error } = await supabase.from('ad_campaigns').update(payload).eq('id', editingId)
        if (error) throw error
        onNotice('Рекламу оновлено.')
      } else {
        const { error } = await supabase.from('ad_campaigns').insert({
          ...payload,
          impressions: 0,
          clicks: 0,
        })
        if (error) throw error
        onNotice('Рекламу створено.')
      }

      closeForm()
      await onRefresh()
      await refreshPublicAds()
    } catch (err) {
      onError(formatSupabaseError(err, 'Не вдалося зберегти рекламу'))
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (campaignId: string) => {
    setCampaignActionId(campaignId)
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({
          status: 'active',
          approved_by: ownerId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
      if (error) throw error
      onNotice('Рекламу активовано.')
      await onRefresh()
      await refreshPublicAds()
    } catch {
      onError('Не вдалося активувати рекламу.')
    } finally {
      setCampaignActionId(null)
    }
  }

  const handleReject = async (campaignId: string) => {
    setCampaignActionId(campaignId)
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status: 'rejected', review_note: 'Відхилено власником' })
        .eq('id', campaignId)
      if (error) throw error
      onNotice('Рекламу вимкнено.')
      await onRefresh()
      await refreshPublicAds()
    } catch {
      onError('Не вдалося вимкнути рекламу.')
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
      onNotice('Рекламу видалено.')
      if (editingId === campaignId) closeForm()
      await onRefresh()
      await refreshPublicAds()
    } catch {
      onError('Не вдалося видалити рекламу.')
    } finally {
      setCampaignActionId(null)
    }
  }

  const handleDeleteAllDemo = async () => {
    if (demoCampaigns.length === 0) {
      onNotice('Демо-реклами не знайдено.')
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
      onNotice(`Видалено ${ids.length} демо-кампаній.`)
      if (editingId && ids.includes(editingId)) closeForm()
      await onRefresh()
      await refreshPublicAds()
    } catch (err) {
      onError(formatSupabaseError(err, 'Не вдалося видалити демо-рекламу'))
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

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="mt-5 rounded-[24px] border border-[rgba(99,102,241,0.22)] bg-[rgba(255,255,255,0.35)] p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-extrabold text-[#2f2a24]">
              {editingId ? 'Редагування реклами' : 'Нова реклама'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full p-1 text-[#6f665d] hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
            </label>
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

          <div className="mt-4 rounded-[20px] border border-white/40 bg-[rgba(255,255,255,0.25)] p-4">
            <p className="text-sm font-semibold text-[#2f2a24]">Зображення / банер *</p>
            <label className="mt-3 block text-sm">
              <span className="text-[#6f665d]">URL банера</span>
              <input
                className="input-glass mt-1.5 w-full"
                value={form.mediaUrl}
                onChange={(e) => setForm((p) => ({ ...p, mediaUrl: e.target.value }))}
                placeholder="https://… або завантажте файл"
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME.join(',')}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadFile(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-[rgba(99,102,241,0.12)] px-4 py-2 text-sm font-semibold text-[#4338ca] disabled:opacity-50"
              >
                {uploading ? (
                  <Upload className="h-4 w-4 animate-pulse" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? 'Завантаження…' : 'Завантажити файл'}
              </button>
              {form.mediaUrl && (
                <img src={form.mediaUrl} alt="" className="h-14 max-w-[200px] rounded-lg object-cover" />
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-[#2f2a24]">Блоки та банери на сайті *</p>
            <AdPlacementSitePreview
              selected={form.selectedSlots}
              onChange={(slots) => setForm((p) => ({ ...p, selectedSlots: slots }))}
            />
          </div>

          {form.mediaUrl && form.title && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a8776]">
                Попередній перегляд
              </p>
              <AdCampaignDraftPreview
                title={form.title}
                description={form.description}
                mediaUrl={form.mediaUrl}
                linkUrl={form.linkUrl}
                mediaType={form.mediaType}
                mediaReady
                placeholderTitle="Реклама"
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={saving || uploading} className="btn-primary rounded-full">
              {saving ? 'Збереження…' : editingId ? 'Зберегти зміни' : 'Опублікувати рекламу'}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary rounded-full">
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

  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {thumb && (
          <img src={thumb} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-[#2f2a24]">{campaign.title}</h3>
            <StatusChip status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="mt-2 line-clamp-2 text-sm text-[#6f665d]">{campaign.description}</p>
          )}
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
              Вимкнути
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

function StatusChip({ status }: { status: AdCampaign['status'] }) {
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
