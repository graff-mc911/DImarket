import { useEffect, useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import {
  EMPTY_PORTFOLIO_DRAFT,
  PORTFOLIO_CATEGORIES,
  createPortfolioItem,
  deletePortfolioItem,
  fetchPortfolioItems,
  updatePortfolioItem,
  type PortfolioItemDraft,
  type PortfolioItemRow,
  type PortfolioMediaType,
} from '../../lib/portfolio'
import {
  PORTFOLIO_MEDIA_ACCEPT,
  isPdfFile,
  isVideoFile,
  uploadPortfolioMedia,
} from '../../lib/portfolioMediaUpload'
import { PortfolioMasonry } from './PortfolioMasonry'
import { PROJECT_TRADES } from '../../lib/projectWizard'
import { useApp } from '../../contexts/AppContext'

const field =
  'w-full rounded-none border border-[rgba(148,163,184,0.35)] bg-[#fafafa] px-3 py-2.5 text-[14px] text-[#2f2a24] outline-none focus:border-[#2f2a24] focus:bg-white'

type Props = {
  profileId: string
  viewerId?: string | null
  editable?: boolean
  highlightItemId?: string | null
}

export function PortfolioManager({
  profileId,
  viewerId,
  editable = false,
  highlightItemId = null,
}: Props) {
  const { t } = useApp()
  const [items, setItems] = useState<PortfolioItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PortfolioItemDraft>(EMPTY_PORTFOLIO_DRAFT)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploadField, setUploadField] = useState<string | null>(null)

  const reload = async () => {
    setLoading(true)
    const rows = await fetchPortfolioItems(profileId, viewerId)
    setItems(rows)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [profileId, viewerId])

  const resetForm = () => {
    setDraft(EMPTY_PORTFOLIO_DRAFT)
    setEditingId(null)
    setOpenForm(false)
  }

  const startEdit = (item: PortfolioItemRow) => {
    setEditingId(item.id)
    setDraft({
      title: item.title || '',
      description: item.description || '',
      media_type: item.media_type || 'image',
      category_slug: item.category_slug || '',
      image_url: item.image_url || '',
      video_url: item.video_url || '',
      before_url: item.before_url || '',
      after_url: item.after_url || '',
    })
    setOpenForm(true)
  }

  const onUpload = async (
    field: 'image_url' | 'video_url' | 'before_url' | 'after_url',
    file: File,
  ) => {
    setUploadField(field)
    setMessage(null)
    try {
      const url = await uploadPortfolioMedia(profileId, file)
      setDraft((d) => {
        const next = { ...d, [field]: url }
        if (field === 'video_url' || isVideoFile(file)) {
          next.media_type = 'video'
          next.video_url = url
        } else if (isPdfFile(file)) {
          next.media_type = 'certificate'
          next.image_url = url
          next.category_slug = next.category_slug || 'certificate'
        }
        return next
      })
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadField(null)
    }
  }

  const onSave = async () => {
    setBusy(true)
    setMessage(null)
    if (editingId) {
      const res = await updatePortfolioItem(editingId, profileId, draft)
      setBusy(false)
      if ('error' in res) {
        setMessage(res.error)
        return
      }
    } else {
      const res = await createPortfolioItem(profileId, draft, items.length)
      setBusy(false)
      if ('error' in res) {
        setMessage(res.error)
        return
      }
    }
    setMessage('Saved')
    resetForm()
    await reload()
  }

  const onDelete = async (item: PortfolioItemRow) => {
    if (!confirm('Delete this portfolio item?')) return
    await deletePortfolioItem(item.id, profileId)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PORTFOLIO_CATEGORIES.map((c) => (
            <button
              key={c.id || 'all'}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                filter === c.id
                  ? 'bg-[#2f2a24] text-white'
                  : 'bg-[#f3f0ea] text-[#2f2a24] hover:bg-[rgba(148,163,184,0.22)]'
              }`}
            >
              {t(c.labelKey as never)}
            </button>
          ))}
        </div>
        {editable ? (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setDraft(EMPTY_PORTFOLIO_DRAFT)
              setOpenForm(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2f2a24] px-4 py-2 text-[12px] font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add project
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-none bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{message}</p>
      ) : null}

      {openForm && editable ? (
        <div className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-sm">
          <h3 className="text-[16px] font-semibold text-[#2f2a24]">
            {editingId ? 'Edit project' : 'New portfolio project'}
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
                Title
              </span>
              <input
                className={`${field} mt-1`}
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Kitchen renovation — Berlin"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
                Description
              </span>
              <textarea
                className={`${field} mt-1`}
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What you did, materials, size…"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
                Type
              </span>
              <select
                className={`${field} mt-1`}
                value={draft.media_type}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, media_type: e.target.value as PortfolioMediaType }))
                }
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="before_after">Before / After</option>
                <option value="certificate">Certificate</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
                Category
              </span>
              <select
                className={`${field} mt-1`}
                value={draft.category_slug}
                onChange={(e) => setDraft((d) => ({ ...d, category_slug: e.target.value }))}
              >
                <option value="">{t('portfolio.cat.general')}</option>
                {PROJECT_TRADES.map((trade) => (
                  <option key={trade.id} value={trade.id}>
                    {t(trade.labelKey)}
                  </option>
                ))}
                <option value="certificate">{t('portfolio.cat.certificate')}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {(draft.media_type === 'image' || draft.media_type === 'certificate' || draft.media_type === 'video') && (
              <UploadRow
                label={draft.media_type === 'video' ? 'Cover image (optional)' : 'Image / PDF'}
                url={draft.image_url}
                busy={uploadField === 'image_url'}
                onFile={(f) => void onUpload('image_url', f)}
              />
            )}
            {draft.media_type === 'video' && (
              <UploadRow
                label="Video file"
                url={draft.video_url}
                busy={uploadField === 'video_url'}
                onFile={(f) => void onUpload('video_url', f)}
              />
            )}
            {draft.media_type === 'before_after' && (
              <>
                <UploadRow
                  label="Before photo"
                  url={draft.before_url}
                  busy={uploadField === 'before_url'}
                  onFile={(f) => void onUpload('before_url', f)}
                />
                <UploadRow
                  label="After photo"
                  url={draft.after_url}
                  busy={uploadField === 'after_url'}
                  onFile={(f) => void onUpload('after_url', f)}
                />
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSave()}
              className="rounded-full bg-[#2f2a24] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[rgba(148,163,184,0.35)] px-5 py-2.5 text-[13px] font-semibold text-[#2f2a24]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-[#8a8178]">Loading portfolio…</p>
      ) : (
        <PortfolioMasonry
          items={items}
          profileId={profileId}
          viewerId={viewerId}
          editable={editable}
          filterCategory={filter}
          highlightItemId={highlightItemId}
          onChanged={setItems}
          onEdit={editable ? startEdit : undefined}
          onDelete={editable ? (item) => void onDelete(item) : undefined}
        />
      )}
    </div>
  )
}

function UploadRow({
  label,
  url,
  busy,
  onFile,
}: {
  label: string
  url: string
  busy: boolean
  onFile: (file: File) => void
}) {
  return (
    <div className="rounded-none border border-[#f0f0f2] bg-[#fafafa] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-[#2f2a24]">{label}</p>
          {url ? (
            <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-[#8a8178]">{url}</p>
          ) : (
            <p className="mt-0.5 text-[11px] text-[#8a8178]">No file yet</p>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#2f2a24] px-3 py-1.5 text-[12px] font-semibold text-white">
          <Upload className="h-3.5 w-3.5" />
          {busy ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept={PORTFOLIO_MEDIA_ACCEPT}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {url && (url.match(/\.(jpg|jpeg|png|webp|gif)/i) || url.includes('image')) ? (
        <img src={url} alt="" className="mt-2 h-24 rounded-none object-cover" />
      ) : null}
    </div>
  )
}
